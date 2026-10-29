import { describe, expect, it } from 'vitest'
import foodsData from '../../../data/nutrition/foods.json'
import { DEFAULT_MEAL_SPLIT, type Macros } from '@/lib/nutrition/portions'
import {
  BREAKFASTS,
  buildDayPlan,
  dayIndexOf,
  DINNER_CHOICES,
  mealOptions,
  recipePools,
  recipePool,
  RECIPE_POOL_SIZE,
  seedOf,
  SNACKS,
  type PlanRecipe,
} from './meal-plan'

const per = (kcal: number, proteinG: number, fatG = 5, carbsG = 10, fiberG = 1): Macros => ({
  kcal,
  proteinG,
  fatG,
  carbsG,
  fiberG,
})

/** Every food the plates use, at plausible values. */
const FOODS: Record<string, Macros> = Object.fromEntries(
  [...BREAKFASTS, ...SNACKS].flatMap((plate) => plate.foods.map(([name]) => [name, per(150, 8)])),
)

const recipe = (id: string, proteinPer100: number): PlanRecipe => ({
  id,
  title: `Recipe ${id}`,
  category: 'Chicken',
  lines: [{ name: 'chicken', grams: 500, per100g: per(200, proteinPer100) }],
})

const RECIPES = Array.from({ length: 70 }, (_, i) =>
  recipe(`r${String(i).padStart(2, '0')}`, i + 1),
)
const TARGETS = { calorieTargetKcal: 2000, proteinG: 150, fatG: 60, carbsG: 200 }

describe('recipePools', () => {
  it('deals the most protein-dense recipes to lunch and dinner alternately, in stable order', () => {
    const { lunch, dinner } = recipePools(RECIPES)
    expect(lunch).toHaveLength(RECIPE_POOL_SIZE)
    expect(dinner).toHaveLength(RECIPE_POOL_SIZE)
    expect(lunch[0]!.id).toBe('r69')
    expect(dinner[0]!.id).toBe('r68')
    expect(lunch.some((recipe) => dinner.includes(recipe))).toBe(false)
    expect(recipePool([{ ...recipe('x', 5), lines: [] }])).toEqual([])
  })
})

describe('buildDayPlan', () => {
  const plan = (dayIndex: number, seed = 0) =>
    buildDayPlan({
      targets: TARGETS,
      split: DEFAULT_MEAL_SPLIT,
      recipes: RECIPES,
      foods: FOODS,
      dayIndex,
      seed,
    })

  it('fills every meal to its share of the day', () => {
    const day = plan(20000)
    expect(day.meals.map((m) => [m.meal, m.kind])).toEqual([
      ['breakfast', 'plate'],
      ['lunch', 'recipe'],
      ['dinner', 'recipe'],
      ['snacks', 'plate'],
    ])
    // Rounded grams make each meal land near (not exactly on) its budget.
    expect(day.totals.kcal).toBeGreaterThan(1900)
    expect(day.totals.kcal).toBeLessThan(2100)
    const lunch = day.meals[1]!
    expect(lunch.portion.budgetKcal).toBe(700)
    expect(day.fibre.complete).toBe(true)
    expect(day.fibre.grams).toBeGreaterThan(0)
  })

  it('never serves the same recipe twice in a day, is stable for a day and rotates daily', () => {
    for (let day = 0; day < 60; day++) {
      const lunch = plan(day).meals[1]!
      const dinner = plan(day).meals[2]!
      expect(
        lunch.kind === 'recipe' && dinner.kind === 'recipe' && lunch.recipeId !== dinner.recipeId,
      ).toBe(true)
    }
    expect(plan(100)).toEqual(plan(100))
    const lunchOf = (day: number) => (plan(day).meals[1] as { recipeId: string }).recipeId
    expect(lunchOf(100)).not.toBe(lunchOf(101))
    // A different person gets a different rotation on the same day.
    expect((plan(100, 7).meals[1] as { recipeId: string }).recipeId).not.toBe(lunchOf(100))
  })

  it('refuses to plan without recipes or with a missing food', () => {
    expect(() =>
      buildDayPlan({
        targets: TARGETS,
        split: DEFAULT_MEAL_SPLIT,
        recipes: [RECIPES[0]!],
        foods: FOODS,
        dayIndex: 0,
        seed: 0,
      }),
    ).toThrow(/at least two recipes/)
    expect(() =>
      buildDayPlan({
        targets: TARGETS,
        split: DEFAULT_MEAL_SPLIT,
        recipes: RECIPES,
        foods: {},
        dayIndex: 0,
        seed: 0,
      }),
    ).toThrow(/no nutrition data/)
  })
})

describe('helpers', () => {
  it('counts days and seeds users stably', () => {
    expect(dayIndexOf('1970-01-02')).toBe(1)
    expect(dayIndexOf('2026-10-29')).toBe(20755)
    expect(seedOf('user-a')).toBe(seedOf('user-a'))
    expect(seedOf('user-a')).not.toBe(seedOf('user-b'))
    expect(seedOf('x')).toBeLessThan(997)
  })
})

describe('fibre', () => {
  it('counts what is known and says when some food has no fibre data', () => {
    const foods = { ...FOODS, egg: { kcal: 143, proteinG: 12.6, fatG: 9.5, carbsG: 0.7 } }
    const day = buildDayPlan({
      targets: TARGETS,
      split: DEFAULT_MEAL_SPLIT,
      recipes: RECIPES,
      foods,
      dayIndex: 0,
      seed: 0,
    })
    const breakfast = day.meals[0]!
    expect(breakfast.kind === 'plate' && breakfast.plateId).toBe('eggs-feta')
    expect(day.fibre.complete).toBe(false)
    expect(day.fibre.grams).toBeGreaterThan(0)
  })
})

describe('dinner choice', () => {
  it("picks, of the spread candidates in its pool, the dinner closest to the day's protein", () => {
    const plan = (proteinG: number) =>
      buildDayPlan({
        targets: { ...TARGETS, proteinG },
        split: DEFAULT_MEAL_SPLIT,
        recipes: RECIPES,
        foods: FOODS,
        dayIndex: 3,
        seed: 0,
      })
    const dinnerOf = (proteinG: number) => {
      const dinner = plan(proteinG).meals[2]!
      return dinner.kind === 'recipe' ? dinner.recipeId : null
    }
    const pool = recipePools(RECIPES).dinner
    const spread = Math.floor(pool.length / DINNER_CHOICES)
    // Pool order is densest first, so sorting the candidates' positions ranks them by protein.
    const candidates = Array.from(
      { length: DINNER_CHOICES },
      (_, i) => (3 + i * spread) % pool.length,
    )
      .sort((a, b) => a - b)
      .map((index) => pool[index]!.id)
    // A very high target wants the densest candidate; a very low one the leanest.
    expect(dinnerOf(2000)).toBe(candidates[0])
    expect(dinnerOf(1)).toBe(candidates.at(-1))
  })

  it('never serves the same recipe at lunch and dinner: the pools are separate', () => {
    for (let day = 0; day < 60; day++) {
      const [, lunch, dinner] = buildDayPlan({
        targets: TARGETS,
        split: DEFAULT_MEAL_SPLIT,
        recipes: RECIPES,
        foods: FOODS,
        dayIndex: day,
        seed: 0,
      }).meals
      expect((lunch as { recipeId: string }).recipeId).not.toBe(
        (dinner as { recipeId: string }).recipeId,
      )
    }
  })
})

describe('choices', () => {
  const input = {
    targets: TARGETS,
    split: DEFAULT_MEAL_SPLIT,
    recipes: RECIPES,
    foods: FOODS,
    dayIndex: 5,
    seed: 0,
  }

  it("offers 25–30 options for every meal, each sized to the member's day", () => {
    for (const meal of ['breakfast', 'lunch', 'dinner', 'snacks'] as const) {
      const options = mealOptions(input, meal)
      expect(options.length, meal).toBeGreaterThanOrEqual(25)
      expect(options.length, meal).toBeLessThanOrEqual(30)
      for (const option of options) {
        expect(option.portion.meal).toBe(meal)
        expect(option.portion.budgetKcal).toBe(
          (TARGETS.calorieTargetKcal * DEFAULT_MEAL_SPLIT[meal]) / 100,
        )
      }
    }
    expect(new Set(mealOptions(input, 'breakfast').map((o) => o.optionId)).size).toBe(
      BREAKFASTS.length,
    )
  })

  it("uses the member's pick for a meal, and the suggestion for the rest", () => {
    const suggested = buildDayPlan(input)
    const lunchPick = mealOptions(input, 'lunch').at(-1)!.optionId
    const snackPick = 'apple-pb'
    const plan = buildDayPlan({ ...input, choices: { lunch: lunchPick, snacks: snackPick } })
    expect((plan.meals[1] as { recipeId: string }).recipeId).toBe(lunchPick)
    expect((plan.meals[3] as { plateId: string }).plateId).toBe(snackPick)
    expect(plan.meals[0]).toEqual(suggested.meals[0])
    // An id that is not one of the meal's options falls back to the suggestion.
    const stray = buildDayPlan({ ...input, choices: { dinner: 'not-an-option' } })
    expect(stray.meals[2]).toEqual(suggested.meals[2])
  })
})

describe('plates', () => {
  it('get at least a fifth of their calories from protein, with real food values', () => {
    for (const plate of [...BREAKFASTS, ...SNACKS]) {
      const totals = plate.foods.reduce(
        (sum, [name, grams]) => {
          const food = (foodsData.foods as Record<string, { per100g: Macros }>)[name]
          expect(food, `${plate.id}: ${name}`).toBeDefined()
          return {
            kcal: sum.kcal + (food!.per100g.kcal * grams) / 100,
            proteinG: sum.proteinG + (food!.per100g.proteinG * grams) / 100,
          }
        },
        { kcal: 0, proteinG: 0 },
      )
      expect((totals.proteinG * 4) / totals.kcal, plate.id).toBeGreaterThanOrEqual(0.2)
    }
  })
})
