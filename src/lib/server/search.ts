import 'server-only'
import type { RecipeProvider } from '@/lib/providers/types'
import type { SearchQuery } from '@/lib/search/query'
import { SEARCH_PAGE_SIZE, type SearchResponse } from '@/types/api'

/** One page of ranked results ("Load more" asks for the next page). */
export async function searchRecipes(
  provider: RecipeProvider,
  query: SearchQuery,
): Promise<SearchResponse> {
  const ranked = await provider.search({
    ingredients: query.ingredients,
    diets: query.diets,
    sort: query.sort,
    assumeStaples: query.assumeStaples,
  })
  const start = (query.page - 1) * SEARCH_PAGE_SIZE
  return {
    results: ranked.slice(start, start + SEARCH_PAGE_SIZE),
    total: ranked.length,
    page: query.page,
    pageSize: SEARCH_PAGE_SIZE,
    hasMore: start + SEARCH_PAGE_SIZE < ranked.length,
    provider: provider.id,
  }
}
