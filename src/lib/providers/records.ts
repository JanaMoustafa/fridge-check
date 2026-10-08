import 'server-only'
import { z } from 'zod'
import { rankRecipes, scoreRecipe, type MatchResult } from '@/lib/matching'
import {
  CanonicalNameSchema,
  IngredientSchema,
  MAX_INGREDIENT_LENGTH,
  MAX_INGREDIENTS,
  RecipeDetailSchema,
  RecipeSummarySchema,
  type Diet,
  type RecipeDetail,
  type RecipeSummary,
  type SearchParams,
} from '@/types/recipe'
import type { MatchContext } from './types'

/** The pantry on a detail page: the search's ingredient rules, but it may be empty. */
export const MatchContextSchema = z.object({
  ingredients: z.array(CanonicalNameSchema.max(MAX_INGREDIENT_LENGTH)).max(MAX_INGREDIENTS),
  assumeStaples: z.boolean(),
})

type MatchField = 'usedIngredients' | 'missingIngredients' | 'matchedUserIngredients' | 'matchScore'

/** A remote recipe before it is scored: what an API told us, mapped to our shape. */
export type RecipeRecord = Omit<RecipeDetail, MatchField>

/**
 * What ranking needs: a card's fields plus the ingredient names to score. Search results can
 * be this lighter shape (Spoonacular's are fetched without steps, which cost points and which
 * cards never show); a full RecipeRecord is one too.
 */
export type SearchRecord = Pick<
  RecipeRecord,
  | 'id'
  | 'source'
  | 'title'
  | 'imageUrl'
  | 'readyInMinutes'
  | 'servings'
  | 'diets'
  | 'dietsEstimated'
  | 'ingredients'
>

const SearchIngredientsSchema = z.array(IngredientSchema).min(1)

const UNSCORED: MatchResult = {
  usedIngredients: [],
  missingIngredients: [],
  matchedUserIngredients: [],
  matchScore: 0,
}

/**
 * Validates a mapped API record with the shared detail schema (so a remote recipe can never
 * carry what a local one could not). Null when it is not a usable recipe, e.g. no steps.
 */
export function parseRecord(candidate: RecipeRecord): RecipeRecord | null {
  const result = RecipeDetailSchema.safeParse({ ...candidate, ...UNSCORED })
  if (!result.success) return null
  const {
    usedIngredients: _used,
    missingIngredients: _missing,
    matchedUserIngredients: _matched,
    matchScore: _score,
    ...record
  } = result.data
  return record
}

/** parseRecord for a search result: the summary schema, plus at least one ingredient. */
export function parseSearchRecord(candidate: SearchRecord): SearchRecord | null {
  const { ingredients, ...card } = candidate
  const summary = RecipeSummarySchema.safeParse({ ...card, ...UNSCORED })
  const lines = SearchIngredientsSchema.safeParse(ingredients)
  if (!summary.success || !lines.success) return null
  const {
    usedIngredients: _used,
    missingIngredients: _missing,
    matchedUserIngredients: _matched,
    matchScore: _score,
    ...fields
  } = summary.data
  return { ...fields, ingredients: lines.data }
}

function toSummary(record: SearchRecord, match: MatchResult): RecipeSummary {
  return {
    id: record.id,
    source: record.source,
    title: record.title,
    imageUrl: record.imageUrl,
    readyInMinutes: record.readyInMinutes,
    servings: record.servings,
    diets: [...record.diets],
    dietsEstimated: record.dietsEstimated,
    usedIngredients: [...match.usedIngredients],
    missingIngredients: [...match.missingIngredients],
    matchedUserIngredients: [...match.matchedUserIngredients],
    matchScore: match.matchScore,
  }
}

/** AND logic, as for the local collection: a recipe passes when it carries every diet. */
function hasDiets(record: SearchRecord, diets: readonly Diet[]): boolean {
  return diets.every((diet) => record.diets.includes(diet))
}

/**
 * Filters by diet, then scores and sorts with the shared engine, so remote results are ranked by
 * exactly the rules local ones are (whatever order or scores the API itself used).
 */
export function rankRecords(
  records: readonly SearchRecord[],
  params: SearchParams,
): RecipeSummary[] {
  const eligible = records.filter((record) => hasDiets(record, params.diets))
  return rankRecipes(params.ingredients, eligible, {
    assumeStaples: params.assumeStaples,
    sort: params.sort,
  }).map((result) => toSummary(result, result))
}

/** A record scored against a detail page's pantry. */
export function scoreRecord(record: RecipeRecord, context: MatchContext): RecipeDetail {
  const match = scoreRecipe(context.ingredients, record, { assumeStaples: context.assumeStaples })
  return {
    ...toSummary(record, match),
    ingredients: record.ingredients.map((ingredient) => ({ ...ingredient })),
    instructions: [...record.instructions],
    cuisine: record.cuisine,
    sourceUrl: record.sourceUrl,
    attribution: record.attribution,
  }
}
