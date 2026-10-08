import type { Kysely } from 'kysely'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestDb } from '../../../tests/db/test-db'
import type { Database } from '@/lib/db/schema'
import { calculateTargets } from '@/lib/nutrition/calculator'
import type { ProfileValues } from '@/lib/nutrition/profile'
import { deleteAccount, getProfile, saveProfile } from './profiles'

const NOW = new Date('2026-10-08T12:00:00Z')
const values: ProfileValues = {
  weightKg: 65,
  heightCm: 165,
  birthYear: 1996,
  sex: 'female',
  activityLevel: 'moderate',
  goal: 'maintain',
  mealSplit: { breakfast: 25, lunch: 35, dinner: 30, snacks: 10 },
}

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
      name: 'Test',
      email: 'u1@example.com',
      emailVerified: true,
      image: null,
      createdAt: NOW,
      updatedAt: NOW,
    })
    .execute()
})

describe('profiles', () => {
  it('has no profile until one is saved', async () => {
    expect(await getProfile(db, 'u1', NOW)).toBeNull()
  })

  it('saves the answers with the targets calculated from them', async () => {
    const saved = await saveProfile(db, 'u1', values, NOW)
    expect(saved.targets).toEqual(calculateTargets({ ...values, age: 30 }))
    const read = await getProfile(db, 'u1', NOW)
    expect(read?.values).toEqual(values)
    expect(read?.targets).toEqual(saved.targets)
    const row = await db.selectFrom('nutrition_profile').selectAll().executeTakeFirstOrThrow()
    expect(row.consented_at.toISOString()).toBe(NOW.toISOString())
    expect(row.calorie_target_kcal).toBe(saved.targets.calorieTargetKcal)
  })

  it('recalculates whenever the profile changes', async () => {
    await saveProfile(db, 'u1', values, NOW)
    const later = new Date('2026-11-01T00:00:00Z')
    const updated = await saveProfile(
      db,
      'u1',
      { ...values, goal: 'lose_fat', weightKg: 70 },
      later,
    )
    expect(updated.targets.calorieTargetKcal).toBeLessThan(
      calculateTargets({ ...values, weightKg: 70, age: 30 }).calorieTargetKcal,
    )
    const rows = await db.selectFrom('nutrition_profile').selectAll().execute()
    expect(rows).toHaveLength(1)
    expect(rows[0]!.goal).toBe('lose_fat')
    expect(rows[0]!.calorie_target_kcal).toBe(updated.targets.calorieTargetKcal)
    expect(rows[0]!.created_at.toISOString()).toBe(NOW.toISOString())
    expect(rows[0]!.updated_at.toISOString()).toBe(later.toISOString())
  })

  it('brings stored targets up to date on read (new year, new formula)', async () => {
    await saveProfile(db, 'u1', values, NOW)
    await db
      .updateTable('nutrition_profile')
      .set({ formula_version: 0, calorie_target_kcal: 1 })
      .execute()
    const nextYear = new Date('2027-01-02T00:00:00Z')
    const read = await getProfile(db, 'u1', nextYear)
    expect(read?.targets).toEqual(calculateTargets({ ...values, age: 31 }))
    const row = await db.selectFrom('nutrition_profile').selectAll().executeTakeFirstOrThrow()
    expect(row.calorie_target_kcal).toBe(read?.targets.calorieTargetKcal)
    expect(row.updated_at.toISOString()).toBe(nextYear.toISOString())
  })

  it('deleting the account removes the profile', async () => {
    await saveProfile(db, 'u1', values, NOW)
    await deleteAccount(db, 'u1')
    expect(await getProfile(db, 'u1', NOW)).toBeNull()
    expect(await db.selectFrom('user').selectAll().execute()).toEqual([])
  })
})
