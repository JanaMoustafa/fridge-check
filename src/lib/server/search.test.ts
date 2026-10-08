import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProviderError } from '@/lib/providers/http'
import type { RecipeProvider } from '@/lib/providers/types'
import type { RecipeSummary } from '@/types/recipe'
import { describeFailure, searchRecipes } from './search'

const query = {
  ingredients: ['rice'],
  diets: [],
  sort: 'fewest-missing' as const,
  assumeStaples: true,
  page: 1,
}

const summary = (id: string): RecipeSummary => ({
  id,
  source: id.split(':')[0] as RecipeSummary['source'],
  title: id,
  diets: [],
  dietsEstimated: true,
  usedIngredients: ['rice'],
  missingIngredients: [],
  matchedUserIngredients: ['rice'],
  matchScore: 1,
})

function fake(id: RecipeProvider['id'], search: RecipeProvider['search']): RecipeProvider {
  return { id, search, getById: () => Promise.reject(new Error('unused')) }
}

const local = fake('local', async () => [summary('local:1')])

afterEach(() => {
  vi.restoreAllMocks()
})

describe('searchRecipes', () => {
  it('answers from the configured provider', async () => {
    const mealdb = fake('mealdb', async () => [summary('mealdb:2')])
    const body = await searchRecipes({ primary: mealdb, local }, query)
    expect(body).toMatchObject({ provider: 'mealdb', total: 1 })
    expect(body.notice).toBeUndefined()
  })

  it.each([
    ['quota', new ProviderError('spoonacular', 'quota', 'complexSearch', 402)],
    ['rate limit', new ProviderError('spoonacular', 'rate-limit', 'complexSearch', 429)],
    ['timeout', new ProviderError('mealdb', 'timeout', 'filter.php')],
    ['any other error', new TypeError('bad data')],
  ])('falls back to local recipes on %s, and says so', async (_label, error) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const remote = fake('spoonacular', () => Promise.reject(error))
    const body = await searchRecipes({ primary: remote, local }, query)
    expect(body).toMatchObject({ provider: 'local', notice: 'fallback-local', total: 1 })
    expect(body.results[0]!.id).toBe('local:1')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('using local recipes'))
  })

  it('passes on a failure of the local provider itself', async () => {
    const broken = fake('local', () => Promise.reject(new Error('dataset')))
    await expect(searchRecipes({ primary: broken, local: broken }, query)).rejects.toThrow(
      'dataset',
    )
  })
})

describe('describeFailure', () => {
  it('names the kind of a provider error, and the type of anything else', () => {
    expect(describeFailure(new ProviderError('mealdb', 'timeout', 'lookup.php'))).toBe(
      'mealdb lookup.php: timeout',
    )
    expect(describeFailure(new RangeError('x'))).toBe('RangeError: x')
    expect(describeFailure('plain')).toBe('plain')
  })
})
