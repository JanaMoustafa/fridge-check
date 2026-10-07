import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { GET as getDetail } from '@/app/api/recipes/[provider]/[id]/route'
import { GET } from '@/app/api/recipes/search/route'
import { createLocalProvider } from '@/lib/providers/local'
import { searchRecipes } from '@/lib/server/search'
import { ApiErrorSchema, SEARCH_PAGE_SIZE, SearchResponseSchema } from '@/types/api'
import type { LocalRecipe } from '@/types/recipe'
import fixture from '../fixtures/local-recipes.sample.json'

const request = (query: string) =>
  new NextRequest(new URL(`http://localhost/api/recipes/search?${query}`))

describe('GET /api/recipes/search', () => {
  it('returns a validated, cacheable page of results', async () => {
    const response = await GET(request('ingredients=rice,onion,lentil'))
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('s-maxage=3600')
    const body = SearchResponseSchema.parse(await response.json())
    expect(body.provider).toBe('local')
    expect(body.page).toBe(1)
    expect(body.results.length).toBeGreaterThan(0)
    expect(body.results.length).toBeLessThanOrEqual(SEARCH_PAGE_SIZE)
  })

  it('answers 400 with readable issues for invalid input', async () => {
    const response = await GET(request('ingredients=<script>&diets=keto'))
    expect(response.status).toBe(400)
    const body = ApiErrorSchema.parse(await response.json())
    expect(body.error.code).toBe('invalid-request')
    expect(body.error.issues?.map((issue) => issue.path)).toEqual(
      expect.arrayContaining(['ingredients.0', 'diets.0']),
    )
  })
})

describe('searchRecipes paging', () => {
  const base = (fixture as { recipes: LocalRecipe[] }).recipes
  // 45 recipes that all share an ingredient, so paging is exercised.
  const many = Array.from({ length: 45 }, (_, i) => ({
    ...base[0]!,
    id: `local:${90000 + i}`,
    mealDbId: String(90000 + i),
    title: `Dish ${i}`,
  }))
  const provider = createLocalProvider(() => many)
  const query = {
    ingredients: [base[0]!.ingredients[0]!.name],
    diets: [],
    sort: 'fewest-missing' as const,
    assumeStaples: true,
  }

  it('slices pages of 20 and reports hasMore', async () => {
    const first = await searchRecipes(provider, { ...query, page: 1 })
    const third = await searchRecipes(provider, { ...query, page: 3 })
    expect([first.total, first.results.length, first.hasMore]).toEqual([45, 20, true])
    expect([third.results.length, third.hasMore]).toEqual([5, false])
    const second = await searchRecipes(provider, { ...query, page: 2 })
    const ids = [...first.results, ...second.results, ...third.results].map((r) => r.id)
    expect(new Set(ids).size).toBe(45)
  })
})

describe('GET /api/recipes/[provider]/[id]', () => {
  const call = (provider: string, id: string) =>
    getDetail(new NextRequest(new URL(`http://localhost/api/recipes/${provider}/${id}`)), {
      params: Promise.resolve({ provider, id }),
    })

  it('returns a cacheable recipe', async () => {
    const response = await call('local', '53027')
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('s-maxage=86400')
    expect(await response.json()).toMatchObject({ id: 'local:53027', title: 'Koshari' })
  })

  it('answers 404 for an unknown recipe and 400 for a malformed id', async () => {
    expect((await call('local', '99999999')).status).toBe(404)
    expect((await call('pantry', '1')).status).toBe(400)
  })
})
