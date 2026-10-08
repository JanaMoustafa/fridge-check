import 'server-only'
import { cache } from 'react'
import type { MatchResult } from '@/lib/matching/types'
import { ProviderError } from '@/lib/providers/http'
import { getRegistry, type ProviderRegistry } from '@/lib/providers/registry'
import { nextUtcMidnight } from '@/lib/providers/spoonacular'
import { RecipeNotFoundError, type MatchContext } from '@/lib/providers/types'
import { splitRecipeId } from '@/lib/search/links'
import type { ApiError } from '@/types/api'
import type { RecipeDetail } from '@/types/recipe'
import { describeFailure } from './search'

export interface RecipePageData {
  recipe: RecipeDetail
  withStaples: MatchResult
  withoutStaples: MatchResult
}

/** Why a remote recipe cannot be shown right now (its id is fine; its source is not answering). */
export interface RecipeUnavailable {
  source: ProviderError['provider']
  /** quota: the day's API points are used up; outage: timeout, network, rate limit, bad answer. */
  reason: 'quota' | 'outage'
  /** When the source answers again (ms since epoch): the next 00:00 UTC for a used-up quota. */
  retryAt?: number
}

export type RecipePageResult =
  | ({ kind: 'found' } & RecipePageData)
  | { kind: 'not-found' }
  | ({ kind: 'unavailable' } & RecipeUnavailable)

type Registry = Pick<ProviderRegistry, 'forSource' | 'local'>

/** A remote provider's failure as something to tell the user; null for anything else (a bug). */
export function unavailableFrom(
  error: unknown,
  now: number = Date.now(),
): RecipeUnavailable | null {
  if (!(error instanceof ProviderError)) return null
  return error.kind === 'quota'
    ? { source: error.provider, reason: 'quota', retryAt: nextUtcMidnight(now) }
    : { source: error.provider, reason: 'outage' }
}

/**
 * A recipe by namespaced id from the provider for its source; null when the id is malformed,
 * unknown or from a source that is not configured. When TheMealDB cannot be reached, a meal that
 * is also in the built-in collection is served from there (same recipe, reviewed tags).
 */
export async function getRecipe(
  id: string,
  context: MatchContext,
  registry: Registry = getRegistry(),
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

/** 503 for the API: when to retry (until the quota resets, else a minute), never cached. */
export function unavailableResponse(
  unavailable: RecipeUnavailable,
  now: number = Date.now(),
): Response {
  const body: ApiError = {
    error: {
      code: 'unavailable',
      message:
        unavailable.reason === 'quota'
          ? 'The recipe source has used its daily quota.'
          : 'The recipe source is not answering.',
    },
  }
  const retryAfter =
    unavailable.retryAt === undefined
      ? 60
      : Math.max(1, Math.ceil((unavailable.retryAt - now) / 1000))
  return Response.json(body, {
    status: 503,
    headers: { 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' },
  })
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
 * staples (the staples setting lives in the browser): found, not found (unknown or malformed
 * id) or unavailable (its source is out of quota or not answering, and no local copy exists).
 */
export async function recipePageResult(
  registry: Registry,
  source: string,
  key: string,
  pantryKey: string,
): Promise<RecipePageResult> {
  const id = `${source}:${key}`
  const ingredients = pantryKey ? pantryKey.split(',') : []
  try {
    const [withStaples, withoutStaples] = await Promise.all([
      getRecipe(id, { ingredients, assumeStaples: true }, registry),
      getRecipe(id, { ingredients, assumeStaples: false }, registry),
    ])
    if (!withStaples || !withoutStaples) return { kind: 'not-found' }
    return {
      kind: 'found',
      recipe: withStaples,
      withStaples: matchOf(withStaples),
      withoutStaples: matchOf(withoutStaples),
    }
  } catch (error) {
    const unavailable = unavailableFrom(error)
    if (unavailable) return { kind: 'unavailable', ...unavailable }
    throw error
  }
}

/**
 * recipePageResult with the process registry, cached per request so metadata and the page share
 * one lookup; remote providers also cache the recipe itself, so the two scorings cost one call.
 */
export const loadRecipePage = cache(
  (source: string, key: string, pantryKey: string): Promise<RecipePageResult> =>
    recipePageResult(getRegistry(), source, key, pantryKey),
)
