import 'server-only'
import { ProviderError } from '@/lib/providers/http'
import type { ProviderRegistry } from '@/lib/providers/registry'
import type { RecipeProvider } from '@/lib/providers/types'
import type { SearchQuery } from '@/lib/search/query'
import { SEARCH_PAGE_SIZE, type SearchResponse } from '@/types/api'
import type { RecipeSummary } from '@/types/recipe'

/** Why a remote provider was skipped, for the server log (never a URL, header or key). */
export function describeFailure(error: unknown): string {
  if (error instanceof ProviderError) return error.message
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error)
}

/**
 * Ranked results from the configured provider, or from the built-in collection when a remote
 * provider fails for any reason (quota, rate limit, timeout, outage, unexpected data): the
 * response then says so with notice "fallback-local".
 */
async function rankedResults(
  registry: Pick<ProviderRegistry, 'primary' | 'local'>,
  query: SearchQuery,
): Promise<{ ranked: RecipeSummary[]; provider: RecipeProvider; fellBack: boolean }> {
  const params = {
    ingredients: query.ingredients,
    diets: query.diets,
    sort: query.sort,
    assumeStaples: query.assumeStaples,
  }
  const { primary, local } = registry
  try {
    return { ranked: await primary.search(params), provider: primary, fellBack: false }
  } catch (error) {
    if (primary === local) throw error
    console.warn(`[search] ${primary.id} failed (${describeFailure(error)}); using local recipes`)
    return { ranked: await local.search(params), provider: local, fellBack: true }
  }
}

/** One page of ranked results ("Load more" asks for the next page). */
export async function searchRecipes(
  registry: Pick<ProviderRegistry, 'primary' | 'local'>,
  query: SearchQuery,
): Promise<SearchResponse> {
  const { ranked, provider, fellBack } = await rankedResults(registry, query)
  const start = (query.page - 1) * SEARCH_PAGE_SIZE
  return {
    results: ranked.slice(start, start + SEARCH_PAGE_SIZE),
    total: ranked.length,
    page: query.page,
    pageSize: SEARCH_PAGE_SIZE,
    hasMore: start + SEARCH_PAGE_SIZE < ranked.length,
    provider: provider.id,
    ...(fellBack ? { notice: 'fallback-local' as const } : {}),
  }
}
