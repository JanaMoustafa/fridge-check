import { describe, expect, it } from 'vitest'
import {
  atwaterKcal,
  DEFAULT_MEAL_SPLIT,
  isValidMealSplit,
  macrosFor,
  perServing,
  planPortion,
  recipeTotals,
  roundPortionGrams,
  sumMacros,
  type NutritionLine,
} from './portions'

// Per-100 g values in the style of USDA FoodData Central (illustrative, round numbers).
const rice: NutritionLine = {
  name: 'rice',
  grams: 400,
  per100g: { kcal: 130, proteinG: 2.7, fatG: 0.3, carbsG: 28, fiberG: 0.4 },
}
const chicken: NutritionLine = {
  name: 'chicken breast',
  grams: 500,
  per100g: { kcal: 165, proteinG: 31, fatG: 3.6, carbsG: 0, fiberG: 0 },
}
const oil: NutritionLine = {
  name: 'olive oil',
  grams: 27,
  per100g: { kcal: 884, proteinG: 0, fatG: 100, carbsG: 0, fiberG: 0 },
}
const cumin: NutritionLine = {
  name: 'cumin',
  grams: 4,
  per100g: { kcal: 375, proteinG: 18, fatG: 22, carbsG: 44, fiberG: 11 },
}
const RECIPE = [rice, chicken, oil, cumin]

const targets = { calorieTargetKcal: 2000, proteinG: 120, fatG: 60, carbsG: 245 }

describe('macros', () => {
  it('scales per-100 g values to a weight', () => {
    expect(macrosFor(200, rice.per100g)).toEqual({
      kcal: 260,
      proteinG: 5.4,
      fatG: 0.6,
      carbsG: 56,
      fiberG: 0.8,
    })
  })

  it('sums a recipe, leaving fiber out when any line lacks it', () => {
    const totals = recipeTotals(RECIPE)
    expect(totals.kcal).toBeCloseTo(520 + 825 + 238.68 + 15, 6)
    expect(totals.fiberG).toBeCloseTo(1.6 + 0 + 0 + 0.44, 6)
    const noFiber = { ...oil, per100g: { kcal: 884, proteinG: 0, fatG: 100, carbsG: 0 } }
    expect(recipeTotals([rice, noFiber]).fiberG).toBeUndefined()
    expect(sumMacros([])).toEqual({ kcal: 0, proteinG: 0, fatG: 0, carbsG: 0 })
  })

  it('divides by servings', () => {
    expect(perServing({ kcal: 1000, proteinG: 40, fatG: 20, carbsG: 100 }, 4)).toEqual({
      kcal: 250,
      proteinG: 10,
      fatG: 5,
      carbsG: 25,
    })
  })

  it('checks energy against the Atwater factors', () => {
    expect(atwaterKcal(chicken.per100g)).toBeCloseTo(31 * 4 + 3.6 * 9, 6)
  })
})

describe('meal split', () => {
  it('accepts whole percentages for all four meals adding up to 100', () => {
    expect(isValidMealSplit(DEFAULT_MEAL_SPLIT)).toBe(true)
    expect(isValidMealSplit({ breakfast: 0, lunch: 50, dinner: 50, snacks: 0 })).toBe(true)
  })

  it.each([
    ['not adding up to 100', { breakfast: 25, lunch: 35, dinner: 30, snacks: 5 }],
    ['a fraction', { breakfast: 25.5, lunch: 34.5, dinner: 30, snacks: 10 }],
    ['a negative share', { breakfast: -10, lunch: 60, dinner: 40, snacks: 10 }],
    ['a missing meal', { breakfast: 40, lunch: 30, dinner: 30 }],
    ['an extra key', { ...DEFAULT_MEAL_SPLIT, brunch: 0 }],
    ['a string', { breakfast: '25', lunch: 35, dinner: 30, snacks: 10 }],
  ])('rejects %s', (_label, split) => {
    expect(isValidMealSplit(split)).toBe(false)
  })
})

describe('roundPortionGrams', () => {
  it('rounds to the nearest 5 g', () => {
    expect(roundPortionGrams(182.4)).toEqual({ grams: 180, small: false })
    expect(roundPortionGrams(182.5)).toEqual({ grams: 185, small: false })
    expect(roundPortionGrams(5)).toEqual({ grams: 5, small: false })
  })

  it('keeps small amounts to the gram, never 0', () => {
    expect(roundPortionGrams(3.4)).toEqual({ grams: 3, small: true })
    expect(roundPortionGrams(0.2)).toEqual({ grams: 1, small: true })
  })
})

describe('planPortion', () => {
  it('scales the whole recipe to the meal budget and reports it against the day', () => {
    const plan = planPortion(RECIPE, targets, DEFAULT_MEAL_SPLIT, 'lunch')!
    const recipeKcal = recipeTotals(RECIPE).kcal
    expect(plan.budgetKcal).toBe(700) // 35 % of 2000
    expect(plan.scale).toBeCloseTo(700 / recipeKcal, 6)
    const byName = Object.fromEntries(plan.lines.map((line) => [line.name, line]))
    expect(byName['rice']).toMatchObject({ recipeGrams: 400, small: false })
    expect(byName['rice']!.grams % 5).toBe(0)
    expect(byName['rice']!.grams).toBe(Math.round((400 * plan.scale) / 5) * 5)
    expect(byName['cumin']).toMatchObject({ small: true })
    // Totals come from the rounded grams, so they stay close to (not exactly at) the budget.
    expect(Math.abs(plan.totals.kcal - 700)).toBeLessThan(30)
    expect(plan.ofDaily.kcal).toBeCloseTo(plan.totals.kcal / 2000, 6)
    expect(plan.ofDaily.proteinG).toBeCloseTo(plan.totals.proteinG / 120, 6)
  })

  it('keeps the recipe’s proportions (one factor for every line)', () => {
    const plan = planPortion([rice, chicken], targets, DEFAULT_MEAL_SPLIT, 'dinner')!
    const [r, c] = plan.lines
    expect(r!.grams / c!.grams).toBeCloseTo(400 / 500, 1)
  })

  it('gives nothing for a meal with no share, and null for a recipe with no calories', () => {
    const plan = planPortion(
      RECIPE,
      targets,
      { breakfast: 0, lunch: 50, dinner: 50, snacks: 0 },
      'breakfast',
    )!
    expect(plan.budgetKcal).toBe(0)
    expect(plan.lines.every((line) => line.small)).toBe(true)
    const water: NutritionLine = {
      name: 'water',
      grams: 500,
      per100g: { kcal: 0, proteinG: 0, fatG: 0, carbsG: 0 },
    }
    expect(planPortion([water], targets, DEFAULT_MEAL_SPLIT, 'lunch')).toBeNull()
  })

  it('reports 0 % of a daily target of 0', () => {
    const plan = planPortion(RECIPE, { ...targets, carbsG: 0 }, DEFAULT_MEAL_SPLIT, 'lunch')!
    expect(plan.ofDaily.carbsG).toBe(0)
  })
})
