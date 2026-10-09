import { createHmac } from 'node:crypto'
import type { Kysely } from 'kysely'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestDb } from '../../../tests/db/test-db'
import type { Database } from '@/lib/db/schema'
import { getProAccess } from './access'
import {
  fulfillCheckout,
  handleXPayEvent,
  recordCheckoutStarted,
  verifySignature,
  type XPayEvent,
} from './webhook'

const SECRET = 'whsec_test_secret_0123456789'
const NOW = new Date('2026-10-09T12:00:00Z')
const DAY = 24 * 60 * 60 * 1000
const later = (days: number) => new Date(NOW.getTime() + days * DAY)

function sign(body: string, timestamp = Math.floor(NOW.getTime() / 1000), secret = SECRET) {
  const v1 = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  return `t=${timestamp},v1=${v1}`
}

describe('verifySignature', () => {
  const body = '{"id":"evt_test_1"}'

  it('accepts XPay’s signature over the raw body', () => {
    expect(verifySignature(body, sign(body), SECRET, NOW)).toEqual({ ok: true })
  })

  it('accepts any of several v1 signatures (secret roll)', () => {
    const header = `${sign(body)},v1=${'ab'.repeat(32)}`
    expect(
      verifySignature(
        body,
        `t=${header.split('t=')[1]!.split(',')[0]},v1=${'00'.repeat(32)},${header.split(',')[1]}`,
        SECRET,
        NOW,
      ),
    ).toEqual({ ok: true })
  })

  it.each([
    ['no header', null, 'missing'],
    ['a malformed header', 'v1=abc', 'malformed'],
    ['no signature', `t=${Math.floor(NOW.getTime() / 1000)}`, 'malformed'],
    ['a stale timestamp (replay)', sign(body, Math.floor(NOW.getTime() / 1000) - 301), 'expired'],
    ['a wrong secret', sign(body, undefined, 'whsec_other'), 'mismatch'],
    ['a tampered body', sign('{"id":"evt_test_2"}'), 'mismatch'],
    ['a non-hex signature', `t=${Math.floor(NOW.getTime() / 1000)},v1=zz`, 'mismatch'],
  ])('rejects %s', (_label, header, reason) => {
    expect(verifySignature(body, header, SECRET, NOW)).toEqual({ ok: false, reason })
  })
})

describe('XPay events', () => {
  let db: Kysely<Database>
  beforeAll(async () => {
    db = await createTestDb()
  })
  afterAll(async () => {
    await db.destroy()
  })
  beforeEach(async () => {
    await db.deleteFrom('webhook_event').execute()
    await db.deleteFrom('payment').execute()
    await db.deleteFrom('user').execute()
    await db
      .insertInto('user')
      .values({
        id: 'u1',
        name: 'T',
        email: 't@example.com',
        emailVerified: true,
        image: null,
        createdAt: NOW,
        updatedAt: NOW,
      })
      .execute()
  })

  const session = (
    id: string,
    paymentStatus: 'paid' | 'unpaid' = 'paid',
    extra: Record<string, unknown> = {},
  ) => ({
    id,
    object: 'checkout.session',
    status: 'complete',
    paymentStatus,
    paymentIntentId: `pi_${id}`,
    customerId: 'cus_test_1',
    amountTotal: 20000,
    currency: 'EGP',
    metadata: { userId: 'u1', plan: 'pro_monthly' },
    livemode: false,
    ...extra,
  })
  const event = (id: string, type: string, object: Record<string, unknown>): XPayEvent => ({
    id,
    type,
    livemode: false,
    data: { object },
  })

  it('grants 30 days of Pro when a checkout is paid', async () => {
    await recordCheckoutStarted(db, 'u1', 'cs_1', NOW)
    expect(
      await handleXPayEvent(db, event('evt_1', 'checkout.session.completed', session('cs_1')), NOW),
    ).toBe('processed')
    const access = await getProAccess(db, 'u1', NOW)
    expect(access).toMatchObject({ isPro: true, status: 'active' })
    expect(access.periodEnd?.toISOString()).toBe(later(30).toISOString())
    const payment = await db.selectFrom('payment').selectAll().executeTakeFirstOrThrow()
    expect(payment).toMatchObject({
      status: 'paid',
      xpay_payment_intent_id: 'pi_cs_1',
      xpay_customer_id: 'cus_test_1',
    })
    const logged = await db.selectFrom('webhook_event').selectAll().executeTakeFirstOrThrow()
    expect(logged).toMatchObject({ id: 'evt_1', type: 'checkout.session.completed', error: null })
    expect(logged.processed_at).not.toBeNull()
  })

  it('never applies the same event or session twice', async () => {
    await recordCheckoutStarted(db, 'u1', 'cs_1', NOW)
    const paid = event('evt_1', 'checkout.session.completed', session('cs_1'))
    await handleXPayEvent(db, paid, NOW)
    expect(await handleXPayEvent(db, paid, later(1))).toBe('duplicate')
    // The same session reported again under another event id (e.g. success-page check).
    await handleXPayEvent(
      db,
      event('evt_2', 'checkout.session.completed', session('cs_1')),
      later(1),
    )
    expect((await getProAccess(db, 'u1', NOW)).periodEnd?.toISOString()).toBe(
      later(30).toISOString(),
    )
    expect(await db.selectFrom('webhook_event').select('id').execute()).toHaveLength(2)
  })

  it('renewing early extends from the end of the current period', async () => {
    await recordCheckoutStarted(db, 'u1', 'cs_1', NOW)
    await handleXPayEvent(db, event('evt_1', 'checkout.session.completed', session('cs_1')), NOW)
    await recordCheckoutStarted(db, 'u1', 'cs_2', later(25))
    await handleXPayEvent(
      db,
      event('evt_2', 'checkout.session.completed', session('cs_2')),
      later(25),
    )
    expect((await getProAccess(db, 'u1', later(25))).periodEnd?.toISOString()).toBe(
      later(60).toISOString(),
    )
  })

  it('renewing after expiry starts a new period from the payment', async () => {
    await recordCheckoutStarted(db, 'u1', 'cs_1', NOW)
    await handleXPayEvent(db, event('evt_1', 'checkout.session.completed', session('cs_1')), NOW)
    await recordCheckoutStarted(db, 'u1', 'cs_2', later(40))
    await handleXPayEvent(
      db,
      event('evt_2', 'checkout.session.completed', session('cs_2')),
      later(40),
    )
    expect((await getProAccess(db, 'u1', later(40))).periodEnd?.toISOString()).toBe(
      later(70).toISOString(),
    )
  })

  it('waits for Fawry: completed-but-unpaid grants nothing until the payment arrives', async () => {
    await recordCheckoutStarted(db, 'u1', 'cs_f', NOW)
    await handleXPayEvent(
      db,
      event('evt_1', 'checkout.session.completed', session('cs_f', 'unpaid')),
      NOW,
    )
    expect((await getProAccess(db, 'u1', NOW)).isPro).toBe(false)
    expect((await db.selectFrom('payment').select('status').executeTakeFirstOrThrow()).status).toBe(
      'pending',
    )
    await handleXPayEvent(
      db,
      event('evt_2', 'checkout.session.async_payment_succeeded', session('cs_f')),
      later(1),
    )
    expect((await getProAccess(db, 'u1', later(1))).isPro).toBe(true)
  })

  it('records failed and expired checkouts', async () => {
    await recordCheckoutStarted(db, 'u1', 'cs_f', NOW)
    await recordCheckoutStarted(db, 'u1', 'cs_e', NOW)
    await handleXPayEvent(
      db,
      event('evt_1', 'checkout.session.async_payment_failed', session('cs_f', 'unpaid')),
      NOW,
    )
    await handleXPayEvent(
      db,
      event('evt_2', 'checkout.session.expired', session('cs_e', 'unpaid', { status: 'expired' })),
      NOW,
    )
    const statuses = await db
      .selectFrom('payment')
      .select(['xpay_checkout_session_id', 'status'])
      .orderBy('xpay_checkout_session_id')
      .execute()
    expect(statuses).toEqual([
      { xpay_checkout_session_id: 'cs_e', status: 'expired' },
      { xpay_checkout_session_id: 'cs_f', status: 'failed' },
    ])
    expect((await getProAccess(db, 'u1', NOW)).isPro).toBe(false)
  })

  it('ends Pro when the payment for the current period is refunded', async () => {
    await recordCheckoutStarted(db, 'u1', 'cs_1', NOW)
    await handleXPayEvent(db, event('evt_1', 'checkout.session.completed', session('cs_1')), NOW)
    await handleXPayEvent(
      db,
      event('evt_2', 'refund.created', { id: 're_1', paymentIntentId: 'pi_cs_1' }),
      later(2),
    )
    expect((await getProAccess(db, 'u1', later(2))).isPro).toBe(false)
    expect((await db.selectFrom('payment').select('status').executeTakeFirstOrThrow()).status).toBe(
      'refunded',
    )
  })

  /** Pays cs_1 now and renews early with cs_2 on day 3: Pro until day 60. */
  async function payTwice() {
    await recordCheckoutStarted(db, 'u1', 'cs_1', NOW)
    await handleXPayEvent(db, event('evt_1', 'checkout.session.completed', session('cs_1')), NOW)
    await recordCheckoutStarted(db, 'u1', 'cs_2', later(3))
    await handleXPayEvent(
      db,
      event('evt_2', 'checkout.session.completed', session('cs_2')),
      later(3),
    )
  }
  const refunded = (eventId: string, sessionId: string, at: Date) =>
    handleXPayEvent(
      db,
      event(eventId, 'refund.created', { id: `re_${eventId}`, checkoutSessionId: sessionId }),
      at,
    )

  it('refunding an early renewal removes only the 30 days it bought', async () => {
    await payTwice()
    await refunded('evt_3', 'cs_2', later(5))
    const access = await getProAccess(db, 'u1', later(5))
    expect(access.isPro).toBe(true)
    expect(access.periodEnd?.toISOString()).toBe(later(30).toISOString())
  })

  it('refunding the first pass after a renewal removes its unused days', async () => {
    await payTwice()
    // Day 5: cs_1 has 25 unused days; the renewal's 30 days move up behind the 5 used ones.
    await refunded('evt_3', 'cs_1', later(5))
    expect((await getProAccess(db, 'u1', later(5))).periodEnd?.toISOString()).toBe(
      later(35).toISOString(),
    )
  })

  it('applies a refund of the same payment only once', async () => {
    await payTwice()
    await refunded('evt_3', 'cs_2', later(5))
    await refunded('evt_4', 'cs_2', later(6))
    expect((await getProAccess(db, 'u1', later(6))).periodEnd?.toISOString()).toBe(
      later(30).toISOString(),
    )
  })

  it('a refund of a pass that already ran out changes nothing else', async () => {
    await recordCheckoutStarted(db, 'u1', 'cs_1', NOW)
    await handleXPayEvent(db, event('evt_1', 'checkout.session.completed', session('cs_1')), NOW)
    await recordCheckoutStarted(db, 'u1', 'cs_2', later(40))
    await handleXPayEvent(
      db,
      event('evt_2', 'checkout.session.completed', session('cs_2')),
      later(40),
    )
    await refunded('evt_3', 'cs_1', later(41))
    expect((await getProAccess(db, 'u1', later(41))).periodEnd?.toISOString()).toBe(
      later(70).toISOString(),
    )
  })

  it('rejects a refund that names no payment, or one it does not know', async () => {
    await expect(
      handleXPayEvent(db, event('evt_1', 'refund.created', { id: 're_1' }), NOW),
    ).rejects.toThrow(/names no payment/)
    await expect(refunded('evt_2', 'cs_unknown', NOW)).rejects.toThrow(/unknown payment/)
  })

  it('refuses an amount or currency that does not match, and records the error', async () => {
    await recordCheckoutStarted(db, 'u1', 'cs_1', NOW)
    await expect(
      handleXPayEvent(
        db,
        event('evt_1', 'checkout.session.completed', session('cs_1', 'paid', { amountTotal: 100 })),
        NOW,
      ),
    ).rejects.toThrow(/paid 100 EGP, expected 20000 EGP/)
    expect((await getProAccess(db, 'u1', NOW)).isPro).toBe(false)
    const logged = await db.selectFrom('webhook_event').selectAll().executeTakeFirstOrThrow()
    expect(logged.processed_at).toBeNull()
    expect(logged.error).toMatch(/expected 20000/)
  })

  it('logs but ignores sessions it did not start and event types it does not use', async () => {
    expect(
      await handleXPayEvent(
        db,
        event('evt_1', 'checkout.session.completed', session('cs_unknown')),
        NOW,
      ),
    ).toBe('ignored')
    expect(
      await handleXPayEvent(db, event('evt_2', 'customer.created', { id: 'cus_1' }), NOW),
    ).toBe('ignored')
    expect(
      await db.selectFrom('webhook_event').select(['id', 'error']).orderBy('id').execute(),
    ).toEqual([
      { id: 'evt_1', error: 'ignored' },
      { id: 'evt_2', error: 'ignored' },
    ])
  })

  it('records a payment for a deleted account without granting anything', async () => {
    await recordCheckoutStarted(db, 'u1', 'cs_1', NOW)
    await db.deleteFrom('user').execute()
    expect(
      await fulfillCheckout(
        db,
        { ...session('cs_1'), status: 'complete', paymentStatus: 'paid' } as never,
        NOW,
      ),
    ).toBe('granted')
    expect(await db.selectFrom('subscription').selectAll().execute()).toEqual([])
    expect(
      await db.selectFrom('payment').select(['status', 'user_id']).executeTakeFirstOrThrow(),
    ).toEqual({ status: 'paid', user_id: null })
  })
})
