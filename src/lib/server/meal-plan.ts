import 'server-only'
import { getLocalRecipes } from '@/lib/data/local-recipes'
import type { Macros, MealSplit } from '@/lib/nutrition/portions'
import { recipeNutrition } from '@/lib/nutrition/recipe-nutrition'
import type { Meal } from '@/lib/nutrition/portions'
import {
  BREAKFASTS,
  buildDayPlan,
  dayIndexOf,
  mealOptions,
  SNACKS,
  seedOf,
  type DayPlan,
  type DayPlanInput,
  type MealOption,
  type PlanRecipe,
} from '@/lib/nutritionist/meal-plan'
import { isPlanFriendly } from '@/lib/nutritionist/plan-filters'
import { getNutritionFoods } from './nutrition'

interface PlanData {
  recipes: PlanRecipe[]
  foods: Record<string, Macros>
}

let loaded: Promise<PlanData> | undefined

/**
 * The planner's inputs, prepared once per server process: every plan-friendly built-in recipe
 * whose nutrition is complete (weighed line by line), and the values of the foods the breakfast
 * and snack plates use. A failed load is retried on the next call.
 */
function planData(): Promise<PlanData> {
  loaded ??= (async () => {
    const [recipes, nutrition] = await Promise.all([getLocalRecipes(), getNutritionFoods()])
    const planRecipes: PlanRecipe[] = []
    for (const recipe of recipes) {
      if (!isPlanFriendly(recipe)) continue
      const weighed = recipeNutrition(recipe.ingredients, nutrition)
      if (weighed.complete && weighed.lines.length > 0) {
        planRecipes.push({
          id: recipe.id,
          title: recipe.title,
          category: recipe.category,
          lines: weighed.lines,
        })
      }
    }
    const foods: Record<string, Macros> = {}
    for (const plate of [...BREAKFASTS, ...SNACKS]) {
      for (const [name] of plate.foods) {
        const food = nutrition.foods[name]
        if (food) foods[name] = food.per100g
      }
    }
    return { recipes: planRecipes, foods }
  })().catch((error: unknown) => {
    loaded = undefined
    throw error
  })
  return loaded
}

async function inputFor(
  userId: string,
  date: string,
  targets: DayPlanInput['targets'],
  split: MealSplit,
  choices?: Partial<Record<Meal, string>>,
): Promise<DayPlanInput> {
  const { recipes, foods } = await planData()
  return {
    targets,
    split,
    recipes,
    foods,
    dayIndex: dayIndexOf(date),
    seed: seedOf(userId),
    choices,
  }
}

/** Today's meals for a member: their picks where they made one, else the day's suggestion. */
export async function mealPlanFor(
  userId: string,
  date: string,
  targets: DayPlanInput['targets'],
  split: MealSplit,
  choices?: Partial<Record<Meal, string>>,
): Promise<DayPlan> {
  return buildDayPlan(await inputFor(userId, date, targets, split, choices))
}

/** Everything a member can pick for a meal, sized to their day. */
export async function mealOptionsFor(
  userId: string,
  date: string,
  targets: DayPlanInput['targets'],
  split: MealSplit,
  meal: Meal,
): Promise<MealOption[]> {
  return mealOptions(await inputFor(userId, date, targets, split), meal)
}
