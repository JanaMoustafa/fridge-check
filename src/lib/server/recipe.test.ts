import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProviderError } from '@/lib/providers/http'
import { localProvider } from '@/lib/providers/local'
import { RecipeNotFoundError, type RecipeProvider } from '@/lib/providers/types'
import { getRecipe, loadRecipePage } from './recipe'

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
  it('scores the recipe for the pantry with and without staples', async () => {
    // Koshari: brown lentil, rice, coriander, macaroni, chickpea, onion, salt, vegetable oil.
    const data = await loadRecipePage('local', '53027', 'rice,onion,salt')
    expect(data?.recipe.title).toBe('Koshari')
    expect(data?.withStaples.usedIngredients).toEqual(['rice', 'onion'])
    expect(data?.withStaples.missingIngredients).not.toContain('salt')
    expect(data?.withoutStaples.usedIngredients).toEqual(
      expect.arrayContaining(['rice', 'onion', 'salt']),
    )
    expect(data?.withoutStaples.missingIngredients).toContain('vegetable oil')
  })

  it('treats an empty pantry as having nothing', async () => {
    const data = await loadRecipePage('local', '53027', '')
    expect(data?.withStaples.usedIngredients).toEqual([])
  })

  it.each([
    ['an unknown id', 'local', '99999999'],
    ['a malformed id', 'local', 'a/b'],
    ['an unknown source', 'pantry', '53027'],
  ])('returns null for %s', async (_label, source, key) => {
    expect(await loadRecipePage(source, key, '')).toBeNull()
  })
})
