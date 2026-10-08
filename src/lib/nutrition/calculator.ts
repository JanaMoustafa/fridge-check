/**
 * Daily energy and macro targets from a nutrition profile. Every formula and constant lives here
 * so they are easy to review and tune: change a value, bump FORMULA_VERSION, and stored profiles
 * are recalculated the next time they are saved or read with an older version.
 *
 * General guidance for healthy adults, not medical advice. Pure: no I/O, no clock.
 */

export const FORMULA_VERSION = 1

export const SEXES = ['female', 'male'] as const
export type Sex = (typeof SEXES)[number]

export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number]

export const GOALS = ['lose_fat', 'maintain', 'gain_muscle'] as const
export type Goal = (typeof GOALS)[number]

/** Accepted inputs. Mifflin-St Jeor is validated for adults, so age stays within 18–80. */
export const LIMITS = {
  weightKg: { min: 30, max: 300 },
  heightCm: { min: 120, max: 230 },
  age: { min: 18, max: 80 },
} as const

/** Mifflin-St Jeor: 10·kg + 6.25·cm − 5·age, then +5 for men and −161 for women. */
const MIFFLIN = { perKg: 10, perCm: 6.25, perYear: 5, male: 5, female: -161 } as const

/** TDEE = BMR × multiplier (the standard Harris-Benedict activity factors). */
export const ACTIVITY_MULTIPLIERS: Readonly<Record<ActivityLevel, number>> = {
  sedentary: 1.2, // little or no exercise
  light: 1.375, // light exercise 1–3 days a week
  moderate: 1.55, // moderate exercise 3–5 days a week
  active: 1.725, // hard exercise 6–7 days a week
  very_active: 1.9, // physical job or training twice a day
}

/** Calorie target = TDEE × (1 + adjustment). */
export const GOAL_CALORIE_ADJUSTMENT: Readonly<Record<Goal, number>> = {
  lose_fat: -0.2,
  maintain: 0,
  gain_muscle: 0.1,
}

/**
 * A fat-loss target never goes below these (common clinical minimums for unsupervised diets),
 * unless the person's own TDEE is lower still, in which case the target is their TDEE.
 */
export const CALORIE_FLOOR_KCAL: Readonly<Record<Sex, number>> = { female: 1200, male: 1500 }

/** Protein per kg of body weight: more in a deficit (to keep muscle) and when building it. */
export const PROTEIN_G_PER_KG: Readonly<Record<Goal, number>> = {
  lose_fat: 2.2,
  maintain: 1.6,
  gain_muscle: 2.0,
}

/** Protein never takes more than this share of the calories (heavy bodies, low targets). */
export const MAX_PROTEIN_SHARE = 0.4

/** Fat as a share of the calorie target (the spec's 25–30 % band). */
export const FAT_SHARE: Readonly<Record<Goal, number>> = {
  lose_fat: 0.25,
  maintain: 0.3,
  gain_muscle: 0.25,
}

/** Energy per gram (Atwater factors). */
export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const

export interface ProfileInput {
  weightKg: number
  heightCm: number
  age: number
  sex: Sex
  activityLevel: ActivityLevel
  goal: Goal
}

export interface NutritionTargets {
  formulaVersion: number
  bmrKcal: number
  tdeeKcal: number
  calorieTargetKcal: number
  proteinG: number
  fatG: number
  carbsG: number
}

/**
 * The age reached this calendar year. Asking for a birth year (not a date) keeps the profile
 * small; at most a year early, which moves BMR by 5 kcal.
 */
export function ageFromBirthYear(birthYear: number, today: Date): number {
  return today.getUTCFullYear() - birthYear
}

/** Basal metabolic rate (kcal/day), Mifflin-St Jeor. */
export function bmr({ weightKg, heightCm, age, sex }: ProfileInput): number {
  return MIFFLIN.perKg * weightKg + MIFFLIN.perCm * heightCm - MIFFLIN.perYear * age + MIFFLIN[sex]
}

export function tdee(input: ProfileInput): number {
  return bmr(input) * ACTIVITY_MULTIPLIERS[input.activityLevel]
}

/** The goal-adjusted target, kept at or above the floor (or at TDEE when TDEE is lower). */
export function calorieTarget(input: ProfileInput): number {
  const maintenance = tdee(input)
  const adjusted = maintenance * (1 + GOAL_CALORIE_ADJUSTMENT[input.goal])
  return Math.max(adjusted, Math.min(CALORIE_FLOOR_KCAL[input.sex], maintenance))
}

/** Nearest 10 kcal: more precision than that would be false accuracy. */
function roundKcal(kcal: number): number {
  return Math.round(kcal / 10) * 10
}

/**
 * Throws a RangeError for inputs outside LIMITS or non-finite numbers. The UI and the API
 * validate first; this guards the formulas against anything that slips through.
 */
export function assertValidProfile(input: ProfileInput): void {
  const checks: Array<[keyof typeof LIMITS, number]> = [
    ['weightKg', input.weightKg],
    ['heightCm', input.heightCm],
    ['age', input.age],
  ]
  for (const [field, value] of checks) {
    const { min, max } = LIMITS[field]
    if (!Number.isFinite(value) || value < min || value > max) {
      throw new RangeError(`${field} must be between ${min} and ${max} (got ${value})`)
    }
  }
}

/**
 * Daily targets: BMR → TDEE → goal-adjusted calories → protein (g/kg, capped), fat (share of
 * calories), carbs (the remainder, never negative). Energy is rounded to 10 kcal, grams to 1 g.
 */
export function calculateTargets(input: ProfileInput): NutritionTargets {
  assertValidProfile(input)
  const target = roundKcal(calorieTarget(input))
  const proteinG = Math.min(
    PROTEIN_G_PER_KG[input.goal] * input.weightKg,
    (MAX_PROTEIN_SHARE * target) / KCAL_PER_GRAM.protein,
  )
  const fatG = (FAT_SHARE[input.goal] * target) / KCAL_PER_GRAM.fat
  const carbsKcal = target - proteinG * KCAL_PER_GRAM.protein - fatG * KCAL_PER_GRAM.fat
  return {
    formulaVersion: FORMULA_VERSION,
    bmrKcal: Math.round(bmr(input)),
    tdeeKcal: roundKcal(tdee(input)),
    calorieTargetKcal: target,
    proteinG: Math.round(proteinG),
    fatG: Math.round(fatG),
    carbsG: Math.max(0, Math.round(carbsKcal / KCAL_PER_GRAM.carbs)),
  }
}
