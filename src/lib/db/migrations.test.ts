import { PGlite } from '@electric-sql/pglite'
import { getMigrations } from 'better-auth/db/migration'
import { Kysely, sql } from 'kysely'
import { PGliteDialect } from 'kysely-pglite-dialect'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestDb } from '../../../tests/db/test-db'
import { assertMigrated, createMigrator, MIGRATIONS } from './migrator'
import type { Database } from './schema'

const OUR_TABLES = ['nutrition_profile', 'payment', 'subscription', 'webhook_event']
const AUTH_TABLES = ['account', 'session', 'user', 'verification']

async function tables(db: Kysely<unknown>): Promise<string[]> {
  const result = await sql<{ name: string }>`
    select table_name as name from information_schema.tables
    where table_schema = 'public' and table_name not like 'kysely_%' order by table_name`.execute(
    db,
  )
  return result.rows.map((row) => row.name)
}

describe('migrations', () => {
  it('apply in order, and revert one by one back to an empty database', async () => {
    const db = new Kysely<unknown>({ dialect: new PGliteDialect(new PGlite()) })
    const migrator = createMigrator(db)
    assertMigrated(await migrator.migrateToLatest())
    expect(await tables(db)).toEqual([...AUTH_TABLES, ...OUR_TABLES].sort())

    for (let i = 0; i < Object.keys(MIGRATIONS).length; i++) {
      assertMigrated(await migrator.migrateDown())
    }
    expect(await tables(db)).toEqual([])

    // Reversible both ways: everything applies again on the emptied database.
    assertMigrated(await migrator.migrateToLatest())
    expect(await tables(db)).toHaveLength(8)
    await db.destroy()
  })

  it('give Better Auth every table and column it needs', async () => {
    const db = await createTestDb()
    const plan = await getMigrations({ database: { db, type: 'postgres' } })
    expect(plan.toBeCreated).toEqual([])
    expect(plan.toBeAdded).toEqual([])
    await db.destroy()
  })

  it('report the failing migration by name', () => {
    expect(() =>
      assertMigrated({
        error: new Error('boom'),
        results: [{ migrationName: '0002_x', direction: 'Up', status: 'Error' }],
      }),
    ).toThrow('Migration 0002_x failed: boom')
    expect(() => assertMigrated({ error: 'odd', results: [] })).toThrow(
      'Migration (setup) failed: odd',
    )
    expect(() => assertMigrated({ results: [] })).not.toThrow()
  })
})

describe('schema rules', () => {
  let db: Kysely<Database>
  const now = new Date('2026-10-08T12:00:00Z')
  const later = new Date('2026-11-07T12:00:00Z')

  beforeAll(async () => {
    db = await createTestDb()
    await db
      .insertInto('user')
      .values({
        id: 'u1',
        name: 'Test',
        email: 't@example.com',
        emailVerified: true,
        image: null,
        createdAt: now,
        updatedAt: now,
      })
      .execute()
  })
  afterAll(async () => {
    await db.destroy()
  })

  const profile = {
    user_id: 'u1',
    weight_kg: 70,
    height_cm: 170,
    birth_year: 1995,
    sex: 'female' as const,
    activity_level: 'moderate' as const,
    goal: 'maintain' as const,
    consented_at: now,
    formula_version: 1,
    bmr_kcal: 1400,
    tdee_kcal: 2170,
    calorie_target_kcal: 2170,
    protein_g: 112,
    fat_g: 66,
    carbs_g: 280,
  }

  it('stores a profile with the default meal split', async () => {
    await db.insertInto('nutrition_profile').values(profile).execute()
    const row = await db
      .selectFrom('nutrition_profile')
      .selectAll()
      .where('user_id', '=', 'u1')
      .executeTakeFirstOrThrow()
    expect(row.meal_split).toEqual({ breakfast: 25, lunch: 35, dinner: 30, snacks: 10 })
    expect(row.weight_kg).toBe(70)
    expect(row.created_at).toBeInstanceOf(Date)
    await db.deleteFrom('nutrition_profile').execute()
  })

  it.each([
    ['a weight out of range', { weight_kg: 12 }],
    ['an unknown sex', { sex: 'other' }],
    ['an unknown goal', { goal: 'bulk' }],
    ['a zero calorie target', { calorie_target_kcal: 0 }],
  ])('rejects %s', async (_label, change) => {
    await expect(
      db
        .insertInto('nutrition_profile')
        .values({ ...profile, ...(change as object) })
        .execute(),
    ).rejects.toThrow(/check constraint/)
  })

  it('records each XPay checkout session once', async () => {
    const payment = {
      user_id: 'u1',
      plan: 'pro_monthly' as const,
      status: 'pending' as const,
      xpay_checkout_session_id: 'cs_test_1',
      amount_minor: 20000,
      currency: 'EGP',
    }
    await db.insertInto('payment').values(payment).execute()
    await expect(db.insertInto('payment').values(payment).execute()).rejects.toThrow(/unique/)
  })

  it('keeps one subscription per user, with its period in order', async () => {
    const subscription = {
      user_id: 'u1',
      plan: 'pro_monthly' as const,
      status: 'active' as const,
      xpay_customer_id: null,
      xpay_subscription_id: null,
      xpay_checkout_session_id: 'cs_test_1',
      current_period_start: now,
      current_period_end: later,
    }
    await expect(
      db
        .insertInto('subscription')
        .values({ ...subscription, current_period_end: now })
        .execute(),
    ).rejects.toThrow(/subscription_period_order/)
    await db.insertInto('subscription').values(subscription).execute()
    await expect(db.insertInto('subscription').values(subscription).execute()).rejects.toThrow(
      /unique/,
    )
  })

  it('deleting a user removes their data but keeps payment records', async () => {
    await db.insertInto('nutrition_profile').values(profile).execute()
    await db.deleteFrom('user').where('id', '=', 'u1').execute()
    expect(await db.selectFrom('nutrition_profile').selectAll().execute()).toEqual([])
    expect(await db.selectFrom('subscription').selectAll().execute()).toEqual([])
    const payments = await db.selectFrom('payment').select(['user_id', 'status']).execute()
    expect(payments).toEqual([{ user_id: null, status: 'pending' }])
  })
})
