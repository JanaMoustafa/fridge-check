import 'server-only'
import { cache } from 'react'
import type { MatchResult } from '@/lib/matching/types'
import { getRegistry, type ProviderRegistry } from '@/lib/providers/registry'
import { RecipeNotFoundError, type MatchContext } from '@/lib/providers/types'
import { splitRecipeId } from '@/lib/search/links'
import type { RecipeDetail } from '@/types/recipe'
import { describeFailure } from './search'

export interface RecipePageData {
  recipe: RecipeDetail
  withStaples: MatchResult
  withoutStaples: MatchResult
}

/**
 * A recipe by namespaced id from the provider for its source; null when the id is malformed,
 * unknown or from a source that is not configured. When TheMealDB cannot be reached, a meal that
 * is also in the built-in collection is served from there (same recipe, reviewed tags).
 */
export async function getRecipe(
  id: string,
  context: MatchContext,
  registry: Pick<ProviderRegistry, 'forSource' | 'local'> = getRegistry(),
): Promise<RecipeDetail | null> {
  const parts = splitRecipeId(id)
  const provider = parts && registry.forSource(parts.source)
  if (!parts || !provider) return null
  try {
    return await provider.getById(id, context)
  } catch (error) {
    if (error instanceof RecipeNotFoundError) return null
    if (parts.source !== 'mealdb') throw error
    console.warn(`[recipe] mealdb failed (${describeFailure(error)}); trying local recipes`)
    try {
      return await registry.local.getById(`local:${parts.key}`, context)
    } catch (fallbackError) {
      if (fallbackError instanceof RecipeNotFoundError) throw error
      throw fallbackError
    }
  }
}

function matchOf(recipe: RecipeDetail): MatchResult {
  return {
    usedIngredients: recipe.usedIngredients,
    missingIngredients: recipe.missingIngredients,
    matchedUserIngredients: recipe.matchedUserIngredients,
    matchScore: recipe.matchScore,
  }
}

/**
 * The recipe for /recipe/<source>/<key>, scored against the pantry both with and without
 * staples (the staples setting lives in the browser). Null for an unknown or malformed id.
 * Cached per request, so metadata and the page share one lookup; remote providers also cache
 * the recipe itself, so the two scorings cost one API call.
 */
export const loadRecipePage = cache(
  async (source: string, key: string, pantryKey: string): Promise<RecipePageData | null> => {
    const id = `${source}:${key}`
    const ingredients = pantryKey ? pantryKey.split(',') : []
    const [withStaples, withoutStaples] = await Promise.all([
      getRecipe(id, { ingredients, assumeStaples: true }),
      getRecipe(id, { ingredients, assumeStaples: false }),
    ])
    if (!withStaples || !withoutStaples) return null
    return {
      recipe: withStaples,
      withStaples: matchOf(withStaples),
      withoutStaples: matchOf(withoutStaples),
    }
  },
)
