import type { SearchResponse } from '@/types/api'
import type { RecipeSource } from '@/types/recipe'

/**
 * CDN caching for the API routes. Identical searches share one CDN entry (the client sends a
 * canonical, sorted query string). Spoonacular's terms allow keeping its data for an hour in
 * total, so its half hour at the CDN comes on top of at most half an hour in server memory, with
 * no stale serving. A fallback answer is kept for a minute only, so the remote provider is tried
 * again soon.
 */
export function searchCacheControl(body: Pick<SearchResponse, 'provider' | 'notice'>): string {
  if (body.notice === 'fallback-local') return 'public, max-age=0, s-maxage=60'
  if (body.provider === 'spoonacular') return 'public, max-age=0, s-maxage=1800'
  return 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
}

/**
 * Recipe details change rarely: a day at the CDN, then revalidated in the background, except
 * Spoonacular's (half an hour, as above) and a fallback answer for another source's id (a minute).
 */
export function detailCacheControl(requested: RecipeSource, served: RecipeSource): string {
  if (requested !== served) return 'public, max-age=0, s-maxage=60'
  if (served === 'spoonacular') return 'public, max-age=0, s-maxage=1800'
  return 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
}
