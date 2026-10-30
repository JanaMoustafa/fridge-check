import { describe, expect, it } from 'vitest'
import { ChefRecipeSchema, chefNutrition, dishNutrition, type ChefRecipe } from './recipes'

const foods = {
  rice: {
    per100g: { kcal: 360, proteinG: 7, fatG: 1, carbsG: 79, fiberG: 1.3 },
    category: 'Cereal Grains and Pasta',
  },
  lamb: {
    per100g: { kcal: 243, proteinG: 17, fatG: 19, carbsG: 0 },
    category: 'Lamb, Veal, and Game Products',
  },
  molokhia: {
    per100g: { kcal: 34, proteinG: 4.7, fatG: 0.3, carbsG: 5.8 },
    category: 'Vegetables and Vegetable Products',
  },
}

const recipe = (ingredients: ChefRecipe['ingredients'], servings = 2) => ({ ingredients, servings })
const line = (food: string | null, grams: number) => ({ food, grams, en: 'x', ar: 'س' })

describe('chefNutrition', () => {
  it('adds up every weighed line and divides by the servings', () => {
    const result = chefNutrition(recipe([line('rice', 200), line('lamb', 400)]), foods)
    expect(result.total.kcal).toBeCloseTo(720 + 972)
    expect(result.perServing.kcal).toBeCloseTo((720 + 972) / 2)
    expect(result.perServing.proteinG).toBeCloseTo((14 + 68) / 2)
    expect(result.missing).toEqual([])
  })

  it('counts no fibre for meat whose record has none, and says when a plant food lacks it', () => {
    const meatAndRice = chefNutrition(recipe([line('rice', 100), line('lamb', 100)]), foods)
    expect(meatAndRice.total.fiberG).toBeCloseTo(1.3)
    expect(meatAndRice.fiberComplete).toBe(true)
    const withLeaves = chefNutrition(recipe([line('rice', 100), line('molokhia', 300)]), foods)
    expect(withLeaves.fiberComplete).toBe(false)
  })

  it('skips seasonings without a food and names foods missing from the table', () => {
    const result = chefNutrition(
      recipe([line(null, 5), line('saffron', 1), line('rice', 100)]),
      foods,
    )
    expect(result.lines[0]).toBeUndefined()
    expect(result.missing).toEqual(['saffron'])
    expect(result.total.kcal).toBeCloseTo(360)
  })
})

describe('dishNutrition', () => {
  it('works on any weighed lines, as the recipe page uses it for TheMealDB dishes', () => {
    const result = dishNutrition([{ grams: 50, per100g: foods.rice.per100g }, undefined], 4)
    expect(result.total.carbsG).toBeCloseTo(39.5)
    expect(result.perServing.carbsG).toBeCloseTo(39.5 / 4)
  })
})

describe('ChefRecipeSchema', () => {
  const valid = {
    id: 'eg-test-dish',
    cuisine: 'Egyptian',
    title: { en: 'Test dish', ar: 'طبق تجريبي' },
    servings: 2,
    minutes: 30,
    ingredients: [line('rice', 100), line(null, 3)],
    steps: { en: ['Boil.', 'Serve.'], ar: ['اسلق.', 'قدّم.'] },
    videoSearch: { en: 'test dish recipe' },
  }

  it('accepts a complete bilingual recipe', () => {
    expect(ChefRecipeSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects steps that do not match one for one, and Arabic that is not Arabic', () => {
    expect(
      ChefRecipeSchema.safeParse({ ...valid, steps: { en: ['a', 'b', 'c'], ar: ['أ', 'ب'] } })
        .success,
    ).toBe(false)
    expect(
      ChefRecipeSchema.safeParse({ ...valid, title: { en: 'Dish', ar: 'Dish' } }).success,
    ).toBe(false)
  })

  it('allows a line without a food only for a small seasoning', () => {
    expect(
      ChefRecipeSchema.safeParse({ ...valid, ingredients: [line(null, 40), line('rice', 1)] })
        .success,
    ).toBe(false)
  })
})
