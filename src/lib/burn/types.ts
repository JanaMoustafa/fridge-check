/**
 * BurnToReturn's exercise library types. The library is data in code (not the message catalogs,
 * which are sent to the browser on every page): each exercise carries its own English and Arabic
 * text and is rendered on the server.
 */

export const STYLES = ['calisthenics', 'pilates', 'gym', 'crossfit'] as const
export type Style = (typeof STYLES)[number]

export const AREAS = ['legs', 'glutes', 'core', 'cardio', 'upper'] as const
export type Area = (typeof AREAS)[number]

/** A piece of text in both languages. */
export interface Bilingual {
  en: string
  ar: string
}

export interface Exercise {
  /** Stable, URL-safe: "<style letter>-<name>", e.g. "c-squat". Used in /burn/exercise/<id>. */
  id: string
  style: Style
  area: Area
  name: Bilingual
  /** Sets for the "maintain" goal; 1 for a single continuous effort (a 20-minute walk). */
  sets: number
  /** What one set is, without the set count: "15 reps", "10 each leg", "30 s", "20 min at 8–10 % incline". */
  work: Bilingual
  /** Seconds of rest between sets (0 when there is none, e.g. one continuous effort). */
  restSeconds: number
  /** Strength work (sets and rest grow when building muscle); false for cardio and mobility. */
  strength: boolean
  /** How to do it: 2–4 short cues. */
  cues: { en: string[]; ar: string[] }
  /** Things to avoid (form faults and injury risks): 2–4 short notes. */
  avoid: { en: string[]; ar: string[] }
}
