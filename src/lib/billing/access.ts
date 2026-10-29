import 'server-only'
import type { Kysely } from 'kysely'
import type { Database, SubscriptionStatus } from '@/lib/db/schema'
import { TRIAL_DAYS } from './plan'

export interface ProAccess {
  /** Every Pro feature is open: during the free trial or a paid period. */
  isPro: boolean
  status: SubscriptionStatus | null
  /** When the paid period ends (Pro stays until then, even after canceling). */
  periodEnd: Date | null
  /** Canceled: Pro until periodEnd, then it does not renew. */
  cancelAtPeriodEnd: boolean
  /** Pro comes only from the free trial right now (no paid period running). */
  onTrial: boolean
  /** When the account's free trial ends (or ended); null when the account is unknown. */
  trialEndsAt: Date | null
}

const DAY_MS = 24 * 60 * 60 * 1000

/** The end of the free trial that every account gets from the day it signs up. */
export function trialEnd(createdAt: Date): Date {
  return new Date(createdAt.getTime() + TRIAL_DAYS * DAY_MS)
}

/**
 * Whether a user has Pro right now. The database is the only truth: every account has every
 * Pro feature for its first 30 days; after that, an active or canceled subscription (written by
 * XPay's verified webhooks, never by the browser) counts until the end of its paid period;
 * past_due and expired do not.
 */
export async function getProAccess(
  db: Kysely<Database>,
  userId: string,
  now: Date,
): Promise<ProAccess> {
  const [row, user] = await Promise.all([
    db
      .selectFrom('subscription')
      .select(['status', 'current_period_end', 'cancel_at_period_end'])
      .where('user_id', '=', userId)
      .executeTakeFirst(),
    db.selectFrom('user').select('createdAt').where('id', '=', userId).executeTakeFirst(),
  ])
  const trialEndsAt = user ? trialEnd(user.createdAt) : null
  const trialRunning = trialEndsAt !== null && trialEndsAt > now
  if (!row) {
    return {
      isPro: trialRunning,
      status: null,
      periodEnd: null,
      cancelAtPeriodEnd: false,
      onTrial: trialRunning,
      trialEndsAt,
    }
  }
  const paidUp = row.status === 'active' || row.status === 'canceled'
  const paidPro = paidUp && row.current_period_end > now
  return {
    isPro: paidPro || trialRunning,
    status: row.current_period_end > now || !paidUp ? row.status : 'expired',
    periodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    onTrial: trialRunning && !paidPro,
    trialEndsAt,
  }
}
