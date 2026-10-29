import { readNumber } from '@/lib/nutrition/profile'

/**
 * One InBody result: the numbers BiteDoneRight uses from the sheet. Only weight is required;
 * everything else is optional because sheets differ and a photo may be hard to read.
 */
export interface ScanValues {
  /** The day of the scan, YYYY-MM-DD (Cairo). */
  scannedOn: string
  weightKg: number
  /** Skeletal muscle mass. */
  smmKg: number | null
  /** Body fat mass. */
  bfmKg: number | null
  /** Percent body fat. */
  pbf: number | null
  /** Basal metabolic rate. */
  bmrKcal: number | null
  /** Visceral fat level. */
  vfl: number | null
  /** Total body water. */
  tbwL: number | null
}

export const SCAN_FIELDS = ['weightKg', 'smmKg', 'bfmKg', 'pbf', 'bmrKcal', 'vfl', 'tbwL'] as const
export type ScanField = (typeof SCAN_FIELDS)[number]

/** Plausible ranges for an adult; the database checks the same ranges. */
export const SCAN_LIMITS: Readonly<Record<ScanField, { min: number; max: number }>> = {
  weightKg: { min: 30, max: 300 },
  smmKg: { min: 5, max: 80 },
  bfmKg: { min: 1, max: 200 },
  pbf: { min: 2, max: 75 },
  bmrKcal: { min: 700, max: 4000 },
  vfl: { min: 1, max: 30 },
  tbwL: { min: 10, max: 100 },
}

/** How far back a scan may be dated. */
export const MAX_SCAN_AGE_DAYS = 400

export type ScanError = 'required' | 'range' | 'date'
export type ParsedScan =
  | { ok: true; values: ScanValues }
  | { ok: false; errors: Partial<Record<ScanField | 'scannedOn', ScanError>> }

const DAY_MS = 24 * 60 * 60 * 1000

/** Today in Cairo as YYYY-MM-DD. */
export function cairoDate(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(now)
}

export function parseScanForm(form: Record<string, string | undefined>, now: Date): ParsedScan {
  const errors: Partial<Record<ScanField | 'scannedOn', ScanError>> = {}
  const values: Record<ScanField, number | null> = {
    weightKg: null,
    smmKg: null,
    bfmKg: null,
    pbf: null,
    bmrKcal: null,
    vfl: null,
    tbwL: null,
  }
  for (const field of SCAN_FIELDS) {
    const raw = (form[field] ?? '').trim()
    if (raw === '') {
      if (field === 'weightKg') errors[field] = 'required'
      continue
    }
    const value = readNumber(raw)
    const { min, max } = SCAN_LIMITS[field]
    if (value === undefined || !Number.isFinite(value) || value < min || value > max)
      errors[field] = 'range'
    else values[field] = Math.round(value * 10) / 10
  }

  const today = cairoDate(now)
  const scannedOn = (form.scannedOn ?? '').trim() || today
  const time = Date.parse(`${scannedOn}T12:00:00Z`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(scannedOn) ||
    Number.isNaN(time) ||
    scannedOn > today ||
    Date.parse(`${today}T12:00:00Z`) - time > MAX_SCAN_AGE_DAYS * DAY_MS
  ) {
    errors.scannedOn = 'date'
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    values: {
      scannedOn,
      weightKg: values.weightKg!,
      smmKg: values.smmKg,
      bfmKg: values.bfmKg,
      pbf: values.pbf,
      bmrKcal: values.bmrKcal === null ? null : Math.round(values.bmrKcal),
      vfl: values.vfl,
      tbwL: values.tbwL,
    },
  }
}

/** Body fat mass from the scan, or worked out from weight and body fat %. */
export function fatMassOf(scan: Pick<ScanValues, 'weightKg' | 'bfmKg' | 'pbf'>): number | null {
  if (scan.bfmKg !== null) return scan.bfmKg
  return scan.pbf === null ? null : (scan.weightKg * scan.pbf) / 100
}

/** Body fat % from the scan, or worked out from fat mass and weight. */
export function fatPercentOf(scan: Pick<ScanValues, 'weightKg' | 'bfmKg' | 'pbf'>): number | null {
  if (scan.pbf !== null) return scan.pbf
  return scan.bfmKg === null ? null : (scan.bfmKg / scan.weightKg) * 100
}

/** The next monthly scan is due 30 days after the latest one. */
export function nextScanDue(lastScannedOn: string): string {
  const next = new Date(Date.parse(`${lastScannedOn}T12:00:00Z`) + 30 * DAY_MS)
  return next.toISOString().slice(0, 10)
}
