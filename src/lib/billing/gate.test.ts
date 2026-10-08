import type { Kysely } from 'kysely'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestDb } from '../../../tests/db/test-db'
import type { Database, SubscriptionStatus } from '@/lib/db/schema'
import type { RecipeNutrition } from '@/lib/nutrition/recipe-nutrition'

const signedIn = vi.hoisted(() => ({
  user: null as null | { id: string; name: string; email: string; image: null },
}))
vi.mock('@/lib/auth/auth', () => ({ getSignedInUser: async () => signedIn.user }))
vi.mock('@/lib/db/client', () => ({ getDb: () => undefined }))

const { getProUser, nutritionView } = await import('./gate')

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
  signedIn.user = null
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

async function subscribe(status: SubscriptionStatus, endsInDays: number) {
  await db
    .insertInto('subscription')
    .values({
      user_id: 'u1',
      plan: 'pro_monthly',
      status,
      xpay_customer_id: null,
      xpay_subscription_id: null,
      xpay_checkout_session_id: null,
      current_period_start: new Date(NOW.getTime() + (endsInDays - 30) * DAY),
      current_period_end: new Date(NOW.getTime() + endsInDays * DAY),
    })
    .execute()
}

const complete: RecipeNutrition = {
  lines: [{ name: 'rice', grams: 100, per100g: { kcal: 365, proteinG: 7, fatG: 1, carbsG: 80 } }],
  uncounted: [{ raw: 'salt', name: 'salt', reason: 'small-amount' }],
  complete: true,
}

describe('getProUser (subscription gating, real database)', () => {
  it('is null when signed out', async () => {
    expect(await getProUser(NOW, db)).toBeNull()
  })

  it.each([
    ['no subscription', null, false],
    ['an active period', ['active', 10], true],
    ['a canceled period that has not ended', ['canceled', 3], true],
    ['a period that ended', ['active', -1], false],
    ['a past-due subscription', ['past_due', 10], false],
    ['an expired subscription', ['expired', 10], false],
  ] as const)('with %s, isPro is %s', async (_label, sub, expected) => {
    signedIn.user = { id: 'u1', name: 'T', email: 't@example.com', image: null }
    if (sub) await subscribe(sub[0], sub[1])
    const result = await getProUser(NOW, db)
    expect(result?.user.id).toBe('u1')
    expect(result?.access.isPro).toBe(expected)
  })
})

describe('nutritionView', () => {
  it('locks free users without computing any nutrition', () => {
    const compute = vi.fn(() => complete)
    expect(nutritionView(false, compute)).toEqual({ kind: 'locked' })
    expect(compute).not.toHaveBeenCalled()
  })

  it('shows Pro users the numbers, or says why it cannot', () => {
    expect(nutritionView(true, complete)).toEqual({ kind: 'ready', nutrition: complete })
    expect(nutritionView(true, null)).toEqual({ kind: 'source-without-data' })
    const incomplete: RecipeNutrition = {
      ...complete,
      complete: false,
      uncounted: [
        ...complete.uncounted,
        { raw: '8 prawns', name: 'shrimp', reason: 'no-usda-weight' },
      ],
    }
    expect(nutritionView(true, incomplete)).toEqual({
      kind: 'incomplete',
      missing: [{ raw: '8 prawns', name: 'shrimp', reason: 'no-usda-weight' }],
    })
  })
})
