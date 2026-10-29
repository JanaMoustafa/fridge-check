import { SCAN_FIELDS, SCAN_LIMITS, type ScanField } from './inbody'

/**
 * What Claude is asked to read from an InBody photo, and how its reply becomes form values.
 * Anything missing, unreadable or outside the plausible ranges comes back empty for the member
 * to fill in: a guess never reaches the form.
 */
export const INBODY_PROMPT = [
  'The image should be a photo of an InBody body composition result sheet. Read the values exactly as printed on it.',
  'Reply with only one JSON object of this shape:',
  '{"isInBody": true, "scannedOn": "2026-10-27", "weightKg": 68.0, "smmKg": 24.1, "bfmKg": 22.6, "pbf": 33.2, "bmrKcal": 1360, "vfl": 8, "tbwL": 33.2}.',
  'scannedOn = the test date printed on the sheet as YYYY-MM-DD; weightKg = body weight in kg; smmKg = skeletal muscle mass in kg;',
  'bfmKg = body fat mass in kg; pbf = percent body fat; bmrKcal = basal metabolic rate in kcal; vfl = visceral fat level;',
  'tbwL = total body water in litres. Numbers only, no units. If the sheet uses pounds, convert to kg.',
  'Use null for any value that is not printed or that you cannot read with confidence; never estimate.',
  'If the image is not a body composition result sheet, reply {"isInBody": false} with every value null.',
].join(' ')

export type ReadValues = Record<ScanField | 'scannedOn', string>

export interface ReadResult {
  isInBody: boolean
  values: ReadValues
  /** How many of the seven numbers were read. */
  found: number
}

const EMPTY: ReadValues = {
  scannedOn: '',
  weightKg: '',
  smmKg: '',
  bfmKg: '',
  pbf: '',
  bmrKcal: '',
  vfl: '',
  tbwL: '',
}

/** Reads the first JSON object in Claude's reply; null when there is none. */
export function parseInbodyReply(text: string): ReadResult | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  let raw: Record<string, unknown>
  try {
    raw = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
  if (typeof raw !== 'object' || raw === null) return null
  const values: ReadValues = { ...EMPTY }
  let found = 0
  for (const field of SCAN_FIELDS) {
    const value = Number(raw[field])
    const { min, max } = SCAN_LIMITS[field]
    if (raw[field] != null && Number.isFinite(value) && value >= min && value <= max) {
      values[field] = String(Math.round(value * 10) / 10)
      found++
    }
  }
  if (typeof raw.scannedOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.scannedOn)) {
    values.scannedOn = raw.scannedOn
  }
  return { isInBody: raw.isInBody !== false, values, found }
}
