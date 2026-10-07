import { describe, expect, it } from 'vitest'
import recipesFile from '../../../data/recipes.json'
import { normalizeIngredient } from '@/lib/matching'
import { createLocalProvider } from '@/lib/providers/local'
import { SearchParamsSchema } from '@/types/recipe'
import { loadLocalRecipes } from './local-recipes'

// Search over the shipped dataset with realistic fridges: guards against a re-seed or an engine
// change that silently breaks results for real users.
const provider = createLocalProvider(() => loadLocalRecipes(recipesFile))
const search = (input: Record<string, unknown>) => provider.search(SearchParamsSchema.parse(input))

const EGYPTIAN_FRIDGE = ['rice', 'lentil', 'onion', 'tomato', 'garlic', 'cumin']
const EGYPTIAN_FRIDGE_AR = ['رز', 'عدس', 'بصل', 'طماطم', 'توم', 'كمون']

describe('local search over data/recipes.json', () => {
  it('finds Koshari for an Egyptian pantry, crediting lentils through the family', async () => {
    const results = await search({ ingredients: EGYPTIAN_FRIDGE })
    const koshari = results.find((recipe) => recipe.id === 'local:53027')
    expect(koshari?.usedIngredients).toEqual(
      expect.arrayContaining(['brown lentil', 'rice', 'onion']),
    )
    expect(results.every((recipe) => recipe.usedIngredients.length > 0)).toBe(true)
  })

  it('gives identical results for the same pantry typed in Arabic', async () => {
    const arabic = EGYPTIAN_FRIDGE_AR.map(normalizeIngredient)
    expect(arabic).toEqual(EGYPTIAN_FRIDGE)
    expect(await search({ ingredients: arabic })).toEqual(
      await search({ ingredients: EGYPTIAN_FRIDGE }),
    )
  })

  it('applies diet filters with AND logic', async () => {
    const results = await search({
      ingredients: EGYPTIAN_FRIDGE,
      diets: ['vegan', 'gluten-free'],
    })
    expect(results.length).toBeGreaterThan(0)
    for (const recipe of results)
      expect(recipe.diets).toEqual(expect.arrayContaining(['vegan', 'gluten-free']))
  })

  it('ranks a British pantry with fewest missing first', async () => {
    const results = await search({ ingredients: ['potato', 'egg', 'cheddar', 'bacon', 'milk'] })
    const missing = results.map((recipe) => recipe.missingIngredients.length)
    expect(missing).toEqual([...missing].sort((a, b) => a - b))
  })

  it('searches the whole dataset well within the 50 ms budget', async () => {
    await search({ ingredients: EGYPTIAN_FRIDGE })
    const start = performance.now()
    await search({ ingredients: [...EGYPTIAN_FRIDGE, 'chicken', 'egg', 'cheese', 'potato'] })
    expect(performance.now() - start).toBeLessThan(50)
  })
})
