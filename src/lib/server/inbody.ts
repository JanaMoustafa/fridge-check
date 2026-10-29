import 'server-only'
import { sql, type Kysely } from 'kysely'
import type { Database } from '@/lib/db/schema'
import type { Extra } from '@/lib/nutritionist/inbody-extra'
import type { ScanValues } from '@/lib/nutritionist/inbody'

export interface StoredScan extends ScanValues {
  id: string
  source: 'photo' | 'typed'
  /** The sheet's other numbers, when read from a photo. */
  extra: Extra
  createdAt: Date
}

const columns = [
  'id',
  sql<string>`scanned_on::text`.as('scanned_on'),
  'weight_kg',
  'smm_kg',
  'bfm_kg',
  'pbf',
  'bmr_kcal',
  'vfl',
  'tbw_l',
  'source',
  'extra',
  'created_at',
] as const

type Row = {
  id: string
  scanned_on: string
  weight_kg: number
  smm_kg: number | null
  bfm_kg: number | null
  pbf: number | null
  bmr_kcal: number | null
  vfl: number | null
  tbw_l: number | null
  source: 'photo' | 'typed'
  extra: Record<string, number>
  created_at: Date
}

const toScan = (row: Row): StoredScan => ({
  id: row.id,
  scannedOn: row.scanned_on,
  weightKg: row.weight_kg,
  smmKg: row.smm_kg,
  bfmKg: row.bfm_kg,
  pbf: row.pbf,
  bmrKcal: row.bmr_kcal,
  vfl: row.vfl,
  tbwL: row.tbw_l,
  source: row.source,
  extra: row.extra as Extra,
  createdAt: row.created_at,
})

/** Every scan, newest first (by scan date, then by when it was recorded). */
export async function listScans(db: Kysely<Database>, userId: string): Promise<StoredScan[]> {
  const rows = await db
    .selectFrom('inbody_scan')
    .select(columns)
    .where('user_id', '=', userId)
    .orderBy('scanned_on', 'desc')
    .orderBy('created_at', 'desc')
    .execute()
  return rows.map((row) => toScan(row as Row))
}

export async function latestScan(db: Kysely<Database>, userId: string): Promise<StoredScan | null> {
  const row = await db
    .selectFrom('inbody_scan')
    .select(columns)
    .where('user_id', '=', userId)
    .orderBy('scanned_on', 'desc')
    .orderBy('created_at', 'desc')
    .limit(1)
    .executeTakeFirst()
  return row ? toScan(row as Row) : null
}

/**
 * Records a scan. When it is now the latest one, the nutrition profile's weight follows it, so
 * every target (and every recipe portion) is worked out from the newest measurement.
 */
export async function saveScan(
  db: Kysely<Database>,
  userId: string,
  values: ScanValues,
  source: 'photo' | 'typed',
  now: Date,
  extra: Extra = {},
): Promise<void> {
  await db.transaction().execute(async (trx) => {
    await trx
      .insertInto('inbody_scan')
      .values({
        user_id: userId,
        scanned_on: values.scannedOn,
        weight_kg: values.weightKg,
        smm_kg: values.smmKg,
        bfm_kg: values.bfmKg,
        pbf: values.pbf,
        bmr_kcal: values.bmrKcal,
        vfl: values.vfl,
        tbw_l: values.tbwL,
        source,
        extra,
        created_at: now,
      })
      .execute()
    const newest = await trx
      .selectFrom('inbody_scan')
      .select(sql<string>`scanned_on::text`.as('scanned_on'))
      .where('user_id', '=', userId)
      .orderBy('scanned_on', 'desc')
      .limit(1)
      .executeTakeFirstOrThrow()
    if (newest.scanned_on === values.scannedOn) {
      await trx
        .updateTable('nutrition_profile')
        .set({ weight_kg: values.weightKg, updated_at: now })
        .where('user_id', '=', userId)
        .execute()
    }
  })
}

/** Removes one of the member's own scans (a scan typed in by mistake). */
export async function deleteScan(
  db: Kysely<Database>,
  userId: string,
  scanId: string,
): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(scanId)) return false
  const result = await db
    .deleteFrom('inbody_scan')
    .where('id', '=', scanId)
    .where('user_id', '=', userId)
    .executeTakeFirst()
  return Number(result.numDeletedRows) > 0
}
