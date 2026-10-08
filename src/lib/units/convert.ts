import type { Unit } from './parse-measure'

/**
 * Metric ↔ US-customary ("imperial" in the UI) display conversion for cleanly parsed measures.
 * Only mass ↔ mass and volume ↔ volume convert; counts, containers and pinches have no
 * counterpart and return null so the UI shows the source measure verbatim.
 *
 * Rounding rule (results only; an amount already in the wanted system is returned untouched):
 * - metric: 2 significant figures (28.35 g → 28 g, 113.4 g → 110 g, 473 ml → 470 ml), but the
 *   nearest 0.5 below 10 (4.4 ml → 4.5 ml); 1000 g / ml and up switch to kg / l (1361 g → 1.4 kg).
 * - US customary: the nearest kitchen fraction the unit is measured in (cups ¼ ⅓ ½ ⅔ ¾, spoons
 *   ⅛ ¼ ½ ¾ tsp and ½ tbsp, oz and lb in quarters), whole numbers from 10 up.
 * - If the rounded amount is more than 25 % off the exact one (2 g is not "¼ oz"), the conversion
 *   is refused (null) rather than shown wrong.
 */

export type UnitSystem = 'metric' | 'imperial'

export interface Quantity {
  amount: number
  unit: Unit
}

/** Grams per unit. */
export const GRAMS: Partial<Record<Unit, number>> = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  oz: 28.349523125,
  lb: 453.59237,
}

/**
 * Millilitres per unit. Cup, spoons and fl oz use the US labelling values (240 / 15 / 5 / 30 ml)
 * so a cup reads 240 ml, not 236.6 ml. TheMealDB's pints are in British recipes (568 ml, the
 * imperial pint); its quarts and gallons are in American ones.
 */
export const MILLILITRES: Partial<Record<Unit, number>> = {
  ml: 1,
  cl: 10,
  dl: 100,
  l: 1000,
  tsp: 5,
  tbsp: 15,
  'fl oz': 30,
  cup: 240,
  pint: 568,
  quart: 946,
  gallon: 3785,
}

const METRIC: ReadonlySet<Unit> = new Set(['mg', 'g', 'kg', 'ml', 'cl', 'dl', 'l'])

/** Spoons are used by metric and US cooks alike, so they never convert. */
const SPOONS: ReadonlySet<Unit> = new Set(['tsp', 'tbsp'])

/** Fractions each US-customary unit is measured in (cups and spoons: the standard sets). */
const KITCHEN_FRACTIONS = {
  tsp: [1 / 8, 1 / 4, 1 / 2, 3 / 4],
  tbsp: [1 / 2],
  cup: [1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4],
  oz: [1 / 4, 1 / 2, 3 / 4],
  lb: [1 / 4, 1 / 2, 3 / 4],
} as const satisfies Partial<Record<Unit, readonly number[]>>

type CustomaryTarget = keyof typeof KITCHEN_FRACTIONS

const MAX_ROUNDING_ERROR = 0.25

function roundMetric(value: number): number {
  if (value < 10) return Math.round(value * 2) / 2
  const step = 10 ** (Math.floor(Math.log10(value)) - 1)
  return Math.round(value / step) * step
}

function roundCustomary(value: number, unit: CustomaryTarget): number {
  if (value >= 10) return Math.round(value)
  const whole = Math.floor(value)
  let best = whole + 1
  for (const fraction of [0, ...KITCHEN_FRACTIONS[unit]]) {
    const candidate = whole + fraction
    if (candidate > 0 && Math.abs(candidate - value) < Math.abs(best - value)) best = candidate
  }
  return best
}

function toMetric(base: number, mass: boolean): Quantity {
  const rounded = roundMetric(base)
  if (rounded >= 1000) return { amount: rounded / 1000, unit: mass ? 'kg' : 'l' }
  return { amount: rounded, unit: mass ? 'g' : 'ml' }
}

function toCustomaryMass(grams: number): Quantity {
  const ounces = roundCustomary(grams / (GRAMS.oz as number), 'oz')
  if (ounces < 16) return { amount: ounces, unit: 'oz' }
  return { amount: roundCustomary(grams / (GRAMS.lb as number), 'lb'), unit: 'lb' }
}

function toCustomaryVolume(millilitres: number): Quantity {
  // Under a tablespoon in teaspoons, under ¼ cup in tablespoons, then cups.
  const unit: CustomaryTarget = millilitres < 15 ? 'tsp' : millilitres < 60 ? 'tbsp' : 'cup'
  return { amount: roundCustomary(millilitres / (MILLILITRES[unit] as number), unit), unit }
}

/**
 * `amount unit` in the wanted system, rounded for display, or null when the unit has no
 * counterpart (counts, containers, pinches, lengths) or no kitchen amount is close enough.
 */
export function toUnitSystem(amount: number, unit: Unit, system: UnitSystem): Quantity | null {
  const grams = GRAMS[unit]
  const millilitres = MILLILITRES[unit]
  if (!(amount > 0) || (grams === undefined && millilitres === undefined)) return null
  if (SPOONS.has(unit) || METRIC.has(unit) === (system === 'metric')) return { amount, unit }

  const mass = grams !== undefined
  const base = amount * (grams ?? (millilitres as number))
  const converted =
    system === 'metric'
      ? toMetric(base, mass)
      : mass
        ? toCustomaryMass(base)
        : toCustomaryVolume(base)
  const factor = (mass ? GRAMS : MILLILITRES)[converted.unit] as number
  const error = Math.abs(converted.amount * factor - base) / base
  return error > MAX_ROUNDING_ERROR ? null : converted
}

/** Glyphs for the fractions recipes use; anything else is written as a decimal. */
const FRACTION_GLYPHS: ReadonlyArray<readonly [number, string]> = [
  [1 / 8, '⅛'],
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [3 / 8, '⅜'],
  [1 / 2, '½'],
  [5 / 8, '⅝'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
  [7 / 8, '⅞'],
]

/** How close a fractional part must be to a glyph's value ("0.333" is ⅓, "0.3" is not). */
const GLYPH_TOLERANCE = 0.01

/** Up to two decimals, no trailing zeros, Western digits: 1.5 → "1.5", 2 → "2", 0.125 → "0.13". */
function formatDecimal(value: number): string {
  return String(Math.round(value * 100) / 100)
}

/**
 * Display text for an amount, in Western digits in both locales. Kitchen fractions become glyphs
 * (0.5 → "½", 1.25 → "1¼", 0.333 → "⅓"); other amounts are decimals (1.4 → "1.4"). Metric units
 * always use decimals ("2.5 ml", "1.5 kg"), as metric recipes do.
 */
export function formatAmount(amount: number, unit?: Unit): string {
  if (unit !== undefined && METRIC.has(unit)) return formatDecimal(amount)
  const whole = Math.floor(amount)
  const part = amount - whole
  if (part < GLYPH_TOLERANCE) return String(whole)
  if (part > 1 - GLYPH_TOLERANCE) return String(whole + 1)
  const glyph = FRACTION_GLYPHS.find(([value]) => Math.abs(part - value) < GLYPH_TOLERANCE)
  if (glyph === undefined) return formatDecimal(amount)
  return whole === 0 ? glyph[1] : `${whole}${glyph[1]}`
}
