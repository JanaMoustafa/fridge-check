import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import {
  LocalRecipeSchema,
  RecipeDetailSchema,
  RecipeSummarySchema,
  SORT_KEYS,
  type LocalRecipe,
  type SearchParams,
} from '@/types/recipe'
import fixture from '../../../tests/fixtures/local-recipes.sample.json'
import { createLocalProvider, localProvider } from './local'
import { RecipeNotFoundError } from './types'

const SAMPLE = z.array(LocalRecipeSchema).parse(fixture.recipes)

const KOSHARI = 'local:53027'
const FUL_MEDAMES = 'local:53025'
const SHAKSHUKA = 'local:52963'
const MULUKHIYAH = 'local:53029'
const SHAWARMA = 'local:53218'
const CARBONARA = 'local:52982'
const SALMON = 'local:52959'
const PEANUT_COOKIES = 'local:52958'

const provider = createLocalProvider(() => SAMPLE)

function paramsFor(ingredients: string[], options: Partial<SearchParams> = {}): SearchParams {
  return { ingredients, diets: [], assumeStaples: true, sort: 'fewest-missing', ...options }
}

function search(ingredients: string[], options: Partial<SearchParams> = {}) {
  return provider.search(paramsFor(ingredients, options))
}

async function idsFor(ingredients: string[], options: Partial<SearchParams> = {}) {
  return (await search(ingredients, options)).map((result) => result.id)
}

function sampleRecipe(id: string): LocalRecipe {
  const recipe = SAMPLE.find((candidate) => candidate.id === id)
  if (recipe === undefined) throw new Error(`fixture has no ${id}`)
  return recipe
}

/** A Shawarma cook's spice rack: 7 of Shawarma's 9 lines, 1 of the cookies' 2. */
const SPICE_RACK = [
  'garlic',
  'cumin',
  'lemon',
  'cardamom',
  'cayenne pepper',
  'smoked paprika',
  'chicken breast',
  'egg',
]

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('localProvider', () => {
  it('is the local source', () => {
    expect(localProvider.id).toBe('local')
    expect(provider.id).toBe('local')
  })
})

describe('search: ranking and exclusion', () => {
  it('drops recipes that use none of the ingredients', async () => {
    expect(await idsFor(['salmon'])).toEqual([SALMON])
    expect(await idsFor(['peanut butter'])).toEqual([PEANUT_COOKIES])
    expect(await idsFor(['dragon fruit'])).toEqual([])
  })

  it('ranks by fewest missing, then score, by default', async () => {
    expect(await idsFor(SPICE_RACK)).toEqual([
      PEANUT_COOKIES, // 1 missing
      SHAWARMA, // 2 missing, 0.78
      FUL_MEDAMES, // 2 missing, 0.6
      MULUKHIYAH, // 3 missing, 0.25
      CARBONARA, // 3 missing, 0.2 (egg covers egg yolk as family)
      SHAKSHUKA, // 5 missing, 0.29
      SALMON, // 5 missing, 0.17
    ])
  })

  it('applies the default sort and staples when the params omit them', async () => {
    const defaulted = await provider.search({ ingredients: SPICE_RACK } as SearchParams)
    expect(defaulted).toEqual(await search(SPICE_RACK))
  })

  it('ranks by score first for best', async () => {
    expect(await idsFor(SPICE_RACK, { sort: 'best' })).toEqual([
      SHAWARMA, // 0.78
      FUL_MEDAMES, // 0.6
      PEANUT_COOKIES, // 0.5
      SHAKSHUKA, // 0.29
      MULUKHIYAH, // 0.25
      CARBONARA, // 0.2
      SALMON, // 0.17
    ])
  })

  // TheMealDB has no cook times, so "quickest" ties throughout and falls back to fewest missing.
  it('falls back to fewest missing for quickest', async () => {
    expect(await idsFor(SPICE_RACK, { sort: 'quickest' })).toEqual(await idsFor(SPICE_RACK))
  })

  it('does not depend on the order of the ingredients', async () => {
    for (const sort of SORT_KEYS) {
      const forward = await search(SPICE_RACK, { sort })
      const backward = await search([...SPICE_RACK].reverse(), { sort })
      expect(backward.map((result) => result.id)).toEqual(forward.map((result) => result.id))
    }
  })

  it('maps a result to a summary with fresh match fields and nothing else', async () => {
    const results = await search(['egg', 'feta'])
    expect(results.map((result) => result.id)).toEqual([PEANUT_COOKIES, CARBONARA, SHAKSHUKA])
    const result = results[2]
    const shakshuka = sampleRecipe(SHAKSHUKA)
    expect(result).toStrictEqual({
      id: SHAKSHUKA,
      source: 'local',
      title: 'Shakshuka',
      imageUrl: shakshuka.imageUrl,
      diets: ['vegetarian', 'gluten-free', 'pescatarian'],
      dietsEstimated: false,
      usedIngredients: ['egg', 'feta'],
      missingIngredients: ['red onion', 'chili', 'garlic', 'coriander', 'cherry tomato'],
      matchedUserIngredients: ['egg', 'feta'],
      matchScore: 0.2857,
    })
  })

  it('credits family matches at 0.8 and names the user item', async () => {
    const [result] = await search(['chicken'])
    expect(result).toMatchObject({
      id: SHAWARMA,
      usedIngredients: ['chicken breast'],
      matchedUserIngredients: ['chicken'],
      matchScore: 0.0889, // 0.8 / 9
    })
  })

  it('passes dietsEstimated through', async () => {
    const [cookies] = await search(['peanut butter'])
    expect(cookies?.dietsEstimated).toBe(true)
  })

  it('rejects invalid params', async () => {
    await expect(search([])).rejects.toThrow(z.ZodError)
    await expect(search(['Tomatoes!'])).rejects.toThrow(z.ZodError)
    await expect(search(['egg'], { diets: ['keto' as never] })).rejects.toThrow(z.ZodError)
  })
})

describe('search: diets', () => {
  const PANTRY = ['garlic', 'lemon', 'onion', 'chickpea', 'rice']

  it('returns everything that matches without a diet filter', async () => {
    expect(await idsFor(PANTRY)).toEqual([
      MULUKHIYAH,
      KOSHARI,
      FUL_MEDAMES,
      SHAKSHUKA,
      SALMON,
      SHAWARMA,
    ])
  })

  it('keeps recipes tagged with one requested diet', async () => {
    expect(await idsFor(PANTRY, { diets: ['vegan'] })).toEqual([KOSHARI, FUL_MEDAMES])
  })

  it('needs every requested diet (AND)', async () => {
    // Koshari is vegan but has macaroni; Ful Medames is both.
    expect(await idsFor(PANTRY, { diets: ['vegan', 'gluten-free'] })).toEqual([FUL_MEDAMES])
    expect(await idsFor(PANTRY, { diets: ['gluten-free', 'dairy-free', 'pescatarian'] })).toEqual([
      FUL_MEDAMES,
      SALMON,
    ])
  })

  it('only returns recipes carrying all requested diets', async () => {
    const diets = ['gluten-free', 'dairy-free'] as const
    const results = await search(PANTRY, { diets: [...diets] })
    expect(results.map((result) => result.id)).toEqual([MULUKHIYAH, FUL_MEDAMES, SALMON])
    for (const result of results) expect(result.diets).toEqual(expect.arrayContaining([...diets]))
  })

  it('returns nothing when no matching recipe fits the diets', async () => {
    expect(await idsFor(['bacon'], { diets: ['vegetarian'] })).toEqual([])
  })
})

describe('search: staples', () => {
  it('ignores staples on both sides while they are assumed', async () => {
    expect(await idsFor(['olive oil'])).toEqual([])
    const [cookies] = await search(['egg'])
    expect(cookies).toMatchObject({ id: PEANUT_COOKIES, missingIngredients: ['peanut butter'] })
    expect(cookies?.matchScore).toBe(0.5)
  })

  it('counts staples like any other ingredient when they are not assumed', async () => {
    expect(await idsFor(['olive oil'], { assumeStaples: false })).toEqual([
      FUL_MEDAMES,
      SALMON,
      MULUKHIYAH,
      SHAKSHUKA,
      SHAWARMA,
    ])
    const [cookies] = await search(['egg'], { assumeStaples: false })
    expect(cookies).toMatchObject({
      id: PEANUT_COOKIES,
      missingIngredients: ['peanut butter', 'sugar'],
      matchScore: 0.3333,
    })
  })

  it('can reorder results', async () => {
    const pantry = ['garlic', 'lemon', 'onion', 'chickpea', 'rice']
    expect((await idsFor(pantry)).slice(0, 3)).toEqual([MULUKHIYAH, KOSHARI, FUL_MEDAMES])
    // Ful Medames only adds olive oil; Mulukhiyah adds salt, water and olive oil.
    expect((await idsFor(pantry, { assumeStaples: false })).slice(0, 3)).toEqual([
      FUL_MEDAMES,
      KOSHARI,
      MULUKHIYAH,
    ])
  })
})

describe('getById', () => {
  it('returns the full recipe with no pantry when there is no context', async () => {
    const koshari = sampleRecipe(KOSHARI)
    expect(await provider.getById(KOSHARI)).toStrictEqual({
      id: KOSHARI,
      source: 'local',
      title: 'Koshari',
      imageUrl: koshari.imageUrl,
      diets: ['vegetarian', 'vegan', 'dairy-free', 'pescatarian'],
      dietsEstimated: false,
      usedIngredients: [],
      missingIngredients: ['brown lentil', 'rice', 'coriander', 'macaroni', 'chickpea', 'onion'],
      matchedUserIngredients: [],
      matchScore: 0,
      ingredients: koshari.ingredients,
      instructions: koshari.instructions,
      cuisine: 'Egyptian',
      sourceUrl: 'https://www.themediterraneandish.com/egyptian-koshari-recipe/',
      attribution: 'TheMealDB',
    })
  })

  it('computes have/need against the context pantry', async () => {
    const detail = await provider.getById(KOSHARI, {
      ingredients: ['rice', 'onion', 'salt', 'tomato'],
      assumeStaples: true,
    })
    expect(detail).toMatchObject({
      usedIngredients: ['rice', 'onion'],
      missingIngredients: ['brown lentil', 'coriander', 'macaroni', 'chickpea'],
      matchedUserIngredients: ['rice', 'onion'],
      matchScore: 0.3333,
    })
  })

  it('counts staples when the context does not assume them', async () => {
    const detail = await provider.getById(KOSHARI, {
      ingredients: ['rice', 'onion', 'salt'],
      assumeStaples: false,
    })
    expect(detail).toMatchObject({
      usedIngredients: ['rice', 'onion', 'salt'],
      missingIngredients: ['brown lentil', 'coriander', 'macaroni', 'chickpea', 'vegetable oil'],
      matchedUserIngredients: ['rice', 'onion', 'salt'],
      matchScore: 0.375,
    })
  })

  it('agrees with search for the same pantry', async () => {
    const [summary] = await search(['chicken'])
    const detail = await provider.getById(SHAWARMA, {
      ingredients: ['chicken'],
      assumeStaples: true,
    })
    expect(detail).toMatchObject(summary ?? {})
  })

  it.each(['local:1', 'mealdb:53027', '53027', 'local:53027 ', ''])(
    'throws RecipeNotFoundError for %j',
    async (id) => {
      const error = await provider.getById(id).catch((caught: unknown) => caught)
      expect(error).toBeInstanceOf(RecipeNotFoundError)
      expect(error).toMatchObject({ recipeId: id, message: `Recipe not found: ${id}` })
    },
  )

  it('rejects an invalid context', async () => {
    const invalid = { ingredients: ['Tomatoes!'], assumeStaples: true }
    await expect(provider.getById(KOSHARI, invalid)).rejects.toThrow(z.ZodError)
  })
})

describe('outputs', () => {
  it('are schema-valid for every sort, diet set and staples setting', async () => {
    for (const sort of SORT_KEYS) {
      for (const assumeStaples of [true, false]) {
        const results = await search(['garlic', 'egg', 'lemon', 'onion', 'chicken'], {
          sort,
          assumeStaples,
        })
        expect(results.length).toBeGreaterThan(0)
        for (const result of results) expect(RecipeSummarySchema.parse(result)).toEqual(result)
      }
    }
    for (const recipe of SAMPLE) {
      const detail = await provider.getById(recipe.id, {
        ingredients: ['garlic', 'egg'],
        assumeStaples: false,
      })
      expect(RecipeDetailSchema.parse(detail)).toEqual(detail)
    }
  })

  it('never share arrays with the dataset', async () => {
    const first = await provider.getById(SHAKSHUKA)
    first.ingredients.pop()
    first.instructions.length = 0
    first.diets.push('vegan')
    const [summary] = await search(['feta'])
    summary?.diets.splice(0)

    const again = await provider.getById(SHAKSHUKA)
    expect(again.ingredients).toEqual(sampleRecipe(SHAKSHUKA).ingredients)
    expect(again.instructions).toHaveLength(2)
    expect(again.diets).toEqual(['vegetarian', 'gluten-free', 'pescatarian'])
  })

  it('are checked against the schemas outside production', async () => {
    const broken = { ...sampleRecipe(SALMON), diets: ['keto'] } as unknown as LocalRecipe
    const unchecked = createLocalProvider(async () => [broken])

    await expect(unchecked.search(paramsFor(['salmon']))).rejects.toThrow(z.ZodError)
    await expect(unchecked.getById(SALMON)).rejects.toThrow(z.ZodError)

    // Production trusts data validated on load: the output is not parsed again.
    vi.stubEnv('NODE_ENV', 'production')
    const [summary] = await unchecked.search(paramsFor(['salmon']))
    expect(summary?.diets).toEqual(['keto'])
    expect((await unchecked.getById(SALMON)).diets).toEqual(['keto'])
  })
})

describe('loading', () => {
  it('accepts a synchronous or an asynchronous loader and calls it per request', async () => {
    const load = vi.fn(async () => SAMPLE)
    const asyncProvider = createLocalProvider(load)
    expect(load).not.toHaveBeenCalled()
    const results = await asyncProvider.search(paramsFor(['salmon']))
    expect(results.map((result) => result.id)).toEqual([SALMON])
    expect((await asyncProvider.getById(SALMON)).title).toBe('Baked salmon with fennel & tomatoes')
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('surfaces a loader failure', async () => {
    const failing = createLocalProvider(() =>
      Promise.reject(new Error('Invalid local recipe data')),
    )
    await expect(failing.search(paramsFor(['egg']))).rejects.toThrow('Invalid local recipe data')
    await expect(failing.getById(KOSHARI)).rejects.toThrow('Invalid local recipe data')
  })
})

describe('performance', () => {
  /** Spec: a search over the full collection stays under 50 ms. */
  const BUDGET_MS = 50
  const RECIPE_COUNT = 200

  /** The sample repeated under distinct ids, about the size of data/recipes.json. */
  const recipes: LocalRecipe[] = Array.from({ length: RECIPE_COUNT }, (_, index) => {
    const recipe = SAMPLE[index % SAMPLE.length] as LocalRecipe
    const mealDbId = String(90_000 + index)
    return { ...recipe, id: `local:${mealDbId}`, mealDbId, title: `${recipe.title} ${index}` }
  })
  const large = createLocalProvider(() => recipes)
  const pantry = ['chicken', 'egg', 'garlic', 'onion', 'tomato', 'rice', 'lemon', 'cheese', 'beef']

  function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b)
    return sorted[Math.floor(sorted.length / 2)] ?? Number.NaN
  }

  it(`searches ${RECIPE_COUNT} recipes in under ${BUDGET_MS} ms`, async () => {
    const params = paramsFor(pantry, { sort: 'best' })
    for (let run = 0; run < 5; run += 1) await large.search(params)

    const timings: number[] = []
    let count = 0
    for (let run = 0; run < 21; run += 1) {
      const started = performance.now()
      count = (await large.search(params)).length
      timings.push(performance.now() - started)
    }
    // Every sample recipe uses one of these, so all 200 are scored, mapped and schema-checked.
    expect(count).toBe(RECIPE_COUNT)
    expect(median(timings)).toBeLessThan(BUDGET_MS)
  })
})
