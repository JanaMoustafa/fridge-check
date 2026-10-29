import type { Kysely } from 'kysely'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestDb } from '../../../tests/db/test-db'
import type { Database, SubscriptionStatus } from '@/lib/db/schema'
import { getProAccess } from './access'

const NOW = new Date('2026-10-09T12:00:00Z')
const DAY = 24 * 60 * 60 * 1000
let db: Kysely<Database>

beforeAll(async () => {
  db = await createTestDb()
})
afterAll(async () => {
  await db.destroy()
})
beforeEach(async () => {
  await db.deleteFrom('user').execute()
  await db
    .insertInto('user')
    .values({
      id: 'u1',
      name: 'T',
      email: 't@example.com',
      emailVerified: true,
      image: null,
      // Signed up 60 days ago: the free trial is over unless a test says otherwise.
      createdAt: new Date(NOW.getTime() - 60 * DAY),
      updatedAt: NOW,
    })
    .execute()
})

async function subscribe(status: SubscriptionStatus, endsInDays: number, cancel = false) {
  await db
    .insertInto('subscription')
    .values({
      user_id: 'u1',
      plan: 'pro_monthly',
      status,
      cancel_at_period_end: cancel,
      xpay_customer_id: null,
      xpay_subscription_id: null,
      xpay_checkout_session_id: null,
      current_period_start: new Date(NOW.getTime() + (endsInDays - 30) * DAY),
      current_period_end: new Date(NOW.getTime() + endsInDays * DAY),
    })
    .execute()
}

describe('getProAccess', () => {
  it('is not Pro without a subscription', async () => {
    expect(await getProAccess(db, 'u1', NOW)).toEqual({
      isPro: false,
      status: null,
      periodEnd: null,
      cancelAtPeriodEnd: false,
      onTrial: false,
      trialEndsAt: new Date(NOW.getTime() - 30 * DAY),
    })
  })

  it('is Pro during an active paid period', async () => {
    await subscribe('active', 10)
    expect(await getProAccess(db, 'u1', NOW)).toMatchObject({ isPro: true, status: 'active' })
  })

  it('keeps Pro after canceling until the period ends', async () => {
    await subscribe('canceled', 3, true)
    expect(await getProAccess(db, 'u1', NOW)).toMatchObject({
      isPro: true,
      status: 'canceled',
      cancelAtPeriodEnd: true,
    })
  })

  it('ends Pro when the period is over, whatever the stored status says', async () => {
    await subscribe('active', -1)
    expect(await getProAccess(db, 'u1', NOW)).toMatchObject({ isPro: false, status: 'expired' })
  })

  it.each(['past_due', 'expired'] as const)('is not Pro when %s', async (status) => {
    await subscribe(status, 10)
    expect(await getProAccess(db, 'u1', NOW)).toMatchObject({ isPro: false, status })
  })

  it('gives every Pro feature free for the first 30 days after sign-up', async () => {
    await db
      .updateTable('user')
      .set({ createdAt: new Date(NOW.getTime() - 3 * DAY) })
      .execute()
    expect(await getProAccess(db, 'u1', NOW)).toMatchObject({
      isPro: true,
      onTrial: true,
      trialEndsAt: new Date(NOW.getTime() + 27 * DAY),
    })
    // Day 31: the trial is over.
    expect(await getProAccess(db, 'u1', new Date(NOW.getTime() + 28 * DAY))).toMatchObject({
      isPro: false,
      onTrial: false,
    })
  })

  it('a paid period during the trial counts as paid, not trial', async () => {
    await db
      .updateTable('user')
      .set({ createdAt: new Date(NOW.getTime() - 3 * DAY) })
      .execute()
    await subscribe('active', 10)
    expect(await getProAccess(db, 'u1', NOW)).toMatchObject({
      isPro: true,
      onTrial: false,
      status: 'active',
    })
  })

  it('an unknown account has no trial', async () => {
    expect(await getProAccess(db, 'nobody', NOW)).toMatchObject({
      isPro: false,
      onTrial: false,
      trialEndsAt: null,
    })
  })
})
