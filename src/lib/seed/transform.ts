import { z } from 'zod'
import { classifyDiets, dietBlockers, isCanonicalName, normalizeIngredient } from '@/lib/matching'
// Not part of the engine's public API: the measure rule below must only ever produce a name the
// engine already knows, never a new phrase built from a measure.
import { CANONICAL_NAMES } from '@/lib/matching/synonyms'
import { splitSteps } from '@/lib/text/split-steps'
import { parseMeasure } from '@/lib/units/parse-measure'
import { LocalRecipeSchema, type Diet, type Ingredient, type LocalRecipe } from '@/types/recipe'
import { cuisineForCountry } from './cuisines'
import { sortDiets, type CuisineOverrides, type DietOverrides } from './data-files'
import { ingredientLines, type MealDbMeal } from './mealdb-schema'

export const ATTRIBUTION = 'TheMealDB'

export interface SeedOverrides {
  dietOverrides: DietOverrides
  cuisineOverrides: CuisineOverrides
}

export interface SeedRecipe {
  recipe: LocalRecipe
  /** Raw lines left out because their ingredient normalizes to no usable name. */
  dropped: string[]
  /**
   * Signs the ingredient list is incomplete: TheMealDB's category or the title names meat or fish
   * that no ingredient line does (e.g. a pork belly recipe that only lists the marinade). The
   * diets they contradict are not claimed, and the selection skips these recipes.
   */
  gaps: string[]
  /**
   * Estimated tags the title argues against beyond meat and fish ("cannelloni" in a recipe the
   * lines call gluten-free). Titles mislead too often to change tags by ("cheese bread" made with
   * tapioca), so these are only shown to the person reviewing the tags.
   */
  doubts: Diet[]
}

/** Categories that name the main ingredient, and the diets that ingredient rules out. */
const CATEGORY_RULES_OUT: Readonly<Record<string, readonly Diet[]>> = {
  Beef: ['vegetarian', 'vegan', 'pescatarian'],
  Chicken: ['vegetarian', 'vegan', 'pescatarian'],
  Goat: ['vegetarian', 'vegan', 'pescatarian'],
  Lamb: ['vegetarian', 'vegan', 'pescatarian'],
  Pork: ['vegetarian', 'vegan', 'pescatarian'],
  Seafood: ['vegetarian', 'vegan'],
}

const SourceUrlSchema = z.url({ protocol: /^https?$/ })

/**
 * The words of a measure that are neither amounts nor units: "2 tsp ground" → "ground",
 * "1 red" → "red", "50g/1¾oz" → "". Parentheticals restate amounts, so they are skipped.
 */
export function measureModifier(measure: string): string {
  return measure
    .replace(/\([^)]*\)?/g, ' ')
    .split(/[\s/,;]+/)
    .map((word) => word.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ''))
    .filter((word) => word !== '' && !/\d/.test(word) && parseMeasure(word).unit === undefined)
    .join(' ')
}

/**
 * The canonical name of one ingredient slot. TheMealDB sometimes puts the word that changes the
 * ingredient into the measure ("2 tsp ground" + "Coriander", "1 red" + "Pepper"), so the measure's
 * modifier words are tried in front of the ingredient, and kept only when that gives a different
 * name the engine already knows (ground coriander, bell pepper). Anything else in the measure
 * ("1 small finely diced", "cut into cubes") cannot leak into the name this way.
 */
export function ingredientName(measure: string, ingredient: string): string {
  const alone = normalizeIngredient(ingredient)
  const modifier = measureModifier(measure)
  if (modifier === '') return alone
  const combined = normalizeIngredient(`${modifier} ${ingredient}`)
  return combined !== alone && CANONICAL_NAMES.has(combined) ? combined : alone
}

/** "1 1/2 cups " + "Brown Lentils" → "1 1/2 cups Brown Lentils": the source text, spaced once. */
function rawLine(measure: string, ingredient: string): string {
  return `${measure} ${ingredient}`.replace(/\s+/g, ' ').trim()
}

/** Meat or fish named by the category or title but by no ingredient line, and what it rules out. */
function findGaps(category: string, title: Record<Diet, string[]>, diets: readonly Diet[]) {
  const gaps: string[] = []
  const ruledOut = new Set<Diet>()
  const byCategory = (CATEGORY_RULES_OUT[category] ?? []).filter((diet) => diets.includes(diet))
  if (byCategory.length > 0) {
    gaps.push(`filed under ${category}, but no ingredient line is ${category.toLowerCase()}`)
    byCategory.forEach((diet) => ruledOut.add(diet))
  }
  // A title names meat and fish reliably ("pork belly", "saltfish"); see SeedRecipe.doubts for
  // what else it may hint at.
  const byTitle: Diet[] = [
    ...(title.vegetarian.length > 0 ? (['vegetarian', 'vegan'] as const) : []),
    ...(title.pescatarian.length > 0 ? (['pescatarian'] as const) : []),
  ].filter((diet) => diets.includes(diet))
  if (byTitle.length > 0) {
    gaps.push('the title names meat or fish, but no ingredient line does')
    byTitle.forEach((diet) => ruledOut.add(diet))
  }
  return { gaps, ruledOut }
}

function fail(meal: MealDbMeal, reason: string): never {
  throw new Error(`Meal ${meal.idMeal} (${meal.strMeal.trim()}): ${reason}`)
}

/** A meal's recipe fields before validation, and what the conversion noticed on the way. */
export interface ConvertedMeal {
  fields: {
    title: string
    imageUrl: string | undefined
    category: string | undefined
    /** Undefined when TheMealDB's country has no label yet (the seed stops; live data omits it). */
    cuisine: string | undefined
    diets: Diet[]
    dietsEstimated: boolean
    ingredients: Ingredient[]
    instructions: string[]
    sourceUrl?: string
    attribution: string
  }
  dropped: string[]
  gaps: string[]
  doubts: Diet[]
}

/**
 * One TheMealDB meal → recipe fields, shared by the seed (toLocalRecipe) and the live TheMealDB
 * provider. Text is kept as published (trimmed; steps split by splitSteps, which only changes
 * layout). Diets come from the reviewed overrides when there is one (dietsEstimated false),
 * otherwise from the classifier on every line's raw text and name, minus whatever an incomplete
 * ingredient list makes doubtful.
 */
export function convertMeal(meal: MealDbMeal, overrides: SeedOverrides): ConvertedMeal {
  const title = meal.strMeal.trim()
  const ingredients: Ingredient[] = []
  const lines: Array<{ raw: string; name: string }> = []
  const dropped: string[] = []
  for (const { measure, ingredient } of ingredientLines(meal)) {
    const raw = rawLine(measure, ingredient)
    const name = ingredient === '' ? '' : ingredientName(measure, ingredient)
    // Dropped lines are still classified: their raw text can name an allergen.
    lines.push({ raw, name: isCanonicalName(name) ? name : '' })
    if (!isCanonicalName(name)) {
      dropped.push(raw)
      continue
    }
    ingredients.push({ raw, name, ...parseMeasure(measure) })
  }

  const country = meal.strCountry?.trim() ?? ''
  const cuisine = overrides.cuisineOverrides[meal.idMeal]?.cuisine ?? cuisineForCountry(country)

  const category = meal.strCategory?.trim() || undefined
  const titleBlockers = dietBlockers([title])
  const estimated = classifyDiets(lines)
  const { gaps, ruledOut } = findGaps(category ?? '', titleBlockers, estimated)
  const reviewed = overrides.dietOverrides[meal.idMeal]
  const diets = reviewed
    ? sortDiets(reviewed.diets)
    : estimated.filter((diet) => !ruledOut.has(diet))
  const doubts = reviewed ? [] : diets.filter((diet) => titleBlockers[diet].length > 0)

  const source = SourceUrlSchema.safeParse(meal.strSource?.trim())
  return {
    fields: {
      title,
      imageUrl: meal.strMealThumb?.trim() || undefined,
      category,
      cuisine,
      diets,
      dietsEstimated: reviewed === undefined,
      ingredients,
      instructions: splitSteps(meal.strInstructions ?? ''),
      ...(source.success ? { sourceUrl: source.data } : {}),
      attribution: ATTRIBUTION,
    },
    dropped,
    gaps,
    doubts,
  }
}

/**
 * One TheMealDB meal → a validated local recipe. Throws, naming the meal, when the meal cannot
 * become a valid recipe (unknown country, no usable ingredient, no steps, bad image).
 */
export function toLocalRecipe(meal: MealDbMeal, overrides: SeedOverrides): SeedRecipe {
  const { fields, dropped, gaps, doubts } = convertMeal(meal, overrides)
  const country = meal.strCountry?.trim() ?? ''
  const cuisine =
    fields.cuisine ??
    fail(meal, `no cuisine label for country "${country}" (add it to src/lib/seed/cuisines.ts)`)
  const candidate = { id: `local:${meal.idMeal}`, mealDbId: meal.idMeal, ...fields, cuisine }
  const result = LocalRecipeSchema.safeParse(candidate)
  if (!result.success) fail(meal, z.prettifyError(result.error).replace(/\n/g, ' '))
  return { recipe: result.data, dropped, gaps, doubts }
}
