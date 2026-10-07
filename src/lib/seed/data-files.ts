import { z } from 'zod'
import { DIETS, DietSchema, type Diet, type LocalRecipe } from '@/types/recipe'
import { CUISINE_LABELS } from './cuisines'

/**
 * The hand-edited and generated JSON files the seed reads, keyed by TheMealDB id ("53027"):
 * - data/seed-allowlist.json: which meals make up data/recipes.json (written by --reselect).
 * - data/cuisine-overrides.json: cuisine corrections where TheMealDB's country is wrong.
 * - data/diet-overrides.json: diet tags a person reviewed against the ingredient list.
 */

const MealDbIdSchema = z.string().regex(/^\d+$/, 'keys are TheMealDB ids, e.g. "53027"')

export const SeedAllowlistSchema = z.object({
  version: z.literal(1),
  /** id → "Title (Cuisine)": only the ids matter; the label is for people reading the file. */
  recipes: z.record(MealDbIdSchema, z.string().min(1)),
})
export type SeedAllowlist = z.infer<typeof SeedAllowlistSchema>

export const CuisineOverrideSchema = z.strictObject({
  cuisine: z.string().refine((label) => CUISINE_LABELS.includes(label), {
    message: 'unknown cuisine label (add it to src/lib/seed/cuisines.ts first)',
  }),
  /** Why TheMealDB's country is wrong, so the correction can be checked later. */
  reason: z.string().trim().min(1),
})
export type CuisineOverride = z.infer<typeof CuisineOverrideSchema>

export const CuisineOverridesSchema = z.object({
  version: z.literal(1),
  recipes: z.record(MealDbIdSchema, CuisineOverrideSchema),
})
export type CuisineOverrides = z.infer<typeof CuisineOverridesSchema>['recipes']

/** Tags that imply others: a reviewed list must be consistent, like the classifier's output. */
const DIET_IMPLICATIONS: ReadonlyArray<readonly [Diet, Diet]> = [
  ['vegan', 'vegetarian'],
  ['vegan', 'dairy-free'],
  ['vegetarian', 'pescatarian'],
]

export const DietOverrideSchema = z
  .strictObject({
    /** The recipe's title, so a mistyped id is caught instead of retagging the wrong recipe. */
    title: z.string().trim().min(1),
    /** The complete reviewed list (not a patch): diets not listed are not claimed. */
    diets: z.array(DietSchema),
    /** What the reviewer checked or changed, e.g. "stock cube: assumed meat-based". */
    note: z.string().trim().min(1).optional(),
  })
  .superRefine((override, ctx) => {
    if (new Set(override.diets).size !== override.diets.length) {
      ctx.addIssue({ code: 'custom', path: ['diets'], message: 'diets are listed twice' })
    }
    for (const [diet, implied] of DIET_IMPLICATIONS) {
      if (override.diets.includes(diet) && !override.diets.includes(implied)) {
        ctx.addIssue({ code: 'custom', path: ['diets'], message: `${diet} implies ${implied}` })
      }
    }
  })
export type DietOverride = z.infer<typeof DietOverrideSchema>

export const DietOverridesSchema = z.object({
  version: z.literal(1),
  recipes: z.record(MealDbIdSchema, DietOverrideSchema),
})
export type DietOverrides = z.infer<typeof DietOverridesSchema>['recipes']

/** Diets in DIETS order, the order the classifier returns them in. */
export function sortDiets(diets: readonly Diet[]): Diet[] {
  return DIETS.filter((diet) => diets.includes(diet))
}

/** The allowlist for a selection, ids ascending (JSON objects keep integer-like keys sorted). */
export function toAllowlist(recipes: readonly LocalRecipe[]): SeedAllowlist {
  const entries = recipes.map((recipe) => [recipe.mealDbId, `${recipe.title} (${recipe.cuisine})`])
  return { version: 1, recipes: Object.fromEntries(entries) }
}
