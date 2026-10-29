import { sql, type Kysely } from 'kysely'

/** What a member chose for a meal on a day, instead of the day's suggestion (one row per meal). */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('meal_choice')
    .addColumn('user_id', 'text', (col) => col.notNull().references('user.id').onDelete('cascade'))
    .addColumn('day', 'date', (col) => col.notNull())
    .addColumn('meal', 'text', (col) =>
      col.notNull().check(sql`meal in ('breakfast', 'lunch', 'dinner', 'snacks')`),
    )
    .addColumn('option_id', 'text', (col) => col.notNull())
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addPrimaryKeyConstraint('meal_choice_pk', ['user_id', 'day', 'meal'])
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('meal_choice').execute()
}
