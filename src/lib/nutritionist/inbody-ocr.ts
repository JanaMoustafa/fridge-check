import { EXTRA_FIELDS, type Extra, type ExtraField } from './inbody-extra'
import { SCAN_FIELDS, SCAN_LIMITS, type ScanField } from './inbody'

/**
 * Turns the text an OCR engine read off an InBody result sheet into the scan's numbers. Sheets
 * differ by model and language, and phone photos add noise, so every field has several label
 * spellings, each number must sit in a plausible range, and whatever cannot be read with
 * confidence is left for the member to type. Pure: no OCR here (see ScanForm for the engine).
 */

export interface OcrRead {
  /** The seven core numbers and the date, as form values ('' when not read). */
  values: Record<ScanField | 'scannedOn', string>
  extra: Extra
  /** How many numbers were read, core and extra together. */
  found: number
  /** Whether the text looks like an InBody sheet at all. */
  isInBody: boolean
}

type Field = ScanField | ExtraField

/** Label patterns per field, most specific first; a label must be followed by the number. */
const LABELS: Record<Field, RegExp[]> = {
  weightKg: [/\bweight\b(?!\s*control)/i, /\bwt\b/i],
  smmKg: [/skeletal\s*muscle\s*mass/i, /\bsmm\b/i],
  bfmKg: [/body\s*fat\s*mass/i, /\bbfm\b/i],
  pbf: [/percent\s*body\s*fat/i, /\bpbf\b/i, /body\s*fat\s*percent/i],
  bmrKcal: [/basal\s*metabolic\s*rate/i, /\bbmr\b/i],
  vfl: [/visceral\s*fat\s*level/i, /\bvfl\b/i],
  tbwL: [/total\s*body\s*water/i, /\btbw\b/i],
  heightCm: [/\bheight\b/i],
  age: [/\bage\b/i],
  bmi: [/body\s*mass\s*index/i, /\bbmi\b/i],
  proteinKg: [/\bprotein\b/i],
  mineralsKg: [/\bminerals?\b/i],
  icwL: [/intracellular\s*water/i, /\bicw\b/i],
  ecwL: [/extracellular\s*water/i, /\becw\b/i],
  ffmKg: [/fat\s*free\s*mass/i, /\bffm\b/i, /lean\s*body\s*mass/i],
  bcmKg: [/body\s*cell\s*mass/i, /\bbcm\b/i],
  bmcKg: [/bone\s*mineral\s*content/i, /\bbmc\b/i],
  whr: [/waist[\s-]*hip\s*ratio/i, /\bwhr\b/i],
  vfaCm2: [/visceral\s*fat\s*area/i, /\bvfa\b/i],
  obesityDegree: [/obesity\s*degree/i],
  smi: [/\bsmi\b/i, /skeletal\s*muscle\s*index/i],
  inbodyScore: [/inbody\s*score/i],
  targetWeightKg: [/target\s*weight/i],
  weightControlKg: [/weight\s*control/i],
  fatControlKg: [/fat\s*control/i],
  muscleControlKg: [/muscle\s*control/i],
  leanRightArmKg: [/right\s*arm/i],
  leanLeftArmKg: [/left\s*arm/i],
  leanTrunkKg: [/\btrunk\b/i],
  leanRightLegKg: [/right\s*leg/i],
  leanLeftLegKg: [/left\s*leg/i],
}

const RANGES: Record<Field, { min: number; max: number }> = { ...SCAN_LIMITS, ...EXTRA_FIELDS }

/** The sheet's test date, in the common prints: 27.10.2026, 2026.10.27, 27/10/2026, 2026-10-27. */
const DATE = /\b(\d{4})[./-](\d{1,2})[./-](\d{1,2})\b|\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/

/**
 * A number after a label, allowing a bracketed note in between ("SMM (Skeletal Muscle Mass) 24.1"):
 * optional sign, digits, optional decimal; OCR's stray trailing dot allowed.
 */
const NUMBER_AFTER = String.raw`(?:\s*\([^)]*\))?[\s:|)]*([+\-−–]?\d{1,4}(?:[.,]\d{1,2})?)\.?(?=\s|$|[a-z%(/])`

/** OCR often reads 0 as O, 1 as l/I and 5 as S inside numbers; comma decimals are common. */
function cleanLine(line: string): string {
  return line
    .replace(/(?<=\d)[,](?=\d)/g, '.')
    .replace(/(?<=\d)[Oo](?=[\d.]|\b)/g, '0')
    .replace(/(?<=[\d.])[lI](?=\d|\b)/g, '1')
    .replace(/\s+/g, ' ')
    .trim()
}

function toNumber(raw: string): number {
  return Number(raw.replace(/[−–]/, '-').replace(',', '.'))
}

export function parseInbodyText(text: string): OcrRead {
  const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean)
  const whole = lines.join('\n')
  const isInBody =
    /inbody|body\s*composition|skeletal\s*muscle|percent\s*body\s*fat|basal\s*metabolic/i.test(
      whole,
    )

  const read: Partial<Record<Field, number>> = {}
  for (const field of Object.keys(LABELS) as Field[]) {
    for (const label of LABELS[field]) {
      const pattern = new RegExp(`${label.source}${NUMBER_AFTER}`, 'i')
      for (const line of lines) {
        const match = pattern.exec(line)
        if (!match) continue
        const value = toNumber(match[1]!)
        const { min, max } = RANGES[field]
        if (Number.isFinite(value) && value >= min && value <= max) {
          read[field] = value
          break
        }
      }
      if (read[field] !== undefined) break
    }
  }

  // Two prints put the value on the line after its label: the header row ("ID Height Age Gender"
  // over "3401 165 cm 30 Female …") and the InBody score ("InBody Score" over "71/100 points").
  const header = /\bheight\b[^\n]*\bage\b[^\n]*\n([^\n]*)/i.exec(whole)
  if (header) {
    const height = /(\d{3})\s*cm\b\s*(\d{1,2})?\b/i.exec(header[1]!)
    if (height) {
      const cm = Number(height[1])
      if (read.heightCm === undefined && cm >= RANGES.heightCm.min && cm <= RANGES.heightCm.max) {
        read.heightCm = cm
      }
      const age = height[2] === undefined ? NaN : Number(height[2])
      if (read.age === undefined && age >= RANGES.age.min && age <= RANGES.age.max) read.age = age
    }
  }
  const score = /inbody\s*score\D{0,24}(\d{2,3})\s*\/\s*100/i.exec(whole)
  if (score && read.inbodyScore === undefined) {
    const points = Number(score[1])
    if (points >= RANGES.inbodyScore.min && points <= RANGES.inbodyScore.max)
      read.inbodyScore = points
  }

  // Weight control is the signed distance to the target weight; sheets print the sign faintly,
  // and fat control carries the same sign (fat to lose when the target is below the weight).
  if (
    read.weightControlKg !== undefined &&
    read.targetWeightKg !== undefined &&
    read.weightKg !== undefined
  ) {
    read.weightControlKg = Math.round((read.targetWeightKg - read.weightKg) * 10) / 10
    if (read.fatControlKg !== undefined && read.weightControlKg < 0 && read.fatControlKg > 0) {
      read.fatControlKg = -read.fatControlKg
    }
  }

  const values = { scannedOn: '' } as OcrRead['values']
  for (const field of SCAN_FIELDS) {
    const value = read[field]
    values[field] = value === undefined ? '' : String(Math.round(value * 10) / 10)
  }
  const date = DATE.exec(whole)
  if (date) {
    const [y, m, d] = date[1] ? [date[1], date[2], date[3]] : [date[6], date[5], date[4]]
    const month = Number(m)
    const day = Number(d)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      values.scannedOn = `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }

  const extra: Extra = {}
  for (const field of Object.keys(EXTRA_FIELDS) as ExtraField[]) {
    if (read[field] !== undefined) extra[field] = read[field]
  }
  const found = SCAN_FIELDS.filter((f) => values[f] !== '').length + Object.keys(extra).length
  return { values, extra, found, isInBody }
}
