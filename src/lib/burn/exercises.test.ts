import { describe, expect, it } from 'vitest'
import { EXERCISES } from './exercises'
import { WORKOUT_KEYS, WORKOUTS, workoutExercises } from './programme'
import { AREAS, STYLES, type Area } from './types'

const PREFIX = { calisthenics: 'c', pilates: 'p', gym: 'g', crossfit: 'x' } as const

describe('the exercise library', () => {
  it('has unique, URL-safe ids that start with their style', () => {
    const ids = EXERCISES.map((exercise) => exercise.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const exercise of EXERCISES) {
      expect(exercise.id).toMatch(/^[cpgx]-[a-z0-9-]+$/)
      expect(exercise.id[0], exercise.id).toBe(PREFIX[exercise.style])
    }
  })

  it('has 10–12 exercises for each strength area and 3–6 for cardio, in every style', () => {
    const range: Record<Area, [number, number]> = {
      legs: [10, 12],
      glutes: [10, 12],
      core: [10, 12],
      upper: [10, 12],
      cardio: [3, 6],
    }
    for (const style of STYLES) {
      for (const area of AREAS) {
        const count = EXERCISES.filter((e) => e.style === style && e.area === area).length
        const [low, high] = range[area]
        expect(count, `${style} ${area}`).toBeGreaterThanOrEqual(low)
        expect(count, `${style} ${area}`).toBeLessThanOrEqual(high)
      }
      for (const key of WORKOUT_KEYS) {
        const workout = workoutExercises(EXERCISES, style, key, 0)
        expect(workout.length, `${style} ${key}`).toBe(WORKOUTS[style][key].length * 2)
      }
      // No two exercises of a style share a name.
      const names = EXERCISES.filter((e) => e.style === style).map((e) => e.name.en.toLowerCase())
      expect(new Set(names).size, style).toBe(names.length)
    }
  })

  it('says everything in both languages, with 2–4 cues and things to avoid', () => {
    for (const exercise of EXERCISES) {
      for (const list of [exercise.cues, exercise.avoid]) {
        expect(list.en.length, exercise.id).toBeGreaterThanOrEqual(2)
        expect(list.en.length, exercise.id).toBeLessThanOrEqual(4)
        expect(list.ar.length, exercise.id).toBe(list.en.length)
      }
      const arabic = [exercise.name.ar, exercise.work.ar, ...exercise.cues.ar, ...exercise.avoid.ar]
      for (const text of arabic) {
        expect(text.trim(), exercise.id).not.toBe('')
        // Western digits only (owner decision), and English only inside parentheses.
        expect(text, exercise.id).not.toMatch(/[٠-٩]/)
        expect(text.replace(/\([^)]*\)/g, ''), exercise.id).not.toMatch(/[A-Za-z]/)
      }
    }
  })

  it('has rest only between sets, and sensible sets', () => {
    for (const exercise of EXERCISES) {
      expect(exercise.sets, exercise.id).toBeGreaterThanOrEqual(1)
      expect(exercise.sets, exercise.id).toBeLessThanOrEqual(5)
      if (exercise.sets === 1) expect(exercise.restSeconds, exercise.id).toBe(0)
    }
  })
})
