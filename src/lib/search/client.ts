import { ApiErrorSchema, SearchResponseSchema, type SearchResponse } from '@/types/api'
import { RecipeDetailSchema, type RecipeDetail, type SearchParams } from '@/types/recipe'
import { splitRecipeId } from './links'
import { toSearchQueryString } from './query'

export class SearchRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(`Search failed (${status} ${code})`)
    this.name = 'SearchRequestError'
  }
}

/** Fetches one page and validates it: the browser never trusts a response shape. */
export async function fetchSearchPage(
  params: SearchParams,
  page: number,
  { signal, fetchImpl = fetch }: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<SearchResponse> {
  const response = await fetchImpl(`/api/recipes/search?${toSearchQueryString(params, page)}`, {
    signal,
    headers: { accept: 'application/json' },
  })
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error = ApiErrorSchema.safeParse(body)
    throw new SearchRequestError(response.status, error.success ? error.data.error.code : 'unknown')
  }
  return SearchResponseSchema.parse(body)
}

/** Full recipe (no pantry), e.g. to complete a favorite saved from a card. */
export async function fetchRecipeDetail(
  id: string,
  { signal, fetchImpl = fetch }: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<RecipeDetail> {
  const parts = splitRecipeId(id)
  if (!parts) throw new SearchRequestError(400, 'invalid-request')
  const response = await fetchImpl(`/api/recipes/${parts.source}/${parts.key}`, {
    signal,
    headers: { accept: 'application/json' },
  })
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error = ApiErrorSchema.safeParse(body)
    throw new SearchRequestError(response.status, error.success ? error.data.error.code : 'unknown')
  }
  return RecipeDetailSchema.parse(body)
}

/** TanStack Query key: order-independent, so the same pantry hits the same cache entry. */
export function searchQueryKey(params: SearchParams) {
  return [
    'search',
    1,
    [...params.ingredients].sort(),
    [...params.diets].sort(),
    params.sort,
    params.assumeStaples,
  ] as const
}
