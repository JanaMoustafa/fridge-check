import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Kysely } from 'kysely'
import { z } from 'zod'
import type { Database } from '@/lib/db/schema'
import { PRO_CURRENCY, PRO_PERIOD_DAYS, PRO_PLAN, PRO_PRICE_MINOR } from './plan'
import { CheckoutSessionSchema, type CheckoutSession } from './xpay'

/** XPay rejects replays older than this; so do we. */
export const SIGNATURE_TOLERANCE_S = 300
const DAY_MS = 24 * 60 * 60 * 1000

export type SignatureCheck =
  { ok: true } | { ok: false; reason: 'missing' | 'malformed' | 'expired' | 'mismatch' }

/**
 * XPay-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<raw body>" with the endpoint's
 * whsec_ secret>. Compared in constant time; more than one v1 (during a secret roll) is allowed.
 */
export function verifySignature(
  rawBody: string,
  header: string | null,
  secret: string,
  now: Date,
): SignatureCheck {
  if (!header) return { ok: false, reason: 'missing' }
  const parts = header.split(',').map((part) => part.trim().split('='))
  const timestamp = Number(parts.find(([key]) => key === 't')?.[1])
  const signatures = parts
    .filter(([key, value]) => key === 'v1' && value)
    .map(([, value]) => value!)
  if (!Number.isInteger(timestamp) || signatures.length === 0)
    return { ok: false, reason: 'malformed' }
  if (Math.abs(now.getTime() / 1000 - timestamp) > SIGNATURE_TOLERANCE_S) {
    return { ok: false, reason: 'expired' }
  }
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest()
  const matches = signatures.some((signature) => {
    if (!/^[0-9a-f]+$/i.test(signature)) return false
    const given = Buffer.from(signature, 'hex')
    return given.length === expected.length && timingSafeEqual(given, expected)
  })
  return matches ? { ok: true } : { ok: false, reason: 'mismatch' }
}

export const XPayEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  livemode: z.boolean(),
  data: z.object({ object: z.record(z.string(), z.unknown()) }),
})
export type XPayEvent = z.infer<typeof XPayEventSchema>

const RefundSchema = z.object({
  id: z.string(),
  paymentIntentId: z.string().nullish(),
  checkoutSessionId: z.string().nullish(),
})

export type FulfillResult = 'granted' | 'already-paid' | 'awaiting-payment' | 'unknown-session'

/**
 * Applies a checkout session XPay reports (by webhook, or when asked on the success page): when
 * it is paid, marks our payment row paid and gives its user 30 days of Pro, from now or, when
 * they already have Pro, from the end of their current period. Safe to run any number of times
 * for the same session (the payment row is locked and only ever paid once).
 */
export async function fulfillCheckout(
  db: Kysely<Database>,
  session: CheckoutSession,
  now: Date,
): Promise<FulfillResult> {
  return db.transaction().execute(async (trx) => {
    const payment = await trx
      .selectFrom('payment')
      .selectAll()
      .where('xpay_checkout_session_id', '=', session.id)
      .forUpdate()
      .executeTakeFirst()
    if (!payment) return 'unknown-session'
    if (payment.status === 'paid' || payment.status === 'refunded') return 'already-paid'
    if (session.paymentStatus !== 'paid') {
      await trx
        .updateTable('payment')
        .set({ xpay_payment_intent_id: session.paymentIntentId ?? null, updated_at: now })
        .where('id', '=', payment.id)
        .execute()
      return 'awaiting-payment'
    }
    if (session.amountTotal !== payment.amount_minor || session.currency !== payment.currency) {
      throw new Error(
        `Checkout ${session.id} paid ${session.amountTotal} ${session.currency}, expected ${payment.amount_minor} ${payment.currency}`,
      )
    }
    if (payment.user_id === null) {
      // The account was deleted before the payment confirmed: record it, grant nothing.
      await trx
        .updateTable('payment')
        .set({ status: 'paid', updated_at: now })
        .where('id', '=', payment.id)
        .execute()
      return 'granted'
    }

    const current = await trx
      .selectFrom('subscription')
      .selectAll()
      .where('user_id', '=', payment.user_id)
      .forUpdate()
      .executeTakeFirst()
    const stillPro =
      current !== undefined &&
      (current.status === 'active' || current.status === 'canceled') &&
      current.current_period_end > now
    const start = stillPro ? current.current_period_end : now
    const end = new Date(start.getTime() + PRO_PERIOD_DAYS * DAY_MS)
    const period = {
      plan: PRO_PLAN,
      status: 'active' as const,
      cancel_at_period_end: false,
      xpay_customer_id: session.customerId ?? current?.xpay_customer_id ?? null,
      xpay_checkout_session_id: session.id,
      current_period_start: stillPro ? current.current_period_start : now,
      current_period_end: end,
    }
    await trx
      .insertInto('subscription')
      .values({ user_id: payment.user_id, xpay_subscription_id: null, ...period })
      .onConflict((conflict) =>
        conflict.column('user_id').doUpdateSet({ ...period, updated_at: now }),
      )
      .execute()
    await trx
      .updateTable('payment')
      .set({
        status: 'paid',
        xpay_payment_intent_id: session.paymentIntentId ?? null,
        xpay_customer_id: session.customerId ?? null,
        period_start: start,
        period_end: end,
        updated_at: now,
      })
      .where('id', '=', payment.id)
      .execute()
    return 'granted'
  })
}

async function settleUnpaid(
  db: Kysely<Database>,
  sessionId: string,
  status: 'failed' | 'expired',
  now: Date,
) {
  await db
    .updateTable('payment')
    .set({ status, updated_at: now })
    .where('xpay_checkout_session_id', '=', sessionId)
    .where('status', '=', 'pending')
    .execute()
}

/**
 * A refund cancels what that payment bought: the payment is marked refunded and, if it paid for
 * the user's current period, Pro ends now.
 */
async function applyRefund(db: Kysely<Database>, object: Record<string, unknown>, now: Date) {
  const refund = RefundSchema.parse(object)
  await db.transaction().execute(async (trx) => {
    let query = trx.selectFrom('payment').selectAll()
    if (refund.checkoutSessionId)
      query = query.where('xpay_checkout_session_id', '=', refund.checkoutSessionId)
    else if (refund.paymentIntentId)
      query = query.where('xpay_payment_intent_id', '=', refund.paymentIntentId)
    else throw new Error(`Refund ${refund.id} names no payment`)
    const payment = await query.forUpdate().executeTakeFirst()
    if (!payment) throw new Error(`Refund ${refund.id}: unknown payment`)
    await trx
      .updateTable('payment')
      .set({ status: 'refunded', updated_at: now })
      .where('id', '=', payment.id)
      .execute()
    if (payment.user_id !== null) {
      await trx
        .updateTable('subscription')
        .set({ status: 'expired', current_period_end: now, updated_at: now })
        .where('user_id', '=', payment.user_id)
        .where('xpay_checkout_session_id', '=', payment.xpay_checkout_session_id)
        .where('current_period_end', '>', now)
        .execute()
    }
  })
}

export type EventOutcome = 'processed' | 'duplicate' | 'ignored'

/**
 * Handles one verified webhook. Every event is stored (the audit log); an event id already
 * processed is skipped, so XPay's retries never apply anything twice. A failure is recorded on
 * the event and rethrown, so the route answers 500 and XPay retries later.
 */
export async function handleXPayEvent(
  db: Kysely<Database>,
  event: XPayEvent,
  now: Date,
): Promise<EventOutcome> {
  await db
    .insertInto('webhook_event')
    .values({
      id: event.id,
      type: event.type,
      livemode: event.livemode,
      payload: JSON.stringify(event),
      received_at: now,
    })
    .onConflict((conflict) => conflict.column('id').doNothing())
    .execute()
  const stored = await db
    .selectFrom('webhook_event')
    .select('processed_at')
    .where('id', '=', event.id)
    .executeTakeFirstOrThrow()
  if (stored.processed_at !== null) return 'duplicate'

  let outcome: EventOutcome = 'processed'
  try {
    const object = event.data.object
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const result = await fulfillCheckout(db, CheckoutSessionSchema.parse(object), now)
        if (result === 'unknown-session') outcome = 'ignored'
        break
      }
      case 'checkout.session.async_payment_failed':
        await settleUnpaid(db, CheckoutSessionSchema.parse(object).id, 'failed', now)
        break
      case 'checkout.session.expired':
        await settleUnpaid(db, CheckoutSessionSchema.parse(object).id, 'expired', now)
        break
      case 'refund.created':
        await applyRefund(db, object, now)
        break
      default:
        outcome = 'ignored'
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await db
      .updateTable('webhook_event')
      .set({ error: message.slice(0, 1000) })
      .where('id', '=', event.id)
      .execute()
    throw error
  }
  await db
    .updateTable('webhook_event')
    .set({ processed_at: now, error: outcome === 'ignored' ? 'ignored' : null })
    .where('id', '=', event.id)
    .execute()
  return outcome
}

/** Payment rows are created when checkout starts: the webhook only ever settles our own rows. */
export async function recordCheckoutStarted(
  db: Kysely<Database>,
  userId: string,
  sessionId: string,
  now: Date,
): Promise<void> {
  await db
    .insertInto('payment')
    .values({
      user_id: userId,
      plan: PRO_PLAN,
      status: 'pending',
      xpay_checkout_session_id: sessionId,
      xpay_payment_intent_id: null,
      xpay_customer_id: null,
      amount_minor: PRO_PRICE_MINOR,
      currency: PRO_CURRENCY,
      period_start: null,
      period_end: null,
      created_at: now,
      updated_at: now,
    })
    .execute()
}
