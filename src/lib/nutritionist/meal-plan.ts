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

/**
 * Breakfasts from foods most kitchens in Egypt and the Gulf have: about a quarter or more of each
 * plate's calories come from protein (eggs, Greek yogurt, cottage cheese, chicken, fish), so the
 * day can reach a high protein target. Grams are as eaten; the portion engine scales them.
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
  {
    id: 'oats-banana',
    foods: [
      ['oats', 45],
      ['greek yogurt', 170],
      ['banana', 100],
      ['peanut butter', 8],
    ],
  },
  {
    id: 'overnight-oats',
    foods: [
      ['oats', 50],
      ['greek yogurt', 150],
      ['chia seed', 10],
      ['strawberry', 100],
    ],
  },
  {
    id: 'cottage-fruit',
    foods: [
      ['cottage cheese', 200],
      ['apple', 150],
      ['walnut', 10],
    ],
  },
  {
    id: 'veg-omelette',
    foods: [
      ['egg', 150],
      ['bell pepper', 60],
      ['mushroom', 60],
      ['onion', 30],
      ['olive oil', 5],
      ['pita', 40],
    ],
  },
  {
    id: 'shakshuka',
    foods: [
      ['egg', 150],
      ['tomato', 200],
      ['onion', 40],
      ['bell pepper', 60],
      ['olive oil', 7],
      ['pita', 50],
    ],
  },
  {
    id: 'egg-white-wrap',
    foods: [
      ['egg white', 150],
      ['egg', 50],
      ['spinach', 50],
      ['pita', 60],
      ['feta', 20],
    ],
  },
  {
    id: 'turkey-toast',
    foods: [
      ['bread', 60],
      ['turkey breast', 70],
      ['tomato', 80],
      ['lettuce', 30],
      ['cream cheese', 15],
    ],
  },
  {
    id: 'salmon-toast',
    foods: [
      ['bread', 60],
      ['smoked salmon', 60],
      ['cream cheese', 20],
      ['cucumber', 80],
    ],
  },
  {
    id: 'ricotta-toast',
    foods: [
      ['bread', 60],
      ['ricotta', 120],
      ['honey', 8],
      ['strawberry', 100],
    ],
  },
  {
    id: 'avocado-egg-toast',
    foods: [
      ['bread', 60],
      ['avocado', 60],
      ['egg', 100],
      ['egg white', 60],
    ],
  },
  {
    id: 'tuna-egg-plate',
    foods: [
      ['tuna', 80],
      ['egg', 50],
      ['cucumber', 100],
      ['tomato', 80],
      ['pita', 40],
    ],
  },
  {
    id: 'cheese-olive-plate',
    foods: [
      ['feta', 50],
      ['olive', 30],
      ['tomato', 100],
      ['cucumber', 100],
      ['pita', 60],
      ['egg', 100],
    ],
  },
  {
    id: 'pb-banana-toast',
    foods: [
      ['bread', 60],
      ['peanut butter', 15],
      ['banana', 100],
      ['greek yogurt', 200],
    ],
  },
  {
    id: 'yogurt-dates',
    foods: [
      ['greek yogurt', 250],
      ['date', 40],
      ['almond', 15],
    ],
  },
  {
    id: 'mushroom-omelette',
    foods: [
      ['egg', 150],
      ['mushroom', 80],
      ['cheddar', 25],
      ['tomato', 80],
    ],
  },
  {
    id: 'chicken-wrap',
    foods: [
      ['chicken breast', 80],
      ['pita', 60],
      ['lettuce', 40],
      ['tomato', 60],
      ['hummus', 25],
    ],
  },
  {
    id: 'sweet-potato-eggs',
    foods: [
      ['sweet potato', 150],
      ['egg', 100],
      ['spinach', 50],
    ],
  },
  {
    id: 'quinoa-bowl',
    foods: [
      ['quinoa', 90],
      ['greek yogurt', 200],
      ['banana', 80],
      ['chia seed', 8],
    ],
  },
  {
    id: 'cottage-toast',
    foods: [
      ['bread', 60],
      ['cottage cheese', 150],
      ['tomato', 100],
      ['olive oil', 5],
    ],
  },
  {
    id: 'egg-cheese-sandwich',
    foods: [
      ['bread', 70],
      ['egg', 100],
      ['cheddar', 25],
      ['tomato', 60],
    ],
  },
  {
    id: 'sardine-toast',
    foods: [
      ['sardine', 70],
      ['bread', 60],
      ['tomato', 80],
      ['lemon', 10],
    ],
  },
  {
    id: 'yogurt-pear-seeds',
    foods: [
      ['greek yogurt', 250],
      ['pear', 120],
      ['pumpkin seed', 15],
    ],
  },
] as const satisfies readonly FoodPlate[]

/** Snacks: small plates that each bring real protein at a typical 10 % share of the day. */
export const SNACKS = [
  {
    id: 'yogurt-orange',
    foods: [
      ['greek yogurt', 170],
      ['orange', 150],
    ],
  },
  {
    id: 'chicken-pita',
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
  {
    id: 'cottage-grapes',
    foods: [
      ['cottage cheese', 150],
      ['grape', 100],
    ],
  },
  {
    id: 'apple-pb',
    foods: [
      ['apple', 150],
      ['peanut butter', 12],
      ['greek yogurt', 150],
    ],
  },
  {
    id: 'feta-cucumber',
    foods: [
      ['feta', 40],
      ['egg', 50],
      ['cucumber', 150],
      ['pita', 25],
    ],
  },
  {
    id: 'turkey-rolls',
    foods: [
      ['turkey breast', 70],
      ['cucumber', 100],
      ['cream cheese', 15],
    ],
  },
  {
    id: 'banana-yogurt',
    foods: [
      ['banana', 100],
      ['greek yogurt', 150],
    ],
  },
  {
    id: 'dates-almonds',
    foods: [
      ['date', 25],
      ['almond', 10],
      ['greek yogurt', 200],
    ],
  },
  {
    id: 'hummus-pepper',
    foods: [
      ['hummus', 40],
      ['bell pepper', 150],
      ['egg', 50],
    ],
  },
  {
    id: 'egg-apple',
    foods: [
      ['egg', 100],
      ['apple', 120],
    ],
  },
  {
    id: 'cottage-tomato',
    foods: [
      ['cottage cheese', 150],
      ['tomato', 120],
    ],
  },
  {
    id: 'salmon-cucumber',
    foods: [
      ['smoked salmon', 50],
      ['cucumber', 150],
      ['cream cheese', 10],
    ],
  },
  {
    id: 'shrimp-lemon',
    foods: [
      ['shrimp', 100],
      ['lemon', 10],
      ['lettuce', 50],
    ],
  },
  {
    id: 'ricotta-berries',
    foods: [
      ['ricotta', 120],
      ['strawberry', 150],
    ],
  },
  {
    id: 'yogurt-seeds',
    foods: [
      ['greek yogurt', 170],
      ['pumpkin seed', 12],
    ],
  },
  {
    id: 'chicken-celery',
    foods: [
      ['chicken breast', 70],
      ['celery', 100],
      ['hummus', 20],
    ],
  },
  {
    id: 'cheddar-pear',
    foods: [
      ['cheddar', 25],
      ['pear', 120],
      ['greek yogurt', 100],
    ],
  },
  {
    id: 'egg-white-tomato',
    foods: [
      ['egg white', 150],
      ['tomato', 120],
      ['olive oil', 3],
    ],
  },
  {
    id: 'tuna-pepper',
    foods: [
      ['tuna', 80],
      ['bell pepper', 120],
    ],
  },
  {
    id: 'mozzarella-tomato',
    foods: [
      ['mozzarella', 50],
      ['tomato', 150],
      ['olive oil', 4],
    ],
  },
  {
    id: 'oats-yogurt-cup',
    foods: [
      ['oats', 30],
      ['greek yogurt', 120],
      ['honey', 5],
    ],
  },
  {
    id: 'chia-pudding',
    foods: [
      ['chia seed', 15],
      ['greek yogurt', 150],
      ['strawberry', 80],
    ],
  },
  {
    id: 'choc-yogurt',
    foods: [
      ['greek yogurt', 170],
      ['dark chocolate', 12],
    ],
  },
  {
    id: 'pistachio-orange',
    foods: [
      ['pistachio', 15],
      ['orange', 150],
      ['greek yogurt', 100],
    ],
  },
] as const satisfies readonly FoodPlate[]

/** Lunch and dinner each draw from their own pool of the most protein-dense recipes. */
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
  /** What the member chose for a meal today (an option id), instead of the day's suggestion. */
  choices?: Partial<Record<Meal, string>>
}

/** One thing a member can pick for a meal, with the portion that fits their day. */
export type MealOption =
  | { optionId: string; kind: 'recipe'; recipeId: string; title: string; portion: PortionPlan }
  | { optionId: string; kind: 'plate'; plateId: PlateId; portion: PortionPlan }

const kcalOf = (recipe: PlanRecipe) =>
  recipe.lines.reduce((total, line) => total + (line.grams * line.per100g.kcal) / 100, 0)
const proteinOf = (recipe: PlanRecipe) =>
  recipe.lines.reduce((total, line) => total + (line.grams * line.per100g.proteinG) / 100, 0)

/**
 * The two recipe pools: the most protein-dense recipes first, dealt alternately to lunch and
 * dinner so both pools are equally strong and no recipe is in both.
 */
export function recipePools(recipes: readonly PlanRecipe[]): {
  lunch: PlanRecipe[]
  dinner: PlanRecipe[]
} {
  const ranked = recipes
    .filter((recipe) => kcalOf(recipe) > 0)
    .map((recipe) => ({ recipe, density: proteinOf(recipe) / kcalOf(recipe) }))
    .sort((a, b) => b.density - a.density || a.recipe.id.localeCompare(b.recipe.id))
    .map(({ recipe }) => recipe)
  const lunch = ranked.filter((_, i) => i % 2 === 0).slice(0, RECIPE_POOL_SIZE)
  const dinner = ranked.filter((_, i) => i % 2 === 1).slice(0, RECIPE_POOL_SIZE)
  return { lunch, dinner }
}

/** Kept for callers that want one ranked list (the first pool). */
export function recipePool(recipes: readonly PlanRecipe[]): PlanRecipe[] {
  return recipePools(recipes).lunch
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

/** Every option for a meal, in the pool's order (the member chooses from these). */
export function mealOptions(input: DayPlanInput, meal: Meal): MealOption[] {
  const portionOf = (lines: readonly NutritionLine[]) =>
    planPortion(lines, input.targets, input.split, meal)
  if (meal === 'breakfast' || meal === 'snacks') {
    const plates: readonly (FoodPlate & { id: PlateId })[] =
      meal === 'breakfast' ? BREAKFASTS : SNACKS
    return plates.flatMap((plate) => {
      const portion = portionOf(plateLines(plate, input.foods))
      return portion
        ? [{ optionId: plate.id, kind: 'plate' as const, plateId: plate.id, portion }]
        : []
    })
  }
  const pool =
    meal === 'lunch' ? recipePools(input.recipes).lunch : recipePools(input.recipes).dinner
  return pool.flatMap((recipe) => {
    const portion = portionOf(recipe.lines)
    return portion
      ? [
          {
            optionId: recipe.id,
            kind: 'recipe' as const,
            recipeId: recipe.id,
            title: recipe.title,
            portion,
          },
        ]
      : []
  })
}

const asMeal = (meal: Meal, option: MealOption): PlannedMeal =>
  option.kind === 'recipe'
    ? {
        meal,
        kind: 'recipe',
        recipeId: option.recipeId,
        title: option.title,
        portion: option.portion,
      }
    : { meal, kind: 'plate', plateId: option.plateId, portion: option.portion }

/**
 * Today's plan: the member's choice for each meal where they made one, otherwise the day's
 * suggestion from the rotation (breakfast, lunch and the snack by turn; dinner the one of a few
 * spread candidates that lands the day closest to its protein and fat targets).
 */
export function buildDayPlan(input: DayPlanInput): DayPlan {
  const options = Object.fromEntries(
    MEALS.map((meal) => [meal, mealOptions(input, meal)]),
  ) as Record<Meal, MealOption[]>
  if (options.lunch.length < 1 || options.dinner.length < 1) {
    throw new Error('The meal plan needs at least two recipes with complete nutrition')
  }
  const turn = input.dayIndex + input.seed
  const chosen = (meal: Meal) => {
    const id = input.choices?.[meal]
    return id ? options[meal].find((option) => option.optionId === id) : undefined
  }

  const breakfast = chosen('breakfast') ?? pick(options.breakfast, turn)
  const lunch = chosen('lunch') ?? pick(options.lunch, turn)
  const snacks = chosen('snacks') ?? pick(options.snacks, turn + 1)
  const dinnerChoice = chosen('dinner')
  const soFar = [breakfast, lunch, snacks]
  const proteinSoFar = soFar.reduce((total, option) => total + option.portion.totals.proteinG, 0)
  const fatSoFar = soFar.reduce((total, option) => total + option.portion.totals.fatG, 0)
  // Grams away from the day's protein and fat targets (calories are already set by the portion).
  // Protein counts double: missing it costs muscle; a little extra fat only shifts the macros.
  const miss = (option: MealOption) =>
    Math.abs(proteinSoFar + option.portion.totals.proteinG - input.targets.proteinG) +
    FAT_MISS_WEIGHT * Math.abs(fatSoFar + option.portion.totals.fatG - input.targets.fatG)
  let dinner = dinnerChoice ?? null
  if (!dinner) {
    const spread = Math.max(1, Math.floor(options.dinner.length / DINNER_CHOICES))
    for (let i = 0; i < DINNER_CHOICES; i++) {
      const candidate = pick(options.dinner, turn + i * spread)
      if (dinner === null || miss(candidate) < miss(dinner)) dinner = candidate
    }
  }

  const meals: PlannedMeal[] = [
    asMeal('breakfast', breakfast),
    asMeal('lunch', lunch),
    asMeal('dinner', dinner!),
    asMeal('snacks', snacks),
  ]
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
