import { z } from 'zod'
import { CANONICAL_NAME_MAX_LENGTH, CANONICAL_NAME_PATTERN } from '@/lib/matching/canonical'

export const DIETS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'pescatarian'] as const
export const DietSchema = z.enum(DIETS)
export type Diet = z.infer<typeof DietSchema>

export const RECIPE_SOURCES = ['local', 'mealdb', 'spoonacular'] as const
export const RecipeSourceSchema = z.enum(RECIPE_SOURCES)
export type RecipeSource = z.infer<typeof RecipeSourceSchema>

export const SORT_KEYS = ['best', 'fewest-missing', 'quickest'] as const
export const SortKeySchema = z.enum(SORT_KEYS)
export type SortKey = z.infer<typeof SortKeySchema>

/** Canonical ingredient name: lowercase words, digits, spaces, hyphens and apostrophes. */
export const CanonicalNameSchema = z
  .string()
  .min(1)
  .max(CANONICAL_NAME_MAX_LENGTH)
  .regex(CANONICAL_NAME_PATTERN, 'canonical names are lowercase ASCII')

export const IngredientSchema = z.object({
  /** Original text, e.g. "2 large ripe tomatoes, diced". */
  raw: z.string().min(1),
  /** Canonical normalized name, e.g. "tomato". */
  name: CanonicalNameSchema,
  amount: z.number().positive().finite().optional(),
  unit: z.string().min(1).optional(),
})
export type Ingredient = z.infer<typeof IngredientSchema>

const RecipeIdSchema = z.string().regex(/^(local|mealdb|spoonacular):[A-Za-z0-9_-]+$/)

export const RecipeSummarySchema = z
  .object({
    /** Namespaced: "local:12", "mealdb:52772", "spoonacular:715538". */
    id: RecipeIdSchema,
    source: RecipeSourceSchema,
    title: z.string().trim().min(1),
    imageUrl: z.url({ protocol: /^https$/ }).optional(),
    readyInMinutes: z.number().int().positive().optional(),
    servings: z.number().int().positive().optional(),
    diets: z.array(DietSchema),
    dietsEstimated: z.boolean(),
    /** Recipe-side canonical names matched by the user's ingredients (exact or family). */
    usedIngredients: z.array(CanonicalNameSchema),
    /** Recipe-side canonical names not matched; staples excluded. */
    missingIngredients: z.array(CanonicalNameSchema),
    /** User ingredients the recipe uses (card text + sort): a maximum matching in which each recipe
     *  ingredient credits at most one user item; independent of chip order. */
    matchedUserIngredients: z.array(CanonicalNameSchema),
    /** Σ weights / non-staple ingredient count, weights: exact 1.0, family 0.8. */
    matchScore: z.number().min(0).max(1),
  })
  .refine((r) => r.id.startsWith(`${r.source}:`), {
    message: 'id namespace must match source',
    path: ['id'],
  })
export type RecipeSummary = z.infer<typeof RecipeSummarySchema>

export const RecipeDetailSchema = RecipeSummarySchema.safeExtend({
  ingredients: z.array(IngredientSchema).min(1),
  /** Ordered steps, plain text. */
  instructions: z.array(z.string().trim().min(1)).min(1),
  cuisine: z.string().min(1).optional(),
  sourceUrl: z.url({ protocol: /^https?$/ }).optional(),
  attribution: z.string().min(1).optional(),
})
export type RecipeDetail = z.infer<typeof RecipeDetailSchema>

export const MAX_INGREDIENTS = 20
export const MAX_INGREDIENT_LENGTH = 40

export const SearchParamsSchema = z.object({
  ingredients: z.array(CanonicalNameSchema.max(MAX_INGREDIENT_LENGTH)).min(1).max(MAX_INGREDIENTS),
  diets: z.array(DietSchema).default([]),
  assumeStaples: z.boolean().default(true),
  // Spec default ordering: fewest missing → highest score → most of your ingredients → quickest.
  sort: SortKeySchema.default('fewest-missing'),
})
export type SearchParams = z.infer<typeof SearchParamsSchema>
