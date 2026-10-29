import type { Kysely } from 'kysely'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestDb } from '../../../tests/db/test-db'
import type { Database } from '@/lib/db/schema'
import { DEFAULT_MEAL_SPLIT } from '@/lib/nutrition/portions'
import type { ScanValues } from '@/lib/nutritionist/inbody'
import { deleteScan, latestScan, listScans, saveScan } from './inbody'
import { getProfile, saveProfile } from './profiles'

const NOW = new Date('2026-10-29T12:00:00Z')
let db: Kysely<Database>

const scan = (scannedOn: string, weightKg: number, bmrKcal: number | null = null): ScanValues => ({
  scannedOn,
  weightKg,
  smmKg: 24.1,
  bfmKg: 22.6,
  pbf: 33.2,
  bmrKcal,
  vfl: 8,
  tbwL: 33.2,
})

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
      name: 'N',
      email: 'n@example.com',
      emailVerified: true,
      image: null,
      createdAt: NOW,
      updatedAt: NOW,
    })
    .execute()
  await saveProfile(
    db,
    'u1',
    {
      weightKg: 70,
      heightCm: 165,
      birthYear: 1994,
      sex: 'female',
      activityLevel: 'moderate',
      goal: 'lose_fat',
      mealSplit: { ...DEFAULT_MEAL_SPLIT },
    },
    NOW,
  )
})

describe('InBody scans', () => {
  it('saves scans and lists them newest first, with the date as written', async () => {
    await saveScan(db, 'u1', scan('2026-09-27', 70), 'typed', NOW)
    await saveScan(db, 'u1', scan('2026-10-27', 68, 1360), 'photo', NOW, {
      inbodyScore: 71,
      bmi: 25,
    })
    const scans = await listScans(db, 'u1')
    expect(scans[0]?.extra).toEqual({ inbodyScore: 71, bmi: 25 })
    expect(scans[1]?.extra).toEqual({})
    expect(scans.map((s) => [s.scannedOn, s.weightKg, s.source])).toEqual([
      ['2026-10-27', 68, 'photo'],
      ['2026-09-27', 70, 'typed'],
    ])
    expect((await latestScan(db, 'u1'))?.bmrKcal).toBe(1360)
  })

  it('moves the profile weight to the newest scan and uses its measured BMR for the targets', async () => {
    await saveScan(db, 'u1', scan('2026-10-27', 68, 1360), 'photo', NOW)
    const profile = await getProfile(db, 'u1', NOW)
    expect(profile?.values.weightKg).toBe(68)
    expect(profile?.targets).toMatchObject({ bmrKcal: 1360, calorieTargetKcal: 1690 })
    // An older scan added later doesn't move the weight back.
    await saveScan(db, 'u1', scan('2026-08-01', 75), 'typed', NOW)
    expect((await getProfile(db, 'u1', NOW))?.values.weightKg).toBe(68)
  })

  it('deletes only the member’s own scans, and all of them with the account', async () => {
    await saveScan(db, 'u1', scan('2026-10-27', 68), 'typed', NOW)
    const [first] = await listScans(db, 'u1')
    expect(await deleteScan(db, 'someone-else', first!.id)).toBe(false)
    expect(await deleteScan(db, 'u1', 'not-a-uuid')).toBe(false)
    expect(await deleteScan(db, 'u1', first!.id)).toBe(true)
    await saveScan(db, 'u1', scan('2026-10-27', 68), 'typed', NOW)
    await db.deleteFrom('user').execute()
    expect(await db.selectFrom('inbody_scan').selectAll().execute()).toEqual([])
  })

  it('refuses values outside the plausible ranges in the database too', async () => {
    await expect(
      saveScan(db, 'u1', { ...scan('2026-10-27', 68), pbf: 90 }, 'typed', NOW),
    ).rejects.toThrow()
    expect(await latestScan(db, 'u1')).toBeNull()
  })
})
