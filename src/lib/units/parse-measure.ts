/**
 * TheMealDB strMeasure → amount and canonical unit. Measures are free text ("1 ½ tbsp",
 * "50g/1¾oz", "1 (400g) tin", "2-3 tbsp", "Juice of 1"), so the parser reads only the leading
 * amount and the unit right after it and ignores everything else. Anything it cannot read with
 * certainty comes back as {} and the UI shows the measure verbatim: it never guesses.
 */

export const UNITS = [
  // Mass
  'mg',
  'g',
  'kg',
  'oz',
  'lb',
  // Volume
  'ml',
  'cl',
  'dl',
  'l',
  'tsp',
  'tbsp',
  'fl oz',
  'cup',
  'pint',
  'quart',
  'gallon',
  // Length ("3cm piece" of ginger)
  'cm',
  'inch',
  // Small, loose amounts
  'pinch',
  'dash',
  'drop',
  'splash',
  'drizzle',
  'sprinkle',
  'knob',
  'handful',
  'scoop',
  'shot',
  // Containers
  'can',
  'tin',
  'jar',
  'bottle',
  'packet',
  'bag',
  'tub',
  'pot',
  // Portions
  'clove',
  'slice',
  'piece',
  'bunch',
  'sprig',
  'stick',
  'stalk',
  'leaf',
  'sheet',
  'head',
  'bulb',
  'fillet',
  'rasher',
  'strip',
  'pod',
  'floret',
  'cube',
  'part',
] as const

export type Unit = (typeof UNITS)[number]

export interface ParsedMeasure {
  /** Always > 0 when present. */
  amount?: number
  unit?: Unit
}

const UNIT_SET: ReadonlySet<string> = new Set(UNITS)

export function isUnit(value: string): value is Unit {
  return UNIT_SET.has(value)
}

/** Every spelling seen in TheMealDB (lowercase, trailing "." removed) → its unit. */
const UNIT_ALIASES: Readonly<Record<string, Unit>> = {
  mg: 'mg',
  milligram: 'mg',
  milligrams: 'mg',
  g: 'g',
  gr: 'g',
  grs: 'g',
  gm: 'g',
  gms: 'g',
  gram: 'g',
  grams: 'g',
  gramme: 'g',
  grammes: 'g',
  kg: 'kg',
  kgs: 'kg',
  kilo: 'kg',
  kilos: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  oz: 'oz',
  ozs: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  lb: 'lb',
  lbs: 'lb',
  pound: 'lb',
  pounds: 'lb',
  ml: 'ml',
  mls: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  cl: 'cl',
  dl: 'dl',
  l: 'l',
  ltr: 'l',
  litre: 'l',
  litres: 'l',
  liter: 'l',
  liters: 'l',
  tsp: 'tsp',
  tsps: 'tsp',
  tspn: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  teaspoonful: 'tsp',
  teaspoonfuls: 'tsp',
  tbsp: 'tbsp',
  tbsps: 'tbsp',
  tbs: 'tbsp',
  tbl: 'tbsp',
  tbls: 'tbsp',
  tblsp: 'tbsp',
  tblspn: 'tbsp',
  tbspn: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tablespoonful: 'tbsp',
  tablespoonfuls: 'tbsp',
  floz: 'fl oz',
  cup: 'cup',
  cups: 'cup',
  pint: 'pint',
  pints: 'pint',
  pt: 'pint',
  quart: 'quart',
  quarts: 'quart',
  qt: 'quart',
  gallon: 'gallon',
  gallons: 'gallon',
  gal: 'gallon',
  cm: 'cm',
  inch: 'inch',
  inches: 'inch',
  pinch: 'pinch',
  pinches: 'pinch',
  dash: 'dash',
  dashes: 'dash',
  drop: 'drop',
  drops: 'drop',
  splash: 'splash',
  splashes: 'splash',
  drizzle: 'drizzle',
  sprinkle: 'sprinkle',
  sprinkling: 'sprinkle',
  sprinking: 'sprinkle',
  spinkling: 'sprinkle',
  knob: 'knob',
  knobs: 'knob',
  handful: 'handful',
  handfuls: 'handful',
  handfull: 'handful',
  handfulls: 'handful',
  scoop: 'scoop',
  scoops: 'scoop',
  shot: 'shot',
  shots: 'shot',
  can: 'can',
  cans: 'can',
  tin: 'tin',
  tins: 'tin',
  jar: 'jar',
  jars: 'jar',
  bottle: 'bottle',
  bottles: 'bottle',
  packet: 'packet',
  packets: 'packet',
  pack: 'packet',
  packs: 'packet',
  package: 'packet',
  packages: 'packet',
  pkg: 'packet',
  pkt: 'packet',
  sachet: 'packet',
  sachets: 'packet',
  envelope: 'packet',
  envelopes: 'packet',
  bag: 'bag',
  bags: 'bag',
  tub: 'tub',
  tubs: 'tub',
  pot: 'pot',
  pots: 'pot',
  clove: 'clove',
  cloves: 'clove',
  slice: 'slice',
  slices: 'slice',
  piece: 'piece',
  pieces: 'piece',
  bunch: 'bunch',
  bunches: 'bunch',
  sprig: 'sprig',
  sprigs: 'sprig',
  stick: 'stick',
  sticks: 'stick',
  stalk: 'stalk',
  stalks: 'stalk',
  leaf: 'leaf',
  leaves: 'leaf',
  sheet: 'sheet',
  sheets: 'sheet',
  head: 'head',
  heads: 'head',
  bulb: 'bulb',
  bulbs: 'bulb',
  fillet: 'fillet',
  fillets: 'fillet',
  rasher: 'rasher',
  rashers: 'rasher',
  strip: 'strip',
  strips: 'strip',
  pod: 'pod',
  pods: 'pod',
  floret: 'floret',
  florets: 'floret',
  cube: 'cube',
  cubes: 'cube',
  part: 'part',
  parts: 'part',
}

/** Size words that may stand between the amount and the unit ("2 large cloves", "1 heaped tsp"). */
const SIZE_WORDS: ReadonlySet<string> = new Set([
  'heaped',
  'heaping',
  'level',
  'rounded',
  'scant',
  'generous',
  'good',
  'large',
  'small',
  'medium',
  'big',
  'little',
  'thick',
  'thin',
  'fresh',
  'whole',
])

/** Approximations dropped from the front ("about 2 cups"). */
const APPROXIMATIONS = /^(?:about|approx\.?|approximately|around)\s+/

const VULGAR_FRACTIONS: Readonly<Record<string, string>> = {
  '½': '1/2',
  '⅓': '1/3',
  '⅔': '2/3',
  '¼': '1/4',
  '¾': '3/4',
  '⅕': '1/5',
  '⅖': '2/5',
  '⅗': '3/5',
  '⅘': '4/5',
  '⅙': '1/6',
  '⅚': '5/6',
  '⅛': '1/8',
  '⅜': '3/8',
  '⅝': '5/8',
  '⅞': '7/8',
}

/** "1 1/2", "2-1/2", "1 and 1/8" (a whole number and a proper fraction). */
const MIXED = /^(\d+)(?:\s+and\s+|\s*-\s*|\s+)(\d+)\/([1-9]\d*)(?!\d)/
const FRACTION = /^(\d+)\/([1-9]\d*)(?!\d)/
const DECIMAL = /^\d+(?:\.\d+)?/

/** A second amount after a range ("2-3", "2 to 3"), unless it sizes a unit ("1 – 14-ounce can"). */
const RANGE = /^\s*(?:-|to|or)\s*/
/** "2 x 400g", "3 400g cans": a count of packs of a stated mass or volume. */
const MULTIPLIER = /^\s*(?:[x×*]\s*)?/

const MASS_OR_VOLUME: ReadonlySet<Unit> = new Set([
  'mg',
  'g',
  'kg',
  'oz',
  'lb',
  'ml',
  'cl',
  'dl',
  'l',
  'tsp',
  'tbsp',
  'fl oz',
  'cup',
  'pint',
  'quart',
  'gallon',
])

interface Read<T> {
  value: T
  rest: string
}

interface ReadUnit extends Read<Unit> {
  /** The spelling that was read, e.g. "leaves" for leaf. */
  word: string
}

function readAmount(text: string): Read<number> | null {
  const mixed = MIXED.exec(text)
  if (mixed && Number(mixed[2]) < Number(mixed[3])) {
    return {
      value: Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]),
      rest: text.slice(mixed[0].length),
    }
  }
  const fraction = FRACTION.exec(text)
  if (fraction) {
    return {
      value: Number(fraction[1]) / Number(fraction[2]),
      rest: text.slice(fraction[0].length),
    }
  }
  const decimal = DECIMAL.exec(text)
  return decimal ? { value: Number(decimal[0]), rest: text.slice(decimal[0].length) } : null
}

/** The unit at the start of `text` ("tbsp", "lb.", "fl oz", "-ounce"), after any size words. */
function readUnit(text: string): ReadUnit | null {
  let rest = text.replace(/^-(?=[a-z])/, '')
  for (;;) {
    const fluidOunce = /^(?:fl\.?\s*oz|fluid\s+ounces?)(?![a-z])\.?/.exec(rest)
    if (fluidOunce) {
      return { value: 'fl oz', word: fluidOunce[0], rest: rest.slice(fluidOunce[0].length) }
    }
    const match = /^([a-z]+)\.?(?![a-z])/.exec(rest)
    if (!match) return null
    const word = match[1] as string
    const unit = UNIT_ALIASES[word]
    if (unit) return { value: unit, word, rest: rest.slice(match[0].length) }
    if (!SIZE_WORDS.has(word)) return null
    rest = rest.slice(match[0].length).trimStart()
  }
}

function clean(measure: string): string {
  return (
    measure
      .replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, (glyph) => ` ${VULGAR_FRACTIONS[glyph]}`)
      .replace(/\u2044/g, '/')
      .replace(/[–—\u2011]/g, '-')
      .toLowerCase()
      // A parenthetical restates the amount in another unit or adds a note: "1 (400g) tin".
      .replace(/\([^)]*\)?/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(APPROXIMATIONS, '')
  )
}

/**
 * A measure with no number: "Pinch", "a pinch" and "Small bunch" mean one; "Leaves" and "Sprigs of
 * fresh" name the unit but not how many.
 */
function parseUnitOnly(text: string): ParsedMeasure {
  const unit = readUnit(text.replace(/^an?\s+/, ''))
  if (unit === null) return {}
  return unit.word.endsWith('s') ? { unit: unit.value } : { amount: 1, unit: unit.value }
}

/** "0" or "0 g" is not an amount. */
function positive(parsed: ParsedMeasure): ParsedMeasure {
  return parsed.amount !== undefined && !(parsed.amount > 0) ? {} : parsed
}

/** strMeasure → { amount, unit }; {} when the measure does not state an amount or unit clearly. */
export function parseMeasure(measure: string): ParsedMeasure {
  const text = clean(measure)
  const first = readAmount(text)
  if (first === null) return parseUnitOnly(text)
  // "1,5" (a decimal comma) and "1,500" (a thousands separator) cannot be told apart.
  if (/^,\d/.test(first.rest)) return {}
  let amount = first.value
  let rest = first.rest

  const range = RANGE.exec(rest)
  if (range) {
    const second = readAmount(rest.slice(range[0].length))
    if (second && !/^-[a-z]/.test(second.rest)) rest = second.rest
  }

  let packSize: number | null = null
  const size = readAmount(rest.replace(MULTIPLIER, ''))
  if (size) {
    packSize = size.value
    rest = size.rest
  }

  // Letters glued to the number must be a unit ("100g"); anything else ("3rd") is not an amount.
  const glued = /^[a-z]/.test(rest)
  const unit = readUnit(rest.trimStart())
  if (glued && unit === null) return {}
  if (packSize !== null) {
    // "2 x 400g" is 800 g, but "3 x 7.5cm" meringue nests are three nests, not 22.5 cm.
    if (unit === null || !MASS_OR_VOLUME.has(unit.value)) return positive({ amount })
    amount *= packSize
  }
  return positive(unit ? { amount, unit: unit.value } : { amount })
}
