'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchSearchPage, searchQueryKey } from '@/lib/search/client'
import type { SearchParams } from '@/types/recipe'

/** Paged search ("Load more"), keyed by the order-independent pantry. Disabled until a chip exists. */
export function useRecipeSearch(params: SearchParams) {
  return useInfiniteQuery({
    queryKey: searchQueryKey(params),
    queryFn: ({ pageParam, signal }) => fetchSearchPage(params, pageParam, { signal }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: params.ingredients.length > 0,
  })
}
