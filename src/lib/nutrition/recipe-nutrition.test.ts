import { describe, expect, it } from 'vitest'
import type { Ingredient } from '@/types/recipe'
import type { NutritionFood } from './data-files'
import {
  densityOf,
  foodForLine,
  isSmallAmount,
  lineWeight,
  recipeNutrition,
} from './recipe-nutrition'

const food = (
  portions: NutritionFood['portions'],
  per100g: Partial<NutritionFood['per100g']> = {},
  category?: string,
): NutritionFood => ({
  fdcId: 1,
  description: 'test',
  dataType: 'SR Legacy',
  ...(category ? { category } : {}),
  per100g: { kcal: 100, proteinG: 5, fatG: 5, carbsG: 10, ...per100g },
  portions,
})

const flour = food({ cup: 125, tbsp: 7.8 }, { kcal: 364 })
const onion = food({ cup: 160, medium: 110, large: 150 }, { kcal: 40 })
const garlic = food({ tsp: 2.8, cup: 136, clove: 3 }, { kcal: 149 })
const milk = food({ cup: 244 }, { kcal: 61 })
const cumin = food({ tsp: 2.1, tbsp: 6 }, { kcal: 375 }, 'Spices and Herbs')
const tomatoes = food({ cup: 240 }, { kcal: 32 })
const line = (raw: string, name: string, amount?: number, unit?: string): Ingredient => ({
  raw,
  name,
  ...(amount === undefined ? {} : { amount }),
  ...(unit === undefined ? {} : { unit }),
})

describe('lineWeight', () => {
  it('converts mass units directly', () => {
    expect(lineWeight(line('200g flour', 'flour', 200, 'g'), flour)).toEqual({ grams: 200 })
    expect(lineWeight(line('1 lb flour', 'flour', 1, 'lb'), flour)).toEqual({ grams: 453.59237 })
  })

  it('uses USDA’s own cup and spoon weights', () => {
    expect(lineWeight(line('2 cups flour', 'flour', 2, 'cup'), flour)).toEqual({ grams: 250 })
    expect(lineWeight(line('1 tbsp flour', 'flour', 1, 'tbsp'), flour)).toEqual({ grams: 7.8 })
  })

  it('converts metric volumes through USDA density', () => {
    const grams = (lineWeight(line('250ml milk', 'milk', 250, 'ml'), milk) as { grams: number })
      .grams
    expect(grams).toBeCloseTo(250 * (244 / 236.588), 6)
    expect(densityOf(milk)).toBeCloseTo(1.0313, 3)
    expect(densityOf(food({}))).toBeUndefined()
  })

  it('weighs counted lines as medium, then other sizes', () => {
    expect(lineWeight(line('2 onions', 'onion', 2), onion)).toEqual({ grams: 220 })
    expect(lineWeight(line('2 eggs', 'egg', 2), food({ large: 50 }))).toEqual({ grams: 100 })
    expect(lineWeight(line('2 limes', 'lime', 2), food({ cup: 200 }))).toEqual({
      notMeasured: 'no-usda-weight',
    })
  })

  it('uses portions for cloves, and the printed size for cans', () => {
    expect(lineWeight(line('3 cloves garlic', 'garlic', 3, 'clove'), garlic)).toEqual({ grams: 9 })
    expect(lineWeight(line('1 (400g) tin chopped tomatoes', 'tomato', 1, 'tin'), tomatoes)).toEqual(
      { grams: 400 },
    )
    expect(lineWeight(line('2 cans tomatoes', 'tomato', 2, 'can'), tomatoes)).toEqual({
      notMeasured: 'no-usda-weight',
    })
  })

  it('reads a pinch as 1/16 tsp and a dash as 1/8 tsp', () => {
    expect(lineWeight(line('pinch cumin', 'cumin', undefined, 'pinch'), cumin)).toEqual({
      grams: 2.1 / 16,
    })
    expect(lineWeight(line('2 dashes cumin', 'cumin', 2, 'dash'), cumin)).toEqual({
      grams: (2 * 2.1) / 8,
    })
    expect(
      (lineWeight(line('pinch flour', 'flour', 1, 'pinch'), flour) as { grams: number }).grams,
    ).toBeCloseTo(((125 / 236.588) * 4.929) / 16, 6)
    expect(lineWeight(line('pinch x', 'x', 1, 'pinch'), food({ medium: 5 }))).toEqual({
      notMeasured: 'no-usda-weight',
    })
  })

  it('says why a line cannot be weighed', () => {
    expect(lineWeight(line('Chopped onion', 'onion'), onion)).toEqual({ notMeasured: 'no-amount' })
    expect(lineWeight(line('Handful parsley', 'parsley', 1, 'handful'), onion)).toEqual({
      notMeasured: 'unknown-unit',
    })
    expect(lineWeight(line('1 bogus flour', 'flour', 1, 'bogus'), flour)).toEqual({
      notMeasured: 'unknown-unit',
    })
    expect(lineWeight(line('cup flour', 'flour', undefined, 'cup'), flour)).toEqual({
      notMeasured: 'no-amount',
    })
    expect(lineWeight(line('1 l milk', 'milk', 1, 'l'), food({ medium: 5 }))).toEqual({
      notMeasured: 'no-usda-weight',
    })
  })
})

describe('recipeNutrition', () => {
  const foods = {
    flour,
    onion,
    garlic,
    cumin,
    salt: food({ tsp: 6 }, { kcal: 0 }, 'Spices and Herbs'),
  }
  const data = { foods, minorWithoutFood: ['garam masala'] }

  it('weighs every line it can and is complete when only minor lines are left out', () => {
    const result = recipeNutrition(
      [
        line('2 cups flour', 'flour', 2, 'cup'),
        line('1 onion', 'onion', 1),
        line('To taste salt', 'salt'),
        line('Ground cumin', 'cumin'),
        line('to serve Bread', 'bread', 2, 'slice'),
      ],
      data,
    )
    expect(result.lines.map((l) => [l.name, l.grams])).toEqual([
      ['flour', 250],
      ['onion', 110],
    ])
    expect(result.uncounted.map((l) => [l.name, l.reason])).toEqual([
      ['salt', 'small-amount'],
      ['cumin', 'small-amount'],
      ['bread', 'served-separately'],
    ])
    expect(result.complete).toBe(true)
  })

  it('is incomplete when a significant line cannot be weighed or has no USDA food', () => {
    expect(
      recipeNutrition([line('2 cups flour', 'flour', 2, 'cup'), line('Flour', 'flour')], data)
        .complete,
    ).toBe(false)
    const unknown = recipeNutrition(
      [line('1 tsp harissa', 'harissa', 1, 'tsp'), line('1 onion', 'onion', 1)],
      data,
    )
    expect(unknown.uncounted).toEqual([
      { raw: '1 tsp harissa', name: 'harissa', reason: 'no-usda-food' },
    ])
    expect(unknown.complete).toBe(false)
    expect(recipeNutrition([line('salt', 'salt')], data).complete).toBe(false)
  })

  it('leaves out a small amount of a minor ingredient with no USDA food, but not a large one', () => {
    const small = recipeNutrition(
      [line('1 tsp garam masala', 'garam masala', 1, 'tsp'), line('1 onion', 'onion', 1)],
      data,
    )
    expect(small.uncounted[0]!.reason).toBe('small-amount')
    expect(small.complete).toBe(true)
    const large = recipeNutrition(
      [line('1/2 cup garam masala', 'garam masala', 0.5, 'cup'), line('1 onion', 'onion', 1)],
      data,
    )
    expect(large.uncounted[0]!.reason).toBe('no-usda-food')
    expect(large.complete).toBe(false)
  })

  it('uses the canned or dried variant the line names', () => {
    const coconut = { ...food({}, { kcal: 354 }), variants: { dried: food({}, { kcal: 660 }) } }
    const tomato = {
      ...food({ medium: 123 }, { kcal: 18 }),
      variants: { canned: food({ can: 190 }, { kcal: 16 }) },
    }
    expect(foodForLine(coconut, '100g Desiccated Coconut').per100g.kcal).toBe(660)
    expect(foodForLine(coconut, '200g Coconut').per100g.kcal).toBe(354)
    const result = recipeNutrition(
      [line('2 cans tomatoes', 'tomato', 2, 'can'), line('2 tomatoes', 'tomato', 2)],
      { foods: { tomato }, minorWithoutFood: [] },
    )
    expect(result.lines.map((l) => [l.grams, l.per100g.kcal])).toEqual([
      [380, 16],
      [246, 18],
    ])
  })
})

describe('isSmallAmount', () => {
  it.each([
    [line('salt', 'x'), true],
    [line('2 tsp x', 'x', 2, 'tsp'), true],
    [line('4 tsp x', 'x', 4, 'tsp'), false],
    [line('2 tbsp x', 'x', 2, 'tbsp'), true],
    [line('3 tbsp x', 'x', 3, 'tbsp'), false],
    [line('pinch x', 'x', undefined, 'pinch'), true],
    [line('10g x', 'x', 10, 'g'), true],
    [line('20g x', 'x', 20, 'g'), false],
    [line('1 cup x', 'x', 1, 'cup'), false],
    [line('2 x', 'x', 2), false],
    [line('1 bogus x', 'x', 1, 'bogus'), false],
  ])('%j → %s', (ingredient, expected) => {
    expect(isSmallAmount(ingredient)).toBe(expected)
  })
})

describe('recipeNutrition: amounts with no fixed size', () => {
  const oil = food(
    { tbsp: 13.6, cup: 218 },
    { kcal: 884, fatG: 100, carbsG: 0, proteinG: 0 },
    'Fats and Oils',
  )
  const butter = food({ tbsp: 14.2 }, { kcal: 717 }, 'Dairy and Egg Products')
  const chicken = food({ piece: 920 }, { kcal: 215 })
  const data = { foods: { oil, butter, chicken, flour }, minorWithoutFood: [] }

  it('leaves frying oil out (with a warning) instead of counting the whole pan', () => {
    const result = recipeNutrition(
      [
        line('2 quarts neutral frying Oil', 'oil', 2, 'quart'),
        line('1 whole Chicken', 'chicken', 1),
      ],
      data,
    )
    expect(result.uncounted).toEqual([
      { raw: '2 quarts neutral frying Oil', name: 'oil', reason: 'frying-oil' },
    ])
    expect(result.lines.map((l) => l.name)).toEqual(['chicken'])
    expect(result.complete).toBe(true)
  })

  it('counts a drizzle, knob or dusting as a small amount', () => {
    const result = recipeNutrition(
      [
        line('drizzle Olive Oil', 'oil', undefined, 'drizzle'),
        line('1 knob Butter', 'butter', 1, 'knob'),
        line('Flour, for dusting', 'flour'),
        line('1 whole Chicken', 'chicken', 1),
      ],
      data,
    )
    expect(result.uncounted.map((l) => l.reason)).toEqual([
      'small-amount',
      'small-amount',
      'small-amount',
    ])
    expect(result.complete).toBe(true)
  })
})

describe('lineWeight: packages and parts', () => {
  const feta = food({ cup: 150 })
  const coconutMilk = food({ cup: 226 })

  it('weighs a package by the size printed in the line', () => {
    expect(lineWeight(line('1 (200g) pack Cubed Feta', 'feta', 1, 'packet'), feta)).toEqual({
      grams: 200,
    })
    const ml = lineWeight(
      line('400ml can coconut milk', 'coconut milk', 1, 'can'),
      coconutMilk,
    ) as { grams: number }
    expect(ml.grams).toBeCloseTo(400 * (226 / 236.588), 6)
    expect(lineWeight(line('1 (8oz) jar x', 'x', 1, 'jar'), feta)).toEqual({
      grams: 8 * 28.349523125,
    })
    expect(lineWeight(line('1 kg bag x', 'x', 1, 'bag'), feta)).toEqual({ grams: 1000 })
    expect(lineWeight(line('1 pot sour cream', 'x', 1, 'pot'), feta)).toEqual({
      notMeasured: 'no-usda-weight',
    })
    expect(lineWeight(line('1 (300ml) pot x', 'x', 1, 'pot'), food({}))).toEqual({
      notMeasured: 'no-usda-weight',
    })
  })

  it('counts garlic in cloves, bread in slices and pastry in sheets', () => {
    expect(lineWeight(line('3 Garlic', 'garlic', 3), food({ clove: 3, cup: 136 }))).toEqual({
      grams: 9,
    })
    expect(lineWeight(line('4 Bacon', 'bacon', 4), food({ slice: 28 }))).toEqual({ grams: 112 })
    expect(lineWeight(line('4 Filo Pastry', 'phyllo dough', 4), food({ sheet: 19 }))).toEqual({
      grams: 76,
    })
    expect(lineWeight(line('10 lasagne sheets', 'x', 10, 'sheet'), food({ sheet: 18 }))).toEqual({
      grams: 180,
    })
  })
})
