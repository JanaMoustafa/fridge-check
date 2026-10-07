import { describe, expect, it } from 'vitest'
import fixture from '../../../tests/fixtures/mealdb-meals.sample.json'
import {
  MealDbCategorySchema,
  MealDbFilterEntrySchema,
  MealDbMealSchema,
  ingredientLines,
  parseMealsField,
  type MealDbMeal,
} from './mealdb-schema'

// The fixture is a real search.php response body, trimmed to 15 meals.
const MEALS = parseMealsField(fixture, MealDbMealSchema).items

function meal(id: string): MealDbMeal {
  const found = MEALS.find((candidate) => candidate.idMeal === id)
  if (found === undefined) throw new Error(`fixture has no meal ${id}`)
  return found
}

describe('parseMealsField', () => {
  it('reads every record of a real response', () => {
    const field = parseMealsField(fixture, MealDbMealSchema)
    expect(field.items).toHaveLength(fixture.meals.length)
    expect(field.invalid).toEqual([])
    expect(field.notice).toBeUndefined()
    expect(meal('53027')).toMatchObject({
      strMeal: 'Koshari',
      strCountry: 'Egypt',
      strIngredient1: 'Brown Lentils',
      strMeasure1: '1 1/2 cups ',
    })
  })

  it('treats null as no results', () => {
    expect(parseMealsField({ meals: null }, MealDbMealSchema)).toEqual({ items: [], invalid: [] })
  })

  it.each([
    ['Invalid ID', 'Invalid ID'],
    ['no data found', 'no data found'],
    [{ message: 'Patreon supporters only' }, '{"message":"Patreon supporters only"}'],
  ])('treats %j as no results, with a notice', (meals, notice) => {
    expect(parseMealsField({ meals }, MealDbMealSchema)).toEqual({ items: [], invalid: [], notice })
  })

  it('reports malformed records without dropping the valid ones', () => {
    const koshari = fixture.meals[0]
    const field = parseMealsField(
      { meals: [koshari, { ...koshari, idMeal: 'abc' }, { strMeal: 'No id' }, 42] },
      MealDbMealSchema,
    )
    expect(field.items.map((item) => item.idMeal)).toEqual(['53027'])
    expect(field.invalid).toHaveLength(3)
    expect(field.invalid[0]).toMatch(/^#1 \(abc\) idMeal: /)
    expect(field.invalid[1]).toMatch(/^#2 idMeal: /)
    expect(field.invalid[2]).toMatch(/^#3 /)
  })

  it.each([[{}], [{ meals: 1 }], [[]], [null], ['<html>']])(
    'throws when %j is not a TheMealDB answer',
    (json) => {
      expect(() => parseMealsField(json, MealDbMealSchema)).toThrow(/^Not a TheMealDB response/)
    },
  )

  it('validates the list endpoints', () => {
    const categories = parseMealsField(
      { meals: [{ strCategory: 'Beef' }, { strCategory: '' }] },
      MealDbCategorySchema,
    )
    expect(categories.items).toEqual([{ strCategory: 'Beef' }])
    expect(categories.invalid).toHaveLength(1)
    const entries = parseMealsField(
      { meals: [{ strMeal: 'Kumpir', strMealThumb: 'x', idMeal: '52978' }] },
      MealDbFilterEntrySchema,
    )
    expect(entries.items).toEqual([{ strMeal: 'Kumpir', idMeal: '52978' }])
  })
})

describe('MealDbMealSchema', () => {
  it('accepts records with missing or null slots and text fields', () => {
    const parsed = MealDbMealSchema.parse({ idMeal: '1', strMeal: 'Toast', strIngredient1: null })
    expect(parsed).toEqual({ idMeal: '1', strMeal: 'Toast', strIngredient1: null })
  })

  it('rejects a non-string slot', () => {
    expect(
      MealDbMealSchema.safeParse({ idMeal: '1', strMeal: 'Toast', strMeasure20: 2 }).success,
    ).toBe(false)
  })
})

describe('ingredientLines', () => {
  it('returns the filled slots in order, trimmed', () => {
    const lines = ingredientLines(meal('53027'))
    expect(lines[0]).toEqual({ slot: 1, ingredient: 'Brown Lentils', measure: '1 1/2 cups' })
    expect(lines.map((line) => line.slot)).toEqual(lines.map((_, index) => index + 1))
    expect(lines.every((line) => line.ingredient !== '')).toBe(true)
  })

  it('skips empty slots anywhere and keeps a measure without an ingredient', () => {
    const lines = ingredientLines({
      idMeal: '1',
      strMeal: 'Toast',
      strIngredient1: 'Bread',
      strMeasure1: '2 slices',
      strIngredient2: '  ',
      strMeasure2: ' ',
      strIngredient3: null,
      strMeasure3: 'to serve',
      strIngredient20: 'Butter',
    })
    expect(lines).toEqual([
      { slot: 1, ingredient: 'Bread', measure: '2 slices' },
      { slot: 3, ingredient: '', measure: 'to serve' },
      { slot: 20, ingredient: 'Butter', measure: '' },
    ])
  })
})
