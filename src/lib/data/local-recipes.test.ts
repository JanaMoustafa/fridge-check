import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import {
  LOCAL_RECIPE_MAX,
  LOCAL_RECIPE_MIN,
  LocalRecipeSchema,
  type LocalRecipe,
} from '@/types/recipe'
import fixture from '../../../tests/fixtures/local-recipes.sample.json'
import { createLocalRecipesLoader, loadLocalRecipes } from './local-recipes'

const SAMPLE = z.array(LocalRecipeSchema).parse(fixture.recipes)

/** `count` valid recipes: the sample repeated under distinct ids, as a real collection would be. */
function repeatSample(count: number): LocalRecipe[] {
  return Array.from({ length: count }, (_, index) => {
    const recipe = SAMPLE[index % SAMPLE.length] as LocalRecipe
    const mealDbId = String(90_000 + index)
    return { ...recipe, id: `local:${mealDbId}`, mealDbId }
  })
}

function collection(recipes: unknown[]) {
  return { version: 1, recipes }
}

/** The thrown message, for assertions on its wording. */
function errorOf(raw: unknown): string {
  try {
    loadLocalRecipes(raw)
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
  throw new Error('expected loadLocalRecipes to throw')
}

describe('the sample fixture', () => {
  it('holds real TheMealDB recipes in the stored shape', () => {
    expect(fixture.version).toBe(1)
    expect(SAMPLE.length).toBeGreaterThanOrEqual(6)
    expect(SAMPLE.length).toBeLessThanOrEqual(10)
    for (const recipe of SAMPLE) {
      expect(recipe.id).toBe(`local:${recipe.mealDbId}`)
      expect(recipe.attribution).toBe('TheMealDB')
    }
    expect(new Set(SAMPLE.map((recipe) => recipe.id)).size).toBe(SAMPLE.length)
  })
})

describe('loadLocalRecipes', () => {
  it.each([LOCAL_RECIPE_MIN, LOCAL_RECIPE_MAX])('accepts a collection of %i recipes', (count) => {
    const recipes = repeatSample(count)
    expect(loadLocalRecipes(collection(recipes))).toEqual(recipes)
  })

  it('rejects a collection that is too small, naming the rule', () => {
    expect(errorOf(collection(SAMPLE))).toBe(
      'Invalid local recipe data (1 issue):\n' +
        '  - recipes: Too small: expected array to have >=150 items',
    )
  })

  it('rejects a collection that is too large', () => {
    expect(errorOf(collection(repeatSample(LOCAL_RECIPE_MAX + 1)))).toMatch(
      /^ {2}- recipes: Too big/m,
    )
  })

  it('names the path and the recipe id of a bad field', () => {
    const recipes: unknown[] = repeatSample(LOCAL_RECIPE_MIN)
    const bad = recipes[3] as LocalRecipe
    recipes[3] = { ...bad, ingredients: [{ raw: '2 Tomatoes', name: 'Tomatoes!' }] }
    expect(errorOf(collection(recipes))).toBe(
      'Invalid local recipe data (1 issue):\n' +
        `  - recipes[3].ingredients[0].name (${bad.id}): canonical names are lowercase ASCII`,
    )
  })

  it('rejects an image that is not on www.themealdb.com', () => {
    const recipes: unknown[] = repeatSample(LOCAL_RECIPE_MIN)
    recipes[0] = { ...(recipes[0] as LocalRecipe), imageUrl: 'https://evil.example/a.jpg' }
    expect(errorOf(collection(recipes))).toMatch(/recipes\[0\]\.imageUrl \(local:90000\): /)
  })

  it('rejects duplicate ids', () => {
    const recipes = repeatSample(LOCAL_RECIPE_MIN)
    recipes[7] = { ...(recipes[2] as LocalRecipe) }
    expect(errorOf(collection(recipes))).toBe(
      'Invalid local recipe data (1 issue):\n' +
        '  - recipes[7].id (local:90002): duplicate id local:90002',
    )
  })

  it('rejects an id that does not match its TheMealDB id', () => {
    const recipes = repeatSample(LOCAL_RECIPE_MIN)
    recipes[5] = { ...(recipes[5] as LocalRecipe), mealDbId: '52772' }
    expect(errorOf(collection(recipes))).toContain(
      '  - recipes[5].id (local:90005): id must be local:52772',
    )
  })

  it('lists the first ten issues and counts the rest', () => {
    const recipes = repeatSample(LOCAL_RECIPE_MIN).map((recipe) => ({ ...recipe, title: ' ' }))
    const lines = errorOf(collection(recipes)).split('\n')
    expect(lines[0]).toBe(`Invalid local recipe data (${LOCAL_RECIPE_MIN} issues):`)
    expect(lines).toHaveLength(1 + 10 + 1)
    expect(lines[1]).toMatch(/^ {2}- recipes\[0\]\.title \(local:90000\): /)
    expect(lines.at(-1)).toBe(`  …and ${LOCAL_RECIPE_MIN - 10} more`)
  })

  it('reports a malformed record without an id', () => {
    const recipes: unknown[] = repeatSample(LOCAL_RECIPE_MIN)
    recipes[1] = null
    expect(errorOf(collection(recipes))).toMatch(/^ {2}- recipes\[1\]: /m)
  })

  it.each([
    ['not an object', null, /^ {2}- \(root\): /m],
    ['an unknown version', { version: 2, recipes: repeatSample(LOCAL_RECIPE_MIN) }, /- version: /],
    ['a missing recipes array', { version: 1 }, /- recipes: /],
  ])('rejects %s', (_label, raw, message) => {
    expect(errorOf(raw)).toMatch(message)
  })
})

describe('createLocalRecipesLoader', () => {
  /** A dataset import that resolves like `import('…json')`: a module whose default is the JSON. */
  function importing(...contents: unknown[]) {
    const importDataset = vi.fn<() => Promise<{ default: unknown }>>()
    for (const content of contents) importDataset.mockResolvedValueOnce({ default: content })
    return importDataset
  }

  it('imports and validates once, sharing concurrent first calls', async () => {
    const recipes = repeatSample(LOCAL_RECIPE_MIN)
    const importDataset = importing(collection(recipes))
    const getRecipes = createLocalRecipesLoader(importDataset)

    expect(importDataset).not.toHaveBeenCalled()
    const [first, second] = await Promise.all([getRecipes(), getRecipes()])
    expect(first).toEqual(recipes)
    expect(second).toBe(first)
    expect(await getRecipes()).toBe(first)
    expect(importDataset).toHaveBeenCalledTimes(1)
  })

  it('rejects with the readable error for invalid data, then retries', async () => {
    const importDataset = importing(collection(SAMPLE), collection(repeatSample(LOCAL_RECIPE_MIN)))
    const getRecipes = createLocalRecipesLoader(importDataset)

    await expect(getRecipes()).rejects.toThrow(/^Invalid local recipe data \(1 issue\)/)
    await expect(getRecipes()).resolves.toHaveLength(LOCAL_RECIPE_MIN)
    expect(importDataset).toHaveBeenCalledTimes(2)
  })

  it('retries after the import itself fails', async () => {
    const importDataset = importing()
    importDataset
      .mockRejectedValueOnce(new Error('chunk failed'))
      .mockResolvedValueOnce({ default: collection(repeatSample(LOCAL_RECIPE_MIN)) })
    const getRecipes = createLocalRecipesLoader(importDataset)

    await expect(getRecipes()).rejects.toThrow('chunk failed')
    await expect(getRecipes()).resolves.toHaveLength(LOCAL_RECIPE_MIN)
  })
})
