/**
 * Reads an InBody result sheet from OCR words with their positions. Sheets are laid out in
 * columns, tables, bar charts and body diagrams, so reading order means little: each figure is
 * found next to its printed label (or, in the 270's body diagrams, by where it sits), with the
 * scale numbers over the bar charts and the normal ranges in brackets set aside. The figures are
 * then checked against each other with InBody's own formulas; a misread that breaks one is
 * replaced by a reading that fits, and a figure the photo did not give is worked out when the
 * others determine it. Pure: the OCR runs elsewhere (ocr-run.ts).
 */

export interface OcrWord {
  text: string
  x0: number
  y0: number
  x1: number
  y1: number
  confidence: number
}

export interface FieldSpec {
  min: number
  max: number
  /** Decimals the sheet prints: a reading without its point is tried with one. */
  decimals: number
}

/** Every figure the reader looks for. Ranges are for adults; anything outside is not a reading. */
export const SHEET_FIELDS = {
  weightKg: { min: 30, max: 300, decimals: 1 },
  smmKg: { min: 5, max: 80, decimals: 1 },
  bfmKg: { min: 1, max: 200, decimals: 1 },
  pbf: { min: 2, max: 75, decimals: 1 },
  bmrKcal: { min: 700, max: 4000, decimals: 0 },
  vfl: { min: 1, max: 30, decimals: 0 },
  tbwL: { min: 10, max: 100, decimals: 1 },
  heightCm: { min: 100, max: 230, decimals: 1 },
  age: { min: 10, max: 100, decimals: 0 },
  bmi: { min: 10, max: 70, decimals: 1 },
  proteinKg: { min: 3, max: 30, decimals: 1 },
  mineralsKg: { min: 1, max: 10, decimals: 2 },
  icwL: { min: 5, max: 60, decimals: 1 },
  ecwL: { min: 5, max: 40, decimals: 1 },
  ecwRatio: { min: 0.3, max: 0.45, decimals: 3 },
  slmKg: { min: 15, max: 120, decimals: 1 },
  ffmKg: { min: 20, max: 150, decimals: 1 },
  bcmKg: { min: 10, max: 100, decimals: 1 },
  bmcKg: { min: 1, max: 8, decimals: 2 },
  whr: { min: 0.5, max: 1.5, decimals: 2 },
  vfaCm2: { min: 10, max: 400, decimals: 1 },
  obesityDegree: { min: 50, max: 300, decimals: 0 },
  smi: { min: 3, max: 15, decimals: 1 },
  phaseAngle: { min: 2, max: 15, decimals: 1 },
  inbodyScore: { min: 20, max: 120, decimals: 0 },
  recommendedKcal: { min: 800, max: 5000, decimals: 0 },
  targetWeightKg: { min: 30, max: 200, decimals: 1 },
  weightControlKg: { min: -100, max: 100, decimals: 1 },
  fatControlKg: { min: -100, max: 100, decimals: 1 },
  muscleControlKg: { min: -30, max: 30, decimals: 1 },
  leanRightArmKg: { min: 0.5, max: 12, decimals: 2 },
  leanLeftArmKg: { min: 0.5, max: 12, decimals: 2 },
  leanTrunkKg: { min: 5, max: 60, decimals: 1 },
  leanRightLegKg: { min: 2, max: 30, decimals: 2 },
  leanLeftLegKg: { min: 2, max: 30, decimals: 2 },
  leanRightArmPct: { min: 40, max: 250, decimals: 1 },
  leanLeftArmPct: { min: 40, max: 250, decimals: 1 },
  leanTrunkPct: { min: 40, max: 250, decimals: 1 },
  leanRightLegPct: { min: 40, max: 250, decimals: 1 },
  leanLeftLegPct: { min: 40, max: 250, decimals: 1 },
  fatRightArmKg: { min: 0.1, max: 15, decimals: 1 },
  fatLeftArmKg: { min: 0.1, max: 15, decimals: 1 },
  fatTrunkKg: { min: 0.5, max: 60, decimals: 1 },
  fatRightLegKg: { min: 0.3, max: 30, decimals: 1 },
  fatLeftLegKg: { min: 0.3, max: 30, decimals: 1 },
  fatRightArmPct: { min: 10, max: 800, decimals: 1 },
  fatLeftArmPct: { min: 10, max: 800, decimals: 1 },
  fatTrunkPct: { min: 10, max: 800, decimals: 1 },
  fatRightLegPct: { min: 10, max: 800, decimals: 1 },
  fatLeftLegPct: { min: 10, max: 800, decimals: 1 },
} as const satisfies Record<string, FieldSpec>

export type SheetField = keyof typeof SHEET_FIELDS
const FIELD_NAMES = Object.keys(SHEET_FIELDS) as SheetField[]

export interface SheetReading {
  values: Partial<Record<SheetField, number>>
  /** Figures worked out from the others (InBody's formulas), not read from the photo. */
  calculated: SheetField[]
  /** The test date, YYYY-MM-DD, when the header was read. */
  scannedOn?: string
  /** Whether the words look like an InBody sheet at all. */
  isInBody: boolean
}

// ── Tokens ───────────────────────────────────────────────────────────────────────────────────

type Unit = 'kg' | 'pct' | 'litre' | 'kcal' | 'cm' | 'degree'

interface NumberReading {
  value: number
  decimals: number
  unit?: Unit
  /** Printed between brackets: a normal range, or the fat diagram's "(1.1kg)". */
  bracketed: boolean
  /** Part of a "low ~ high" normal range. */
  range: boolean
}

interface Token {
  text: string
  x0: number
  y0: number
  x1: number
  y1: number
  cx: number
  cy: number
  h: number
  /** Letters only, lower case: what labels are matched on. */
  letters: string
  number?: NumberReading
  /** A tick label of a bar chart's scale or of a legend. */
  scale?: boolean
  /** Used by a matched label. */
  label?: boolean
}

const UNIT_WORDS: Record<string, Unit> = {
  kg: 'kg',
  '%': 'pct',
  l: 'litre',
  kcal: 'kcal',
  cm: 'cm',
  '°': 'degree',
}

/** OCR's usual confusions inside a number: O for 0, l/I/| for 1, a comma for the point. */
function fixDigits(text: string): string {
  return text
    .replace(/(?<=\d)[Oo]|[Oo](?=\d)/g, '0')
    .replace(/^[lI|L](?=[.,]?\d)/, '1')
    .replace(/(?<=\d)[lI|](?=\d)/g, '1')
    .replace(/(?<=\d),(?=\d)/g, '.')
}

function readNumber(raw: string): NumberReading | undefined {
  const text = fixDigits(raw.trim())
  const match =
    /^([([{]?)([+\-−–]?)(\d{1,4}(?:\.\d{1,3})?)\.?(kg\/m.?|kg|%|l|kcal|cm|°)?([)\]}]?)(.*)$/i.exec(
      text,
    )
  if (!match) return undefined
  const rest = match[6]!
  // Whatever follows must not continue the number ("17.03.08", "12:30", "3kg5").
  if (rest && !/^[\s—–=_~\-:;,'"|!.)\]}(]*([a-z]*)$/i.test(rest)) return undefined
  if (/^[.:]\d/.test(rest) || (rest && !match[4] && !match[5] && /^[a-z]/i.test(rest))) {
    return undefined
  }
  const digits = match[3]!
  const value = Number(digits) * (/[-−–]/.test(match[2]!) ? -1 : 1)
  const decimals = digits.includes('.') ? digits.split('.')[1]!.length : 0
  const unitWord = match[4]?.toLowerCase()
  const unit = unitWord?.startsWith('kg/') ? undefined : unitWord ? UNIT_WORDS[unitWord] : undefined
  return {
    value,
    decimals,
    unit,
    bracketed: Boolean(match[1] || match[5]),
    range: false,
  }
}

function toTokens(words: readonly OcrWord[]): Token[] {
  const tokens: Token[] = []
  for (const word of words) {
    const text = word.text.trim()
    if (!text) continue
    const h = Math.max(1, word.y1 - word.y0)
    tokens.push({
      text,
      x0: word.x0,
      y0: word.y0,
      x1: word.x1,
      y1: word.y1,
      cx: (word.x0 + word.x1) / 2,
      cy: (word.y0 + word.y1) / 2,
      h,
      letters: text
        .replace(/\((l|kg|%|cm|kcal|kg\/m.?|cm.?)\)$/i, '')
        .toLowerCase()
        .replace(/[^a-z]/g, ''),
      number: readNumber(text),
    })
  }
  return tokens
}

function overlapShare(a: Token, b: Token) {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
  if (w <= 0 || h <= 0) return 0
  return (w * h) / Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0))
}

/**
 * Two passes read the same spot: one copy of a word read alike; a number read short ("2" under
 * "2.35", "9" under "95") gives way to the fuller reading; a digit made out of a unit ("8" for
 * "(kg)") is dropped. Different full readings of one spot both stay as candidates.
 */
function dedupe(tokens: Token[]): Token[] {
  const kept: Token[] = []
  for (const token of tokens) {
    const twin = kept.find(
      (other) =>
        other.text === token.text &&
        Math.abs(other.cx - token.cx) < token.h &&
        Math.abs(other.cy - token.cy) < token.h * 0.6,
    )
    if (!twin) kept.push(token)
  }
  return kept.filter((token) => {
    if (!token.number) return true
    return !kept.some((other) => {
      if (other === token || overlapShare(token, other) < 0.6) return false
      if (/^\(?(kg|%|l|cm|kcal)\)?$/i.test(other.text) && token.number!.decimals === 0) return true
      return (
        other.number !== undefined &&
        token.number!.decimals === 0 &&
        other.text.length > token.text.length &&
        other.text.replace(/[^\d]/g, '').startsWith(token.text.replace(/[^\d]/g, ''))
      )
    })
  })
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]!
}

/** Tokens whose centres share a line with `token`, left to right. */
function sameRow(tokens: Token[], token: Token, tolerance = 0.5): Token[] {
  return tokens
    .filter((other) => Math.abs(other.cy - token.cy) <= Math.max(other.h, token.h) * tolerance)
    .sort((a, b) => a.x0 - b.x0)
}

/** Brackets and tildes: numbers in "(29.1 ~ 35.5)" are a normal range, not a reading. */
function markRanges(tokens: Token[]) {
  for (const token of tokens) {
    const row = sameRow(tokens, token)
    const at = row.indexOf(token)
    const before = row[at - 1]
    const after = row[at + 1]
    const near = (other: Token | undefined) =>
      other !== undefined && Math.abs(other.x0 - token.x1) < token.h * 2.5
    const nearBefore = (other: Token | undefined) =>
      other !== undefined && Math.abs(token.x0 - other.x1) < token.h * 2.5
    if (!token.number) continue
    if (
      /~|[-–]\d/.test(token.text.slice(1)) ||
      (near(after) && /^[~∼-]/.test(after!.text) && !/kg/i.test(token.text)) ||
      (nearBefore(before) && /[~∼]$/.test(before!.text))
    ) {
      token.number.range = true
    }
    // "(26.4" … "32.2)": an opening bracket without a unit starts a range.
    if (/^\(/.test(token.text) && token.number.unit === undefined) token.number.range = true
    if (/\)$/.test(token.text) && !/^\(/.test(token.text) && token.number.unit === undefined) {
      token.number.range = true
    }
  }
}

/** A bar chart's scale: four or more rising numbers along one line, or a legend's numbers. */
function markScales(tokens: Token[]) {
  const done = new Set<Token>()
  for (const token of tokens) {
    if (!token.number || done.has(token)) continue
    const row = sameRow(tokens, token, 0.45).filter((t) => t.number && !t.number.range)
    for (const t of row) done.add(t)
    let run: Token[] = []
    const even = (ticks: Token[]) => {
      const gaps = ticks.slice(1).map((t, i) => t.cx - ticks[i]!.cx)
      // Ticks are evenly spaced; a missed tick or two leaves a wider gap.
      return ticks.length >= 6 || Math.max(...gaps) <= 3.5 * Math.min(...gaps)
    }
    const flush = () => {
      if (run.length >= 4 && even(run)) {
        for (const t of run) t.scale = true
        // Other readings of the same ticks.
        for (const t of row) {
          if (run.some((r) => Math.min(r.x1, t.x1) - Math.max(r.x0, t.x0) > 0.5 * (t.x1 - t.x0))) {
            t.scale = true
          }
        }
      }
      run = []
    }
    for (const t of row) {
      const last = run[run.length - 1]
      if (last && Math.min(last.x1, t.x1) - Math.max(last.x0, t.x0) > 0) continue
      if (last && t.number!.value > last.number!.value && t.x0 - last.x1 < 5 * t.h) run.push(t)
      else {
        flush()
        run = [t]
      }
    }
    flush()
  }
  // Short scales: rising numbers in print smaller than the page's text ("0.75  0.85").
  const small = median(tokens.map((t) => t.h)) * 0.75
  for (const token of tokens) {
    if (!token.number || token.scale || token.h > small) continue
    const row = sameRow(tokens, token, 0.45).filter(
      (t) => t.number && !t.number.range && t.h <= small && Math.abs(t.cx - token.cx) < token.h * 8,
    )
    const rising = row.every((t, i) => i === 0 || t.number!.value > row[i - 1]!.number!.value)
    if (row.length >= 2 && rising) for (const t of row) t.scale = true
  }
  // Legends: a number between two of "Low 10 High", "Under 100 Over" on its line.
  const legend = /^(low|high|under|over|normal)$/
  for (const token of tokens) {
    if (!token.number) continue
    const row = sameRow(tokens, token, 0.45)
    const near = (t: Token) => Math.abs(t.cx - token.cx) < token.h * 8
    const left = row.some((t) => t.x1 <= token.x0 && near(t) && legend.test(t.letters))
    const right = row.some((t) => t.x0 >= token.x1 && near(t) && legend.test(t.letters))
    if (left && right) token.scale = true
  }
}

// ── Labels ───────────────────────────────────────────────────────────────────────────────────

interface Label {
  field: string
  x0: number
  y0: number
  x1: number
  y1: number
  cx: number
  cy: number
  h: number
}

/** Printed labels, letters only. Longer labels are matched first and claim their words. */
const LABELS: Array<[string, string[]]> = [
  ['recommendedKcal', ['recommendedcalorieintakeperday', 'recommendedcalorieintake']],
  ['bmcKg', ['bonemineralcontent']],
  ['icwL', ['intracellularwater']],
  ['ecwL', ['extracellularwater']],
  ['tbwL', ['totalbodywater']],
  ['bmrKcal', ['basalmetabolicrate']],
  ['vfl', ['visceralfatlevel']],
  ['vfaCm2', ['visceralfatarea']],
  ['phaseAngle', ['wholebodyphaseangle', 'phaseangle']],
  ['history', ['bodycompositionhistory']],
  ['segmentalLean', ['segmentalleananalysis']],
  ['segmentalFat', ['segmentalfatanalysis']],
  ['smmKg', ['skeletalmusclemass', 'smm']],
  ['bcmKg', ['bodycellmass', 'bcm']],
  ['slmKg', ['softleanmass', 'slm']],
  ['ffmKg', ['fatfreemass', 'leanbodymass', 'ffm']],
  ['bfmKg', ['bodyfatmass', 'bfm']],
  ['pbf', ['percentbodyfat', 'pbf']],
  ['bmi', ['bodymassindex', 'bmi']],
  ['whr', ['waisthipratio', 'whr']],
  ['obesityDegree', ['obesitydegree']],
  ['inbodyScore', ['inbodyscore']],
  ['targetWeightKg', ['targetweight']],
  ['weightControlKg', ['weightcontrol']],
  ['fatControlKg', ['fatcontrol']],
  ['muscleControlKg', ['musclecontrol']],
  ['ecwRatio', ['ecwratio', 'ecwtbw']],
  ['rightArm', ['rightarm']],
  ['leftArm', ['leftarm']],
  ['rightLeg', ['rightleg']],
  ['leftLeg', ['leftleg']],
  ['trunk', ['trunk']],
  ['proteinKg', ['protein']],
  ['mineralsKg', ['minerals', 'mineral']],
  ['heightCm', ['height']],
  ['age', ['age']],
  ['date', ['testdatetime', 'testdate', 'datetime']],
  ['smi', ['smi']],
  ['weightKg', ['weight']],
]

/** Edits allowed for a label of this length: OCR drops or swaps a letter or two. */
function allowedEdits(length: number) {
  return length <= 4 ? 0 : length <= 7 ? 1 : length <= 14 ? 2 : 3
}

function editDistance(a: string, b: string): number {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0]!
    previous[0] = i
    for (let j = 1; j <= b.length; j++) {
      const above = previous[j]!
      previous[j] = Math.min(
        previous[j]! + 1,
        previous[j - 1]! + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      diagonal = above
    }
  }
  return previous[b.length]!
}

/**
 * Labels by best match: every run of up to five neighbouring words is compared with every label,
 * and the closest (then the longest) wins, so "Extracellular Water" is never read as
 * "Intracellular Water" nor "Weight" as "Height".
 */
function findLabels(tokens: Token[]): Label[] {
  const words = tokens.filter((t) => t.letters.length > 0 && !t.number)
  interface Match {
    field: string
    used: Token[]
    distance: number
    length: number
  }
  const matches: Match[] = []
  for (const start of words) {
    const row = sameRow(words, start, 0.4).filter((t) => t.x0 >= start.x0)
    let letters = ''
    const used: Token[] = []
    for (const word of row.slice(0, 8)) {
      const last = used[used.length - 1]
      if (last && word.x0 < last.x1 - Math.min(last.h, word.h) * 0.5) continue
      if (last && word.x0 - last.x1 > 2 * Math.max(word.h, last.h)) break
      if (used.length === 5) break
      used.push(word)
      letters += word.letters.replace(/(kg|cm)$/, '')
      for (const [field, variants] of LABELS) {
        for (const variant of variants) {
          const allowed = allowedEdits(variant.length)
          if (Math.abs(letters.length - variant.length) > allowed) continue
          const distance = editDistance(letters, variant)
          if (distance <= allowed) {
            matches.push({ field, used: [...used], distance, length: variant.length })
          }
        }
      }
    }
  }
  // Closest first, then longest; a word belongs to one label only.
  matches.sort((a, b) => a.distance - b.distance || b.length - a.length)
  const labels: Label[] = []
  for (const match of matches) {
    if (match.used.some((u) => u.label)) continue
    for (const u of match.used) u.label = true
    const x0 = Math.min(...match.used.map((u) => u.x0))
    const x1 = Math.max(...match.used.map((u) => u.x1))
    const y0 = Math.min(...match.used.map((u) => u.y0))
    const y1 = Math.max(...match.used.map((u) => u.y1))
    labels.push({
      field: match.field,
      x0,
      y0,
      x1,
      y1,
      cx: (x0 + x1) / 2,
      cy: (y0 + y1) / 2,
      h: y1 - y0,
    })
  }
  return labels
}

/** Labels inside "Body Composition History" (below it, in its column) are earlier tests. */
function withoutHistory(labels: Label[]): Label[] {
  const heads = labels.filter((l) => l.field === 'history')
  return labels.filter(
    (label) =>
      label.field !== 'history' &&
      !heads.some(
        (head) =>
          label.cy > head.cy && label.x0 < head.x1 + head.h * 4 && label.x1 > head.x0 - head.h * 4,
      ),
  )
}

// ── Finding values ───────────────────────────────────────────────────────────────────────────

interface Candidate {
  value: number
  score: number
}

/** Figures every InBody model prints with decimals: a whole number there is a tick, not a reading. */
const ALWAYS_DECIMAL = /^(lean|fat)(Right|Left|Trunk)|^vfaCm2$/

/** A reading in its range, or with the point the OCR dropped put back. */
function fits(field: SheetField, n: NumberReading): Candidate | undefined {
  const { min, max, decimals } = SHEET_FIELDS[field]
  if (n.decimals === 0 && ALWAYS_DECIMAL.test(field)) return undefined
  const inRange = (v: number) => v >= min && v <= max
  if (inRange(n.value)) {
    if (n.decimals > decimals) {
      // A stray character read as a last digit ("13.5L" → "13.51"): keep the printed precision.
      const factor = 10 ** decimals
      return { value: Math.trunc(n.value * factor) / factor, score: 0.6 }
    }
    // A figure printed with decimals that came back without them is less sure.
    const score = n.decimals === decimals ? 1 : decimals > 0 && n.decimals === 0 ? 0.55 : 0.8
    return { value: n.value, score }
  }
  if (n.decimals > decimals && n.decimals > 1) {
    const factor = 10 ** decimals
    const cut = Math.trunc(n.value * factor) / factor
    if (inRange(cut)) return { value: cut, score: 0.5 }
  }
  if (n.decimals === 0 && decimals > 0) {
    const shifted = n.value / 10 ** decimals
    if (inRange(shifted))
      return { value: Math.round(shifted * 10 ** decimals) / 10 ** decimals, score: 0.4 }
  }
  return undefined
}

/** Is there a label between the label and this token on its line? Then the token is that one's. */
function blocked(labels: Label[], from: Label, token: Token) {
  return labels.some(
    (other) =>
      other !== from &&
      other.x0 > from.x1 - 1 &&
      other.x1 < token.x0 + 1 &&
      Math.abs(other.cy - token.cy) < Math.max(other.h, token.h) * 0.7,
  )
}

/** The tick row of a bar chart to the right of this label (on its line or just above), if any. */
function scaleRow(tokens: Token[], label: Label): number | undefined {
  const ticks = tokens.filter(
    (t) =>
      t.scale &&
      t.x0 > label.x1 &&
      t.cy > label.cy - label.h * 1.3 &&
      t.cy < label.cy + label.h * 0.6,
  )
  return ticks.length >= 3 ? median(ticks.map((t) => t.cy + t.h / 2)) : undefined
}

/**
 * Numbers to the right of a label, nearest first: on its line, or for a bar chart under the
 * chart's tick row (the figure is printed at the end of the bar, below the ticks).
 */
function rightOf(tokens: Token[], labels: Label[], label: Label, width: number, below?: number) {
  const ticks = scaleRow(tokens, label)
  const reach = below ?? (ticks !== undefined ? 1.8 : 0.75)
  return tokens
    .filter(
      (t) =>
        t.number &&
        !t.scale &&
        !t.label &&
        // Figures are printed at least as large as their labels; ticks and notes are smaller.
        t.h >= label.h * 0.7 &&
        t.x0 >= label.x1 - label.h * 0.3 &&
        t.x0 - label.x1 < width * 0.5 &&
        t.cy >= label.cy - label.h * 0.8 &&
        t.cy <= label.cy + label.h * reach &&
        (ticks === undefined || t.cy > ticks) &&
        !blocked(labels, label, t),
    )
    .sort(
      (a, b) =>
        a.x0 -
        label.x1 +
        Math.abs(a.cy - label.cy) * 4 -
        (b.x0 - label.x1 + Math.abs(b.cy - label.cy) * 4),
    )
}

function add(
  candidates: Map<SheetField, Candidate[]>,
  field: SheetField,
  c: Candidate | undefined,
) {
  if (!c) return
  const list = candidates.get(field) ?? []
  const same = list.find((other) => Math.abs(other.value - c.value) < 1e-9)
  if (same) same.score += c.score
  else list.push({ ...c })
  candidates.set(field, list)
}

const ROW_FIELDS: SheetField[] = [
  'weightKg',
  'smmKg',
  'bfmKg',
  'pbf',
  'bmrKcal',
  'tbwL',
  'bmi',
  'proteinKg',
  'mineralsKg',
  'icwL',
  'ecwL',
  'ecwRatio',
  'slmKg',
  'ffmKg',
  'bcmKg',
  'bmcKg',
  'whr',
  'vfaCm2',
  'obesityDegree',
  'smi',
  'recommendedKcal',
  'targetWeightKg',
  'weightControlKg',
  'fatControlKg',
  'muscleControlKg',
]

const SEGMENTS = ['rightArm', 'leftArm', 'trunk', 'rightLeg', 'leftLeg'] as const
type Segment = (typeof SEGMENTS)[number]
const SEGMENT_FIELD = {
  rightArm: 'RightArm',
  leftArm: 'LeftArm',
  trunk: 'Trunk',
  rightLeg: 'RightLeg',
  leftLeg: 'LeftLeg',
} as const

/** A sign printed as its own word before the number: "- 7.4 kg". */
function signBefore(tokens: Token[], token: Token): number {
  const row = sameRow(tokens, token)
  const before = row[row.indexOf(token) - 1]
  if (before && token.x0 - before.x1 < token.h * 1.5) {
    if (/^[-−–]$/.test(before.text)) return -1
  }
  return 1
}

function rowCandidates(
  tokens: Token[],
  labels: Label[],
  width: number,
  candidates: Map<SheetField, Candidate[]>,
) {
  for (const label of labels) {
    if (!(ROW_FIELDS as string[]).includes(label.field)) continue
    const field = label.field as SheetField
    const near = rightOf(tokens, labels, label, width)
    // The nearest readings, nearer ones counting more; a clean reading beats a repaired one.
    const weight = [1, 0.7, 0.45]
    for (const [rank, token] of near.slice(0, 3).entries()) {
      const n = token.number!
      if (n.range || n.bracketed) continue
      let reading = n
      if (field.endsWith('ControlKg') && n.value >= 0) {
        reading = { ...n, value: n.value * signBefore(tokens, token) }
      }
      const c = fits(field, reading)
      if (!c) continue
      add(candidates, field, { value: c.value, score: c.score * weight[rank]! })
      if (field.endsWith('ControlKg') && c.value !== 0) {
        add(candidates, field, { value: -c.value, score: c.score * weight[rank]! * 0.5 })
      }
    }
  }
}

/** Labels that head a column in the body composition table of the 570/770. */
const COLUMN_HEADS = ['tbwL', 'slmKg', 'ffmKg', 'weightKg']

/** Fields printed under their label: the header row, the 270's waist-hip ratio and VF level. */
function belowCandidates(
  tokens: Token[],
  labels: Label[],
  width: number,
  candidates: Map<SheetField, Candidate[]>,
) {
  for (const label of labels) {
    const field = label.field
    const head =
      COLUMN_HEADS.includes(field) && rightOf(tokens, labels, label, width, 0.6).length === 0
    if (!head && !['heightCm', 'age', 'whr', 'vfl', 'vfaCm2', 'phaseAngle'].includes(field))
      continue
    const under = tokens
      .filter(
        (t) =>
          t.number &&
          !t.scale &&
          !t.label &&
          !t.number.range &&
          (head || t.h >= label.h * 0.65) &&
          t.cy > label.cy + label.h * 0.5 &&
          t.cy < label.cy + label.h * (field === 'vfaCm2' ? 12 : head ? 6 : 4) &&
          (head
            ? t.cx > label.x0 - 10 && t.cx < label.x1 + 10
            : t.x1 > label.x0 - label.h * 2 &&
              t.x0 < label.x1 + label.h * (field === 'phaseAngle' ? 14 : 4)),
      )
      .sort((a, b) => a.cy - b.cy)
    // The best-formed reading among the nearest few (a repaired tick loses to a clean figure).
    let best: Candidate | undefined
    for (const [rank, token] of under.slice(0, 4).entries()) {
      const n = token.number!
      // Axis ticks of the VFA chart are round numbers without a point.
      if (field === 'vfaCm2' && n.decimals === 0) continue
      const c = fits(field as SheetField, n)
      if (!c) continue
      const score = c.score * (head ? 0.8 : 0.9) * (1 - 0.1 * rank)
      if (!best || score > best.score) best = { value: c.value, score }
    }
    add(candidates, field as SheetField, best)
  }
}

/** "81 / 100 Points": the score, even when the big digits came apart ("8 1"). */
function scoreCandidates(
  tokens: Token[],
  labels: Label[],
  candidates: Map<SheetField, Candidate[]>,
) {
  for (const label of labels.filter((l) => l.field === 'inbodyScore')) {
    const region = tokens
      .filter(
        (t) =>
          t.cy > label.cy &&
          t.cy < label.cy + label.h * 7 &&
          t.x1 > label.x0 - label.h * 4 &&
          t.x0 < label.x1 + label.h * 14,
      )
      .sort((a, b) => a.cy - b.cy || a.x0 - b.x0)
    for (const token of region) {
      const slash = /^(\d{1,3})\/100/.exec(token.text.replace(/\s/g, ''))
      if (slash) {
        add(candidates, 'inbodyScore', fits('inbodyScore', readNumber(slash[1]!)!))
        continue
      }
      if (!/^\/?100/.test(token.text)) continue
      // Digits just left of "/100" on its line, joined.
      const left = sameRow(region, token).filter(
        (t) => t.x1 <= token.x0 + 2 && token.x0 - t.x1 < token.h * 4 && /^\d+$/.test(t.text),
      )
      const digits = left.map((t) => t.text).join('')
      const n = digits ? readNumber(digits) : undefined
      if (n) add(candidates, 'inbodyScore', fits('inbodyScore', n))
    }
  }
}

/** Which diagram a segment row is in: the nearest segmental heading above, in its column. */
function headingOf(labels: Label[], label: Label): Label | undefined {
  return labels
    .filter(
      (h) =>
        (h.field === 'segmentalLean' || h.field === 'segmentalFat') &&
        h.cy < label.cy &&
        h.x0 < label.x1 + label.h * 6 &&
        h.x1 > label.x0 - label.h * 6,
    )
    .sort((a, b) => b.cy - a.cy)[0]
}

/** Bar-chart segment rows (570/770): "Right Arm (kg) … 2.56 / (%) … 116.6", and the fat rows. */
function segmentRowCandidates(
  tokens: Token[],
  labels: Label[],
  width: number,
  candidates: Map<SheetField, Candidate[]>,
) {
  for (const label of labels) {
    if (!(SEGMENTS as readonly string[]).includes(label.field)) continue
    const segment = SEGMENT_FIELD[label.field as Segment]
    const kind = headingOf(labels, label)?.field === 'segmentalFat' ? 'fat' : 'lean'
    // Lean rows (bar charts): kg on the label's line, % on the line under it. Fat rows (the 770's
    // list): "(1.1kg) ── 110.9%" on one line, lines close together.
    const kgField = `${kind}${segment}Kg` as SheetField
    const pctField = `${kind}${segment}Pct` as SheetField
    const near = rightOf(tokens, labels, label, width, kind === 'lean' ? 2.2 : 0.6).filter(
      (t) => !t.number!.range || /kg/i.test(t.text),
    )
    const kg = near.find(
      (t) =>
        t.number!.unit !== 'pct' &&
        Math.abs(t.cy - label.cy) < label.h * 0.9 &&
        fits(kgField, t.number!) !== undefined,
    )
    if (kg) add(candidates, kgField, fits(kgField, kg.number!))
    const pct = near.find(
      (t) =>
        t !== kg &&
        (kind === 'fat'
          ? t.number!.unit === 'pct' || (kg !== undefined && t.x0 > kg.x1)
          : t.number!.unit === 'pct' || t.cy > (kg?.cy ?? label.cy) + label.h * 0.5) &&
        fits(pctField, t.number!) !== undefined,
    )
    if (pct) add(candidates, pctField, fits(pctField, pct.number!))
  }
}

/**
 * The 270's body diagrams: under "Segmental Lean Analysis" and "Segmental Fat Analysis", a
 * figure with "1.71 kg / 86.6 %" at each arm, the trunk and each leg. The sheet prints "Left" on
 * the figure's left side, so the upper-left pair is the left arm.
 */
function diagramCandidates(
  tokens: Token[],
  labels: Label[],
  width: number,
  candidates: Map<SheetField, Candidate[]>,
) {
  for (const head of labels.filter(
    (l) => l.field === 'segmentalLean' || l.field === 'segmentalFat',
  )) {
    const kind = head.field === 'segmentalLean' ? 'lean' : 'fat'
    // The panel: from the heading's left edge to the next heading on its line (or a third of the page).
    const nextHead = labels
      .filter((l) => (l.field === 'segmentalLean' || l.field === 'segmentalFat') && l !== head)
      .filter((l) => l.x0 > head.x1 && Math.abs(l.cy - head.cy) < head.h * 1.5)
      .sort((a, b) => a.x0 - b.x0)[0]
    const panelX0 = head.x0 - head.h
    const panelX1 = nextHead ? nextHead.x0 - head.h * 0.5 : head.x0 + width * 0.3
    const inPanel = tokens.filter(
      (t) =>
        t.number &&
        !t.scale &&
        t.cx > panelX0 &&
        t.cx < panelX1 &&
        t.cy > head.y1 &&
        t.cy < head.y1 + width * 0.32,
    )
    // A kg figure has its percentage right under it ("1.71 kg" over "86.6 %").
    const below = (t: Token) =>
      inPanel.find(
        (o) =>
          o !== t &&
          o.cy > t.cy + t.h * 0.6 &&
          o.cy < t.cy + t.h * 2.8 &&
          Math.abs(o.cx - t.cx) < t.h * 3 &&
          (o.number!.unit === 'pct' || o.number!.value >= 20),
      )
    const kgs = inPanel.filter(
      (t) => t.number!.unit !== 'pct' && t.number!.value < 70 && below(t) !== undefined,
    )
    // One reading per spot (two passes), then rows: arms, trunk, legs, top to bottom.
    const spots: Token[] = []
    for (const t of kgs.sort((a, b) => b.number!.decimals - a.number!.decimals)) {
      if (!spots.some((o) => overlapShare(o, t) > 0.3)) spots.push(t)
    }
    spots.sort((a, b) => a.cy - b.cy)
    const rows: Token[][] = []
    for (const t of spots) {
      const row = rows[rows.length - 1]
      if (row && t.cy - row[0]!.cy < t.h * 1.5) row.push(t)
      else rows.push([t])
    }
    for (const row of rows) row.sort((a, b) => a.cx - b.cx)
    // Rows by how far under the heading they sit: arms, then trunk, then legs.
    const span = width * 0.25
    const place = (row: Token[]) => (row[0]!.cy - head.cy) / span
    const arms = rows.find((row) => row.length === 2 && place(row) < 0.4)
    const legs = rows.find((row) => row.length === 2 && place(row) > 0.7)
    const trunk = rows.find((row) => row.length === 1 && place(row) >= 0.3 && place(row) <= 0.7)
    const slots: Array<[string, Token | undefined]> = [
      ['LeftArm', arms?.[0]],
      ['RightArm', arms?.[1]],
      ['Trunk', trunk?.[0]],
      ['LeftLeg', legs?.[0]],
      ['RightLeg', legs?.[1]],
    ]
    for (const [segment, kg] of slots) {
      if (!kg) continue
      const kgField = `${kind}${segment}Kg` as SheetField
      add(candidates, kgField, fits(kgField, kg.number!))
      const pct = below(kg)
      const pctField = `${kind}${segment}Pct` as SheetField
      if (pct) add(candidates, pctField, fits(pctField, pct.number!))
    }
  }
}

/** The header's date: 2018.04.03., 03.04.2018, 2018-04-03 … */
function readDate(tokens: Token[]): string | undefined {
  for (const token of tokens) {
    const text = token.text
    const ymd = /(20\d{2})[./-](\d{1,2})[./-](\d{1,2})/.exec(text)
    const dmy = /(\d{1,2})[./-](\d{1,2})[./-](20\d{2})/.exec(text)
    const [y, m, d] = ymd ? [ymd[1], ymd[2], ymd[3]] : dmy ? [dmy[3], dmy[2], dmy[1]] : []
    if (!y) continue
    const month = Number(m)
    const day = Number(d)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }
  return undefined
}

// ── Checking figures against each other ──────────────────────────────────────────────────────

type Values = Partial<Record<SheetField, number>>

interface Rule {
  fields: SheetField[]
  /** How far a printed set may be from the formula (each figure is rounded on the sheet). */
  tolerance: number
  /** formula(values) - 0 when the figures agree. */
  error: (v: Required<Values>) => number
  /** Each field worked out from the others. */
  solve: Partial<Record<SheetField, (v: Required<Values>) => number>>
}

const sq = (cm: number) => (cm / 100) ** 2

/** InBody's own definitions, as printed on its result sheets. */
const RULES: Rule[] = [
  {
    fields: ['weightKg', 'tbwL', 'proteinKg', 'mineralsKg', 'bfmKg'],
    tolerance: 0.35,
    error: (v) => v.tbwL + v.proteinKg + v.mineralsKg + v.bfmKg - v.weightKg,
    solve: {
      weightKg: (v) => v.tbwL + v.proteinKg + v.mineralsKg + v.bfmKg,
      bfmKg: (v) => v.weightKg - v.tbwL - v.proteinKg - v.mineralsKg,
      proteinKg: (v) => v.weightKg - v.tbwL - v.mineralsKg - v.bfmKg,
    },
  },
  {
    fields: ['ffmKg', 'tbwL', 'proteinKg', 'mineralsKg'],
    tolerance: 0.25,
    error: (v) => v.tbwL + v.proteinKg + v.mineralsKg - v.ffmKg,
    solve: {
      ffmKg: (v) => v.tbwL + v.proteinKg + v.mineralsKg,
      proteinKg: (v) => v.ffmKg - v.tbwL - v.mineralsKg,
      mineralsKg: (v) => v.ffmKg - v.tbwL - v.proteinKg,
      tbwL: (v) => v.ffmKg - v.proteinKg - v.mineralsKg,
    },
  },
  {
    fields: ['weightKg', 'ffmKg', 'bfmKg'],
    tolerance: 0.25,
    error: (v) => v.ffmKg + v.bfmKg - v.weightKg,
    solve: {
      ffmKg: (v) => v.weightKg - v.bfmKg,
      bfmKg: (v) => v.weightKg - v.ffmKg,
      weightKg: (v) => v.ffmKg + v.bfmKg,
    },
  },
  {
    fields: ['pbf', 'bfmKg', 'weightKg'],
    tolerance: 0.25,
    error: (v) => (100 * v.bfmKg) / v.weightKg - v.pbf,
    solve: { pbf: (v) => (100 * v.bfmKg) / v.weightKg, bfmKg: (v) => (v.pbf * v.weightKg) / 100 },
  },
  {
    fields: ['bmi', 'weightKg', 'heightCm'],
    tolerance: 0.25,
    error: (v) => v.weightKg / sq(v.heightCm) - v.bmi,
    solve: { bmi: (v) => v.weightKg / sq(v.heightCm) },
  },
  {
    fields: ['bmrKcal', 'ffmKg'],
    tolerance: 3,
    error: (v) => 370 + 21.6 * v.ffmKg - v.bmrKcal,
    solve: { bmrKcal: (v) => 370 + 21.6 * v.ffmKg, ffmKg: (v) => (v.bmrKcal - 370) / 21.6 },
  },
  {
    fields: ['tbwL', 'icwL', 'ecwL'],
    tolerance: 0.25,
    error: (v) => v.icwL + v.ecwL - v.tbwL,
    solve: {
      tbwL: (v) => v.icwL + v.ecwL,
      icwL: (v) => v.tbwL - v.ecwL,
      ecwL: (v) => v.tbwL - v.icwL,
    },
  },
  {
    fields: ['ecwRatio', 'ecwL', 'tbwL'],
    tolerance: 0.004,
    error: (v) => v.ecwL / v.tbwL - v.ecwRatio,
    solve: { ecwRatio: (v) => v.ecwL / v.tbwL },
  },
  {
    fields: ['targetWeightKg', 'weightKg', 'weightControlKg'],
    tolerance: 0.15,
    error: (v) => v.weightKg + v.weightControlKg - v.targetWeightKg,
    solve: {
      weightControlKg: (v) => v.targetWeightKg - v.weightKg,
      targetWeightKg: (v) => v.weightKg + v.weightControlKg,
    },
  },
  {
    fields: ['weightControlKg', 'fatControlKg', 'muscleControlKg'],
    tolerance: 0.15,
    error: (v) => v.fatControlKg + v.muscleControlKg - v.weightControlKg,
    solve: {
      weightControlKg: (v) => v.fatControlKg + v.muscleControlKg,
      fatControlKg: (v) => v.weightControlKg - v.muscleControlKg,
      muscleControlKg: (v) => v.weightControlKg - v.fatControlKg,
    },
  },
  {
    fields: [
      'smi',
      'leanRightArmKg',
      'leanLeftArmKg',
      'leanRightLegKg',
      'leanLeftLegKg',
      'heightCm',
    ],
    tolerance: 0.12,
    error: (v) =>
      (v.leanRightArmKg + v.leanLeftArmKg + v.leanRightLegKg + v.leanLeftLegKg) / sq(v.heightCm) -
      v.smi,
    solve: {
      smi: (v) =>
        (v.leanRightArmKg + v.leanLeftArmKg + v.leanRightLegKg + v.leanLeftLegKg) / sq(v.heightCm),
    },
  },
]

function roundTo(field: SheetField, value: number) {
  const factor = 10 ** SHEET_FIELDS[field].decimals
  return Math.round(value * factor) / factor
}

function inRange(field: SheetField, value: number) {
  return value >= SHEET_FIELDS[field].min && value <= SHEET_FIELDS[field].max
}

/** A reading at least this sure may anchor a formula; weaker ones may be overruled by one. */
const SURE = 0.75

/**
 * Picks one value per field. Start from each field's best-scored reading; where a formula fails,
 * try the field's other readings and keep the set that satisfies the most formulas. A weak
 * reading (a lost decimal point, a single faint pass) that breaks a formula whose other figures
 * are sure is replaced by the formula's value, and missing figures are worked out from sure ones.
 */
function resolve(candidates: Map<SheetField, Candidate[]>): {
  values: Values
  calculated: SheetField[]
} {
  const options = new Map<SheetField, Candidate[]>()
  for (const [field, list] of candidates) {
    options.set(field, [...list].sort((a, b) => b.score - a.score).slice(0, 4))
  }
  const values: Values = {}
  const sureness = new Map<SheetField, number>()
  for (const [field, list] of options) {
    values[field] = list[0]!.value
    sureness.set(field, list[0]!.score)
  }

  const holds = (rule: Rule, v: Values) =>
    rule.fields.every((f) => v[f] !== undefined) &&
    Math.abs(rule.error(v as Required<Values>)) <= rule.tolerance
  const agreement = (v: Values) => RULES.filter((rule) => holds(rule, v)).length

  // Change one field's reading at a time while that makes more formulas hold.
  for (let round = 0; round < 3; round++) {
    let improved = false
    for (const [field, list] of options) {
      let best = agreement(values)
      let bestOption: Candidate | undefined
      for (const option of list) {
        const score = agreement({ ...values, [field]: option.value })
        if (score > best) {
          best = score
          bestOption = option
        }
      }
      if (bestOption) {
        values[field] = bestOption.value
        sureness.set(field, Math.max(bestOption.score, SURE))
        improved = true
      }
    }
    if (!improved) break
  }

  const sure = (field: SheetField) => (sureness.get(field) ?? 0) >= SURE

  // A bar's end can swallow the "1" of the figure printed after it (19.6 read as 9.6). Skeletal
  // muscle mass is close to 55% of fat-free mass on every InBody sheet, so put the 1 back when
  // that is what makes it fit.
  const { smmKg, ffmKg } = values
  if (smmKg !== undefined && ffmKg !== undefined && smmKg / ffmKg < 0.4) {
    const fixed = smmKg + 10
    if (fixed / ffmKg >= 0.45 && fixed / ffmKg <= 0.65 && inRange('smmKg', fixed))
      values.smmKg = fixed
  }

  const calculated: SheetField[] = []
  for (let round = 0; round < 6; round++) {
    let changed = false
    // A weak reading that breaks a formula whose other figures are sure: use the formula's value.
    for (const rule of RULES) {
      if (!rule.fields.every((f) => values[f] !== undefined) || holds(rule, values)) continue
      const weak = rule.fields.filter((f) => !sure(f))
      if (weak.length !== 1) continue
      const field = weak[0]!
      const solve = rule.solve[field]
      if (!solve) continue
      const fixed = roundTo(field, solve(values as Required<Values>))
      if (inRange(field, fixed)) {
        values[field] = fixed
        sureness.set(field, SURE)
        changed = true
      }
    }
    // Missing figures that the sure ones determine.
    for (const rule of RULES) {
      const missing = rule.fields.filter((f) => values[f] === undefined)
      if (missing.length !== 1) continue
      if (!rule.fields.every((f) => f === missing[0] || sure(f))) continue
      const field = missing[0]!
      const solve = rule.solve[field]
      if (!solve) continue
      const value = roundTo(field, solve(values as Required<Values>))
      if (!Number.isFinite(value) || !inRange(field, value)) continue
      values[field] = value
      sureness.set(field, SURE)
      calculated.push(field)
      changed = true
    }
    if (!changed) break
  }
  return { values, calculated }
}

// ── Entry point ──────────────────────────────────────────────────────────────────────────────

/**
 * Reads the sheet from the words of one or more OCR passes over the same (flattened) image.
 * `hints` are figures found by a closer look at one spot (ocr-run.ts): they count as readings.
 */
export function readInbodySheet(
  words: readonly OcrWord[],
  pageWidth: number,
  hints: Partial<Record<SheetField, number>> = {},
): SheetReading {
  const tokens = dedupe(toTokens(words))
  markRanges(tokens)
  markScales(tokens)
  const labels = withoutHistory(findLabels(tokens))
  const isInBody =
    tokens.some((t) => /inbody/i.test(t.text)) ||
    labels.filter((l) => ['tbwL', 'smmKg', 'pbf', 'bfmKg', 'bmrKcal'].includes(l.field)).length >= 2

  const candidates = new Map<SheetField, Candidate[]>()
  rowCandidates(tokens, labels, pageWidth, candidates)
  belowCandidates(tokens, labels, pageWidth, candidates)
  scoreCandidates(tokens, labels, candidates)
  segmentRowCandidates(tokens, labels, pageWidth, candidates)
  diagramCandidates(tokens, labels, pageWidth, candidates)

  // Header: "Height 156.9cm", "Age 51" sit under their labels; a "cm" number anywhere is height.
  for (const token of tokens) {
    if (token.number?.unit === 'cm') add(candidates, 'heightCm', fits('heightCm', token.number))
  }
  for (const [field, value] of Object.entries(hints) as Array<[SheetField, number]>) {
    add(candidates, field, { value, score: 0.7 })
  }

  const { values, calculated } = resolve(candidates)
  for (const field of FIELD_NAMES) {
    const value = values[field]
    if (value !== undefined && !inRange(field, value)) delete values[field]
  }
  return { values, calculated, scannedOn: readDate(tokens), isInBody }
}

/** The reader's working parts, for tests and the bench. */
export const internals = {
  prepare(words: readonly OcrWord[]) {
    const tokens = dedupe(toTokens(words))
    markRanges(tokens)
    markScales(tokens)
    const labels = withoutHistory(findLabels(tokens))
    return { tokens, labels }
  },
  candidates(words: readonly OcrWord[], pageWidth: number) {
    const { tokens, labels } = internals.prepare(words)
    const candidates = new Map<SheetField, Candidate[]>()
    rowCandidates(tokens, labels, pageWidth, candidates)
    belowCandidates(tokens, labels, pageWidth, candidates)
    scoreCandidates(tokens, labels, candidates)
    segmentRowCandidates(tokens, labels, pageWidth, candidates)
    diagramCandidates(tokens, labels, pageWidth, candidates)
    return { tokens, labels, candidates }
  },
}

export interface Region {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface Reread {
  /** Where the missing figures should be printed. */
  region: Region
  /** The label they belong to and its heading (kept with the patch's words to parse it). */
  around: Region[]
  fields: SheetField[]
}

/**
 * Where to look again: for each figure still missing whose label was found, the patch of the
 * page its value should be printed in. ocr-run.ts reads these patches enlarged, digits only.
 */
export function rereadRegions(
  words: readonly OcrWord[],
  pageWidth: number,
  pageHeight: number,
  reading: SheetReading,
): Reread[] {
  const { tokens, labels } = internals.prepare(words)
  const missing = (field: string) => reading.values[field as SheetField] === undefined
  const clamp = (r: Region): Region => ({
    x0: Math.max(0, Math.round(r.x0)),
    y0: Math.max(0, Math.round(r.y0)),
    x1: Math.min(pageWidth, Math.round(r.x1)),
    y1: Math.min(pageHeight, Math.round(r.y1)),
  })
  const rereads: Reread[] = []
  const push = (region: Region, around: Label[], fields: string[]) => {
    const wanted = fields.filter(missing) as SheetField[]
    if (wanted.length > 0) {
      rereads.push({ region: clamp(region), around: around.map(clamp), fields: wanted })
    }
  }
  for (const label of labels) {
    const { field, h } = label
    const bar = scaleRow(tokens, label) !== undefined
    if ((ROW_FIELDS as string[]).includes(field)) {
      push(
        {
          x0: label.x1 - h * 0.3,
          y0: label.cy - h * 1.2,
          x1: label.x1 + pageWidth * 0.45,
          y1: label.cy + h * (bar ? 2.2 : 1.1),
        },
        [label],
        [field],
      )
      if (COLUMN_HEADS.includes(field)) {
        push(
          { x0: label.x0 - h, y0: label.y0, x1: label.x1 + h, y1: label.y1 + h * 6 },
          [label],
          [field],
        )
      }
    } else if ((SEGMENTS as readonly string[]).includes(field)) {
      const segment = SEGMENT_FIELD[field as Segment]
      const heading = headingOf(labels, label)
      const kind = heading?.field === 'segmentalFat' ? 'fat' : 'lean'
      push(
        {
          x0: label.x1,
          y0: label.cy - h * 1.2,
          x1: label.x1 + pageWidth * 0.5,
          y1: label.cy + h * 2.4,
        },
        heading ? [label, heading] : [label],
        [`${kind}${segment}Kg`, `${kind}${segment}Pct`],
      )
    } else if (field === 'segmentalLean' || field === 'segmentalFat') {
      const kind = field === 'segmentalLean' ? 'lean' : 'fat'
      push(
        {
          x0: label.x0 - h,
          y0: label.y0,
          x1: label.x0 + pageWidth * 0.32,
          y1: label.y1 + pageWidth * 0.3,
        },
        [label],
        SEGMENTS.flatMap((s) => [`${kind}${SEGMENT_FIELD[s]}Kg`, `${kind}${SEGMENT_FIELD[s]}Pct`]),
      )
    } else if (['whr', 'vfl', 'inbodyScore', 'phaseAngle', 'heightCm', 'age'].includes(field)) {
      push(
        { x0: label.x0 - h * 2, y0: label.y0, x1: label.x1 + h * 14, y1: label.y1 + h * 7 },
        [label],
        [field],
      )
    } else if (field === 'vfaCm2') {
      push(
        { x0: label.x0 - h * 2, y0: label.y0, x1: label.x1 + h * 8, y1: label.y1 + h * 12 },
        [label],
        [field],
      )
    }
  }
  return rereads.filter(({ region: r }) => r.x1 - r.x0 > 8 && r.y1 - r.y0 > 8)
}
