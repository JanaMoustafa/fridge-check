import { z } from 'zod'
import { macrosFor, sumMacros, type Macros } from '@/lib/nutrition/portions'

/**
 * Cooking Companion's own recipes (data/chef/*.json), written for it in both languages with every
 * ingredient weighed in grams. Separate from the Find recipes collection: these never take part
 * in ingredient matching, so they only need a weight and, for anything with energy, a USDA food.
 */

export const CHEF_CUISINES = [
  'Egyptian',
  'Italian',
  'Mexican',
  'Moroccan',
  'Saudi Arabian',
] as const
export type ChefCuisine = (typeof CHEF_CUISINES)[number]

/** File per cuisine under data/chef/. */
export const CHEF_FILES: Readonly<Record<ChefCuisine, string>> = {
  Egyptian: 'egyptian.json',
  Italian: 'italian.json',
  Mexican: 'mexican.json',
  Moroccan: 'moroccan.json',
  'Saudi Arabian': 'saudi.json',
}

/** A seasoning with no USDA food (a spice blend, a pinch of salt) may weigh up to this. */
export const UNMAPPED_MAX_G = 15

const ARABIC = /[؀-ۿ]/
const english = z.string().trim().min(1)
const arabic = z.string().trim().regex(ARABIC, 'must be written in Arabic')
const YOUTUBE_ID = z.string().regex(/^[A-Za-z0-9_-]{11}$/)

export const ChefIngredientSchema = z
  .object({
    /** Key in data/nutrition/foods.json; null only for a small seasoning with no USDA food. */
    food: z.string().min(1).nullable(),
    grams: z.number().positive().max(5000),
    /** The line as a cook reads it: "2 medium onions, finely chopped". */
    en: english,
    ar: arabic,
  })
  .refine((line) => line.food !== null || line.grams <= UNMAPPED_MAX_G, {
    message: `only seasonings up to ${UNMAPPED_MAX_G} g may have no food`,
  })

/** A cooking video and the channel to credit. */
const VideoSchema = z.object({ id: YOUTUBE_ID, channel: z.string().min(1) })

export const ChefRecipeSchema = z.object({
  /** Two-letter cuisine prefix and the dish: "eg-koshari". */
  id: z.string().regex(/^(eg|it|mx|ma|sa)-[a-z0-9]+(?:-[a-z0-9]+)*$/),
  cuisine: z.enum(CHEF_CUISINES),
  title: z.object({ en: english, ar: arabic }),
  servings: z.number().int().min(1).max(16),
  /** Start to finish, including soaking or resting. */
  minutes: z
    .number()
    .int()
    .min(5)
    .max(48 * 60),
  ingredients: z.array(ChefIngredientSchema).min(2).max(30),
  steps: z
    .object({ en: z.array(english).min(2).max(20), ar: z.array(arabic).min(2).max(20) })
    .refine((steps) => steps.en.length === steps.ar.length, {
      message: 'steps.en and steps.ar must have the same number of steps',
    }),
  /** What to search YouTube for when choosing the videos (scripts/find-recipe-videos.py). */
  videoSearch: z.object({ en: english, ar: arabic.optional() }),
  /** Chosen by the script: a real cook making the dish, narrated in English or Arabic. */
  video: z.object({ en: VideoSchema.optional(), ar: VideoSchema.optional() }).optional(),
})
export type ChefRecipe = z.infer<typeof ChefRecipeSchema>
export const ChefCollectionSchema = z.array(ChefRecipeSchema)

/** USDA categories of foods with no dietary fibre: an unrecorded value there is zero. */
const NO_FIBRE_CATEGORIES: ReadonlySet<string> = new Set([
  'Beef Products',
  'Dairy and Egg Products',
  'Finfish and Shellfish Products',
  'Lamb, Veal, and Game Products',
  'Pork Products',
  'Poultry Products',
])

export interface WeighedLine {
  grams: number
  per100g: Macros
  /** The USDA category, which says whether a missing fibre value means none. */
  category?: string
}

export interface DishNutrition {
  /** Per line, in recipe order; undefined for a line with no food (a seasoning). */
  lines: Array<Macros | undefined>
  total: Macros & { fiberG: number }
  perServing: Macros & { fiberG: number }
  /** False when a plant food has no fibre value: the fibre shown is then a lower bound. */
  fiberComplete: boolean
}

/** Calories, protein, carbohydrate, fat and fibre for each line, the dish and one serving. */
export function dishNutrition(
  weighed: ReadonlyArray<WeighedLine | undefined>,
  servings: number,
): DishNutrition {
  let fiberComplete = true
  const lines = weighed.map((line) => {
    if (line === undefined) return undefined
    const macros = macrosFor(line.grams, line.per100g)
    if (macros.fiberG !== undefined) return macros
    if (line.category && NO_FIBRE_CATEGORIES.has(line.category)) return { ...macros, fiberG: 0 }
    fiberComplete = false
    return macros
  })
  const known = lines.filter((line): line is Macros => line !== undefined)
  const fiberG = known.reduce((sum, line) => sum + (line.fiberG ?? 0), 0)
  const total = { ...sumMacros(known), fiberG }
  const perServing = { ...macrosFor(100 / servings, total), fiberG: fiberG / servings }
  return { lines, total, perServing, fiberComplete }
}

/** A Cooking Companion recipe's nutrition, with the foods missing from the table named. */
export function chefNutrition(
  recipe: Pick<ChefRecipe, 'ingredients' | 'servings'>,
  foods: Readonly<Record<string, { per100g: Macros; category?: string }>>,
): DishNutrition & { missing: string[] } {
  const missing: string[] = []
  const weighed = recipe.ingredients.map(({ food, grams }) => {
    if (food === null) return undefined
    const entry = Object.hasOwn(foods, food) ? foods[food] : undefined
    if (!entry) {
      missing.push(food)
      return undefined
    }
    return { grams, per100g: entry.per100g, category: entry.category }
  })
  return { ...dishNutrition(weighed, recipe.servings), missing }
}
