import 'server-only'
import { z } from 'zod'
import { isCanonicalName, isFamilyMatch, isStaple, normalizeIngredient } from '@/lib/matching'
import { consistentDiets, CuisineOverridesSchema, DietOverridesSchema } from '@/lib/seed/data-files'
import {
  MealDbFilterEntrySchema,
  MealDbMealSchema,
  parseMealsField,
} from '@/lib/seed/mealdb-schema'
import { convertMeal, type SeedOverrides } from '@/lib/seed/transform'
import { SearchParamsSchema, type SearchParams } from '@/types/recipe'
import { fetchJson, mapLimit, ProviderError } from './http'
import {
  MatchContextSchema,
  parseRecord,
  rankRecords,
  scoreRecord,
  type RecipeRecord,
} from './records'
import { createTtlCache } from './ttl-cache'
import { RecipeNotFoundError, type RecipeProvider } from './types'

const DAY_MS = 24 * 60 * 60 * 1000

/** TheMealDB name variants queried per user ingredient ("Chicken", "Chicken Breast", …). */
export const MAX_NAMES_PER_INGREDIENT = 5
/** filter.php calls per search, shared round-robin between the user's ingredients. */
export const MAX_FILTER_CALLS = 24
/** Meals looked up (and scored) per search: the ones that use the most of the user's items. */
export const MAX_LOOKUPS = 40
const CONCURRENCY = 6
/** The whole search, every call included: past this the built-in collection answers instead. */
export const SEARCH_BUDGET_MS = 10_000

const IngredientEntrySchema = z.object({ strIngredient: z.string().trim().min(1) })

const NO_CONTEXT = { ingredients: [], assumeStaples: true }

export interface MealDbProviderOptions {
  /** "1" is the free development key (v1 API); a supporter key uses the v2 API. */
  apiKey: string
  fetchImpl?: typeof fetch
  now?: () => number
  /** Reviewed diets and cuisine corrections for meals that are also in the local collection. */
  loadOverrides?: () => Promise<SeedOverrides>
  searchBudgetMs?: number
}

async function loadDataOverrides(): Promise<SeedOverrides> {
  const [diets, cuisines] = await Promise.all([
    import('../../../data/diet-overrides.json'),
    import('../../../data/cuisine-overrides.json'),
  ])
  return {
    dietOverrides: DietOverridesSchema.parse(diets.default).recipes,
    cuisineOverrides: CuisineOverridesSchema.parse(cuisines.default).recipes,
  }
}

/**
 * A live meal → a record. Meals a person reviewed for the local collection keep their reviewed
 * tags; any other meal claims a diet only when nothing argues against it: no tags at all when the
 * ingredient list looks incomplete, and none the title casts doubt on.
 */
export function toMealDbRecord(
  meal: z.infer<typeof MealDbMealSchema>,
  overrides: SeedOverrides,
): RecipeRecord | null {
  const { fields, gaps, doubts } = convertMeal(meal, overrides)
  const diets = !fields.dietsEstimated
    ? fields.diets
    : gaps.length > 0
      ? []
      : consistentDiets(fields.diets.filter((diet) => !doubts.includes(diet)))
  return parseRecord({
    id: `mealdb:${meal.idMeal}`,
    source: 'mealdb',
    title: fields.title,
    imageUrl: fields.imageUrl?.startsWith('https://') ? fields.imageUrl : undefined,
    diets,
    dietsEstimated: fields.dietsEstimated,
    ingredients: fields.ingredients,
    instructions: fields.instructions,
    cuisine: fields.cuisine,
    category: fields.category,
    sourceUrl: fields.sourceUrl,
    attribution: fields.attribution,
  })
}

/** canonical name → TheMealDB's ingredient names that normalize to it. */
export type IngredientIndex = ReadonlyMap<string, readonly string[]>

export function buildIngredientIndex(names: readonly string[]): IngredientIndex {
  const index = new Map<string, string[]>()
  for (const name of names) {
    const canonical = normalizeIngredient(name)
    if (!isCanonicalName(canonical)) continue
    const list = index.get(canonical) ?? []
    if (!list.includes(name)) list.push(name)
    index.set(canonical, list)
  }
  for (const list of index.values()) list.sort()
  return index
}

/**
 * The TheMealDB names to query for one user ingredient: its own names first, then those of its
 * family (chicken → Chicken Breast, Chicken Thighs; chicken breast → Chicken). filter.php only
 * matches a name exactly, so every variant is a separate call.
 */
export function namesFor(ingredient: string, index: IngredientIndex): string[] {
  const relatives = [...index.keys()].filter((canonical) => isFamilyMatch(ingredient, canonical))
  const names = [
    ...(index.get(ingredient) ?? []),
    ...relatives.sort().flatMap((c) => index.get(c)!),
  ]
  return [...new Set(names)].slice(0, MAX_NAMES_PER_INGREDIENT)
}

/** Round-robin over the user's ingredients, so each gets its best names queried first. */
export function planFilterCalls(perIngredient: ReadonlyArray<readonly string[]>): string[] {
  const calls: string[] = []
  const longest = Math.max(0, ...perIngredient.map((names) => names.length))
  for (let round = 0; round < longest; round++) {
    for (const names of perIngredient) {
      const name = names[round]
      if (name !== undefined && !calls.includes(name)) calls.push(name)
    }
  }
  return calls.slice(0, MAX_FILTER_CALLS)
}

/**
 * Meals ordered by how many distinct user ingredients found them (then by id, for a stable
 * order), cut to MAX_LOOKUPS. TheMealDB cannot intersect filters on the free key, and an
 * intersection is usually empty anyway, so the union is ranked instead.
 */
export function rankCandidates(
  hits: ReadonlyArray<{ ingredient: string; mealIds: readonly string[] }>,
): string[] {
  const found = new Map<string, Set<string>>()
  for (const { ingredient, mealIds } of hits) {
    for (const id of mealIds) {
      const by = found.get(id) ?? new Set<string>()
      by.add(ingredient)
      found.set(id, by)
    }
  }
  return [...found.entries()]
    .sort(([a, aBy], [b, bBy]) => bBy.size - aBy.size || Number(a) - Number(b))
    .slice(0, MAX_LOOKUPS)
    .map(([id]) => id)
}

/**
 * TheMealDB as a live provider: per-ingredient filter calls, the best candidates looked up in
 * full, then filtered and ranked by the shared engine. Answers are cached for a day (recipes
 * rarely change); a failed call fails the search, so the registry falls back to local recipes.
 */
export function createMealDbProvider(options: MealDbProviderOptions): RecipeProvider {
  const { apiKey, fetchImpl, now = Date.now, searchBudgetMs = SEARCH_BUDGET_MS } = options
  const version = apiKey === '1' ? 'v1' : 'v2'
  const base = `https://www.themealdb.com/api/json/${version}/${encodeURIComponent(apiKey)}/`
  const cacheOptions = { ttlMs: DAY_MS, now }
  const indexCache = createTtlCache<IngredientIndex>({ ...cacheOptions, maxEntries: 1 })
  const filterCache = createTtlCache<string[]>({ ...cacheOptions, maxEntries: 2_000 })
  const recordCache = createTtlCache<RecipeRecord | null>({ ...cacheOptions, maxEntries: 2_000 })
  let overrides: Promise<SeedOverrides> | undefined
  const getOverrides = () => {
    overrides ??= (options.loadOverrides ?? loadDataOverrides)().catch((error: unknown) => {
      overrides = undefined
      throw error
    })
    return overrides
  }

  const call = (endpoint: string, query: Record<string, string>, signal?: AbortSignal) => {
    const url = new URL(endpoint, base)
    for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value)
    return fetchJson(url, { provider: 'mealdb', label: endpoint, signal, fetchImpl })
  }

  const parse = <T>(json: unknown, schema: z.ZodType<T>, label: string): T[] => {
    try {
      return parseMealsField(json, schema).items
    } catch {
      throw new ProviderError('mealdb', 'invalid-response', label)
    }
  }

  const ingredientIndex = (signal?: AbortSignal) =>
    indexCache.get('index', async () => {
      const json = await call('list.php', { i: 'list' }, signal)
      const entries = parse(json, IngredientEntrySchema, 'list.php')
      if (entries.length === 0) throw new ProviderError('mealdb', 'invalid-response', 'list.php')
      return buildIngredientIndex(entries.map((entry) => entry.strIngredient))
    })

  const mealsWith = (name: string, signal?: AbortSignal) =>
    filterCache.get(name, async () => {
      const json = await call('filter.php', { i: name.replace(/ /g, '_') }, signal)
      return parse(json, MealDbFilterEntrySchema, 'filter.php').map((meal) => meal.idMeal)
    })

  const record = (mealId: string, signal?: AbortSignal) =>
    recordCache.get(mealId, async () => {
      const json = await call('lookup.php', { i: mealId }, signal)
      const meal = parse(json, MealDbMealSchema, 'lookup.php')[0]
      return meal ? toMealDbRecord(meal, await getOverrides()) : null
    })

  return {
    id: 'mealdb',

    async search(input: SearchParams) {
      const params = SearchParamsSchema.parse(input)
      const signal = AbortSignal.timeout(searchBudgetMs)
      // Staples are assumed: querying "salt" would only pull in hundreds of unrelated meals.
      const wanted = params.ingredients.filter(
        (ingredient) => !(params.assumeStaples && isStaple(ingredient)),
      )
      const index = await ingredientIndex(signal)
      const perIngredient = wanted.map((ingredient) => namesFor(ingredient, index))
      const calls = planFilterCalls(perIngredient)
      const found = await mapLimit(calls, CONCURRENCY, (name) => mealsWith(name, signal))
      const byName = new Map(calls.map((name, i) => [name, found[i]!]))
      const hits = wanted.map((ingredient, i) => ({
        ingredient,
        mealIds: perIngredient[i]!.flatMap((name) => byName.get(name) ?? []),
      }))
      const candidates = rankCandidates(hits)
      const records = await mapLimit(candidates, CONCURRENCY, (id) => record(id, signal))
      return rankRecords(
        records.filter((entry): entry is RecipeRecord => entry !== null),
        params,
      )
    },

    async getById(id, context = NO_CONTEXT) {
      const pantry = MatchContextSchema.parse(context)
      const match = /^mealdb:(\d+)$/.exec(id)
      if (!match) throw new RecipeNotFoundError(id)
      const found = await record(match[1]!, AbortSignal.timeout(searchBudgetMs))
      if (found === null) throw new RecipeNotFoundError(id)
      return scoreRecord(found, pantry)
    },
  }
}
