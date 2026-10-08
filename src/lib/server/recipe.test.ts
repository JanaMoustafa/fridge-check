import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProviderError } from '@/lib/providers/http'
import { localProvider } from '@/lib/providers/local'
import { RecipeNotFoundError, type RecipeProvider } from '@/lib/providers/types'
import { ApiErrorSchema } from '@/types/api'
import {
  getRecipe,
  loadRecipePage,
  recipePageResult,
  unavailableFrom,
  unavailableResponse,
} from './recipe'

const PANTRY = { ingredients: ['rice'], assumeStaples: true }

function failing(id: RecipeProvider['id'], error: Error): RecipeProvider {
  return { id, search: () => Promise.reject(error), getById: () => Promise.reject(error) }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getRecipe', () => {
  const registry = (mealdb: RecipeProvider | undefined, local: RecipeProvider = localProvider) => ({
    local,
    forSource: (source: string) =>
      source === 'mealdb' ? mealdb : source === 'local' ? local : undefined,
  })

  it('serves a TheMealDB meal from the local collection when TheMealDB fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const down = failing('mealdb', new ProviderError('mealdb', 'timeout', 'lookup.php'))
    const recipe = await getRecipe('mealdb:53027', PANTRY, registry(down))
    expect(recipe).toMatchObject({ id: 'local:53027', title: 'Koshari', usedIngredients: ['rice'] })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('trying local recipes'))
  })

  it('passes the original failure on when the meal is not local either', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const outage = new ProviderError('mealdb', 'http', 'lookup.php', 503)
    await expect(getRecipe('mealdb:1', PANTRY, registry(failing('mealdb', outage)))).rejects.toBe(
      outage,
    )
  })

  it('passes a failure of the fallback itself on', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const down = failing('mealdb', new ProviderError('mealdb', 'network', 'lookup.php'))
    const broken = failing('local', new Error('dataset'))
    await expect(getRecipe('mealdb:53027', PANTRY, registry(down, broken))).rejects.toThrow(
      'dataset',
    )
  })

  it('returns null for a recipe the provider does not have', async () => {
    const empty = failing('mealdb', new RecipeNotFoundError('mealdb:1'))
    expect(await getRecipe('mealdb:1', PANTRY, registry(empty))).toBeNull()
  })

  it('returns null for a source that is not configured', async () => {
    expect(await getRecipe('spoonacular:1', PANTRY, registry(undefined))).toBeNull()
  })

  it('does not fall back for other sources', async () => {
    const error = new ProviderError('spoonacular', 'quota', 'information', 402)
    const spoonacular = failing('spoonacular', error)
    await expect(
      getRecipe('spoonacular:1', PANTRY, { local: localProvider, forSource: () => spoonacular }),
    ).rejects.toBe(error)
  })
})

describe('loadRecipePage', () => {
  async function found(source: string, key: string, pantry: string) {
    const result = await loadRecipePage(source, key, pantry)
    if (result.kind !== 'found') throw new Error(`expected a recipe, got ${result.kind}`)
    return result
  }

  it('scores the recipe for the pantry with and without staples', async () => {
    // Koshari: brown lentil, rice, coriander, macaroni, chickpea, onion, salt, vegetable oil.
    const data = await found('local', '53027', 'rice,onion,salt')
    expect(data.recipe.title).toBe('Koshari')
    expect(data.withStaples.usedIngredients).toEqual(['rice', 'onion'])
    expect(data.withStaples.missingIngredients).not.toContain('salt')
    expect(data.withoutStaples.usedIngredients).toEqual(
      expect.arrayContaining(['rice', 'onion', 'salt']),
    )
    expect(data.withoutStaples.missingIngredients).toContain('vegetable oil')
  })

  it('treats an empty pantry as having nothing', async () => {
    const data = await found('local', '53027', '')
    expect(data.withStaples.usedIngredients).toEqual([])
  })

  it.each([
    ['an unknown id', 'local', '99999999'],
    ['a malformed id', 'local', 'a/b'],
    ['an unknown source', 'pantry', '53027'],
  ])('reports not-found for %s', async (_label, source, key) => {
    expect(await loadRecipePage(source, key, '')).toEqual({ kind: 'not-found' })
  })
})

describe('recipePageResult when the source cannot answer', () => {
  const only = (provider: RecipeProvider) => ({
    local: localProvider,
    forSource: (source: string) => (source === provider.id ? provider : undefined),
  })

  it('says when a used-up quota resets', async () => {
    const quota = failing(
      'spoonacular',
      new ProviderError('spoonacular', 'quota', 'information', 402),
    )
    const result = await recipePageResult(only(quota), 'spoonacular', '715538', 'rice')
    expect(result).toMatchObject({ kind: 'unavailable', source: 'spoonacular', reason: 'quota' })
    const { retryAt } = result as { retryAt: number }
    expect(new Date(retryAt).toISOString()).toMatch(/T00:00:00\.000Z$/)
    expect(retryAt).toBeGreaterThan(Date.now())
  })

  it('reports an outage of TheMealDB for a meal that is not local', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const down = failing('mealdb', new ProviderError('mealdb', 'timeout', 'lookup.php'))
    expect(await recipePageResult(only(down), 'mealdb', '1', '')).toEqual({
      kind: 'unavailable',
      source: 'mealdb',
      reason: 'outage',
    })
  })

  it('still fails loudly on a bug', async () => {
    const broken = failing('spoonacular', new TypeError('bad mapping'))
    await expect(recipePageResult(only(broken), 'spoonacular', '1', '')).rejects.toThrow(
      'bad mapping',
    )
  })
})

describe('unavailableFrom', () => {
  const NOW = Date.UTC(2026, 9, 8, 13, 0)

  it('maps a used-up quota to the next 00:00 UTC, anything else to an outage', () => {
    expect(unavailableFrom(new ProviderError('spoonacular', 'quota', 'x', 402), NOW)).toEqual({
      source: 'spoonacular',
      reason: 'quota',
      retryAt: Date.UTC(2026, 9, 9),
    })
    expect(unavailableFrom(new ProviderError('spoonacular', 'rate-limit', 'x', 429), NOW)).toEqual({
      source: 'spoonacular',
      reason: 'outage',
    })
    expect(unavailableFrom(new Error('bug'), NOW)).toBeNull()
  })
})

describe('unavailableResponse', () => {
  const NOW = Date.UTC(2026, 9, 8, 23, 0)

  it('answers 503 with Retry-After until the quota resets, never cached', async () => {
    const response = unavailableResponse(
      { source: 'spoonacular', reason: 'quota', retryAt: Date.UTC(2026, 9, 9) },
      NOW,
    )
    expect(response.status).toBe(503)
    expect(response.headers.get('retry-after')).toBe('3600')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(ApiErrorSchema.parse(await response.json()).error.code).toBe('unavailable')
  })

  it('asks to retry in a minute after an outage', async () => {
    const response = unavailableResponse({ source: 'mealdb', reason: 'outage' }, NOW)
    expect(response.headers.get('retry-after')).toBe('60')
    expect((await response.json()).error.message).toMatch(/not answering/)
  })
})
