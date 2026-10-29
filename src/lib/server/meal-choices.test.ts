import type { Kysely } from 'kysely'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestDb } from '../../../tests/db/test-db'
import type { Database } from '@/lib/db/schema'
import { clearMealChoice, getMealChoices, saveMealChoice } from './meal-choices'

const NOW = new Date('2026-10-30T12:00:00Z')
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
      name: 'Nour',
      email: 'n@example.com',
      emailVerified: true,
      image: null,
      createdAt: NOW,
      updatedAt: NOW,
    })
    .execute()
})

describe('meal choices', () => {
  it('remembers a pick per meal and day, replaces it, and clears it', async () => {
    expect(await getMealChoices(db, 'u1', '2026-10-30')).toEqual({})
    await saveMealChoice(db, 'u1', '2026-10-30', 'lunch', 'local:1', NOW)
    await saveMealChoice(db, 'u1', '2026-10-30', 'snacks', 'apple-pb', NOW)
    await saveMealChoice(db, 'u1', '2026-10-31', 'lunch', 'local:2', NOW)
    expect(await getMealChoices(db, 'u1', '2026-10-30')).toEqual({
      lunch: 'local:1',
      snacks: 'apple-pb',
    })
    await saveMealChoice(db, 'u1', '2026-10-30', 'lunch', 'local:3', NOW)
    expect((await getMealChoices(db, 'u1', '2026-10-30')).lunch).toBe('local:3')
    await clearMealChoice(db, 'u1', '2026-10-30', 'lunch')
    expect(await getMealChoices(db, 'u1', '2026-10-30')).toEqual({ snacks: 'apple-pb' })
    expect(await getMealChoices(db, 'u1', '2026-10-31')).toEqual({ lunch: 'local:2' })
  })

  it('refuses an unknown meal and goes with the account', async () => {
    await expect(
      saveMealChoice(db, 'u1', '2026-10-30', 'brunch' as 'lunch', 'x', NOW),
    ).rejects.toThrow()
    await saveMealChoice(db, 'u1', '2026-10-30', 'dinner', 'local:9', NOW)
    await db.deleteFrom('user').where('id', '=', 'u1').execute()
    expect(await db.selectFrom('meal_choice').selectAll().execute()).toEqual([])
  })
})
