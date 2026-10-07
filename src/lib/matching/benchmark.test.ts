import { describe, expect, it } from 'vitest'
import { CanonicalNameSchema, SORT_KEYS } from '@/types/recipe'
import { FAMILIES } from './families'
import { rankRecipes } from './score'
import { STAPLES, isStaple } from './staples'
import type { SortableRecipe } from './types'

/** Spec requirement: ranking a realistic result set stays under 50 ms. */
const BUDGET_MS = 50
const RECIPE_COUNT = 200
const WARM_UP_RUNS = 5
const MEASURED_RUNS = 21

/** Everyday ingredients outside the family table, so recipes mix plain and family lines. */
const EVERYDAY = [
  'egg',
  'milk',
  'cream',
  'sour cream',
  'creme fraiche',
  'yogurt',
  'cream cheese',
  'ricotta',
  'tofu',
  'onion',
  'green onion',
  'garlic',
  'tomato',
  'tomato paste',
  'potato',
  'sweet potato',
  'carrot',
  'celery',
  'cucumber',
  'bell pepper',
  'eggplant',
  'zucchini',
  'spinach',
  'cauliflower',
  'broccoli',
  'green bean',
  'okra',
  'leek',
  'pumpkin',
  'beet',
  'avocado',
  'lemon',
  'lime',
  'banana',
  'molokhia',
  'vine leaf',
  'coriander',
  'parsley',
  'mint',
  'dill',
  'basil',
  'oregano',
  'thyme',
  'rosemary',
  'bay leaf',
  'turmeric',
  'cinnamon',
  'cardamom',
  'clove',
  'nutmeg',
  'ginger',
  'ground ginger',
  'garam masala',
  'curry powder',
  'sumac',
  "za'atar",
  'allspice',
  'saffron',
  'chili powder',
  'chili flakes',
  'sesame seed',
  'tahini',
  'couscous',
  'bulgur',
  'freekeh',
  'oats',
  'chickpea',
  'honey',
  'soy sauce',
  'coconut milk',
  'yeast',
  'baking powder',
  'walnut',
  'pistachio',
  'pine nut',
  'peanut',
  'raisin',
  'date',
] as const

/** ~300 canonical names: staples, everyday items and both sides of every family pair. */
const VOCABULARY = [
  ...new Set([...STAPLES, ...EVERYDAY, ...Object.values(FAMILIES), ...Object.keys(FAMILIES)]),
].slice(0, 300)

/** A fridge with parents (chicken, cheese, rice) and children (cod, red lentil) to hit families. */
const USER_INGREDIENTS = [
  'chicken',
  'ground beef',
  'egg',
  'milk',
  'cheese',
  'cheddar',
  'onion',
  'garlic',
  'tomato',
  'potato',
  'carrot',
  'bell pepper',
  'lemon',
  'parsley',
  'rice',
  'pasta',
  'red lentil',
  'cod',
  'yogurt',
  'cumin',
] as const

/** Several relatives per recipe line (three cheeses, two onions, beef and steak) and staples. */
const RELATIVES_PANTRY = [
  'cheddar',
  'mozzarella',
  'feta',
  'beef',
  'steak',
  'red onion',
  'shallot',
  'chicken breast',
  'chicken thigh',
  'cod',
  'salmon',
  'basmati rice',
  'jasmine rice',
  'spaghetti',
  'penne',
  'tomato',
  'egg',
  'garlic',
  'sugar',
  'butter',
  'olive oil',
] as const

/** mulberry32: a tiny seeded PRNG so every run benchmarks the same recipes. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

/** Orders items by a seeded random key, so a failing order can be replayed. */
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  return items
    .map((item) => ({ item, key: random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item)
}

function generateRecipes(count: number, seed: number): SortableRecipe[] {
  const random = createRandom(seed)
  const pick = () => VOCABULARY[Math.floor(random() * VOCABULARY.length)] ?? 'salt'
  return Array.from({ length: count }, (_, index) => {
    const size = 8 + Math.floor(random() * 13)
    // Real recipes repeat lines (onion in the base and the garnish), so duplicates are allowed.
    const ingredients = Array.from({ length: size }, () => ({ name: pick() }))
    const minutes = 10 + Math.floor(random() * 170)
    const title = `Recipe ${String(index).padStart(3, '0')}`
    // TheMealDB recipes carry no cook time, so a share of them is left unknown.
    return index % 4 === 0
      ? { title, ingredients }
      : { title, ingredients, readyInMinutes: minutes }
  })
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? Number.NaN
}

describe('rankRecipes benchmark', () => {
  const recipes = generateRecipes(RECIPE_COUNT, 20_261_006)
  const options = { assumeStaples: true, sort: 'fewest-missing' } as const

  it('generates a realistic, deterministic data set', () => {
    expect(VOCABULARY.length).toBeGreaterThanOrEqual(280)
    for (const name of [...VOCABULARY, ...USER_INGREDIENTS]) {
      expect(CanonicalNameSchema.safeParse(name).success).toBe(true)
    }
    expect(recipes).toHaveLength(RECIPE_COUNT)
    for (const recipe of recipes) {
      expect(recipe.ingredients.length).toBeGreaterThanOrEqual(8)
      expect(recipe.ingredients.length).toBeLessThanOrEqual(20)
    }
    expect(generateRecipes(RECIPE_COUNT, 20_261_006)).toEqual(recipes)

    // The workload must exercise every path: exact hits, family hits and exclusions.
    const ranked = rankRecipes(USER_INGREDIENTS, recipes, options)
    const used = ranked.flatMap((r) => r.usedIngredients)
    const userSet = new Set<string>(USER_INGREDIENTS)
    expect(ranked.length).toBeGreaterThan(RECIPE_COUNT / 2)
    expect(ranked.length).toBeLessThan(RECIPE_COUNT)
    expect(used.some((name) => userSet.has(name))).toBe(true)
    expect(used.some((name) => !userSet.has(name))).toBe(true)
  })

  it(`ranks ${RECIPE_COUNT} recipes against 20 ingredients in under ${BUDGET_MS} ms`, () => {
    for (let run = 0; run < WARM_UP_RUNS; run++) rankRecipes(USER_INGREDIENTS, recipes, options)

    const timings: number[] = []
    for (let run = 0; run < MEASURED_RUNS; run++) {
      const start = performance.now()
      rankRecipes(USER_INGREDIENTS, recipes, options)
      timings.push(performance.now() - start)
    }

    const medianMs = median(timings)
    console.log(
      `rankRecipes: median ${medianMs.toFixed(3)} ms over ${MEASURED_RUNS} runs ` +
        `(${RECIPE_COUNT} recipes, ${USER_INGREDIENTS.length} user ingredients)`,
    )
    expect(medianMs).toBeLessThan(BUDGET_MS)
  })
})

describe('rankRecipes on the benchmark workload', () => {
  const recipes = generateRecipes(RECIPE_COUNT, 20_261_006)

  it.each(SORT_KEYS)('gives the same results for any order of the user list (%s)', (sort) => {
    const options = { assumeStaples: true, sort }
    const expected = rankRecipes(RELATIVES_PANTRY, recipes, options)
    const random = createRandom(20_261_007)
    for (let run = 0; run < 20; run++) {
      const user = shuffle(RELATIVES_PANTRY, random)
      // Only the matched list follows the user's order; everything else is identical.
      const inUserOrder = expected.map((result) => ({
        ...result,
        matchedUserIngredients: user.filter((name) => result.matchedUserIngredients.includes(name)),
      }))
      expect(rankRecipes(user, recipes, options)).toEqual(inUserOrder)
    }
  })

  it('ignores staples the user typed while staples are assumed', () => {
    const assumed = { assumeStaples: true, sort: 'fewest-missing' } as const
    const scored = { ...assumed, assumeStaples: false }
    const staples = [...STAPLES]

    // Not vacuous: with the switch off, typed staples reach non-staple lines through families.
    const reached = rankRecipes(staples, recipes, scored).flatMap((r) => r.usedIngredients)
    expect(reached.some((name) => !isStaple(name))).toBe(true)

    expect(rankRecipes([...USER_INGREDIENTS, ...staples], recipes, assumed)).toEqual(
      rankRecipes(USER_INGREDIENTS, recipes, assumed),
    )
    expect(rankRecipes(staples, recipes, assumed)).toEqual([])
  })
})
