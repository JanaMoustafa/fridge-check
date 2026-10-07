import { describe, expect, it } from 'vitest'
import { LOCAL_RECIPE_MIN, type LocalRecipe } from '@/types/recipe'
import fixture from '../../../tests/fixtures/mealdb-meals.sample.json'
import { buildCollection, datasetStats, formatStats, isSeafood, toJson } from './collection'
import { MealDbMealSchema, parseMealsField } from './mealdb-schema'
import { toLocalRecipe } from './transform'

const RECIPES = parseMealsField(fixture, MealDbMealSchema).items.map(
  (meal) => toLocalRecipe(meal, { dietOverrides: {}, cuisineOverrides: {} }).recipe,
)

function byId(id: string): LocalRecipe {
  return RECIPES.find((recipe) => recipe.mealDbId === id) as LocalRecipe
}

/** `count` copies of Koshari under ids 9000, 9001, … (shorter ids sort first numerically). */
function copies(count: number, firstId = 9_000): LocalRecipe[] {
  const koshari = byId('53027')
  return Array.from({ length: count }, (_, index) => {
    const mealDbId = String(firstId + index)
    return { ...koshari, id: `local:${mealDbId}`, mealDbId }
  })
}

describe('buildCollection', () => {
  it('sorts recipes by numeric TheMealDB id', () => {
    const recipes = [...copies(LOCAL_RECIPE_MIN - 1), byId('53027')].reverse()
    const collection = buildCollection(recipes)
    expect(collection.version).toBe(1)
    expect(collection.recipes.map((recipe) => recipe.mealDbId).slice(0, 2)).toEqual([
      '9000',
      '9001',
    ])
    expect(collection.recipes.at(-1)?.mealDbId).toBe('53027')
  })

  it('rejects duplicate ids and collections outside the size limits', () => {
    const recipes = copies(LOCAL_RECIPE_MIN)
    expect(() => buildCollection([...recipes, recipes[3] as LocalRecipe])).toThrow(
      'Duplicate recipe id local:9003',
    )
    expect(() => buildCollection(copies(LOCAL_RECIPE_MIN - 1))).toThrow(/>=150/)
  })
})

describe('toJson', () => {
  it('writes 2-space JSON with a trailing newline', () => {
    expect(toJson({ version: 1, recipes: [] })).toBe('{\n  "version": 1,\n  "recipes": []\n}\n')
  })
})

describe('isSeafood', () => {
  it('means fish without meat', () => {
    expect(isSeafood(byId('52819'))).toBe(true)
    expect(isSeafood(byId('53027'))).toBe(false)
    expect(isSeafood(byId('52796'))).toBe(false)
  })
})

describe('datasetStats', () => {
  it('counts diets, seafood, MENA, desserts, reviews and cuisines', () => {
    const reviewed = { ...byId('53027'), dietsEstimated: false }
    const recipes = [...RECIPES.filter((recipe) => recipe.mealDbId !== '53027'), reviewed]
    const stats = datasetStats(recipes)
    expect(stats.total).toBe(15)
    expect(stats.diets.vegan).toBe(
      recipes.filter((recipe) => recipe.diets.includes('vegan')).length,
    )
    expect(stats.seafood).toBe(3)
    // Koshari, Feteer Meshaltet, Shawarma bread, Knafeh, kabse, Chakchouka.
    expect(stats.mena).toBe(6)
    expect(stats.desserts).toBe(1)
    expect(stats.reviewed).toBe(1)
    expect(stats.cuisines.slice(0, 3)).toEqual([
      ['Saudi Arabian', 3],
      ['Antiguan', 2],
      ['Egyptian', 2],
    ])
  })

  it('formats a readable summary', () => {
    const text = formatStats(datasetStats(RECIPES))
    expect(text.split('\n')[0]).toBe('Recipes: 15 (0 with reviewed diet tags)')
    expect(text).toMatch(/^ {2}seafood {8} {3}3 {2}20\.0%$/m)
    expect(text).toMatch(/^ {2}Saudi Arabian 3$/m)
    expect(formatStats(datasetStats([]))).toContain('  vegan             0  0%')
  })
})
