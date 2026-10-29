import { describe, expect, it } from 'vitest'
import { EXERCISES } from './exercises'
import { formatDuration, MAX_VIDEO_SECONDS, videoFor } from './videos'

describe('exercise videos', () => {
  it('gives every exercise a real-trainer video of two minutes or under', () => {
    const missing = EXERCISES.filter((exercise) => videoFor(exercise.id) === null).map((e) => e.id)
    expect(missing).toEqual([])
    for (const exercise of EXERCISES) {
      expect(videoFor(exercise.id)!.durationSeconds).toBeLessThanOrEqual(MAX_VIDEO_SECONDS)
    }
  })

  it('formats durations as m:ss', () => {
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(120)).toBe('2:00')
    expect(formatDuration(8)).toBe('0:08')
  })
})
