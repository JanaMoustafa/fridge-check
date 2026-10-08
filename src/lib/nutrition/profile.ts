import { z } from 'zod'
import {
  ACTIVITY_LEVELS,
  ageFromBirthYear,
  GOALS,
  LIMITS,
  SEXES,
  type ActivityLevel,
  type Goal,
  type Sex,
} from './calculator'
import { DEFAULT_MEAL_SPLIT, isValidMealSplit, MEALS, type MealSplit } from './portions'

/** What the profile form collects (the calculator's inputs, with a birth year and meal split). */
export interface ProfileValues {
  weightKg: number
  heightCm: number
  birthYear: number
  sex: Sex
  activityLevel: ActivityLevel
  goal: Goal
  mealSplit: MealSplit
}

export const PROFILE_FIELDS = [
  'weightKg',
  'heightCm',
  'birthYear',
  'sex',
  'activityLevel',
  'goal',
  'mealSplit',
  'consent',
] as const
export type ProfileField = (typeof PROFILE_FIELDS)[number]

/** Translated by the form ("profile.errors.<code>"), so the server never sends English text. */
export type ProfileError = 'required' | 'range' | 'age' | 'mealSplit' | 'consent'

export type ProfileParse =
  | { ok: true; values: ProfileValues }
  | { ok: false; errors: Partial<Record<ProfileField, ProfileError>> }

/**
 * A number field: "72,5" (decimal comma) and "72.5" both read as 72.5, Arabic-Indic digits too;
 * blank or absent is undefined, anything else unreadable is NaN.
 */
export function readNumber(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined
  const text = value
    .trim()
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[,٫]/, '.')
  return text === '' ? undefined : Number(text)
}

/** Accepts any FormData-like record: an unknown choice reads as missing. */
const ChoicesSchema = z.object({
  sex: z.enum(SEXES).optional().catch(undefined),
  activityLevel: z.enum(ACTIVITY_LEVELS).optional().catch(undefined),
  goal: z.enum(GOALS).optional().catch(undefined),
  consent: z.literal('on').optional().catch(undefined),
})

function inRange(value: number | undefined, min: number, max: number): ProfileError | null {
  if (value === undefined) return 'required'
  return Number.isFinite(value) && value >= min && value <= max ? null : 'range'
}

/**
 * Reads and validates the profile form. Weight and height are rounded to one decimal, birth year
 * must make the person 18–80 this year, the meal split must be four whole percentages adding up
 * to 100, and consent to storing these health details is required.
 */
export function parseProfileForm(form: Record<string, unknown>, today: Date): ProfileParse {
  const choices = ChoicesSchema.parse(form)
  const raw = {
    ...choices,
    weightKg: readNumber(form.weightKg),
    heightCm: readNumber(form.heightCm),
    birthYear: readNumber(form.birthYear),
  }
  const errors: Partial<Record<ProfileField, ProfileError>> = {}

  const weight = inRange(raw.weightKg, LIMITS.weightKg.min, LIMITS.weightKg.max)
  if (weight) errors.weightKg = weight
  const height = inRange(raw.heightCm, LIMITS.heightCm.min, LIMITS.heightCm.max)
  if (height) errors.heightCm = height
  if (raw.birthYear === undefined) errors.birthYear = 'required'
  else if (!Number.isInteger(raw.birthYear)) errors.birthYear = 'range'
  else {
    const age = ageFromBirthYear(raw.birthYear, today)
    if (age < LIMITS.age.min || age > LIMITS.age.max) errors.birthYear = 'age'
  }
  if (!raw.sex) errors.sex = 'required'
  if (!raw.activityLevel) errors.activityLevel = 'required'
  if (!raw.goal) errors.goal = 'required'

  const split = Object.fromEntries(MEALS.map((meal) => [meal, readNumber(form[meal])]))
  const mealSplit = MEALS.every((meal) => split[meal] === undefined)
    ? { ...DEFAULT_MEAL_SPLIT }
    : split
  if (!isValidMealSplit(mealSplit)) errors.mealSplit = 'mealSplit'
  if (raw.consent !== 'on') errors.consent = 'consent'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  const round1 = (value: number) => Math.round(value * 10) / 10
  return {
    ok: true,
    values: {
      weightKg: round1(raw.weightKg as number),
      heightCm: round1(raw.heightCm as number),
      birthYear: raw.birthYear as number,
      sex: raw.sex!,
      activityLevel: raw.activityLevel!,
      goal: raw.goal!,
      mealSplit: mealSplit as MealSplit,
    },
  }
}
