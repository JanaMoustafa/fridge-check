import { sql, type Kysely } from 'kysely'

/** How to reach a member: an optional phone number, kept apart from the health profile. */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('member_contact')
    .addColumn('user_id', 'text', (col) =>
      col.primaryKey().references('user.id').onDelete('cascade'),
    )
    .addColumn('phone', 'text', (col) => col.check(sql`phone ~ '^\\+?[0-9]{7,15}$'`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('member_contact').execute()
}
