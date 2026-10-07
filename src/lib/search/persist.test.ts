import { describe, expect, it } from 'vitest'
import { deserializePersistedCache } from './persist'

const response = {
  results: [],
  total: 0,
  page: 1,
  pageSize: 20,
  hasMore: false,
  provider: 'local',
}

const query = (queryKey: unknown[], data: unknown) => ({
  queryKey,
  queryHash: JSON.stringify(queryKey),
  state: { data, status: 'success', dataUpdatedAt: 1 },
})

const client = (queries: unknown[]) =>
  JSON.stringify({ timestamp: 1, buster: 'search-v1', clientState: { mutations: [], queries } })

describe('deserializePersistedCache', () => {
  it('keeps valid search queries', () => {
    const restored = deserializePersistedCache(
      client([query(['search', 1, ['egg']], { pages: [response], pageParams: [1] })]),
    )
    expect(restored.clientState.queries).toHaveLength(1)
  })

  it('drops invalid or foreign queries but keeps the rest', () => {
    const restored = deserializePersistedCache(
      client([
        query(['search', 1, ['egg']], { pages: [response], pageParams: [1] }),
        query(['search', 1, ['milk']], { pages: [{ ...response, total: -1 }], pageParams: [1] }),
        query(['other'], { anything: true }),
        'not a query',
      ]),
    )
    expect(restored.clientState.queries.map((q) => q.queryKey[2])).toEqual([['egg']])
  })

  it('rejects a corrupt cache entirely', () => {
    expect(() => deserializePersistedCache('{oops')).toThrow()
    expect(() => deserializePersistedCache('{"timestamp":"now"}')).toThrow()
  })
})
