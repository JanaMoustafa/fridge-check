import 'server-only'
import { sql, type Kysely } from 'kysely'
import type { Database } from '@/lib/db/schema'
import type { Meal } from '@/lib/nutrition/portions'

/** The member's picks for a day, by meal (meals without a pick are missing). */
export async function getMealChoices(
  db: Kysely<Database>,
  userId: string,
  day: string,
): Promise<Partial<Record<Meal, string>>> {
  const rows = await db
    .selectFrom('meal_choice')
    .select(['meal', 'option_id'])
    .where('user_id', '=', userId)
    .where(sql`day::text`, '=', day)
    .execute()
  return Object.fromEntries(rows.map((row) => [row.meal, row.option_id]))
}

export async function saveMealChoice(
  db: Kysely<Database>,
  userId: string,
  day: string,
  meal: Meal,
  optionId: string,
  now: Date,
): Promise<void> {
  await db
    .insertInto('meal_choice')
    .values({ user_id: userId, day, meal, option_id: optionId, updated_at: now })
    .onConflict((conflict) =>
      conflict
        .columns(['user_id', 'day', 'meal'])
        .doUpdateSet({ option_id: optionId, updated_at: now }),
    )
    .execute()
}

/** Back to the day's suggestion for that meal. */
export async function clearMealChoice(
  db: Kysely<Database>,
  userId: string,
  day: string,
  meal: Meal,
): Promise<void> {
  await db
    .deleteFrom('meal_choice')
    .where('user_id', '=', userId)
    .where(sql`day::text`, '=', day)
    .where('meal', '=', meal)
    .execute()
}
