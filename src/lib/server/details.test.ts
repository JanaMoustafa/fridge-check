import type { Kysely } from 'kysely'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestDb } from '../../../tests/db/test-db'
import type { Database } from '@/lib/db/schema'
import { getDetails, saveDetails } from './details'

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

describe('member details', () => {
  it('reads the Google name with no phone until one is saved', async () => {
    expect(await getDetails(db, 'u1')).toEqual({ name: 'Nour', phone: null })
  })

  it('saves the name and phone, and updates them later', async () => {
    await saveDetails(db, 'u1', { name: 'Nour Adel', phone: '+201001234567' }, NOW)
    expect(await getDetails(db, 'u1')).toEqual({ name: 'Nour Adel', phone: '+201001234567' })
    await saveDetails(db, 'u1', { name: 'Nour Adel', phone: null }, NOW)
    expect(await getDetails(db, 'u1')).toEqual({ name: 'Nour Adel', phone: null })
  })

  it('refuses a malformed phone in the database too, and deletes it with the account', async () => {
    await expect(
      db
        .insertInto('member_contact')
        .values({ user_id: 'u1', phone: '12-34', updated_at: NOW })
        .execute(),
    ).rejects.toThrow()
    await saveDetails(db, 'u1', { name: 'Nour', phone: '01001234567' }, NOW)
    await db.deleteFrom('user').where('id', '=', 'u1').execute()
    expect(await db.selectFrom('member_contact').selectAll().execute()).toEqual([])
  })

  it('is null for an unknown account', async () => {
    expect(await getDetails(db, 'nobody')).toBeNull()
  })
})
