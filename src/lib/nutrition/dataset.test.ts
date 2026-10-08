import { describe, expect, it } from 'vitest'
import mappingFile from '../../../data/nutrition/fdc-mapping.json'
import foodsFile from '../../../data/nutrition/foods.json'
import recipesFile from '../../../data/recipes.json'
import { LocalRecipeCollectionSchema } from '@/types/recipe'
import { FdcMappingSchema, NutritionFoodsSchema } from './data-files'
import { recipeTotals } from './portions'
import { recipeNutrition } from './recipe-nutrition'

const mapping = FdcMappingSchema.parse(mappingFile)
const data = NutritionFoodsSchema.parse(foodsFile)
const recipes = LocalRecipeCollectionSchema.parse(recipesFile).recipes

describe('nutrition dataset', () => {
  it('maps every ingredient of the built-in recipes, explaining each one with no USDA food', () => {
    const names = new Set(recipes.flatMap((recipe) => recipe.ingredients.map((line) => line.name)))
    expect([...names].filter((name) => !(name in mapping.foods))).toEqual([])
  })

  it('has plausible values: no food above pure fat, no negative macros', () => {
    for (const [name, food] of Object.entries(data.foods)) {
      expect(food.per100g.kcal, name).toBeLessThanOrEqual(902)
      expect(
        food.per100g.proteinG + food.per100g.fatG + food.per100g.carbsG,
        name,
      ).toBeLessThanOrEqual(101)
    }
  })

  it('gives most built-in recipes complete nutrition, with sane totals', () => {
    const results = recipes.map((recipe) => recipeNutrition(recipe.ingredients, data))
    const complete = results.filter((result) => result.complete)
    // 140 of 195 when the data was reviewed (2026-10-08); a drop means a regression.
    expect(complete.length).toBeGreaterThanOrEqual(135)
    for (const result of complete) {
      const kcal = recipeTotals(result.lines).kcal
      expect(kcal).toBeGreaterThan(50)
      expect(kcal).toBeLessThan(12_000)
    }
  })
})
