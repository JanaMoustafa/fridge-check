import 'server-only'
import type { Kysely } from 'kysely'
import type { Database } from '@/lib/db/schema'

/** Unfinished checkouts allowed per user per hour: enough for retries, not for abuse. */
export const MAX_OPEN_CHECKOUTS_PER_HOUR = 5
const HOUR_MS = 60 * 60 * 1000

/**
 * Canceling a prepaid pass means "do not remind me to renew": Pro stays until the paid period
 * ends. Only a current, paid-up subscription can be canceled. Returns whether anything changed.
 */
export async function cancelRenewal(
  db: Kysely<Database>,
  userId: string,
  now: Date,
): Promise<boolean> {
  const result = await db
    .updateTable('subscription')
    .set({ status: 'canceled', cancel_at_period_end: true, updated_at: now })
    .where('user_id', '=', userId)
    .where('status', '=', 'active')
    .where('current_period_end', '>', now)
    .executeTakeFirst()
  return result.numUpdatedRows > 0n
}

/** Undoes cancelRenewal while the period is still running. */
export async function resumeRenewal(
  db: Kysely<Database>,
  userId: string,
  now: Date,
): Promise<boolean> {
  const result = await db
    .updateTable('subscription')
    .set({ status: 'active', cancel_at_period_end: false, updated_at: now })
    .where('user_id', '=', userId)
    .where('status', '=', 'canceled')
    .where('current_period_end', '>', now)
    .executeTakeFirst()
  return result.numUpdatedRows > 0n
}

/** Whether the user may start another checkout now (see MAX_OPEN_CHECKOUTS_PER_HOUR). */
export async function mayStartCheckout(
  db: Kysely<Database>,
  userId: string,
  now: Date,
): Promise<boolean> {
  const { count } = await db
    .selectFrom('payment')
    .select((eb) => eb.fn.countAll<string>().as('count'))
    .where('user_id', '=', userId)
    .where('status', '=', 'pending')
    .where('created_at', '>', new Date(now.getTime() - HOUR_MS))
    .executeTakeFirstOrThrow()
  return Number(count) < MAX_OPEN_CHECKOUTS_PER_HOUR
}

/** Days of Pro left (rounded up), for the renewal reminder. */
export function daysLeft(periodEnd: Date, now: Date): number {
  return Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (24 * HOUR_MS)))
}
