import 'server-only'
import type { z } from 'zod'
import { getLocalRecipes } from '@/lib/data/local-recipes'
import { rankRecipes, scoreRecipe, type MatchResult } from '@/lib/matching'
import {
  RecipeDetailSchema,
  RecipeSummarySchema,
  SearchParamsSchema,
  type Diet,
  type LocalRecipe,
  type RecipeDetail,
  type RecipeSummary,
} from '@/types/recipe'
import { MatchContextSchema } from './records'
import { RecipeNotFoundError, type MatchContext, type RecipeProvider } from './types'

/** Returns already-validated recipes (getLocalRecipes validates data/recipes.json on load). */
export type LoadLocalRecipes = () => Promise<LocalRecipe[]> | LocalRecipe[]

const NO_CONTEXT: MatchContext = { ingredients: [], assumeStaples: true }

/**
 * Output checks run in development and tests only. Every output field is copied from recipes that
 * passed LocalRecipeCollectionSchema or from engine results built from them and from validated
 * params, so in production a second parse would re-prove the same facts on every request; outside
 * production it catches drift between the engine, this mapping and the shared schemas.
 */
function checked<T>(schema: z.ZodType<T>, value: T): T {
  return process.env.NODE_ENV === 'production' ? value : schema.parse(value)
}

/** AND logic: a recipe passes when it carries every requested diet. */
function hasDiets(recipe: LocalRecipe, diets: readonly Diet[]): boolean {
  return diets.every((diet) => recipe.diets.includes(diet))
}

/** Fresh arrays throughout, so callers can never mutate the shared, process-wide dataset. */
function toSummary(recipe: LocalRecipe, match: MatchResult): RecipeSummary {
  return {
    id: recipe.id,
    source: 'local',
    title: recipe.title,
    imageUrl: recipe.imageUrl,
    diets: [...recipe.diets],
    dietsEstimated: recipe.dietsEstimated,
    usedIngredients: [...match.usedIngredients],
    missingIngredients: [...match.missingIngredients],
    matchedUserIngredients: [...match.matchedUserIngredients],
    matchScore: match.matchScore,
  }
}

function toDetail(recipe: LocalRecipe, match: MatchResult): RecipeDetail {
  return {
    ...toSummary(recipe, match),
    ingredients: recipe.ingredients.map((ingredient) => ({ ...ingredient })),
    instructions: [...recipe.instructions],
    cuisine: recipe.cuisine,
    sourceUrl: recipe.sourceUrl,
    attribution: recipe.attribution,
  }
}

/**
 * The built-in collection as a RecipeProvider: the fallback when a remote API fails and the
 * default source without keys. Everything is in memory, so search scores every recipe each time.
 */
export function createLocalProvider(load: LoadLocalRecipes): RecipeProvider {
  return {
    id: 'local',

    async search(input) {
      const params = SearchParamsSchema.parse(input)
      // Diets first: filtering never changes a score, and fewer recipes are scored.
      const eligible = (await load()).filter((recipe) => hasDiets(recipe, params.diets))
      const ranked = rankRecipes(params.ingredients, eligible, {
        assumeStaples: params.assumeStaples,
        sort: params.sort,
      })
      return ranked.map((result) => checked(RecipeSummarySchema, toSummary(result, result)))
    },

    async getById(id, context = NO_CONTEXT) {
      const pantry = MatchContextSchema.parse(context)
      const recipe = (await load()).find((candidate) => candidate.id === id)
      if (recipe === undefined) throw new RecipeNotFoundError(id)
      const match = scoreRecipe(pantry.ingredients, recipe, {
        assumeStaples: pantry.assumeStaples,
      })
      return checked(RecipeDetailSchema, toDetail(recipe, match))
    },
  }
}

/** The production instance, backed by data/recipes.json. */
export const localProvider = createLocalProvider(getLocalRecipes)
