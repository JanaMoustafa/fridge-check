import { sql, type Kysely } from 'kysely'

/**
 * A member's BurnToReturn choice: the training style and the days of the week they train
 * (bit 0 = Sunday … bit 6 = Saturday).
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('training_plan')
    .addColumn('user_id', 'text', (col) =>
      col.primaryKey().references('user.id').onDelete('cascade'),
    )
    .addColumn('style', 'text', (col) =>
      col.notNull().check(sql`style in ('calisthenics', 'pilates', 'gym', 'crossfit')`),
    )
    .addColumn('days', 'smallint', (col) => col.notNull().check(sql`days between 1 and 127`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('training_plan').execute()
}
