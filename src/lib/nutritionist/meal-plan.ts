import type { NutritionTargets } from '@/lib/nutrition/calculator'
import {
  MEALS,
  planPortion,
  sumMacros,
  type Macros,
  type Meal,
  type MealSplit,
  type NutritionLine,
  type PortionPlan,
} from '@/lib/nutrition/portions'

/**
 * A day of meals that adds up to the user's calories: lunch and dinner are built-in recipes with
 * complete nutrition, breakfast and the snack are simple plates of everyday foods. Every meal is
 * scaled to its share of the day (the same portion engine as the recipe pages), so the plan's
 * numbers and the recipe pages always agree. The same day gives the same plan; days rotate.
 */

/** A recipe the planner may use: complete nutrition, already weighed line by line. */
export interface PlanRecipe {
  id: string
  title: string
  category: string
  lines: NutritionLine[]
}

/** A plate of foods (canonical ingredient names) at a base weight, scaled to the meal. */
export interface FoodPlate {
  id: string
  foods: ReadonlyArray<readonly [food: string, grams: number]>
}

/** Breakfasts from foods most kitchens in Egypt and the Gulf have. */
export const BREAKFASTS = [
  {
    id: 'eggs-feta',
    foods: [
      ['egg', 100],
      ['pita', 60],
      ['feta', 30],
      ['tomato', 80],
      ['cucumber', 80],
    ],
  },
  {
    id: 'yogurt-berries',
    foods: [
      ['greek yogurt', 200],
      ['strawberry', 120],
      ['almond', 15],
      ['honey', 10],
    ],
  },
  {
    id: 'hummus-plate',
    foods: [
      ['hummus', 60],
      ['pita', 60],
      ['egg', 50],
      ['cucumber', 80],
      ['tomato', 80],
    ],
  },
  {
    id: 'cheese-toast',
    foods: [
      ['bread', 60],
      ['cheddar', 30],
      ['egg', 50],
      ['tomato', 100],
    ],
  },
] as const satisfies readonly FoodPlate[]

export const SNACKS = [
  {
    id: 'yogurt-orange',
    foods: [
      ['greek yogurt', 170],
      ['orange', 130],
    ],
  },
  {
    id: 'almonds-strawberries',
    foods: [
      ['almond', 20],
      ['strawberry', 150],
    ],
  },
  {
    id: 'hummus-carrot',
    foods: [
      ['hummus', 50],
      ['carrot', 120],
    ],
  },
  {
    id: 'tuna-cucumber',
    foods: [
      ['tuna', 80],
      ['cucumber', 120],
      ['pita', 30],
    ],
  },
] as const satisfies readonly FoodPlate[]

/** How many of the most protein-dense recipes the lunch and dinner rotation draws from. */
export const RECIPE_POOL_SIZE = 30

export type PlateId = (typeof BREAKFASTS)[number]['id'] | (typeof SNACKS)[number]['id']

export type PlannedMeal =
  | { meal: Meal; kind: 'recipe'; recipeId: string; title: string; portion: PortionPlan }
  | { meal: Meal; kind: 'plate'; plateId: PlateId; portion: PortionPlan }

export interface DayPlan {
  meals: PlannedMeal[]
  totals: Macros
  /** Fibre from the foods whose fibre is known; `complete` is false when some food's isn't. */
  fibre: { grams: number; complete: boolean }
}

export interface DayPlanInput {
  targets: Pick<NutritionTargets, 'calorieTargetKcal' | 'proteinG' | 'fatG' | 'carbsG'>
  split: MealSplit
  recipes: readonly PlanRecipe[]
  /** Values per 100 g for every food the plates use. */
  foods: Readonly<Record<string, Macros>>
  /** Days since 1970-01-01 (Cairo): the plan changes every day. */
  dayIndex: number
  /** Per-user offset, so two people don't get the same rotation. */
  seed: number
}

const kcalOf = (recipe: PlanRecipe) =>
  recipe.lines.reduce((total, line) => total + (line.grams * line.per100g.kcal) / 100, 0)
const proteinOf = (recipe: PlanRecipe) =>
  recipe.lines.reduce((total, line) => total + (line.grams * line.per100g.proteinG) / 100, 0)

/** The rotation: the most protein-dense recipes first (to help reach the protein target). */
export function recipePool(recipes: readonly PlanRecipe[]): PlanRecipe[] {
  return recipes
    .filter((recipe) => kcalOf(recipe) > 0)
    .map((recipe) => ({ recipe, density: proteinOf(recipe) / kcalOf(recipe) }))
    .sort((a, b) => b.density - a.density || a.recipe.id.localeCompare(b.recipe.id))
    .slice(0, RECIPE_POOL_SIZE)
    .map(({ recipe }) => recipe)
}

function plateLines(plate: FoodPlate, foods: DayPlanInput['foods']): NutritionLine[] {
  return plate.foods.map(([name, grams]) => {
    const per100g = foods[name]
    if (!per100g)
      throw new Error(`Meal plate ${plate.id} uses ${name}, which has no nutrition data`)
    return { name, grams, per100g }
  })
}

const pick = <T>(items: readonly T[], index: number): T =>
  items[((index % items.length) + items.length) % items.length]!

export function buildDayPlan(input: DayPlanInput): DayPlan {
  const pool = recipePool(input.recipes)
  if (pool.length < 2)
    throw new Error('The meal plan needs at least two recipes with complete nutrition')
  const turn = input.dayIndex + input.seed
  const lunch = pick(pool, turn)
  // Dinner sits half the pool away from lunch, so the two are never the same recipe.
  const dinner = pick(pool, turn + Math.floor(pool.length / 2))
  const breakfast = pick(BREAKFASTS, turn)
  const snack = pick(SNACKS, turn + 1)

  const meals: PlannedMeal[] = []
  for (const meal of MEALS) {
    if (meal === 'breakfast' || meal === 'snacks') {
      const plate = meal === 'breakfast' ? breakfast : snack
      const portion = planPortion(plateLines(plate, input.foods), input.targets, input.split, meal)
      if (portion) meals.push({ meal, kind: 'plate', plateId: plate.id, portion })
    } else {
      const recipe = meal === 'lunch' ? lunch : dinner
      const portion = planPortion(recipe.lines, input.targets, input.split, meal)
      if (portion)
        meals.push({ meal, kind: 'recipe', recipeId: recipe.id, title: recipe.title, portion })
    }
  }
  const lines = meals.flatMap((meal) => meal.portion.lines)
  const fibre = {
    grams: lines.reduce((total, line) => total + (line.macros.fiberG ?? 0), 0),
    complete: lines.every((line) => line.macros.fiberG !== undefined),
  }
  return { meals, totals: sumMacros(meals.map((meal) => meal.portion.totals)), fibre }
}

/** Days since 1970-01-01 for a YYYY-MM-DD date. */
export function dayIndexOf(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000)
}

/** A small stable number from a user id, for the per-user rotation offset. */
export function seedOf(userId: string): number {
  let hash = 0
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) % 997
  return hash
}
