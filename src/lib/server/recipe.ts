import 'server-only'
import { cache } from 'react'
import type { MatchResult } from '@/lib/matching/types'
import { getRecipeProvider } from '@/lib/providers/registry'
import { RecipeNotFoundError } from '@/lib/providers/types'
import { splitRecipeId } from '@/lib/search/links'
import type { RecipeDetail } from '@/types/recipe'

export interface RecipePageData {
  recipe: RecipeDetail
  withStaples: MatchResult
  withoutStaples: MatchResult
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
 * Cached per request, so metadata and the page share one lookup.
 */
export const loadRecipePage = cache(
  async (source: string, key: string, pantryKey: string): Promise<RecipePageData | null> => {
    const id = `${source}:${key}`
    if (!splitRecipeId(id)) return null
    const ingredients = pantryKey ? pantryKey.split(',') : []
    const provider = getRecipeProvider()
    try {
      const [withStaples, withoutStaples] = await Promise.all([
        provider.getById(id, { ingredients, assumeStaples: true }),
        provider.getById(id, { ingredients, assumeStaples: false }),
      ])
      return {
        recipe: withStaples,
        withStaples: matchOf(withStaples),
        withoutStaples: matchOf(withoutStaples),
      }
    } catch (error) {
      if (error instanceof RecipeNotFoundError) return null
      throw error
    }
  },
)
