import 'server-only'
import type { Kysely } from 'kysely'
import type { Database } from '@/lib/db/schema'
import { fulfillCheckout } from './webhook'
import type { XPayClient } from './xpay'

export type CheckoutOutcome = 'paid' | 'pending' | 'failed' | 'unknown'

/**
 * The success page's view of one of the user's own checkouts. Webhooks normally settle it first;
 * while it is still pending, XPay is asked directly (server to server, with the secret key) and
 * the answer goes through the same idempotent fulfilment. Someone else's session id, or one we
 * never started, is "unknown" and is never looked up.
 */
export async function confirmCheckout(
  db: Kysely<Database>,
  xpay: Pick<XPayClient, 'getCheckoutSession'> | null,
  userId: string,
  sessionId: string,
  now: Date,
): Promise<CheckoutOutcome> {
  const read = () =>
    db
      .selectFrom('payment')
      .select('status')
      .where('xpay_checkout_session_id', '=', sessionId)
      .where('user_id', '=', userId)
      .executeTakeFirst()
  let payment = await read()
  if (!payment) return 'unknown'
  if (payment.status === 'pending' && xpay) {
    try {
      const session = await xpay.getCheckoutSession(sessionId)
      await fulfillCheckout(db, session, now)
      payment = await read()
    } catch (error) {
      // Leave it pending: the webhook (or the next refresh) will settle it.
      console.warn('[checkout] confirmation failed', error instanceof Error ? error.message : error)
    }
  }
  if (payment?.status === 'paid') return 'paid'
  if (payment?.status === 'pending') return 'pending'
  return 'failed'
}
