import { describe, expect, it } from 'vitest'
import { loadLocalRecipes } from '@/lib/data/local-recipes'
import cuisineOverridesFile from '../../../data/cuisine-overrides.json'
import dietOverridesFile from '../../../data/diet-overrides.json'
import recipesFile from '../../../data/recipes.json'
import allowlistFile from '../../../data/seed-allowlist.json'
import { CANONICAL_NAMES } from '@/lib/matching/synonyms'
import { datasetStats } from './collection'
import { CUISINE_LABELS } from './cuisines'
import {
  CuisineOverridesSchema,
  DietOverridesSchema,
  SeedAllowlistSchema,
  sortDiets,
} from './data-files'
import { SEED_PLAN } from './select'

// The shipped data files, checked on every test run: a bad seed or a hand edit fails here, before
// the app ever loads them.
const recipes = loadLocalRecipes(recipesFile)
const allowlist = SeedAllowlistSchema.parse(allowlistFile)
const cuisineOverrides = CuisineOverridesSchema.parse(cuisineOverridesFile).recipes
const dietOverrides = DietOverridesSchema.parse(dietOverridesFile).recipes
const byId = new Map(recipes.map((recipe) => [recipe.mealDbId, recipe]))

describe('data/recipes.json', () => {
  it('holds exactly the allowlisted meals, sorted by id', () => {
    const ids = recipes.map((recipe) => recipe.mealDbId)
    expect(ids).toEqual(Object.keys(allowlist.recipes))
    expect(ids).toEqual([...ids].sort((a, b) => Number(a) - Number(b)))
  })

  it('uses only ingredient names the engine knows (so they can be suggested and typed)', () => {
    const unknown = recipes.flatMap((recipe) =>
      recipe.ingredients.map(({ name }) => name).filter((name) => !CANONICAL_NAMES.has(name)),
    )
    expect([...new Set(unknown)]).toEqual([])
  })

  it('labels every recipe with a known cuisine', () => {
    const unknown = recipes.filter((recipe) => !CUISINE_LABELS.includes(recipe.cuisine))
    expect(unknown.map((recipe) => recipe.id)).toEqual([])
  })

  it('applies every cuisine override', () => {
    for (const [id, override] of Object.entries(cuisineOverrides)) {
      expect(byId.get(id)?.cuisine, id).toBe(override.cuisine)
    }
  })

  it('carries the reviewed diets exactly where there is a review', () => {
    for (const [id, override] of Object.entries(dietOverrides)) {
      const recipe = byId.get(id)
      expect(recipe, `diet override ${id} matches no recipe`).toBeDefined()
      expect(recipe?.title).toBe(override.title)
      expect(recipe?.diets).toEqual(sortDiets(override.diets))
    }
    const reviewed = recipes.filter((recipe) => !recipe.dietsEstimated)
    expect(reviewed.map((recipe) => recipe.mealDbId).sort()).toEqual(
      Object.keys(dietOverrides).sort(),
    )
  })

  it("meets the owner's size and balance targets", () => {
    const stats = datasetStats(recipes)
    const { targets } = SEED_PLAN
    expect(stats.total).toBeGreaterThanOrEqual(SEED_PLAN.minTotal)
    expect(stats.total).toBeLessThanOrEqual(SEED_PLAN.targetTotal)
    expect(stats.diets.vegetarian / stats.total).toBeGreaterThanOrEqual(targets.vegetarian)
    expect(stats.diets.vegan / stats.total).toBeGreaterThanOrEqual(targets.vegan)
    expect(stats.seafood / stats.total).toBeGreaterThanOrEqual(targets.seafood)
    expect(stats.mena).toBeGreaterThanOrEqual(targets.mena)
    for (const id of SEED_PLAN.required) expect(byId.has(id), id).toBe(true)
  })
})
