import { describe, expect, it } from 'vitest'
import {
  areaExercises,
  DEFAULT_DAYS,
  daysOf,
  maskOf,
  nextTraining,
  parseTrainingForm,
  prescriptionFor,
  weekdayOf,
  weekIndexOf,
  weekSchedule,
  workoutExercises,
  workoutMinutes,
  WORKOUTS,
} from './programme'
import { AREAS, STYLES, type Area, type Exercise, type Style } from './types'

const text = (en: string) => ({ en, ar: `${en} (ar)` })
const exercise = (
  id: string,
  style: Style,
  area: Area,
  extra: Partial<Exercise> = {},
): Exercise => ({
  id,
  style,
  area,
  name: text(id),
  sets: 3,
  work: text('10 reps'),
  restSeconds: 60,
  strength: true,
  cues: { en: ['a'], ar: ['a'] },
  avoid: { en: ['b'], ar: ['b'] },
  ...extra,
})

const LIBRARY = [
  exercise('c-legs-1', 'calisthenics', 'legs'),
  exercise('c-legs-2', 'calisthenics', 'legs'),
  exercise('c-legs-3', 'calisthenics', 'legs'),
  exercise('c-core-1', 'calisthenics', 'core'),
  exercise('c-core-2', 'calisthenics', 'core'),
  exercise('g-legs-1', 'gym', 'legs'),
]

describe('training days', () => {
  it('turn into a bit mask and back, Sunday first', () => {
    expect(daysOf(DEFAULT_DAYS)).toEqual([0, 2, 4])
    expect(maskOf([4, 0, 2])).toBe(DEFAULT_DAYS)
  })

  it('take workouts A, B, C in week order, cycling with more days', () => {
    expect(weekSchedule(DEFAULT_DAYS)).toEqual(['a', null, 'b', null, 'c', null, null])
    expect(weekSchedule(maskOf([1, 2, 3, 4, 5]))).toEqual([null, 'a', 'b', 'c', 'a', 'b', null])
  })

  it('finds today or the next training day', () => {
    expect(nextTraining(DEFAULT_DAYS, 2)).toEqual({ weekday: 2, workout: 'b', inDays: 0 })
    expect(nextTraining(DEFAULT_DAYS, 5)).toEqual({ weekday: 0, workout: 'a', inDays: 2 })
    expect(nextTraining(0, 3)).toBeNull()
  })

  it('knows weekdays and week numbers of dates', () => {
    expect(weekdayOf('2026-11-01')).toBe(0) // a Sunday
    expect(weekdayOf('2026-10-29')).toBe(4) // a Thursday
    expect(weekIndexOf('2026-11-01')).toBe(weekIndexOf('2026-11-07'))
    expect(weekIndexOf('2026-11-08')).toBe(weekIndexOf('2026-11-01') + 1)
  })
})

describe('workouts', () => {
  it('cover two or three areas each, all five across the week, for every style', () => {
    for (const style of STYLES) {
      const areas = new Set(Object.values(WORKOUTS[style]).flat())
      expect([...areas].sort(), style).toEqual([...AREAS].sort())
    }
  })

  it('list the workout areas in order, rotating an area with spare exercises weekly', () => {
    const ids = (week: number) =>
      workoutExercises(LIBRARY, 'calisthenics', 'a', week).map((e) => e.id)
    expect(ids(0)).toEqual(['c-legs-1', 'c-legs-2', 'c-core-1', 'c-core-2'])
    expect(ids(1)).toEqual(['c-legs-3', 'c-legs-1', 'c-core-1', 'c-core-2'])
    expect(areaExercises(LIBRARY, 'gym', 'legs').map((e) => e.id)).toEqual(['g-legs-1'])
  })
})

describe('prescriptionFor', () => {
  const squat = exercise('squat', 'gym', 'legs')
  const walk = exercise('walk', 'gym', 'cardio', {
    sets: 1,
    restSeconds: 0,
    strength: false,
    work: text('20 min at 8–10 % incline'),
  })
  const rope = exercise('rope', 'crossfit', 'cardio', { strength: false, restSeconds: 40 })

  it('adds a set and rest for muscle, cuts rest for fat loss, keeps the base to maintain', () => {
    expect(prescriptionFor(squat, 'gain_muscle')).toEqual({ sets: 4, restSeconds: 90 })
    expect(prescriptionFor(exercise('x', 'gym', 'legs', { sets: 5 }), 'gain_muscle').sets).toBe(5)
    expect(prescriptionFor(squat, 'lose_fat')).toEqual({ sets: 3, restSeconds: 45 })
    expect(prescriptionFor(rope, 'lose_fat')).toEqual({ sets: 3, restSeconds: 30 })
    expect(prescriptionFor(rope, 'gain_muscle')).toEqual({ sets: 3, restSeconds: 40 })
    expect(prescriptionFor(squat, 'maintain')).toEqual({ sets: 3, restSeconds: 60 })
    expect(prescriptionFor(walk, 'lose_fat')).toEqual({ sets: 1, restSeconds: 0 })
  })

  it('estimates a workout length to the nearest 5 minutes', () => {
    // 3 sets: 60 s setup + 120 s work + 120 s rest = 5 min each.
    expect(workoutMinutes([squat, squat], 'maintain')).toBe(10)
    expect(workoutMinutes([walk], 'maintain')).toBe(20)
    const rows = exercise('rows', 'gym', 'cardio', {
      sets: 1,
      restSeconds: 0,
      work: text('8 rounds: 1 min hard, 1 min easy'),
    })
    expect(workoutMinutes([rows], 'maintain')).toBe(15)
    expect(workoutMinutes([], 'maintain')).toBe(5)
  })
})

describe('parseTrainingForm', () => {
  it('accepts a style and two to six days', () => {
    expect(parseTrainingForm('pilates', ['0', '2', '4', '4'])).toEqual({
      ok: true,
      value: { style: 'pilates', days: DEFAULT_DAYS },
    })
  })

  it('refuses a missing style, too few or too many days, and junk', () => {
    expect(parseTrainingForm(undefined, ['1', '3'])).toEqual({
      ok: false,
      errors: { style: 'required' },
    })
    expect(parseTrainingForm('gym', ['1', 'x', '9'])).toEqual({
      ok: false,
      errors: { days: 'count' },
    })
    expect(parseTrainingForm('yoga', ['0', '1', '2', '3', '4', '5', '6'])).toEqual({
      ok: false,
      errors: { style: 'required', days: 'count' },
    })
  })
})
