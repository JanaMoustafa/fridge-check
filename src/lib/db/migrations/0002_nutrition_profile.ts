import { sql, type Kysely } from 'kysely'

/**
 * One nutrition profile per user, with the targets computed from it. The checks are a last line
 * of defence: the app validates the same ranges (and the adult age range) before saving.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('nutrition_profile')
    .addColumn('user_id', 'text', (col) =>
      col.primaryKey().references('user.id').onDelete('cascade'),
    )
    .addColumn('weight_kg', 'double precision', (col) =>
      col.notNull().check(sql`weight_kg between 30 and 300`),
    )
    .addColumn('height_cm', 'double precision', (col) =>
      col.notNull().check(sql`height_cm between 120 and 230`),
    )
    .addColumn('birth_year', 'smallint', (col) =>
      col.notNull().check(sql`birth_year between 1900 and 2100`),
    )
    .addColumn('sex', 'text', (col) => col.notNull().check(sql`sex in ('female', 'male')`))
    .addColumn('activity_level', 'text', (col) =>
      col
        .notNull()
        .check(sql`activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')`),
    )
    .addColumn('goal', 'text', (col) =>
      col.notNull().check(sql`goal in ('lose_fat', 'maintain', 'gain_muscle')`),
    )
    .addColumn('meal_split', 'jsonb', (col) =>
      col
        .notNull()
        .defaultTo(sql`'{"breakfast":25,"lunch":35,"dinner":30,"snacks":10}'::jsonb`)
        .check(sql`jsonb_typeof(meal_split) = 'object'`),
    )
    .addColumn('consented_at', 'timestamptz', (col) => col.notNull())
    .addColumn('formula_version', 'smallint', (col) => col.notNull())
    .addColumn('bmr_kcal', 'integer', (col) => col.notNull().check(sql`bmr_kcal > 0`))
    .addColumn('tdee_kcal', 'integer', (col) => col.notNull().check(sql`tdee_kcal > 0`))
    .addColumn('calorie_target_kcal', 'integer', (col) =>
      col.notNull().check(sql`calorie_target_kcal > 0`),
    )
    .addColumn('protein_g', 'integer', (col) => col.notNull().check(sql`protein_g >= 0`))
    .addColumn('fat_g', 'integer', (col) => col.notNull().check(sql`fat_g >= 0`))
    .addColumn('carbs_g', 'integer', (col) => col.notNull().check(sql`carbs_g >= 0`))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('nutrition_profile').execute()
}
