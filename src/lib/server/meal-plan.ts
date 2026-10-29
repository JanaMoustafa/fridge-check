import 'server-only'
import { getLocalRecipes } from '@/lib/data/local-recipes'
import type { NutritionTargets } from '@/lib/nutrition/calculator'
import type { Macros, MealSplit } from '@/lib/nutrition/portions'
import { recipeNutrition } from '@/lib/nutrition/recipe-nutrition'
import {
  BREAKFASTS,
  buildDayPlan,
  dayIndexOf,
  SNACKS,
  seedOf,
  type DayPlan,
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

/** Today's meals for a member: the same all day, a new rotation tomorrow. */
export async function mealPlanFor(
  userId: string,
  date: string,
  targets: Pick<NutritionTargets, 'calorieTargetKcal' | 'proteinG' | 'fatG' | 'carbsG'>,
  split: MealSplit,
): Promise<DayPlan> {
  const { recipes, foods } = await planData()
  return buildDayPlan({
    targets,
    split,
    recipes,
    foods,
    dayIndex: dayIndexOf(date),
    seed: seedOf(userId),
  })
}
