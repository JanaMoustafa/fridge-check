import { toUnitSystem, type Quantity, type UnitSystem } from './convert'
import { isUnit, type Unit } from './parse-measure'

const METRIC: ReadonlySet<Unit> = new Set(['mg', 'g', 'kg', 'ml', 'cl', 'dl', 'l'])
const US: ReadonlySet<Unit> = new Set(['oz', 'lb', 'cup', 'fl oz', 'pint', 'quart', 'gallon'])

/** Which system a unit belongs to; spoons, counts and containers belong to neither. */
export function systemOf(unit: Unit): UnitSystem | null {
  if (METRIC.has(unit)) return 'metric'
  if (US.has(unit)) return 'imperial'
  return null
}

/**
 * The converted quantity to show next to a recipe line, or null when the line is already in the
 * preferred system, has no clean amount/unit, or cannot be converted honestly.
 */
export function convertForDisplay(
  line: { amount?: number; unit?: string },
  preferred: UnitSystem,
): Quantity | null {
  if (line.amount === undefined || line.unit === undefined || !isUnit(line.unit)) return null
  const system = systemOf(line.unit)
  if (system === null || system === preferred) return null
  const converted = toUnitSystem(line.amount, line.unit, preferred)
  return converted && converted.unit !== line.unit ? converted : null
}

/** Message key for a unit label ("fl oz" → "fl-oz"). */
export function unitMessageKey(unit: Unit): string {
  return unit.replace(/\s+/g, '-')
}
