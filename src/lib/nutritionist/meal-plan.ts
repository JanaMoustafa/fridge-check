import type { NutritionTargets } from '@/lib/nutrition/calculator'
import {
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

/**
 * Breakfasts from foods most kitchens in Egypt and the Gulf have. Each gets about 30 % of its
 * calories from protein (egg whites do the heavy lifting), so the day can reach a high protein
 * target alongside lunch and dinner.
 */
export const BREAKFASTS = [
  {
    id: 'eggs-feta',
    foods: [
      ['egg', 100],
      ['egg white', 100],
      ['pita', 50],
      ['feta', 25],
      ['tomato', 120],
      ['cucumber', 120],
    ],
  },
  {
    id: 'yogurt-berries',
    foods: [
      ['greek yogurt', 250],
      ['strawberry', 200],
      ['almond', 10],
      ['honey', 5],
    ],
  },
  {
    id: 'hummus-plate',
    foods: [
      ['hummus', 40],
      ['pita', 40],
      ['egg', 100],
      ['egg white', 100],
      ['cucumber', 80],
      ['tomato', 80],
      ['carrot', 80],
    ],
  },
  {
    id: 'cheese-toast',
    foods: [
      ['bread', 50],
      ['cheddar', 20],
      ['egg', 50],
      ['egg white', 100],
      ['tomato', 150],
      ['cucumber', 100],
    ],
  },
] as const satisfies readonly FoodPlate[]

/** Snacks that each bring 13–19 g of protein at a typical 10 % share of the day. */
export const SNACKS = [
  {
    id: 'yogurt-orange',
    foods: [
      ['greek yogurt', 170],
      ['orange', 150],
    ],
  },
  {
    id: 'chicken-wrap',
    foods: [
      ['chicken breast', 60],
      ['pita', 30],
      ['cucumber', 100],
      ['tomato', 80],
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
  {
    id: 'eggs-cucumber',
    foods: [
      ['egg', 100],
      ['cucumber', 100],
      ['carrot', 80],
    ],
  },
] as const satisfies readonly FoodPlate[]

/** How many of the most protein-dense recipes the lunch and dinner rotation draws from. */
export const RECIPE_POOL_SIZE = 30
/** How many recipes dinner chooses between, to bring the day's protein and fat closest to target. */
export const DINNER_CHOICES = 3
const FAT_MISS_WEIGHT = 0.5

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
  const plated = (meal: Meal, plate: FoodPlate & { id: PlateId }): PlannedMeal | null => {
    const portion = planPortion(plateLines(plate, input.foods), input.targets, input.split, meal)
    return portion && { meal, kind: 'plate', plateId: plate.id, portion }
  }
  const cooked = (meal: Meal, recipe: PlanRecipe): PlannedMeal | null => {
    const portion = planPortion(recipe.lines, input.targets, input.split, meal)
    return portion && { meal, kind: 'recipe', recipeId: recipe.id, title: recipe.title, portion }
  }

  const lunchRecipe = pick(pool, turn)
  const breakfast = plated('breakfast', pick(BREAKFASTS, turn))
  const lunch = cooked('lunch', lunchRecipe)
  const snacks = plated('snacks', pick(SNACKS, turn + 1))
  const proteinSoFar = [breakfast, lunch, snacks].reduce(
    (total, meal) => total + (meal?.portion.totals.proteinG ?? 0),
    0,
  )
  const fatSoFar = [breakfast, lunch, snacks].reduce(
    (total, meal) => total + (meal?.portion.totals.fatG ?? 0),
    0,
  )
  // Grams away from the day's protein and fat targets (calories are already set by the portion).
  // Protein counts double: missing it costs muscle; a little extra fat only shifts the macros.
  const miss = (meal: PlannedMeal) =>
    Math.abs(proteinSoFar + meal.portion.totals.proteinG - input.targets.proteinG) +
    FAT_MISS_WEIGHT * Math.abs(fatSoFar + meal.portion.totals.fatG - input.targets.fatG)
  // Dinner: of a few recipes spread across the pool (starting half the pool away from lunch, and
  // never lunch itself), the one that brings the day's protein and fat closest to the targets. The pool is
  // sorted by protein density, so spreading the choices gives the day real options; the rotation
  // still moves every day.
  const half = Math.floor(pool.length / 2)
  const spread = Math.max(1, Math.floor(pool.length / DINNER_CHOICES))
  let dinner: PlannedMeal | null = null
  for (let i = 0; i < DINNER_CHOICES; i++) {
    const recipe = pick(pool, turn + half + i * spread)
    if (recipe.id === lunchRecipe.id) continue
    const meal = cooked('dinner', recipe)
    if (meal && (dinner === null || miss(meal) < miss(dinner))) dinner = meal
  }

  const meals = [breakfast, lunch, dinner, snacks].filter(
    (meal): meal is PlannedMeal => meal !== null,
  )
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
