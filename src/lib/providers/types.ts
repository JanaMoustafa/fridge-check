import type { RecipeDetail, RecipeSource, RecipeSummary, SearchParams } from '@/types/recipe'

/** The user's pantry, used to compute have/need on a recipe detail. */
export interface MatchContext {
  ingredients: readonly string[]
  assumeStaples: boolean
}

/**
 * The one interface every recipe source implements. UI and route code depend only on this,
 * never on a specific API (spec §3.1).
 */
export interface RecipeProvider {
  id: RecipeSource
  /** All matching recipes, scored, filtered by diets (AND) and sorted; paging happens above. */
  search(params: SearchParams): Promise<RecipeSummary[]>
  /**
   * Full recipe by namespaced id ("local:52772"). Match fields are computed against `context`
   * (an empty pantry when omitted). Throws RecipeNotFoundError for unknown ids.
   */
  getById(id: string, context?: MatchContext): Promise<RecipeDetail>
}

export class RecipeNotFoundError extends Error {
  constructor(readonly recipeId: string) {
    super(`Recipe not found: ${recipeId}`)
    this.name = 'RecipeNotFoundError'
  }
}
