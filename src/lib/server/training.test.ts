import type { Kysely } from 'kysely'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestDb } from '../../../tests/db/test-db'
import type { Database } from '@/lib/db/schema'
import { getTrainingChoice, saveTrainingChoice } from './training'

const NOW = new Date('2026-10-29T12:00:00Z')
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

describe('training choice', () => {
  it('is empty until chosen, then saved and changed', async () => {
    expect(await getTrainingChoice(db, 'u1')).toBeNull()
    await saveTrainingChoice(db, 'u1', { style: 'pilates', days: 0b0010101 }, NOW)
    expect(await getTrainingChoice(db, 'u1')).toEqual({ style: 'pilates', days: 0b0010101 })
    await saveTrainingChoice(db, 'u1', { style: 'gym', days: 0b0111110 }, NOW)
    expect(await getTrainingChoice(db, 'u1')).toEqual({ style: 'gym', days: 0b0111110 })
  })

  it('goes with the account, and the database refuses an unknown style or no days', async () => {
    await saveTrainingChoice(db, 'u1', { style: 'gym', days: 1 }, NOW)
    await db.deleteFrom('user').where('id', '=', 'u1').execute()
    expect(await db.selectFrom('training_plan').selectAll().execute()).toEqual([])
    await db
      .insertInto('user')
      .values({
        id: 'u1',
        name: 'N',
        email: 'n@example.com',
        emailVerified: true,
        image: null,
        createdAt: NOW,
        updatedAt: NOW,
      })
      .execute()
    await expect(
      saveTrainingChoice(db, 'u1', { style: 'yoga' as 'gym', days: 1 }, NOW),
    ).rejects.toThrow()
    await expect(saveTrainingChoice(db, 'u1', { style: 'gym', days: 0 }, NOW)).rejects.toThrow()
  })
})
