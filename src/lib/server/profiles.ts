import 'server-only'
import type { Kysely } from 'kysely'
import type { Database, NutritionProfileRow } from '@/lib/db/schema'
import {
  ageFromBirthYear,
  calculateTargets,
  FORMULA_VERSION,
  type NutritionTargets,
} from '@/lib/nutrition/calculator'
import type { ProfileValues } from '@/lib/nutrition/profile'

export interface StoredProfile {
  values: ProfileValues
  targets: NutritionTargets
  updatedAt: Date
}

function targetsFor(values: ProfileValues, today: Date): NutritionTargets {
  return calculateTargets({ ...values, age: ageFromBirthYear(values.birthYear, today) })
}

function valuesOf(row: NutritionProfileRow): ProfileValues {
  return {
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    birthYear: row.birth_year,
    sex: row.sex,
    activityLevel: row.activity_level,
    goal: row.goal,
    mealSplit: row.meal_split,
  }
}

function targetsOf(row: NutritionProfileRow): NutritionTargets {
  return {
    formulaVersion: row.formula_version,
    bmrKcal: row.bmr_kcal,
    tdeeKcal: row.tdee_kcal,
    calorieTargetKcal: row.calorie_target_kcal,
    proteinG: row.protein_g,
    fatG: row.fat_g,
    carbsG: row.carbs_g,
  }
}

const targetColumns = (targets: NutritionTargets) => ({
  formula_version: targets.formulaVersion,
  bmr_kcal: targets.bmrKcal,
  tdee_kcal: targets.tdeeKcal,
  calorie_target_kcal: targets.calorieTargetKcal,
  protein_g: targets.proteinG,
  fat_g: targets.fatG,
  carbs_g: targets.carbsG,
})

/**
 * The user's profile, or null. Targets are recomputed from the stored answers on every read and
 * saved back when they differ, so they follow a new formula version and the user's age as years
 * pass without the user doing anything.
 */
export async function getProfile(
  db: Kysely<Database>,
  userId: string,
  today: Date,
): Promise<StoredProfile | null> {
  const row = await db
    .selectFrom('nutrition_profile')
    .selectAll()
    .where('user_id', '=', userId)
    .executeTakeFirst()
  if (!row) return null
  const values = valuesOf(row)
  const targets = targetsFor(values, today)
  if (JSON.stringify(targets) === JSON.stringify(targetsOf(row))) {
    return { values, targets, updatedAt: row.updated_at }
  }
  await db
    .updateTable('nutrition_profile')
    .set({ ...targetColumns(targets), updated_at: today })
    .where('user_id', '=', userId)
    .execute()
  return { values, targets, updatedAt: today }
}

/** Saves the answers (new or changed) and the targets calculated from them, in one statement. */
export async function saveProfile(
  db: Kysely<Database>,
  userId: string,
  values: ProfileValues,
  now: Date,
): Promise<StoredProfile> {
  const targets = targetsFor(values, now)
  const columns = {
    weight_kg: values.weightKg,
    height_cm: values.heightCm,
    birth_year: values.birthYear,
    sex: values.sex,
    activity_level: values.activityLevel,
    goal: values.goal,
    meal_split: values.mealSplit,
    ...targetColumns(targets),
  }
  await db
    .insertInto('nutrition_profile')
    .values({ user_id: userId, ...columns, consented_at: now, created_at: now, updated_at: now })
    .onConflict((conflict) =>
      conflict.column('user_id').doUpdateSet({ ...columns, updated_at: now }),
    )
    .execute()
  return { values, targets, updatedAt: now }
}

/**
 * Deletes the user and, through the schema's cascades, their sessions, Google link, profile and
 * Pro access. Payment records stay, without the user (financial records).
 */
export async function deleteAccount(db: Kysely<Database>, userId: string): Promise<void> {
  await db.deleteFrom('user').where('id', '=', userId).execute()
}

export { FORMULA_VERSION }
