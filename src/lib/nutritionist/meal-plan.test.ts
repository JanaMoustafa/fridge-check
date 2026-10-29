import { describe, expect, it } from 'vitest'
import foodsData from '../../../data/nutrition/foods.json'
import { DEFAULT_MEAL_SPLIT, type Macros } from '@/lib/nutrition/portions'
import {
  BREAKFASTS,
  buildDayPlan,
  dayIndexOf,
  DINNER_CHOICES,
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

const RECIPES = Array.from({ length: 40 }, (_, i) =>
  recipe(`r${String(i).padStart(2, '0')}`, i + 1),
)
const TARGETS = { calorieTargetKcal: 2000, proteinG: 150, fatG: 60, carbsG: 200 }

describe('recipePool', () => {
  it('keeps the most protein-dense recipes, in a stable order', () => {
    const pool = recipePool(RECIPES)
    expect(pool).toHaveLength(RECIPE_POOL_SIZE)
    expect(pool[0]!.id).toBe('r39')
    expect(pool.at(-1)!.id).toBe('r10')
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
  it('picks, of the spread candidates, the dinner that lands the day closest to its protein', () => {
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
    const pool = recipePool(RECIPES)
    const half = Math.floor(pool.length / 2)
    const spread = Math.floor(pool.length / DINNER_CHOICES)
    // Pool order is densest first, so sorting the candidates' positions ranks them by protein.
    const candidates = Array.from(
      { length: DINNER_CHOICES },
      (_, i) => (3 + half + i * spread) % pool.length,
    )
      .sort((a, b) => a - b)
      .map((index) => pool[index]!.id)
    // A very high target wants the densest candidate; a very low one the leanest.
    expect(dinnerOf(400)).toBe(candidates[0])
    expect(dinnerOf(1)).toBe(candidates.at(-1))
    const lunch = plan(150).meals[1]!
    expect(lunch.kind === 'recipe' && candidates.includes(lunch.recipeId)).toBe(false)
  })

  it('never serves lunch again at dinner, even from a tiny pool', () => {
    const day = buildDayPlan({
      targets: TARGETS,
      split: DEFAULT_MEAL_SPLIT,
      recipes: RECIPES.slice(0, 2),
      foods: FOODS,
      dayIndex: 1,
      seed: 0,
    })
    const [, lunch, dinner] = day.meals
    expect(lunch!.kind === 'recipe' && dinner!.kind === 'recipe').toBe(true)
    expect((lunch as { recipeId: string }).recipeId).not.toBe(
      (dinner as { recipeId: string }).recipeId,
    )
  })
})

describe('plates', () => {
  it('get at least a quarter of their calories from protein, with real food values', () => {
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
      expect((totals.proteinG * 4) / totals.kcal, plate.id).toBeGreaterThanOrEqual(0.25)
    }
  })
})
