import { z } from 'zod'
import { SearchResponseSchema } from '@/types/api'

export const QUERY_CACHE_KEY = 'fc:query-cache:v1'
/** Bump when the response shape changes: an old cache is then dropped, not reused. */
export const QUERY_CACHE_BUSTER = 'search-v1'
export const QUERY_CACHE_MAX_AGE = 60 * 60 * 1000

const SearchPagesSchema = z.object({
  pages: z.array(SearchResponseSchema),
  pageParams: z.array(z.number().int().positive()),
})

const PersistedQuerySchema = z.looseObject({
  queryKey: z.array(z.unknown()),
  queryHash: z.string(),
  state: z.looseObject({ data: z.unknown() }),
})

const PersistedClientSchema = z.object({
  timestamp: z.number(),
  buster: z.string(),
  clientState: z.object({
    mutations: z.array(z.unknown()),
    queries: z.array(z.unknown()),
  }),
})

/**
 * The session cache comes back from sessionStorage, so it is untrusted: a corrupt file is
 * rejected (TanStack then starts empty) and any single query whose data no longer matches the
 * response schema is dropped while the valid ones are kept.
 */
export function deserializePersistedCache(text: string) {
  const client = PersistedClientSchema.parse(JSON.parse(text))
  const queries = client.clientState.queries.flatMap((query) => {
    const parsed = PersistedQuerySchema.safeParse(query)
    if (!parsed.success) return []
    if (parsed.data.queryKey[0] !== 'search') return []
    return SearchPagesSchema.safeParse(parsed.data.state.data).success ? [parsed.data] : []
  })
  return { ...client, clientState: { mutations: [], queries } }
}
