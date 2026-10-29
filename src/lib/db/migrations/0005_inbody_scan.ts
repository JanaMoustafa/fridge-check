import { sql, type Kysely } from 'kysely'

/**
 * One row per InBody result a member records (read from a photo or typed in). The photo itself
 * is never stored, only these numbers. Ranges match src/lib/nutritionist/inbody.ts.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('inbody_scan')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'text', (col) => col.notNull().references('user.id').onDelete('cascade'))
    .addColumn('scanned_on', 'date', (col) => col.notNull())
    .addColumn('weight_kg', 'double precision', (col) =>
      col.notNull().check(sql`weight_kg between 30 and 300`),
    )
    .addColumn('smm_kg', 'double precision', (col) => col.check(sql`smm_kg between 5 and 80`))
    .addColumn('bfm_kg', 'double precision', (col) => col.check(sql`bfm_kg between 1 and 200`))
    .addColumn('pbf', 'double precision', (col) => col.check(sql`pbf between 2 and 75`))
    .addColumn('bmr_kcal', 'integer', (col) => col.check(sql`bmr_kcal between 700 and 4000`))
    .addColumn('vfl', 'double precision', (col) => col.check(sql`vfl between 1 and 30`))
    .addColumn('tbw_l', 'double precision', (col) => col.check(sql`tbw_l between 10 and 100`))
    .addColumn('source', 'text', (col) => col.notNull().check(sql`source in ('photo', 'typed')`))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute()
  await db.schema
    .createIndex('inbody_scan_user_date')
    .on('inbody_scan')
    .columns(['user_id', 'scanned_on desc', 'created_at desc'])
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('inbody_scan').execute()
}
