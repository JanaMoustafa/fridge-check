import { z } from 'zod'
import { SCAN_FIELDS, type ScanField } from './inbody'
import { SHEET_FIELDS } from './inbody-sheet'

/**
 * Everything else an InBody sheet prints beyond the seven core numbers: read from the photo and
 * kept with the scan so the report can show the whole sheet. Each has a plausible adult range
 * (shared with the photo reader); anything outside it is dropped rather than stored.
 */
export const EXTRA_FIELDS = Object.fromEntries(
  Object.entries(SHEET_FIELDS).filter(
    ([name]) => !(SCAN_FIELDS as readonly string[]).includes(name),
  ),
) as Omit<typeof SHEET_FIELDS, ScanField>

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
