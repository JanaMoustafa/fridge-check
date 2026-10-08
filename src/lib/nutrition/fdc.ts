import { z } from 'zod'
import type { Macros } from './portions'

/**
 * USDA FoodData Central (public domain): the shapes the nutrition seed reads, and how a food
 * record becomes our per-100 g values and gram weights. Pure; the seed script does the I/O.
 */

/** Nutrient numbers (the stable "number", not the database id). */
export const FDC_NUTRIENTS = {
  energyKcal: '208',
  /** Foundation foods report energy as Atwater factors instead of 208. */
  energyAtwaterSpecific: '958',
  energyAtwaterGeneral: '957',
  protein: '203',
  fat: '204',
  carbs: '205',
  fiber: '291',
} as const

const FdcNutrientSchema = z.object({
  nutrient: z.object({ number: z.string(), unitName: z.string() }),
  amount: z.number().optional(),
})

const FdcPortionSchema = z.object({
  amount: z.number().optional(),
  gramWeight: z.number(),
  modifier: z.string().optional(),
  portionDescription: z.string().optional(),
  measureUnit: z.object({ name: z.string() }).optional(),
})
export type FdcPortion = z.infer<typeof FdcPortionSchema>

export const FdcFoodSchema = z.object({
  fdcId: z.number().int().positive(),
  description: z.string(),
  dataType: z.string(),
  foodCategory: z.object({ description: z.string() }).optional(),
  foodNutrients: z.array(FdcNutrientSchema),
  foodPortions: z.array(FdcPortionSchema).optional(),
})
export type FdcFood = z.infer<typeof FdcFoodSchema>

export const FdcSearchSchema = z.object({
  foods: z.array(
    z.object({
      fdcId: z.number().int().positive(),
      description: z.string(),
      dataType: z.string(),
      foodCategory: z.string().optional(),
    }),
  ),
})

/**
 * Units a food can have a gram weight for. Volumes are kept so densities come from USDA's own
 * cup/tbsp/tsp weights; sizes and pieces are for counted lines ("2 onions" = 2 × medium).
 */
export const PORTION_KEYS = [
  'cup',
  'tbsp',
  'tsp',
  'fl-oz',
  'small',
  'medium',
  'large',
  'piece',
  'clove',
  'slice',
  'stalk',
  'leaf',
  'sprig',
  'stick',
  'head',
  'bulb',
  'can',
  'fillet',
  'strip',
  'pod',
  'sheet',
] as const
export type PortionKey = (typeof PORTION_KEYS)[number]
export type Portions = Partial<Record<PortionKey, number>>

/** USDA's wording → our key. Order matters: the first rule that matches wins. */
const PORTION_RULES: ReadonlyArray<readonly [RegExp, PortionKey]> = [
  [/^fl oz\b|^fluid ounces?\b/, 'fl-oz'],
  [/^cups?\b/, 'cup'],
  [/^(tbsp|tablespoons?)\b/, 'tbsp'],
  [/^(tsp|teaspoons?)\b/, 'tsp'],
  [/^cloves?\b/, 'clove'],
  [/^slices?\b|^rashers?\b/, 'slice'],
  [/^stalks?\b|^stems?\b/, 'stalk'],
  [/^(leaf|leaves)\b/, 'leaf'],
  [/^sprigs?\b/, 'sprig'],
  [/^sticks?\b/, 'stick'],
  [/^heads?\b/, 'head'],
  [/^bulbs?\b/, 'bulb'],
  [/^cans?\b/, 'can'],
  [/^fillets?\b/, 'fillet'],
  [/^strips?\b/, 'strip'],
  [/^pods?\b/, 'pod'],
  [/^sheets?\b/, 'sheet'],
  [/^(links?|rolls?|patty|patties)\b/, 'piece'],
  [/\bextra large\b|\bjumbo\b/, 'large'],
  [/\blarge\b/, 'large'],
  [/\bmedium\b/, 'medium'],
  [/\bsmall\b/, 'small'],
  [/^(piece|whole|item|each|fruit|egg|serving)\b/, 'piece'],
]

/** Measures that are never "one of the food", whatever word follows them. */
const NOT_A_PIECE = /^(oz|ounces?|package|container|serving|nlea|unit|cubic|wedge|pat|lb|g)\b/

/** "Leeks" → "leek", "Tomatoes" → "tomato": enough to match "1 leek" to "Leeks, raw". */
function singular(word: string): string {
  return word.replace(/(oes|es|s)$/, (end) => (end === 'oes' ? 'o' : end === 'es' ? 'e' : ''))
}

/**
 * "cup, chopped" / measureUnit "cup" / "1 large (3-1/8\" dia)" → the key, or undefined. USDA
 * often weighs one of the food by its own name ("1 leek", "1 tortilla", "1 avocado, NS as to
 * Florida or California"): with the food's description, that counts as a piece.
 */
export function portionKey(portion: FdcPortion, description = ''): PortionKey | undefined {
  const unit = portion.measureUnit?.name
  const text = (
    unit && unit !== 'undetermined' ? unit : (portion.modifier ?? portion.portionDescription ?? '')
  )
    .toLowerCase()
    .replace(/^\d+(\.\d+)?\s*/, '')
    .trim()
  const ruled = PORTION_RULES.find(([pattern]) => pattern.test(text))?.[1]
  if (ruled !== undefined || NOT_A_PIECE.test(text)) return ruled
  const first = /^[a-z]+/.exec(text)?.[0]
  const words = new Set((description.toLowerCase().match(/[a-z]+/g) ?? []).map(singular))
  return first !== undefined && words.has(singular(first)) ? 'piece' : undefined
}

/**
 * Grams for one of each unit, in USDA's own order (its first portion of a kind is the usual
 * one: "cup, chopped" before "cup, sliced"). Portions with no amount or weight are skipped.
 */
export function extractPortions(food: FdcFood): Portions {
  const portions: Portions = {}
  for (const portion of food.foodPortions ?? []) {
    const key = portionKey(portion, food.description)
    const amount = portion.amount ?? 1
    if (!key || key in portions || !(amount > 0) || !(portion.gramWeight > 0)) continue
    portions[key] = Math.round((portion.gramWeight / amount) * 100) / 100
  }
  return portions
}

function nutrient(food: FdcFood, number: string): number | undefined {
  const entry = food.foodNutrients.find((item) => item.nutrient.number === number)
  return entry?.amount
}

/**
 * Per-100 g energy (kcal), protein, fat, carbs and fiber. FoodData Central reports nutrients
 * per 100 g for these data types. Throws when energy or a macro is missing: a food without
 * them cannot be used, and leaving it at 0 would be inventing a value.
 */
export function extractPer100g(food: FdcFood): Macros {
  const kcal =
    nutrient(food, FDC_NUTRIENTS.energyKcal) ??
    nutrient(food, FDC_NUTRIENTS.energyAtwaterSpecific) ??
    nutrient(food, FDC_NUTRIENTS.energyAtwaterGeneral)
  const proteinG = nutrient(food, FDC_NUTRIENTS.protein)
  const fatG = nutrient(food, FDC_NUTRIENTS.fat)
  const carbsG = nutrient(food, FDC_NUTRIENTS.carbs)
  const missing = Object.entries({ kcal, proteinG, fatG, carbsG })
    .filter(([, value]) => value === undefined)
    .map(([name]) => name)
  if (missing.length > 0) {
    throw new Error(`FDC ${food.fdcId} (${food.description}) has no ${missing.join(', ')}`)
  }
  const fiberG = nutrient(food, FDC_NUTRIENTS.fiber)
  return {
    kcal: kcal!,
    proteinG: proteinG!,
    fatG: fatG!,
    carbsG: carbsG!,
    ...(fiberG === undefined ? {} : { fiberG }),
  }
}
