/**
 * Personalized portions: how much of a recipe fits one meal of the user's day. The whole recipe
 * is scaled by one factor so it keeps its proportions (scaling ingredients separately to hit every
 * macro would change the dish); the macros that follow are shown against the daily targets.
 * Pure: no I/O.
 */
import { KCAL_PER_GRAM, type NutritionTargets } from './calculator'

export const MEALS = ['breakfast', 'lunch', 'dinner', 'snacks'] as const
export type Meal = (typeof MEALS)[number]

/** Percent of the day's calories per meal; whole numbers adding up to 100. */
export type MealSplit = Record<Meal, number>

export const DEFAULT_MEAL_SPLIT: Readonly<MealSplit> = {
  breakfast: 25,
  lunch: 35,
  dinner: 30,
  snacks: 10,
}

/** Portions are rounded to this many grams; anything less is shown as a small amount. */
export const PORTION_ROUNDING_G = 5

export interface Macros {
  kcal: number
  proteinG: number
  fatG: number
  carbsG: number
  /** Unknown for some foods; then left out of the totals rather than counted as zero. */
  fiberG?: number
}

/** One recipe line with its weight in the whole recipe and its food's values per 100 g. */
export interface NutritionLine {
  name: string
  grams: number
  per100g: Macros
}

export function isValidMealSplit(split: Readonly<Record<string, unknown>>): split is MealSplit {
  const values = MEALS.map((meal) => split[meal])
  return (
    Object.keys(split).length === MEALS.length &&
    values.every((value) => Number.isInteger(value) && (value as number) >= 0) &&
    values.reduce((sum: number, value) => sum + (value as number), 0) === 100
  )
}

/** The values for `grams` of a food. */
export function macrosFor(grams: number, per100g: Macros): Macros {
  const factor = grams / 100
  return {
    kcal: per100g.kcal * factor,
    proteinG: per100g.proteinG * factor,
    fatG: per100g.fatG * factor,
    carbsG: per100g.carbsG * factor,
    ...(per100g.fiberG === undefined ? {} : { fiberG: per100g.fiberG * factor }),
  }
}

/** Sum of the lines; fiber only when every line knows it. */
export function sumMacros(items: readonly Macros[]): Macros {
  const total: Macros = { kcal: 0, proteinG: 0, fatG: 0, carbsG: 0 }
  let fiber: number | undefined = 0
  for (const item of items) {
    total.kcal += item.kcal
    total.proteinG += item.proteinG
    total.fatG += item.fatG
    total.carbsG += item.carbsG
    fiber = fiber === undefined || item.fiberG === undefined ? undefined : fiber + item.fiberG
  }
  return fiber === undefined || items.length === 0 ? total : { ...total, fiberG: fiber }
}

export function recipeTotals(lines: readonly NutritionLine[]): Macros {
  return sumMacros(lines.map((line) => macrosFor(line.grams, line.per100g)))
}

/** Per serving, for recipes that state how many they serve. */
export function perServing(totals: Macros, servings: number): Macros {
  return macrosFor(100 / servings, totals)
}

/** Nearest 5 g; amounts under 5 g are kept to the gram (a pinch of spice is not 0 g). */
export function roundPortionGrams(grams: number): { grams: number; small: boolean } {
  if (grams < PORTION_ROUNDING_G) return { grams: Math.max(1, Math.round(grams)), small: true }
  return { grams: Math.round(grams / PORTION_ROUNDING_G) * PORTION_ROUNDING_G, small: false }
}

export interface PortionLine {
  name: string
  /** Weight in the whole recipe. */
  recipeGrams: number
  /** What this user should eat, rounded. */
  grams: number
  /** Under 5 g: shown as "a little" next to the gram figure. */
  small: boolean
  macros: Macros
}

export interface PortionPlan {
  meal: Meal
  /** Calories this meal should bring, from the daily target and the meal split. */
  budgetKcal: number
  /** Share of the whole recipe this portion is (1 = the whole recipe). */
  scale: number
  lines: PortionLine[]
  /** The portion's values, from the rounded grams the user is told to eat. */
  totals: Macros
  /** The portion as a share (0–1+) of each daily target. */
  ofDaily: { kcal: number; proteinG: number; fatG: number; carbsG: number }
}

/**
 * The portion of a recipe that fits one meal: scale = meal budget ÷ recipe calories, each line
 * scaled and rounded, totals recomputed from the rounded grams (so numbers match what is shown).
 * Null when the recipe has no calories to scale by.
 */
export function planPortion(
  lines: readonly NutritionLine[],
  targets: Pick<NutritionTargets, 'calorieTargetKcal' | 'proteinG' | 'fatG' | 'carbsG'>,
  split: MealSplit,
  meal: Meal,
): PortionPlan | null {
  const recipeKcal = recipeTotals(lines).kcal
  if (!(recipeKcal > 0)) return null
  const budgetKcal = (targets.calorieTargetKcal * split[meal]) / 100
  const scale = budgetKcal / recipeKcal
  const portionLines = lines.map((line) => {
    const rounded = roundPortionGrams(line.grams * scale)
    return {
      name: line.name,
      recipeGrams: line.grams,
      ...rounded,
      macros: macrosFor(rounded.grams, line.per100g),
    }
  })
  const totals = sumMacros(portionLines.map((line) => line.macros))
  const share = (value: number, target: number) => (target > 0 ? value / target : 0)
  return {
    meal,
    budgetKcal,
    scale,
    lines: portionLines,
    totals,
    ofDaily: {
      kcal: share(totals.kcal, targets.calorieTargetKcal),
      proteinG: share(totals.proteinG, targets.proteinG),
      fatG: share(totals.fatG, targets.fatG),
      carbsG: share(totals.carbsG, targets.carbsG),
    },
  }
}

/** Energy from the three macros (Atwater), for checking a food's values are consistent. */
export function atwaterKcal({ proteinG, fatG, carbsG }: Macros): number {
  return proteinG * KCAL_PER_GRAM.protein + fatG * KCAL_PER_GRAM.fat + carbsG * KCAL_PER_GRAM.carbs
}
