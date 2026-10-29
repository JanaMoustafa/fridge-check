import { sql, type Kysely } from 'kysely'

/**
 * Everything else an InBody sheet prints (segmental lean mass, body water split, InBody score…),
 * read from the photo: an object of named numbers, validated in code (src/lib/nutritionist/
 * inbody-extra.ts) because the set grows with the sheet models we learn to read.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('inbody_scan')
    .addColumn('extra', 'jsonb', (col) => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('inbody_scan').dropColumn('extra').execute()
}
