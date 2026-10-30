import { describe, expect, it } from 'vitest'
import egyptian from '../../../data/chef/egyptian.json'
import italian from '../../../data/chef/italian.json'
import mexican from '../../../data/chef/mexican.json'
import moroccan from '../../../data/chef/moroccan.json'
import saudi from '../../../data/chef/saudi.json'
import foodsFile from '../../../data/nutrition/foods.json'
import recipesFile from '../../../data/recipes.json'
import { NutritionFoodsSchema } from '@/lib/nutrition/data-files'
import { LocalRecipeCollectionSchema } from '@/types/recipe'
import { CHEF_CUISINES, ChefCollectionSchema, chefNutrition } from './recipes'

const chef = [egyptian, italian, mexican, moroccan, saudi].flatMap((file) =>
  ChefCollectionSchema.parse(file),
)
const local = LocalRecipeCollectionSchema.parse(recipesFile).recipes
const foods = NutritionFoodsSchema.parse(foodsFile).foods

/** The focus cuisines as Cooking Companion's filters group them. */
const FOCUS: Record<string, string[]> = {
  Egyptian: ['Egyptian'],
  Italian: ['Italian'],
  Mexican: ['Mexican'],
  Moroccan: ['Moroccan'],
  'Saudi Arabian': ['Saudi Arabian', 'Arabian'],
  Asian: ['Chinese', 'Japanese', 'Thai', 'Vietnamese', 'Malaysian', 'Filipino', 'Indian'],
}

describe('Cooking Companion recipes', () => {
  it('has at least 60 dishes in every focus cuisine (owner, 2026-10-30)', () => {
    for (const [name, cuisines] of Object.entries(FOCUS)) {
      const count =
        chef.filter((r) => cuisines.includes(r.cuisine)).length +
        local.filter((r) => cuisines.includes(r.cuisine)).length
      expect(count, name).toBeGreaterThanOrEqual(60)
    }
  })

  it('keeps each file to its cuisine with unique ids', () => {
    expect(new Set(chef.map((r) => r.id)).size).toBe(chef.length)
    for (const recipe of chef) expect(CHEF_CUISINES).toContain(recipe.cuisine)
  })

  it('weighs every line with a food from the nutrition table, at a sane energy per serving', () => {
    for (const recipe of chef) {
      const { perServing, missing } = chefNutrition(recipe, foods)
      expect(missing, recipe.id).toEqual([])
      expect(perServing.kcal, recipe.id).toBeGreaterThan(50)
      expect(perServing.kcal, recipe.id).toBeLessThan(1500)
    }
  })

  it('links almost every dish to a cooking video', () => {
    const withVideo = chef.filter((r) => r.video?.en || r.video?.ar).length
    expect(withVideo / chef.length).toBeGreaterThan(0.98)
  })
})
