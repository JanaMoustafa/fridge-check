import {
  DIETS,
  LocalRecipeCollectionSchema,
  type Diet,
  type LocalRecipe,
  type LocalRecipeCollection,
} from '@/types/recipe'
import { MENA_CUISINES } from './cuisines'

/** TheMealDB's dessert category, capped in the selection. */
export const DESSERT_CATEGORY = 'Dessert'

/** Recipes sorted by TheMealDB id (numeric), so every re-seed diffs line by line. */
function byMealDbId(a: LocalRecipe, b: LocalRecipe): number {
  return Number(a.mealDbId) - Number(b.mealDbId)
}

/**
 * data/recipes.json: the recipes sorted by id and validated with the same schema the app loads it
 * with. Duplicate ids are an error rather than silently merged.
 */
export function buildCollection(recipes: readonly LocalRecipe[]): LocalRecipeCollection {
  const sorted = [...recipes].sort(byMealDbId)
  sorted.forEach((recipe, index) => {
    if (index > 0 && recipe.id === sorted[index - 1]?.id) {
      throw new Error(`Duplicate recipe id ${recipe.id}`)
    }
  })
  return LocalRecipeCollectionSchema.parse({ version: 1, recipes: sorted })
}

/** 2-space JSON with a trailing newline: the format prettier would leave alone. */
export function toJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`
}

/** Contains fish but no meat: pescatarian without being vegetarian. */
export function isSeafood(recipe: Pick<LocalRecipe, 'diets'>): boolean {
  return recipe.diets.includes('pescatarian') && !recipe.diets.includes('vegetarian')
}

export interface DatasetStats {
  total: number
  /** Recipes carrying each diet tag. */
  diets: Record<Diet, number>
  seafood: number
  mena: number
  desserts: number
  /** Recipes whose tags a person reviewed (dietsEstimated false). */
  reviewed: number
  /** Count per cuisine, largest first, then A–Z. */
  cuisines: Array<[cuisine: string, count: number]>
}

export function datasetStats(recipes: readonly LocalRecipe[]): DatasetStats {
  const diets = Object.fromEntries(DIETS.map((diet) => [diet, 0])) as Record<Diet, number>
  const cuisines = new Map<string, number>()
  for (const recipe of recipes) {
    recipe.diets.forEach((diet) => diets[diet]++)
    cuisines.set(recipe.cuisine, (cuisines.get(recipe.cuisine) ?? 0) + 1)
  }
  const count = (test: (recipe: LocalRecipe) => boolean) => recipes.filter(test).length
  return {
    total: recipes.length,
    diets,
    seafood: count(isSeafood),
    mena: count((recipe) => MENA_CUISINES.has(recipe.cuisine)),
    desserts: count((recipe) => recipe.category === DESSERT_CATEGORY),
    reviewed: count((recipe) => !recipe.dietsEstimated),
    cuisines: [...cuisines].sort(([a, x], [b, y]) => y - x || a.localeCompare(b)),
  }
}

function percent(count: number, total: number): string {
  return total === 0 ? '0%' : `${((count / total) * 100).toFixed(1)}%`
}

/** The printed summary: diet balance first, then one line per cuisine. */
export function formatStats(stats: DatasetStats): string {
  const { total } = stats
  const share = (label: string, count: number) =>
    `  ${label.padEnd(14)} ${String(count).padStart(4)}  ${percent(count, total)}`
  const width = Math.max(...stats.cuisines.map(([cuisine]) => cuisine.length), 7)
  return [
    `Recipes: ${total} (${stats.reviewed} with reviewed diet tags)`,
    ...DIETS.map((diet) => share(diet, stats.diets[diet])),
    share('seafood', stats.seafood),
    share('MENA', stats.mena),
    share('desserts', stats.desserts),
    `Cuisines: ${stats.cuisines.length}`,
    ...stats.cuisines.map(([cuisine, count]) => `  ${cuisine.padEnd(width)} ${count}`),
  ].join('\n')
}
