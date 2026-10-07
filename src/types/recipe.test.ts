import { describe, expect, it } from 'vitest'
import {
  IngredientSchema,
  RecipeDetailSchema,
  RecipeSummarySchema,
  SearchParamsSchema,
  type RecipeDetail,
} from './recipe'

const summary = {
  id: 'local:53027',
  source: 'local',
  title: 'Koshari',
  imageUrl: 'https://www.themealdb.com/images/media/meals/4er7mj1598733193.jpg',
  diets: ['vegetarian', 'vegan', 'dairy-free'],
  dietsEstimated: false,
  usedIngredients: ['lentil', 'rice'],
  missingIngredients: ['chickpea'],
  matchedUserIngredients: ['lentil', 'rice'],
  matchScore: 0.67,
} as const

const detail: RecipeDetail = {
  ...summary,
  diets: [...summary.diets],
  usedIngredients: [...summary.usedIngredients],
  missingIngredients: [...summary.missingIngredients],
  matchedUserIngredients: [...summary.matchedUserIngredients],
  ingredients: [{ raw: '1 cup brown lentils', name: 'lentil', amount: 1, unit: 'cup' }],
  instructions: ['Rinse the lentils.', 'Simmer until tender.'],
  cuisine: 'Egyptian',
  sourceUrl: 'https://example.com/koshari',
  attribution: 'TheMealDB',
}

describe('RecipeSummarySchema', () => {
  it('accepts a valid summary', () => {
    expect(RecipeSummarySchema.parse(summary)).toEqual(summary)
  })

  it.each([
    ['a non-namespaced id', { id: '53027' }],
    ['a namespace that does not match the source', { id: 'mealdb:53027' }],
    ['an unknown diet', { diets: ['keto'] }],
    ['a score above 1', { matchScore: 1.2 }],
    ['an http image', { imageUrl: 'http://www.themealdb.com/a.jpg' }],
    ['a javascript: image url', { imageUrl: 'javascript:alert(1)' }],
    ['a non-canonical ingredient', { usedIngredients: ['Tomatoes!'] }],
    ['a blank title', { title: '   ' }],
    ['a fractional cook time', { readyInMinutes: 12.5 }],
  ])('rejects %s', (_label, patch) => {
    expect(RecipeSummarySchema.safeParse({ ...summary, ...patch }).success).toBe(false)
  })
})

describe('RecipeDetailSchema', () => {
  it('accepts a valid detail', () => {
    expect(RecipeDetailSchema.parse(detail)).toEqual(detail)
  })

  it('keeps the id/source refinement', () => {
    expect(RecipeDetailSchema.safeParse({ ...detail, id: 'spoonacular:1' }).success).toBe(false)
  })

  it.each([
    ['no ingredients', { ingredients: [] }],
    ['no instructions', { instructions: [] }],
    ['an empty step', { instructions: ['  '] }],
    ['a non-http source url', { sourceUrl: 'ftp://example.com' }],
  ])('rejects %s', (_label, patch) => {
    expect(RecipeDetailSchema.safeParse({ ...detail, ...patch }).success).toBe(false)
  })
})

describe('IngredientSchema', () => {
  it('allows amount and unit to be absent', () => {
    expect(IngredientSchema.parse({ raw: 'Salt to taste', name: 'salt' })).toEqual({
      raw: 'Salt to taste',
      name: 'salt',
    })
  })

  it('rejects non-positive amounts', () => {
    expect(IngredientSchema.safeParse({ raw: 'x', name: 'salt', amount: 0 }).success).toBe(false)
  })
})

describe('SearchParamsSchema', () => {
  it('applies defaults', () => {
    expect(SearchParamsSchema.parse({ ingredients: ['tomato'] })).toEqual({
      ingredients: ['tomato'],
      diets: [],
      assumeStaples: true,
      sort: 'fewest-missing',
    })
  })

  it('enforces the 20-ingredient limit', () => {
    const ingredients = Array.from({ length: 21 }, (_, i) => `item ${i}`)
    expect(SearchParamsSchema.safeParse({ ingredients }).success).toBe(false)
  })

  it('enforces the 40-character limit', () => {
    expect(SearchParamsSchema.safeParse({ ingredients: ['a'.repeat(41)] }).success).toBe(false)
  })

  it('requires at least one ingredient', () => {
    expect(SearchParamsSchema.safeParse({ ingredients: [] }).success).toBe(false)
  })
})
