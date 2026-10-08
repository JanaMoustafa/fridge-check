import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server, interceptExternalApis } from '../../../tests/msw/server'
import {
  quotaExceeded,
  SPOONACULAR_BASE,
  spoonacularHandlers,
  spoonacularRecipes,
  TEST_SPOONACULAR_KEY,
} from '../../../tests/msw/spoonacular'
import { RecipeDetailSchema, RecipeSummarySchema, type SearchParams } from '@/types/recipe'
import { ProviderError } from './http'
import {
  complexSearchQuery,
  createSpoonacularProvider,
  nextUtcMidnight,
  RESULTS_PER_SEARCH,
  SPOONACULAR_CACHE_MS,
  SpoonacularRecipeSchema,
  toSpoonacularRecord,
  toSpoonacularSearchRecord,
} from './spoonacular'
import { RecipeNotFoundError } from './types'

interceptExternalApis()

const params = (overrides: Partial<SearchParams> = {}): SearchParams => ({
  ingredients: ['pasta', 'garlic'],
  diets: [],
  sort: 'fewest-missing',
  assumeStaples: true,
  ...overrides,
})

function clock(start = Date.UTC(2026, 9, 7, 15, 0, 0)) {
  let time = start
  return { now: () => time, advance: (ms: number) => (time += ms) }
}

const record = (recipe: unknown) => toSpoonacularRecord(SpoonacularRecipeSchema.parse(recipe))

describe('complexSearchQuery', () => {
  it('asks for the recipes that use the most of the user’s ingredients, without steps', () => {
    expect(complexSearchQuery(params())).toEqual({
      includeIngredients: 'pasta,garlic',
      fillIngredients: 'true',
      addRecipeInformation: 'true',
      instructionsRequired: 'true',
      ignorePantry: 'true',
      sort: 'max-used-ingredients',
      number: String(RESULTS_PER_SEARCH),
    })
  })

  it('maps diets to Spoonacular’s names, and dairy-free to an intolerance', () => {
    const query = complexSearchQuery(
      params({ diets: ['vegan', 'gluten-free', 'pescatarian', 'dairy-free', 'vegetarian'] }),
    )
    expect(query?.diet).toBe('vegan,gluten free,pescetarian,vegetarian')
    expect(query?.intolerances).toBe('dairy')
  })

  it('leaves out assumed staples, and asks nothing when only staples are left', () => {
    expect(complexSearchQuery(params({ ingredients: ['salt', 'pasta'] }))?.includeIngredients).toBe(
      'pasta',
    )
    expect(complexSearchQuery(params({ ingredients: ['salt'] }))).toBeNull()
    const withStaples = complexSearchQuery(params({ ingredients: ['salt'], assumeStaples: false }))
    expect(withStaples).toMatchObject({ includeIngredients: 'salt', ignorePantry: 'false' })
  })
})

describe('toSpoonacularRecord', () => {
  it('maps a recipe to our shape with canonical ingredient names', () => {
    const pasta = record(spoonacularRecipes.pasta)!
    expect(pasta).toMatchObject({
      id: 'spoonacular:716429',
      source: 'spoonacular',
      readyInMinutes: 45,
      servings: 2,
      diets: ['vegetarian', 'pescatarian'],
      dietsEstimated: true,
      attribution: 'spoonacular',
      instructions: [
        'Cook the pasta in salted water until al dente.',
        'Brown the garlic and scallions in butter.',
        'Toss with cauliflower, breadcrumbs and parmesan.',
      ],
    })
    expect(pasta.ingredients.map((line) => line.name)).toEqual(
      expect.arrayContaining(['butter', 'garlic', 'pasta', 'green onion', 'salt']),
    )
    expect(pasta.ingredients.find((line) => line.name === 'breadcrumb')).toMatchObject({
      raw: '0.3333333333333333 cup breadcrumbs',
      amount: 0.333,
      unit: 'cup',
    })
    expect(pasta.ingredients.find((line) => line.name === 'salt')).toEqual({
      raw: 'salt to taste',
      name: 'salt',
    })
  })

  it('reads HTML instructions when there are no analyzed steps, and fixes a bare image name', () => {
    const jambalaya = record(spoonacularRecipes.jambalaya)!
    expect(jambalaya.instructions).toEqual([
      'Rinse the kidney beans & drain.',
      'Fry the onion, celery and pepper.',
      'Add the rice and simmer for 20–25 minutes.',
    ])
    expect(jambalaya.imageUrl).toBe('https://img.spoonacular.com/recipes/782601-312x231.jpg')
    expect(jambalaya.diets).toEqual([
      'vegetarian',
      'vegan',
      'gluten-free',
      'dairy-free',
      'pescatarian',
    ])
    expect(jambalaya.cuisine).toBe('Cajun')
    expect(jambalaya.sourceUrl).toBe(
      'http://www.foodandspice.com/2016/05/red-kidney-bean-jambalaya.html',
    )
  })

  it('takes search results’ used and missed lines as the ingredient list', () => {
    const { extendedIngredients, ...rest } = spoonacularRecipes.salad
    const fromSearch = record({
      ...rest,
      usedIngredients: extendedIngredients.slice(0, 2),
      missedIngredients: extendedIngredients.slice(2),
    })!
    expect(fromSearch.ingredients.map((line) => line.name)).toEqual([
      'pork tenderloin',
      'pasta',
      'tomato',
      'red onion',
      'basil',
    ])
    expect(fromSearch.diets).toEqual(['dairy-free'])
  })

  it('skips unusable lines and fields, and rejects a recipe with no steps', () => {
    const odd = record({
      ...spoonacularRecipes.salad,
      image: 'ftp://elsewhere/pic.png',
      readyInMinutes: 0,
      servings: null,
      sourceUrl: 'not a url',
      cuisines: ['  '],
      diets: ['pescatarian'],
      extendedIngredients: [
        ...spoonacularRecipes.salad.extendedIngredients,
        { name: '', original: 'mystery' },
        { name: 'Ω', original: 'Ω' },
      ],
    })!
    expect(odd.imageUrl).toBeUndefined()
    expect(odd.readyInMinutes).toBeUndefined()
    expect(odd.servings).toBeUndefined()
    expect(odd.sourceUrl).toBeUndefined()
    expect(odd.cuisine).toBeUndefined()
    expect(odd.diets).toEqual(['dairy-free', 'pescatarian'])
    expect(odd.ingredients).toHaveLength(5)
    expect(
      record({ ...spoonacularRecipes.salad, analyzedInstructions: null, instructions: null }),
    ).toBeNull()
  })
})

describe('toSpoonacularSearchRecord', () => {
  it('keeps a search result that has no steps (cards never show them)', () => {
    const { analyzedInstructions: _steps, ...withoutSteps } = spoonacularRecipes.salad
    const recipe = SpoonacularRecipeSchema.parse(withoutSteps)
    expect(toSpoonacularRecord(recipe)).toBeNull()
    expect(toSpoonacularSearchRecord(recipe)).toEqual({
      id: 'spoonacular:715538',
      source: 'spoonacular',
      title: 'Bruschetta Style Pork & Pasta Salad',
      imageUrl: 'https://img.spoonacular.com/recipes/715538-312x231.jpg',
      readyInMinutes: 35,
      servings: 2,
      diets: ['dairy-free'],
      dietsEstimated: true,
      ingredients: expect.arrayContaining([expect.objectContaining({ name: 'pasta' })]),
    })
  })

  it('rejects a search result without a usable ingredient or title', () => {
    const salad = { ...spoonacularRecipes.salad, extendedIngredients: [] }
    expect(toSpoonacularSearchRecord(SpoonacularRecipeSchema.parse(salad))).toBeNull()
    const untitled = { ...spoonacularRecipes.salad, title: '  ' }
    expect(toSpoonacularSearchRecord(SpoonacularRecipeSchema.parse(untitled))).toBeNull()
  })
})

describe('createSpoonacularProvider: search', () => {
  it('sends the key only in the x-api-key header and re-ranks with the shared engine', async () => {
    const requests: Request[] = []
    server.use(...spoonacularHandlers(requests))
    const spoonacular = createSpoonacularProvider({ apiKey: TEST_SPOONACULAR_KEY })
    const results = await spoonacular.search(
      params({ ingredients: ['pasta', 'garlic', 'cauliflower'] }),
    )
    for (const result of results) RecipeSummarySchema.parse(result)
    expect(results.map((result) => result.id)).toEqual(['spoonacular:716429', 'spoonacular:715538'])
    expect(results[0]!.matchedUserIngredients).toEqual(['pasta', 'garlic', 'cauliflower'])
    expect(requests).toHaveLength(1)
    expect(requests[0]!.headers.get('x-api-key')).toBe(TEST_SPOONACULAR_KEY)
    expect(requests[0]!.url).not.toContain(TEST_SPOONACULAR_KEY)
  })

  it('filters by diet with our tags too', async () => {
    server.use(...spoonacularHandlers())
    const spoonacular = createSpoonacularProvider({ apiKey: TEST_SPOONACULAR_KEY })
    const results = await spoonacular.search(
      params({ ingredients: ['rice', 'pasta'], diets: ['vegan'] }),
    )
    expect(results.map((result) => result.id)).toEqual(['spoonacular:782601'])
  })

  it('skips malformed results and calls nothing for staples alone', async () => {
    const requests: Request[] = []
    server.use(
      http.get(`${SPOONACULAR_BASE}/recipes/complexSearch`, ({ request }) => {
        requests.push(request)
        return HttpResponse.json({ results: [{ id: 'x' }, spoonacularRecipes.salad] })
      }),
    )
    const spoonacular = createSpoonacularProvider({ apiKey: TEST_SPOONACULAR_KEY })
    expect((await spoonacular.search(params({ ingredients: ['pasta'] }))).map((r) => r.id)).toEqual(
      ['spoonacular:715538'],
    )
    expect(await spoonacular.search(params({ ingredients: ['salt'] }))).toEqual([])
    expect(requests).toHaveLength(1)
  })

  it('caches a search for half an hour at most', async () => {
    const requests: Request[] = []
    server.use(...spoonacularHandlers(requests))
    const time = clock()
    const spoonacular = createSpoonacularProvider({ apiKey: TEST_SPOONACULAR_KEY, now: time.now })
    await spoonacular.search(params())
    await spoonacular.search(params({ sort: 'best' }))
    expect(requests).toHaveLength(1)
    time.advance(SPOONACULAR_CACHE_MS)
    await spoonacular.search(params())
    expect(requests).toHaveLength(2)
  })

  it('stops calling after a 402 until the points reset at midnight UTC', async () => {
    let calls = 0
    server.use(
      http.get(`${SPOONACULAR_BASE}/recipes/complexSearch`, () => {
        calls++
        return quotaExceeded()
      }),
    )
    const time = clock()
    const spoonacular = createSpoonacularProvider({ apiKey: TEST_SPOONACULAR_KEY, now: time.now })
    await expect(spoonacular.search(params())).rejects.toMatchObject({ kind: 'quota', status: 402 })
    time.advance(8 * 60 * 60 * 1000) // 23:00 UTC
    await expect(spoonacular.search(params())).rejects.toMatchObject({ kind: 'quota' })
    await expect(spoonacular.getById('spoonacular:716429')).rejects.toMatchObject({ kind: 'quota' })
    expect(calls).toBe(1)
    time.advance(60 * 60 * 1000) // midnight
    server.use(...spoonacularHandlers())
    expect((await spoonacular.search(params())).length).toBeGreaterThan(0)
  })

  it('pauses after a 429 for Retry-After seconds (a minute without one)', async () => {
    let calls = 0
    server.use(
      http.get(`${SPOONACULAR_BASE}/recipes/complexSearch`, () => {
        calls++
        return new HttpResponse(null, {
          status: 429,
          headers: calls === 1 ? { 'Retry-After': '5' } : {},
        })
      }),
    )
    const time = clock()
    const spoonacular = createSpoonacularProvider({ apiKey: TEST_SPOONACULAR_KEY, now: time.now })
    await expect(spoonacular.search(params())).rejects.toMatchObject({ kind: 'rate-limit' })
    time.advance(4_000)
    await expect(spoonacular.search(params())).rejects.toMatchObject({ kind: 'rate-limit' })
    expect(calls).toBe(1)
    time.advance(1_000)
    await expect(spoonacular.search(params())).rejects.toMatchObject({ kind: 'rate-limit' })
    expect(calls).toBe(2)
    time.advance(59_000)
    await expect(spoonacular.search(params())).rejects.toThrow()
    expect(calls).toBe(2)
  })

  it('pauses for ten minutes after the key is refused', async () => {
    let calls = 0
    server.use(
      http.get(`${SPOONACULAR_BASE}/recipes/complexSearch`, () => {
        calls++
        return new HttpResponse(null, { status: 401 })
      }),
    )
    const time = clock()
    const spoonacular = createSpoonacularProvider({ apiKey: 'wrong', now: time.now })
    await expect(spoonacular.search(params())).rejects.toMatchObject({ kind: 'auth' })
    time.advance(9 * 60 * 1000)
    await expect(spoonacular.search(params())).rejects.toMatchObject({ kind: 'auth' })
    time.advance(60 * 1000)
    await expect(spoonacular.search(params())).rejects.toMatchObject({ kind: 'auth' })
    expect(calls).toBe(2)
  })

  it('reports a response that is not a search result', async () => {
    server.use(
      http.get(`${SPOONACULAR_BASE}/recipes/complexSearch`, () => HttpResponse.json({ oops: 1 })),
    )
    const spoonacular = createSpoonacularProvider({ apiKey: TEST_SPOONACULAR_KEY })
    const error = await spoonacular.search(params()).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ProviderError)
    expect(error).toMatchObject({ provider: 'spoonacular', kind: 'invalid-response' })
  })
})

describe('createSpoonacularProvider: getById', () => {
  it('returns a scored detail from /information', async () => {
    const requests: Request[] = []
    server.use(...spoonacularHandlers(requests))
    const spoonacular = createSpoonacularProvider({ apiKey: TEST_SPOONACULAR_KEY })
    const detail = await spoonacular.getById('spoonacular:782601', {
      ingredients: ['rice', 'onion'],
      assumeStaples: true,
    })
    RecipeDetailSchema.parse(detail)
    expect(detail.usedIngredients).toEqual(['onion', 'rice'])
    expect(new URL(requests[0]!.url).searchParams.get('includeNutrition')).toBe('false')
    // Cached: the page scores twice (with and without staples) for one call.
    await spoonacular.getById('spoonacular:782601')
    expect(requests).toHaveLength(1)
  })

  it('throws RecipeNotFoundError for a 404 or a malformed id', async () => {
    server.use(...spoonacularHandlers())
    const spoonacular = createSpoonacularProvider({ apiKey: TEST_SPOONACULAR_KEY })
    await expect(spoonacular.getById('spoonacular:1')).rejects.toBeInstanceOf(RecipeNotFoundError)
    await expect(spoonacular.getById('spoonacular:abc')).rejects.toBeInstanceOf(RecipeNotFoundError)
  })

  it('throws RecipeNotFoundError for a recipe with no steps', async () => {
    server.use(
      http.get(`${SPOONACULAR_BASE}/recipes/:id/information`, () =>
        HttpResponse.json({ ...spoonacularRecipes.salad, analyzedInstructions: [] }),
      ),
    )
    const spoonacular = createSpoonacularProvider({ apiKey: TEST_SPOONACULAR_KEY })
    await expect(spoonacular.getById('spoonacular:715538')).rejects.toBeInstanceOf(
      RecipeNotFoundError,
    )
  })

  it('passes other failures on (the page shows its error state)', async () => {
    server.use(http.get(`${SPOONACULAR_BASE}/recipes/:id/information`, () => HttpResponse.json([])))
    const spoonacular = createSpoonacularProvider({ apiKey: TEST_SPOONACULAR_KEY })
    await expect(spoonacular.getById('spoonacular:715538')).rejects.toMatchObject({
      kind: 'invalid-response',
    })
    server.use(
      http.get(
        `${SPOONACULAR_BASE}/recipes/:id/information`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    )
    await expect(spoonacular.getById('spoonacular:715538')).rejects.toMatchObject({ kind: 'http' })
  })
})

describe('nextUtcMidnight', () => {
  it('is the start of the next UTC day', () => {
    expect(nextUtcMidnight(Date.UTC(2026, 9, 7, 23, 59, 59))).toBe(Date.UTC(2026, 9, 8))
    expect(nextUtcMidnight(Date.UTC(2026, 9, 7))).toBe(Date.UTC(2026, 9, 8))
    expect(nextUtcMidnight(Date.UTC(2026, 11, 31, 12))).toBe(Date.UTC(2027, 0, 1))
  })
})
