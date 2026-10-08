/**
 * A recipe's ingredient lines → weights in grams → nutrition, using the USDA foods in
 * data/nutrition/foods.json. Nothing is guessed: a line is converted only through a weight USDA
 * publishes (or a standard unit definition); otherwise it is reported, and a recipe with a
 * significant line that cannot be weighed is "incomplete" rather than shown with wrong numbers.
 * Pure: the foods are passed in.
 */
import { GRAMS, MILLILITRES } from '@/lib/units/convert'
import { isUnit, type Unit } from '@/lib/units/parse-measure'
import type { Ingredient } from '@/types/recipe'
import type { FoodValues, NutritionFood, NutritionFoods } from './data-files'
import type { PortionKey } from './fdc'
import type { NutritionLine } from './portions'

/** USDA measures volumes in US customary units. */
const USDA_ML: Readonly<Record<'cup' | 'tbsp' | 'tsp' | 'fl-oz', number>> = {
  cup: 236.588,
  tbsp: 14.787,
  tsp: 4.929,
  'fl-oz': 29.574,
}

/** Standard culinary definitions, as fractions of a teaspoon. */
const TSP_FRACTION: Partial<Record<Unit, number>> = { pinch: 1 / 16, dash: 1 / 8 }

/** Our units that USDA weighs as a portion of the food itself. */
const PORTION_UNITS: Partial<Record<Unit, PortionKey>> = {
  clove: 'clove',
  slice: 'slice',
  rasher: 'slice',
  stalk: 'stalk',
  leaf: 'leaf',
  sprig: 'sprig',
  stick: 'stick',
  head: 'head',
  bulb: 'bulb',
  fillet: 'fillet',
  strip: 'strip',
  pod: 'pod',
  piece: 'piece',
  sheet: 'sheet',
}

/**
 * A counted line is one of the food: "2 onions" = 2 medium, unless USDA only has another size;
 * then the natural unit of foods counted in parts ("3 garlic" = 3 cloves, "4 bacon" = 4 slices,
 * "4 filo pastry" = 4 sheets).
 */
const COUNT_PORTIONS: readonly PortionKey[] = [
  'medium',
  'piece',
  'large',
  'small',
  'clove',
  'slice',
  'sheet',
]

/** Loose amounts with no fixed size: when they cannot be weighed they count as a small amount. */
const LOOSE_UNITS: ReadonlySet<string> = new Set([
  'pinch',
  'dash',
  'drop',
  'splash',
  'drizzle',
  'sprinkle',
  'knob',
  'sprig',
  'leaf',
])

/** A dusting of flour or a greased tin: a small amount, whatever the ingredient. */
const SMALL_AMOUNT_WORDS = /\b(dusting|for dusting|to dust|for greasing|to grease)\b/i

/** Accompaniments named in the line ("to serve", "for garnish") are not part of the dish. */
const SERVED_ON_THE_SIDE = /\b(to serve|for serving|serve with|to garnish|for garnish|optional)\b/i

/** "1 (400g) tin" / "400ml can": the package size printed in the line. */
const PACKAGE_SIZE = /(\d+(?:\.\d+)?)\s*(g|kg|ml|oz)\b/i

/** Packages weighed by the size printed in the line (cans also by USDA's can weight). */
const CONTAINER_UNITS: ReadonlySet<Unit> = new Set([
  'can',
  'tin',
  'jar',
  'bottle',
  'packet',
  'bag',
  'tub',
  'pot',
])

/**
 * Oil to fry in is mostly left in the pan; how much the food absorbs is not knowable from the
 * recipe. It is left out and the page says so (the real numbers are higher).
 */
const FRYING = /\b(fry|frying|deep[- ]fry|deep[- ]frying)\b/i

/** Below this many kcal per 100 g, an unmeasured line counts as a small amount (herbs, water). */
const LOW_ENERGY_KCAL_PER_100G = 50

/** Words that mean the line uses another form of the ingredient than its main USDA food. */
const VARIANT_WORDS = {
  canned: /\b(cans?|canned|tins?|tinned)\b/i,
  dried: /\b(dried|desiccated|sun-dried)\b/i,
} as const

/**
 * The most an ingredient with no USDA food (a spice blend, a flavouring) may be used in for it to
 * count as a small amount: 1 tbsp, 2 tbsp, 15 g; pinches, dashes, leaves and sprigs always.
 */
const SMALL_AMOUNT_LIMIT: Partial<Record<Unit, number>> = {
  pinch: Infinity,
  dash: Infinity,
  drop: Infinity,
  sprinkle: Infinity,
  leaf: 10,
  sprig: 10,
  pod: 10,
  tsp: 3,
  tbsp: 2,
  g: 15,
}

/** Why a line has no weight: no amount, a unit with no fixed size, or no USDA weight for it. */
export type NotMeasured = 'no-amount' | 'unknown-unit' | 'no-usda-weight'

export type LineWeight = { grams: number } | { notMeasured: NotMeasured }

/** Grams per millilitre, from the first USDA volume weight available. */
export function densityOf(food: Pick<FoodValues, 'portions'>): number | undefined {
  for (const unit of ['cup', 'tbsp', 'tsp', 'fl-oz'] as const) {
    const grams = food.portions[unit]
    if (grams !== undefined) return grams / USDA_ML[unit]
  }
  return undefined
}

/** The printed package size in grams; millilitres go through the food's USDA density. */
function packageGrams(raw: string, food: Pick<FoodValues, 'portions'>): number | undefined {
  const match = PACKAGE_SIZE.exec(raw)
  if (!match) return undefined
  const size = Number(match[1])
  const unit = match[2]!.toLowerCase()
  if (unit === 'ml') {
    const density = densityOf(food)
    return density === undefined ? undefined : size * density
  }
  return size * (unit === 'kg' ? 1000 : unit === 'oz' ? GRAMS.oz! : 1)
}

/** The weight of one ingredient line, or why it cannot be weighed. */
export function lineWeight(line: Ingredient, food: Pick<FoodValues, 'portions'>): LineWeight {
  const { amount, unit, raw } = line
  const parsedUnit = unit !== undefined && isUnit(unit) ? unit : undefined
  if (unit !== undefined && parsedUnit === undefined) return { notMeasured: 'unknown-unit' }

  if (parsedUnit === undefined) {
    if (amount === undefined) return { notMeasured: 'no-amount' }
    const each = COUNT_PORTIONS.map((key) => food.portions[key]).find((g) => g !== undefined)
    return each === undefined ? { notMeasured: 'no-usda-weight' } : { grams: amount * each }
  }

  const count = amount ?? (TSP_FRACTION[parsedUnit] !== undefined ? 1 : undefined)
  if (count === undefined) return { notMeasured: 'no-amount' }

  const mass = GRAMS[parsedUnit]
  if (mass !== undefined) return { grams: count * mass }

  const fraction = TSP_FRACTION[parsedUnit]
  if (fraction !== undefined) {
    const density = densityOf(food)
    const perTsp = food.portions.tsp ?? (density === undefined ? undefined : density * USDA_ML.tsp)
    return perTsp === undefined
      ? { notMeasured: 'no-usda-weight' }
      : { grams: count * fraction * perTsp }
  }

  const ml = MILLILITRES[parsedUnit]
  if (ml !== undefined) {
    // Spoons and cups: USDA's own weight for that measure; other volumes through its density.
    const own =
      parsedUnit === 'fl oz' ? food.portions['fl-oz'] : food.portions[parsedUnit as PortionKey]
    if (own !== undefined) return { grams: count * own }
    const density = densityOf(food)
    return density === undefined
      ? { notMeasured: 'no-usda-weight' }
      : { grams: count * ml * density }
  }

  if (CONTAINER_UNITS.has(parsedUnit)) {
    const each =
      packageGrams(raw, food) ??
      (parsedUnit === 'can' || parsedUnit === 'tin' ? food.portions.can : undefined)
    return each === undefined ? { notMeasured: 'no-usda-weight' } : { grams: count * each }
  }

  const portion = PORTION_UNITS[parsedUnit]
  if (portion !== undefined) {
    const each = food.portions[portion]
    return each === undefined ? { notMeasured: 'no-usda-weight' } : { grams: count * each }
  }
  return { notMeasured: 'unknown-unit' }
}

export interface UncountedLine {
  raw: string
  name: string
  /**
   * small-amount, served-separately and frying-oil do not affect completeness (frying-oil adds a
   * warning that the real numbers are higher); the others do.
   */
  reason: 'small-amount' | 'served-separately' | 'frying-oil' | 'no-usda-food' | NotMeasured
}

export interface RecipeNutrition {
  /** Lines with a weight and USDA values, ready for recipeTotals / planPortion. */
  lines: NutritionLine[]
  /** Lines left out: listed under the numbers so the user knows what is not included. */
  uncounted: UncountedLine[]
  /** False when a line that may matter could not be weighed: the numbers are then not shown. */
  complete: boolean
}

/** Herbs, spices and near-zero-energy foods: leaving an unmeasured pinch out changes nothing. */
function isMinor(food: FoodValues): boolean {
  return food.category === 'Spices and Herbs' || food.per100g.kcal <= LOW_ENERGY_KCAL_PER_100G
}

/** The food for this line: its canned or dried variant when the line names that form. */
export function foodForLine(food: NutritionFood, raw: string): FoodValues {
  for (const [variant, words] of Object.entries(VARIANT_WORDS) as Array<
    [keyof typeof VARIANT_WORDS, RegExp]
  >) {
    const alternative = food.variants?.[variant]
    if (alternative && words.test(raw)) return alternative
  }
  return food
}

/** Unmeasured, or measured within SMALL_AMOUNT_LIMIT. */
export function isSmallAmount({ amount, unit }: Ingredient): boolean {
  if (unit === undefined) return amount === undefined
  const limit = isUnit(unit) ? SMALL_AMOUNT_LIMIT[unit] : undefined
  return limit !== undefined && (amount ?? 1) <= limit
}

export type NutritionData = Pick<NutritionFoods, 'foods' | 'minorWithoutFood'>

const NOT_BLOCKING: ReadonlySet<UncountedLine['reason']> = new Set([
  'small-amount',
  'served-separately',
  'frying-oil',
])

export function recipeNutrition(
  ingredients: readonly Ingredient[],
  { foods, minorWithoutFood }: NutritionData,
): RecipeNutrition {
  const lines: NutritionLine[] = []
  const uncounted: UncountedLine[] = []
  for (const ingredient of ingredients) {
    const { raw, name } = ingredient
    if (SERVED_ON_THE_SIDE.test(raw)) {
      uncounted.push({ raw, name, reason: 'served-separately' })
      continue
    }
    const entry = Object.hasOwn(foods, name) ? foods[name] : undefined
    if (entry === undefined) {
      const small = minorWithoutFood.includes(name) && isSmallAmount(ingredient)
      uncounted.push({ raw, name, reason: small ? 'small-amount' : 'no-usda-food' })
      continue
    }
    const food = foodForLine(entry, raw)
    if (FRYING.test(raw) && (food.category === 'Fats and Oils' || name.endsWith('oil'))) {
      uncounted.push({ raw, name, reason: 'frying-oil' })
      continue
    }
    const weight = lineWeight(ingredient, food)
    if ('grams' in weight) {
      lines.push({ name, grams: weight.grams, per100g: food.per100g })
      continue
    }
    const small =
      isMinor(food) ||
      SMALL_AMOUNT_WORDS.test(raw) ||
      (ingredient.unit !== undefined && LOOSE_UNITS.has(ingredient.unit))
    uncounted.push({ raw, name, reason: small ? 'small-amount' : weight.notMeasured })
  }
  const complete = lines.length > 0 && uncounted.every((line) => NOT_BLOCKING.has(line.reason))
  return { lines, uncounted, complete }
}
