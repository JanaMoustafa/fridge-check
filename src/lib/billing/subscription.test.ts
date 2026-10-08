import type { Kysely } from 'kysely'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestDb } from '../../../tests/db/test-db'
import type { Database } from '@/lib/db/schema'
import { getProAccess } from './access'
import {
  cancelRenewal,
  daysLeft,
  MAX_OPEN_CHECKOUTS_PER_HOUR,
  mayStartCheckout,
  resumeRenewal,
} from './subscription'
import { recordCheckoutStarted } from './webhook'

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

async function subscribe(endsInDays: number) {
  await db
    .insertInto('subscription')
    .values({
      user_id: 'u1',
      plan: 'pro_monthly',
      status: 'active',
      xpay_customer_id: null,
      xpay_subscription_id: null,
      xpay_checkout_session_id: null,
      current_period_start: new Date(NOW.getTime() + (endsInDays - 30) * DAY),
      current_period_end: new Date(NOW.getTime() + endsInDays * DAY),
    })
    .execute()
}

describe('cancel and resume', () => {
  it('keeps Pro until the period ends after canceling, and can resume', async () => {
    await subscribe(10)
    expect(await cancelRenewal(db, 'u1', NOW)).toBe(true)
    expect(await getProAccess(db, 'u1', NOW)).toMatchObject({
      isPro: true,
      status: 'canceled',
      cancelAtPeriodEnd: true,
    })
    expect(await getProAccess(db, 'u1', new Date(NOW.getTime() + 11 * DAY))).toMatchObject({
      isPro: false,
    })
    expect(await resumeRenewal(db, 'u1', NOW)).toBe(true)
    expect(await getProAccess(db, 'u1', NOW)).toMatchObject({
      isPro: true,
      status: 'active',
      cancelAtPeriodEnd: false,
    })
  })

  it('changes nothing without a current subscription', async () => {
    expect(await cancelRenewal(db, 'u1', NOW)).toBe(false)
    await subscribe(-1)
    expect(await cancelRenewal(db, 'u1', NOW)).toBe(false)
    expect(await resumeRenewal(db, 'u1', NOW)).toBe(false)
  })
})

describe('mayStartCheckout', () => {
  it(`allows ${MAX_OPEN_CHECKOUTS_PER_HOUR} unfinished checkouts an hour`, async () => {
    for (let i = 0; i < MAX_OPEN_CHECKOUTS_PER_HOUR; i++) {
      expect(await mayStartCheckout(db, 'u1', NOW)).toBe(true)
      await recordCheckoutStarted(db, 'u1', `cs_${i}`, NOW)
    }
    expect(await mayStartCheckout(db, 'u1', NOW)).toBe(false)
    expect(await mayStartCheckout(db, 'u1', new Date(NOW.getTime() + 61 * 60 * 1000))).toBe(true)
  })
})

describe('daysLeft', () => {
  it('rounds up and never goes below 0', () => {
    expect(daysLeft(new Date(NOW.getTime() + 2.2 * DAY), NOW)).toBe(3)
    expect(daysLeft(new Date(NOW.getTime() - DAY), NOW)).toBe(0)
  })
})
