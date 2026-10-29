import { z } from 'zod'
import videos from '../../../data/burn/videos.json'

/**
 * The demonstration video of each exercise: a real trainer on YouTube, two minutes or under,
 * public and embeddable. Found by scripts/find-exercise-videos (the search and the checks) and
 * listed in docs/burn-videos.md for a coach to review; the data is data/burn/videos.json.
 */
export const MAX_VIDEO_SECONDS = 120

export const ExerciseVideoSchema = z.object({
  /** YouTube's 11-character id. */
  videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  title: z.string().min(1),
  channel: z.string().min(1),
  durationSeconds: z.number().int().positive().max(MAX_VIDEO_SECONDS),
  /** When it was last checked to be public, embeddable and within the length limit. */
  checkedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
export type ExerciseVideo = z.infer<typeof ExerciseVideoSchema>

const VIDEOS: Readonly<Record<string, ExerciseVideo>> = z
  .record(z.string(), ExerciseVideoSchema)
  .parse(videos)

export function videoFor(exerciseId: string): ExerciseVideo | null {
  return VIDEOS[exerciseId] ?? null
}

/** "1:05" for 65 seconds. */
export function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
