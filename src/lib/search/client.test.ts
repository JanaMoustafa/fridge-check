import { describe, expect, it, vi } from 'vitest'
import { fetchSearchPage, SearchRequestError, searchQueryKey } from './client'

const params = {
  ingredients: ['tomato', 'egg'],
  diets: [],
  sort: 'fewest-missing' as const,
  assumeStaples: true,
}
const ok = { results: [], total: 0, page: 1, pageSize: 20, hasMore: false, provider: 'local' }

function fakeFetch(status: number, body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }))
}

describe('fetchSearchPage', () => {
  it('requests the canonical query string and validates the response', async () => {
    const fetchImpl = fakeFetch(200, ok)
    await expect(fetchSearchPage(params, 2, { fetchImpl })).resolves.toEqual(ok)
    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/recipes/search?ingredients=egg%2Ctomato&page=2',
      expect.objectContaining({ headers: { accept: 'application/json' } }),
    )
  })

  it('throws a typed error with the API error code', async () => {
    const fetchImpl = fakeFetch(400, { error: { code: 'invalid-request', message: 'x' } })
    await expect(fetchSearchPage(params, 1, { fetchImpl })).rejects.toMatchObject({
      status: 400,
      code: 'invalid-request',
    })
  })

  it('copes with a non-JSON error body', async () => {
    const fetchImpl = vi.fn(async () => new Response('Bad gateway', { status: 502 }))
    const error = await fetchSearchPage(params, 1, { fetchImpl }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(SearchRequestError)
    expect(error).toMatchObject({ status: 502, code: 'unknown' })
  })

  it('rejects a malformed success body', async () => {
    await expect(
      fetchSearchPage(params, 1, { fetchImpl: fakeFetch(200, { results: 'nope' }) }),
    ).rejects.toThrow()
  })
})

describe('searchQueryKey', () => {
  it('does not depend on chip or diet order', () => {
    expect(searchQueryKey({ ...params, diets: ['vegan', 'dairy-free'] })).toEqual(
      searchQueryKey({ ...params, ingredients: ['egg', 'tomato'], diets: ['dairy-free', 'vegan'] }),
    )
  })
})
