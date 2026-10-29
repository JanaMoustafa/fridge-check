import type { Goal } from '@/lib/nutrition/calculator'
import { STYLES, type Area, type Exercise, type Style } from './types'

/**
 * A BurnToReturn programme: three workouts (A, B, C) per style, each covering two or three body
 * areas, spread over the days the member trains. Sets and rest follow the member's goal.
 */

export const WORKOUT_KEYS = ['a', 'b', 'c'] as const
export type WorkoutKey = (typeof WORKOUT_KEYS)[number]

export const WORKOUTS: Readonly<Record<Style, Readonly<Record<WorkoutKey, readonly Area[]>>>> = {
  calisthenics: { a: ['legs', 'core'], b: ['glutes', 'core', 'cardio'], c: ['upper', 'cardio'] },
  pilates: { a: ['core', 'legs'], b: ['glutes', 'core', 'cardio'], c: ['upper', 'core', 'legs'] },
  gym: { a: ['legs', 'core'], b: ['glutes', 'cardio'], c: ['upper', 'core'] },
  crossfit: { a: ['legs', 'cardio'], b: ['glutes', 'core', 'cardio'], c: ['upper', 'core'] },
}

/** Exercises per area in one workout; an area with more rotates week by week. */
export const EXERCISES_PER_AREA = 2

/** Weekdays, 0 = Sunday (the first day of the week in Egypt and the Gulf). */
export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const
export const MIN_DAYS = 2
export const MAX_DAYS = 6
/** Sunday, Tuesday, Thursday. */
export const DEFAULT_DAYS = 0b0010101

export const isStyle = (value: unknown): value is Style =>
  typeof value === 'string' && (STYLES as readonly string[]).includes(value)

export function daysOf(mask: number): number[] {
  return WEEKDAYS.filter((day) => (mask >> day) & 1)
}

export function maskOf(days: readonly number[]): number {
  return days.reduce((mask, day) => mask | (1 << day), 0)
}

/** Which workout falls on each weekday: training days in week order take A, B, C, A… */
export function weekSchedule(mask: number): (WorkoutKey | null)[] {
  let next = 0
  return WEEKDAYS.map((day) => {
    if (!((mask >> day) & 1)) return null
    return WORKOUT_KEYS[next++ % WORKOUT_KEYS.length]!
  })
}

/** The next training day from `weekday` on (today included), and how many days away it is. */
export function nextTraining(
  mask: number,
  weekday: number,
): { weekday: number; workout: WorkoutKey; inDays: number } | null {
  const schedule = weekSchedule(mask)
  for (let inDays = 0; inDays < 7; inDays++) {
    const day = (weekday + inDays) % 7
    const workout = schedule[day]
    if (workout) return { weekday: day, workout, inDays }
  }
  return null
}

/**
 * The exercises of one workout, area by area in the workout's order. Each area shows
 * EXERCISES_PER_AREA of its exercises, rotating through the rest week by week.
 */
export function workoutExercises(
  library: readonly Exercise[],
  style: Style,
  workout: WorkoutKey,
  week: number,
): Exercise[] {
  return WORKOUTS[style][workout].flatMap((area) => {
    const all = library.filter((exercise) => exercise.style === style && exercise.area === area)
    if (all.length <= EXERCISES_PER_AREA) return all
    return Array.from(
      { length: EXERCISES_PER_AREA },
      (_, i) => all[(week * EXERCISES_PER_AREA + i) % all.length]!,
    )
  })
}

export function areaExercises(library: readonly Exercise[], style: Style, area: Area): Exercise[] {
  return library.filter((exercise) => exercise.style === style && exercise.area === area)
}

export interface Prescription {
  sets: number
  restSeconds: number
}

/**
 * Sets and rest for the member's goal. Building muscle: one more set of strength work (at most
 * 5) and 30 s more rest. Losing fat: 15 s less rest (at least 30 s) to keep the heart rate up.
 */
export function prescriptionFor(exercise: Exercise, goal: Goal): Prescription {
  const base = { sets: exercise.sets, restSeconds: exercise.restSeconds }
  if (base.restSeconds === 0) return base
  if (goal === 'gain_muscle' && exercise.strength) {
    return { sets: Math.min(5, base.sets + 1), restSeconds: base.restSeconds + 30 }
  }
  if (goal === 'lose_fat') {
    return { ...base, restSeconds: Math.max(30, base.restSeconds - 15) }
  }
  return base
}

/** About 40 s of work per set, plus rest between sets and a minute to set up each exercise. */
const SET_SECONDS = 40
const SETUP_SECONDS = 60

/** A rough length for a workout in minutes, rounded to 5: a guide, not a promise. */
export function workoutMinutes(exercises: readonly Exercise[], goal: Goal): number {
  const seconds = exercises.reduce((total, exercise) => {
    const continuous = /(\d+)\s*min/.exec(exercise.work.en)
    if (exercise.sets === 1 && continuous) {
      const rounds = /^(\d+) rounds/.exec(exercise.work.en)
      return (
        total + SETUP_SECONDS + Number(continuous[1]) * 60 * (rounds ? 2 * Number(rounds[1]) : 1)
      )
    }
    const { sets, restSeconds } = prescriptionFor(exercise, goal)
    return total + SETUP_SECONDS + sets * SET_SECONDS + (sets - 1) * restSeconds
  }, 0)
  return Math.max(5, Math.round(seconds / 60 / 5) * 5)
}

/** Weeks since 1970-01-04 (a Sunday) for a YYYY-MM-DD date: the area rotation's week number. */
export function weekIndexOf(date: string): number {
  return Math.floor((Date.parse(`${date}T00:00:00Z`) / 86_400_000 - 3) / 7)
}

/** The weekday (0 = Sunday) of a YYYY-MM-DD date. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay()
}

export interface TrainingChoice {
  style: Style
  /** Bit mask of training days, bit 0 = Sunday. */
  days: number
}

export type TrainingFormErrors = { style?: 'required'; days?: 'count' }

/** Reads the setup form: one style and 2–6 training days (checkboxes named "day", values 0–6). */
export function parseTrainingForm(
  style: unknown,
  days: readonly unknown[],
): { ok: true; value: TrainingChoice } | { ok: false; errors: TrainingFormErrors } {
  const picked = [
    ...new Set(
      days.map((day) => Number(day)).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6),
    ),
  ]
  const errors: TrainingFormErrors = {}
  if (!isStyle(style)) errors.style = 'required'
  if (picked.length < MIN_DAYS || picked.length > MAX_DAYS) errors.days = 'count'
  if (!isStyle(style) || errors.days) return { ok: false, errors }
  return { ok: true, value: { style, days: maskOf(picked) } }
}
