import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { MEALDB_BASE, mealDbHandlers, mealDbMeals } from '../../../tests/msw/mealdb'
import { server, interceptExternalApis } from '../../../tests/msw/server'
import { RecipeDetailSchema, RecipeSummarySchema, type Diet } from '@/types/recipe'
import { ProviderError } from './http'
import {
  buildIngredientIndex,
  createMealDbProvider,
  MAX_FILTER_CALLS,
  MAX_LOOKUPS,
  MAX_NAMES_PER_INGREDIENT,
  namesFor,
  planFilterCalls,
  rankCandidates,
  toMealDbRecord,
} from './mealdb'
import { RecipeNotFoundError } from './types'

interceptExternalApis()

const NO_OVERRIDES = { dietOverrides: {}, cuisineOverrides: {} }
const meal = (id: string) => mealDbMeals.find((candidate) => candidate.idMeal === id)!
const search = { diets: [] as Diet[], sort: 'fewest-missing' as const, assumeStaples: true }

function provider(overrides = NO_OVERRIDES, extra = {}) {
  return createMealDbProvider({ apiKey: '1', loadOverrides: async () => overrides, ...extra })
}

describe('ingredient index', () => {
  const index = buildIngredientIndex([
    'Chicken',
    'Chicken Breast',
    'Chicken Breasts',
    'Chicken Thighs',
    'Brown Lentils',
    'Red Lentils',
    'Lentils',
    'Rice',
    'Basmati Rice',
    'Chicken',
    '!!!',
  ])

  it('groups TheMealDB names by canonical name and skips names that have none', () => {
    expect(index.get('chicken breast')).toEqual(['Chicken Breast', 'Chicken Breasts'])
    expect(index.get('chicken')).toEqual(['Chicken'])
    expect([...index.keys()]).not.toContain('')
  })

  it('queries an ingredient by its own names first, then its family', () => {
    expect(namesFor('chicken', index)).toEqual([
      'Chicken',
      'Chicken Breast',
      'Chicken Breasts',
      'Chicken Thighs',
    ])
    expect(namesFor('chicken breast', index)).toEqual([
      'Chicken Breast',
      'Chicken Breasts',
      'Chicken',
    ])
    expect(namesFor('saffron', index)).toEqual([])
  })

  it(`caps the names per ingredient at ${MAX_NAMES_PER_INGREDIENT}`, () => {
    const many = buildIngredientIndex([
      'Lentils',
      ...'ABCDEFG'.split('').map((c) => `Lentils ${c}`),
    ])
    expect(namesFor('lentil', many).length).toBeLessThanOrEqual(MAX_NAMES_PER_INGREDIENT)
  })
})

describe('planFilterCalls', () => {
  it('takes names round-robin, without repeats', () => {
    expect(planFilterCalls([['A1', 'A2', 'A3'], ['B1'], ['C1', 'A1']])).toEqual([
      'A1',
      'B1',
      'C1',
      'A2',
      'A3',
    ])
  })

  it(`stops at ${MAX_FILTER_CALLS} calls`, () => {
    const lists = Array.from({ length: 20 }, (_, i) => [`${i}a`, `${i}b`])
    const calls = planFilterCalls(lists)
    expect(calls).toHaveLength(MAX_FILTER_CALLS)
    expect(calls.slice(0, 20)).toEqual(lists.map((names) => names[0]))
  })

  it('handles no ingredients', () => {
    expect(planFilterCalls([])).toEqual([])
  })
})

describe('rankCandidates', () => {
  it('ranks meals by distinct user ingredients found, then by id', () => {
    expect(
      rankCandidates([
        { ingredient: 'rice', mealIds: ['3', '1', '2'] },
        { ingredient: 'onion', mealIds: ['2', '3', '3'] },
        { ingredient: 'lentil', mealIds: ['2'] },
      ]),
    ).toEqual(['2', '3', '1'])
  })

  it(`keeps at most ${MAX_LOOKUPS}`, () => {
    const ids = Array.from({ length: 60 }, (_, i) => String(i + 1))
    expect(rankCandidates([{ ingredient: 'rice', mealIds: ids }])).toHaveLength(MAX_LOOKUPS)
  })
})

describe('toMealDbRecord', () => {
  it('keeps reviewed diets for meals in the local collection', () => {
    const record = toMealDbRecord(meal('53027'), {
      dietOverrides: { '53027': { title: 'Koshari', diets: ['vegetarian', 'pescatarian'] } },
      cuisineOverrides: {},
    })
    expect(record).toMatchObject({
      id: 'mealdb:53027',
      source: 'mealdb',
      diets: ['vegetarian', 'pescatarian'],
      dietsEstimated: false,
      cuisine: 'Egyptian',
      attribution: 'TheMealDB',
    })
  })

  it('claims no diet when the ingredient list looks incomplete', () => {
    // Filed under Pork, but no line is pork: the list only covers the marinade.
    const record = toMealDbRecord(meal('53432'), NO_OVERRIDES)
    expect(record?.diets).toEqual([])
    expect(record?.dietsEstimated).toBe(true)
  })

  it('applies cuisine corrections and leaves out an unknown country', () => {
    expect(
      toMealDbRecord(meal('53251'), {
        dietOverrides: {},
        cuisineOverrides: { '53251': { cuisine: 'Turkish', reason: 'test' } },
      })?.cuisine,
    ).toBe('Turkish')
    expect(
      toMealDbRecord({ ...meal('53027'), strCountry: 'Atlantis' }, NO_OVERRIDES)?.cuisine,
    ).toBe(undefined)
  })

  it('drops an image that is not https, and a meal without steps', () => {
    const insecure = { ...meal('53027'), strMealThumb: 'http://example.com/a.jpg' }
    expect(toMealDbRecord(insecure, NO_OVERRIDES)?.imageUrl).toBeUndefined()
    expect(toMealDbRecord({ ...meal('53027'), strInstructions: ' ' }, NO_OVERRIDES)).toBeNull()
  })

  it('drops tags the title casts doubt on', () => {
    // The lines of "Vegan Chocolate Cake" are vegan; a title naming cream cheese argues against
    // the vegan and dairy-free tags, and nobody reviewed this meal.
    const record = toMealDbRecord(
      { ...meal('52794'), strMeal: 'Chocolate Cake with Cream Cheese' },
      NO_OVERRIDES,
    )
    expect(toMealDbRecord(meal('52794'), NO_OVERRIDES)?.diets).toContain('vegan')
    expect(record?.diets).toEqual(['vegetarian', 'pescatarian'])
  })
})

describe('createMealDbProvider: search', () => {
  it('queries per ingredient, looks up the best candidates and ranks them', async () => {
    const calls: string[] = []
    server.use(...mealDbHandlers(calls))
    const results = await provider().search({ ingredients: ['lentil', 'rice', 'onion'], ...search })
    expect(results.length).toBeGreaterThan(0)
    for (const result of results) RecipeSummarySchema.parse(result)
    expect(results.every((result) => result.id.startsWith('mealdb:'))).toBe(true)
    expect(results[0]!.title).toBe('Koshari')
    expect(calls.filter((url) => url.includes('/list.php'))).toHaveLength(1)
    expect(calls.some((url) => url.includes('filter.php?i=Brown_Lentils'))).toBe(true)
  })

  it('caches TheMealDB answers between searches', async () => {
    const calls: string[] = []
    server.use(...mealDbHandlers(calls))
    const mealdb = provider()
    await mealdb.search({ ingredients: ['rice'], ...search })
    const first = calls.length
    await mealdb.search({ ingredients: ['rice'], ...search, sort: 'best' })
    expect(calls.length).toBe(first)
  })

  it('filters by diet after scoring', async () => {
    server.use(...mealDbHandlers())
    const results = await provider().search({
      ingredients: ['onion', 'garlic'],
      ...search,
      diets: ['vegan'],
    })
    expect(results.every((result) => result.diets.includes('vegan'))).toBe(true)
  })

  it('does not query assumed staples', async () => {
    const calls: string[] = []
    server.use(...mealDbHandlers(calls))
    expect(await provider().search({ ingredients: ['salt'], ...search })).toEqual([])
    expect(calls.some((url) => url.includes('filter.php'))).toBe(false)
  })

  it('fails with a ProviderError when TheMealDB is down', async () => {
    server.use(http.get(`${MEALDB_BASE}/list.php`, () => new HttpResponse(null, { status: 503 })))
    await expect(provider().search({ ingredients: ['rice'], ...search })).rejects.toMatchObject({
      provider: 'mealdb',
      kind: 'http',
      status: 503,
    })
  })

  it('fails when TheMealDB answers something else', async () => {
    server.use(http.get(`${MEALDB_BASE}/list.php`, () => HttpResponse.json({ error: 'no' })))
    await expect(provider().search({ ingredients: ['rice'], ...search })).rejects.toMatchObject({
      kind: 'invalid-response',
    })
    server.use(http.get(`${MEALDB_BASE}/list.php`, () => HttpResponse.json({ meals: null })))
    await expect(provider().search({ ingredients: ['rice'], ...search })).rejects.toMatchObject({
      kind: 'invalid-response',
    })
  })

  it('gives up when the whole search takes too long', async () => {
    server.use(...mealDbHandlers())
    server.use(
      http.get(`${MEALDB_BASE}/filter.php`, async () => {
        await delay(500)
        return HttpResponse.json({ meals: null })
      }),
    )
    const slow = provider(NO_OVERRIDES, { searchBudgetMs: 50 })
    const error = await slow.search({ ingredients: ['rice'], ...search }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ProviderError)
    expect((error as ProviderError).kind).toBe('timeout')
  })

  it('retries loading the overrides after a failure', async () => {
    server.use(...mealDbHandlers())
    let attempts = 0
    const mealdb = createMealDbProvider({
      apiKey: '1',
      loadOverrides: async () => {
        attempts++
        if (attempts === 1) throw new Error('disk')
        return NO_OVERRIDES
      },
    })
    await expect(mealdb.getById('mealdb:53027')).rejects.toThrow('disk')
    expect((await mealdb.getById('mealdb:53027')).title).toBe('Koshari')
  })
})

describe('createMealDbProvider: getById', () => {
  it('returns a scored detail for the pantry', async () => {
    server.use(...mealDbHandlers())
    const detail = await provider().getById('mealdb:53027', {
      ingredients: ['rice', 'onion'],
      assumeStaples: true,
    })
    RecipeDetailSchema.parse(detail)
    expect(detail.usedIngredients).toEqual(['rice', 'onion'])
    expect(detail.instructions.length).toBeGreaterThan(1)
  })

  it('uses the reviewed tags from data/ by default', async () => {
    server.use(...mealDbHandlers())
    const detail = await createMealDbProvider({ apiKey: '1' }).getById('mealdb:53027')
    expect(detail.dietsEstimated).toBe(false)
  })

  it('throws RecipeNotFoundError for unknown and malformed ids', async () => {
    server.use(...mealDbHandlers())
    await expect(provider().getById('mealdb:1')).rejects.toBeInstanceOf(RecipeNotFoundError)
    await expect(provider().getById('local:53027')).rejects.toBeInstanceOf(RecipeNotFoundError)
  })

  it('uses the v2 API with a supporter key', async () => {
    const calls: string[] = []
    server.use(
      http.get('https://www.themealdb.com/api/json/v2/:key/lookup.php', ({ request, params }) => {
        calls.push(`${String(params.key)} ${new URL(request.url).search}`)
        return HttpResponse.json({ meals: [meal('53027')] })
      }),
    )
    const supporter = createMealDbProvider({
      apiKey: 'patreon',
      loadOverrides: async () => NO_OVERRIDES,
    })
    expect((await supporter.getById('mealdb:53027')).title).toBe('Koshari')
    expect(calls).toEqual(['patreon ?i=53027'])
  })
})
