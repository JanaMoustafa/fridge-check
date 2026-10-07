import { describe, expect, it, vi } from 'vitest'
import { fetchRecipeDetail, fetchSearchPage, SearchRequestError, searchQueryKey } from './client'

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

describe('fetchRecipeDetail', () => {
  const detail = {
    id: 'local:1',
    source: 'local',
    title: 'Koshari',
    diets: [],
    dietsEstimated: false,
    usedIngredients: [],
    missingIngredients: [],
    matchedUserIngredients: [],
    matchScore: 0,
    ingredients: [{ raw: '1 cup Rice', name: 'rice' }],
    instructions: ['Cook.'],
  }

  it('fetches and validates a recipe', async () => {
    const fetchImpl = fakeFetch(200, detail)
    await expect(fetchRecipeDetail('local:1', { fetchImpl })).resolves.toMatchObject({
      title: 'Koshari',
    })
    expect(fetchImpl).toHaveBeenCalledWith('/api/recipes/local/1', expect.anything())
  })

  it('rejects an invalid id without a request', async () => {
    const fetchImpl = fakeFetch(200, detail)
    await expect(fetchRecipeDetail('nope', { fetchImpl })).rejects.toBeInstanceOf(
      SearchRequestError,
    )
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('throws the API error code on failure', async () => {
    const fetchImpl = fakeFetch(404, { error: { code: 'not-found', message: 'x' } })
    await expect(fetchRecipeDetail('local:9', { fetchImpl })).rejects.toMatchObject({
      code: 'not-found',
    })
    const broken = vi.fn(async () => new Response('oops', { status: 500 }))
    await expect(fetchRecipeDetail('local:9', { fetchImpl: broken })).rejects.toMatchObject({
      code: 'unknown',
    })
  })
})
