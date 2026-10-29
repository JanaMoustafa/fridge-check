import { z } from 'zod'

/**
 * Everything else an InBody sheet prints beyond the seven core numbers: read from the photo and
 * kept with the scan so the report can show the whole sheet. Each has a plausible adult range;
 * anything outside it is dropped rather than stored.
 */
export const EXTRA_FIELDS = {
  heightCm: { min: 100, max: 230 },
  age: { min: 10, max: 100 },
  bmi: { min: 10, max: 70 },
  proteinKg: { min: 3, max: 30 },
  mineralsKg: { min: 1, max: 10 },
  icwL: { min: 5, max: 60 },
  ecwL: { min: 5, max: 40 },
  ffmKg: { min: 20, max: 150 },
  bcmKg: { min: 10, max: 100 },
  bmcKg: { min: 1, max: 8 },
  whr: { min: 0.5, max: 1.5 },
  vfaCm2: { min: 10, max: 400 },
  obesityDegree: { min: 50, max: 300 },
  smi: { min: 3, max: 15 },
  inbodyScore: { min: 20, max: 100 },
  targetWeightKg: { min: 30, max: 200 },
  weightControlKg: { min: -100, max: 100 },
  fatControlKg: { min: -100, max: 100 },
  muscleControlKg: { min: -30, max: 30 },
  leanRightArmKg: { min: 0.5, max: 12 },
  leanLeftArmKg: { min: 0.5, max: 12 },
  leanTrunkKg: { min: 5, max: 60 },
  leanRightLegKg: { min: 2, max: 30 },
  leanLeftLegKg: { min: 2, max: 30 },
} as const

export type ExtraField = keyof typeof EXTRA_FIELDS
export const EXTRA_FIELD_NAMES = Object.keys(EXTRA_FIELDS) as ExtraField[]

/** The extras as stored: only known names, each a finite number within its range. */
export const ExtraSchema = z.record(z.string(), z.unknown()).transform((raw) => {
  const out: Partial<Record<ExtraField, number>> = {}
  for (const name of EXTRA_FIELD_NAMES) {
    const value = raw[name]
    const { min, max } = EXTRA_FIELDS[name]
    if (typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max) {
      out[name] = Math.round(value * 100) / 100
    }
  }
  return out
})
export type Extra = z.infer<typeof ExtraSchema>

/** Reads a JSON string of extras (from the scan form) into a clean object; `{}` for anything odd. */
export function parseExtraJson(json: string | undefined): Extra {
  if (!json) return {}
  try {
    const parsed: unknown = JSON.parse(json)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
    return ExtraSchema.parse(parsed)
  } catch {
    return {}
  }
}
