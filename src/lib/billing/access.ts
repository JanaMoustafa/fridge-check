import 'server-only'
import type { Kysely } from 'kysely'
import type { Database, SubscriptionStatus } from '@/lib/db/schema'

export interface ProAccess {
  isPro: boolean
  status: SubscriptionStatus | null
  /** When the paid period ends (Pro stays until then, even after canceling). */
  periodEnd: Date | null
  /** Canceled: Pro until periodEnd, then it does not renew. */
  cancelAtPeriodEnd: boolean
}

const NONE: ProAccess = { isPro: false, status: null, periodEnd: null, cancelAtPeriodEnd: false }

/**
 * Whether a user has Pro right now. The database is the only truth (written by XPay's verified
 * webhooks, never by the browser): an active or canceled subscription counts until the end of
 * its paid period; past_due and expired do not.
 */
export async function getProAccess(
  db: Kysely<Database>,
  userId: string,
  now: Date,
): Promise<ProAccess> {
  const row = await db
    .selectFrom('subscription')
    .select(['status', 'current_period_end', 'cancel_at_period_end'])
    .where('user_id', '=', userId)
    .executeTakeFirst()
  if (!row) return NONE
  const paidUp = row.status === 'active' || row.status === 'canceled'
  return {
    isPro: paidUp && row.current_period_end > now,
    status: row.current_period_end > now || !paidUp ? row.status : 'expired',
    periodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
  }
}
