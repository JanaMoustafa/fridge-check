import 'server-only'
import { NutritionFoodsSchema, type NutritionFoods } from '@/lib/nutrition/data-files'
import { recipeNutrition, type RecipeNutrition } from '@/lib/nutrition/recipe-nutrition'
import type { RecipeDetail } from '@/types/recipe'

let loaded: Promise<NutritionFoods> | undefined

/**
 * USDA nutrition data (data/nutrition/foods.json, ~120 KB), validated once per server process.
 * Imported only here: it never reaches the browser. A failed load is retried on the next call.
 */
export function getNutritionFoods(): Promise<NutritionFoods> {
  loaded ??= import('../../../data/nutrition/foods.json')
    .then((module) => NutritionFoodsSchema.parse(module.default))
    .catch((error: unknown) => {
      loaded = undefined
      throw error
    })
  return loaded
}

/**
 * A recipe's weighed lines and what was left out, from USDA data: built-in and TheMealDB recipes.
 * Spoonacular recipes come with their own nutrition (null here).
 */
export async function nutritionForRecipe(recipe: RecipeDetail): Promise<RecipeNutrition | null> {
  if (recipe.source === 'spoonacular') return null
  return recipeNutrition(recipe.ingredients, await getNutritionFoods())
}
