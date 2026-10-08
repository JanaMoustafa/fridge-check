import { describe, expect, it } from 'vitest'
import { extractPer100g, extractPortions, FdcFoodSchema, portionKey, type FdcFood } from './fdc'

/** The shape of an SR Legacy record from /v1/foods?format=full (trimmed). */
const garlic: FdcFood = FdcFoodSchema.parse({
  fdcId: 169230,
  description: 'Garlic, raw',
  dataType: 'SR Legacy',
  foodCategory: { description: 'Vegetables and Vegetable Products' },
  foodNutrients: [
    { nutrient: { number: '208', unitName: 'kcal' }, amount: 149 },
    { nutrient: { number: '268', unitName: 'kJ' }, amount: 623 },
    { nutrient: { number: '203', unitName: 'g' }, amount: 6.36 },
    { nutrient: { number: '204', unitName: 'g' }, amount: 0.5 },
    { nutrient: { number: '205', unitName: 'g' }, amount: 33.06 },
    { nutrient: { number: '291', unitName: 'g' }, amount: 2.1 },
  ],
  foodPortions: [
    { amount: 1, gramWeight: 2.8, modifier: 'tsp', measureUnit: { name: 'undetermined' } },
    { amount: 1, gramWeight: 136, modifier: 'cup', measureUnit: { name: 'undetermined' } },
    { amount: 1, gramWeight: 3, modifier: 'clove', measureUnit: { name: 'undetermined' } },
    { amount: 3, gramWeight: 9, modifier: 'cloves', measureUnit: { name: 'undetermined' } },
  ],
})

describe('extractPer100g', () => {
  it('reads kcal, protein, fat, carbs and fiber', () => {
    expect(extractPer100g(garlic)).toEqual({
      kcal: 149,
      proteinG: 6.36,
      fatG: 0.5,
      carbsG: 33.06,
      fiberG: 2.1,
    })
  })

  it('falls back to Atwater energy (Foundation foods) and omits unknown fiber', () => {
    const foundation = FdcFoodSchema.parse({
      ...garlic,
      dataType: 'Foundation',
      foodNutrients: [
        { nutrient: { number: '957', unitName: 'kcal' }, amount: 140 },
        { nutrient: { number: '958', unitName: 'kcal' }, amount: 143 },
        { nutrient: { number: '203', unitName: 'g' }, amount: 6 },
        { nutrient: { number: '204', unitName: 'g' }, amount: 0.4 },
        { nutrient: { number: '205', unitName: 'g' }, amount: 30 },
      ],
    })
    expect(extractPer100g(foundation)).toEqual({ kcal: 143, proteinG: 6, fatG: 0.4, carbsG: 30 })
  })

  it('refuses a food without energy or a macro rather than inventing 0', () => {
    const partial = {
      ...garlic,
      foodNutrients: garlic.foodNutrients.filter((n) => n.nutrient.number !== '204'),
    }
    expect(() => extractPer100g(partial)).toThrow('FDC 169230 (Garlic, raw) has no fatG')
  })
})

describe('portions', () => {
  it('keeps USDA’s first weight per unit, per one unit', () => {
    expect(extractPortions(garlic)).toEqual({ tsp: 2.8, cup: 136, clove: 3 })
  })

  it.each([
    [{ modifier: 'cup, chopped' }, 'cup'],
    [{ modifier: 'tbsp' }, 'tbsp'],
    [{ modifier: 'large (3-1/8" dia)' }, 'large'],
    [{ modifier: 'medium (2-1/2" dia)' }, 'medium'],
    [{ modifier: 'extra large' }, 'large'],
    [{ modifier: 'slice, thin' }, 'slice'],
    [{ modifier: 'stalk, medium (7-1/2" - 8" long)' }, 'stalk'],
    [{ modifier: 'fruit without skin and seeds' }, 'piece'],
    [{ modifier: 'oz' }, undefined],
    [{ measureUnit: { name: 'tablespoon' } }, 'tbsp'],
    [{ measureUnit: { name: 'cup' }, modifier: 'chopped' }, 'cup'],
    [{ measureUnit: { name: 'undetermined' }, portionDescription: '1 fl oz' }, 'fl-oz'],
  ])('reads %j as %s', (portion, key) => {
    expect(portionKey({ gramWeight: 1, ...portion })).toBe(key)
  })

  it('skips portions with no usable amount or weight', () => {
    const odd = {
      ...garlic,
      foodPortions: [
        { amount: 0, gramWeight: 5, modifier: 'cup' },
        { gramWeight: 0, modifier: 'tbsp' },
      ],
    }
    expect(extractPortions(odd)).toEqual({})
    expect(extractPortions({ ...garlic, foodPortions: undefined })).toEqual({})
  })
})

describe('portionKey: one of the food by its own name', () => {
  it.each([
    ['leek', 'Leeks, (bulb and lower leaf-portion), raw', 'piece'],
    ['tortilla', 'Tortillas, ready-to-bake or -fry, corn', 'piece'],
    ['avocado, NS as to Florida or California', 'Avocados, raw, all commercial varieties', 'piece'],
    ['tomato', 'Tomatoes, red, ripe, raw', 'piece'],
    ['link', 'Sausage, Italian, pork, mild, raw', 'piece'],
    ['roll 1 serving', 'Rolls, hamburger or hotdog, plain', 'piece'],
    ['sheet dough', 'Phyllo dough', 'sheet'],
    ['package', 'Pork, cured, bacon, unprepared', undefined],
    ['oz', 'Leeks, raw', undefined],
    ['NLEA Serving', 'Avocados, raw', undefined],
    ['enchilada', 'Tortillas, ready-to-bake or -fry, corn', undefined],
  ])('"%s" of "%s" → %s', (modifier, description, key) => {
    expect(portionKey({ gramWeight: 10, amount: 1, modifier }, description)).toBe(key)
  })

  it('applies the description when extracting', () => {
    const leek = FdcFoodSchema.parse({
      ...garlic,
      description: 'Leeks, raw',
      foodPortions: [{ amount: 1, gramWeight: 89, modifier: 'leek' }],
    })
    expect(extractPortions(leek)).toEqual({ piece: 89 })
  })
})
