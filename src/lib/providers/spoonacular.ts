import 'server-only'
import { z } from 'zod'
import { isCanonicalName, isStaple, normalizeIngredient } from '@/lib/matching'
import { consistentDiets, sortDiets } from '@/lib/seed/data-files'
import { htmlToText } from '@/lib/text/html-to-text'
import { splitSteps } from '@/lib/text/split-steps'
import { parseMeasure } from '@/lib/units/parse-measure'
import { SearchParamsSchema, type Diet, type Ingredient, type SearchParams } from '@/types/recipe'
import { fetchJson, ProviderError, type ProviderErrorKind } from './http'
import {
  MatchContextSchema,
  parseRecord,
  rankRecords,
  scoreRecord,
  type RecipeRecord,
} from './records'
import { createTtlCache } from './ttl-cache'
import { RecipeNotFoundError, type RecipeProvider } from './types'

const BASE = 'https://api.spoonacular.com/'
/**
 * Spoonacular's terms allow caching their data for at most one hour: half an hour here, plus at
 * most half an hour at the CDN (see searchCacheControl).
 */
export const SPOONACULAR_CACHE_MS = 30 * 60 * 1000
/** Each result costs points (free plan: 150 a day), so one search asks for enough for 2 pages. */
export const RESULTS_PER_SEARCH = 30
/** After a 429 without Retry-After, and after an auth failure (a bad key will not fix itself). */
const RATE_LIMIT_PAUSE_MS = 60 * 1000
const AUTH_PAUSE_MS = 10 * 60 * 1000

/** Our diet tags → Spoonacular's `diet` values (comma = AND). Dairy-free is an intolerance. */
const SPOONACULAR_DIETS: Partial<Record<Diet, string>> = {
  vegetarian: 'vegetarian',
  vegan: 'vegan',
  'gluten-free': 'gluten free',
  pescatarian: 'pescetarian',
}

const IngredientLineSchema = z.object({
  name: z.string().trim().min(1),
  nameClean: z.string().nullish(),
  original: z.string().trim().min(1),
  amount: z.number().nullish(),
  unit: z.string().nullish(),
})

const InstructionBlockSchema = z.object({
  steps: z.array(z.object({ step: z.string() })).nullish(),
})

/** A recipe from complexSearch (with recipe information) or from /information. */
export const SpoonacularRecipeSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  image: z.string().nullish(),
  readyInMinutes: z.number().nullish(),
  servings: z.number().nullish(),
  sourceUrl: z.string().nullish(),
  vegetarian: z.boolean().nullish(),
  vegan: z.boolean().nullish(),
  glutenFree: z.boolean().nullish(),
  dairyFree: z.boolean().nullish(),
  diets: z.array(z.string()).nullish(),
  cuisines: z.array(z.string()).nullish(),
  analyzedInstructions: z.array(InstructionBlockSchema).nullish(),
  /** HTML; used only when analyzedInstructions has no steps. */
  instructions: z.string().nullish(),
  /** /information: every ingredient line. */
  extendedIngredients: z.array(z.unknown()).nullish(),
  /** complexSearch with fillIngredients: the lines split by whether the user has them. */
  usedIngredients: z.array(z.unknown()).nullish(),
  missedIngredients: z.array(z.unknown()).nullish(),
})
export type SpoonacularRecipe = z.infer<typeof SpoonacularRecipeSchema>

const ComplexSearchSchema = z.object({ results: z.array(z.unknown()) })

const UrlSchema = z.url({ protocol: /^https?$/ })

function positiveInt(value: number | null | undefined): number | undefined {
  return value !== null && value !== undefined && Number.isFinite(value) && value >= 1
    ? Math.round(value)
    : undefined
}

/** Image URLs are absolute on current responses; a bare "123-312x231.jpg" is made absolute. */
function imageOf(image: string | null | undefined): string | undefined {
  if (!image) return undefined
  if (image.startsWith('https://')) return image
  return /^\d+-\d+x\d+\.\w+$/.test(image)
    ? `https://img.spoonacular.com/recipes/${image}`
    : undefined
}

function toIngredient(line: unknown): Ingredient | null {
  const parsed = IngredientLineSchema.safeParse(line)
  if (!parsed.success) return null
  const { name, nameClean, original, amount, unit } = parsed.data
  const canonical = normalizeIngredient(nameClean?.trim() || name)
  if (!isCanonicalName(canonical)) return null
  const measure =
    amount !== null && amount !== undefined && Number.isFinite(amount) && amount > 0
      ? parseMeasure(`${Math.round(amount * 1000) / 1000} ${unit ?? ''}`)
      : {}
  return { raw: original, name: canonical, ...measure }
}

function ingredientsOf(recipe: SpoonacularRecipe): Ingredient[] {
  const lines = recipe.extendedIngredients?.length
    ? recipe.extendedIngredients
    : [...(recipe.usedIngredients ?? []), ...(recipe.missedIngredients ?? [])]
  return lines.map(toIngredient).filter((line): line is Ingredient => line !== null)
}

function stepsOf(recipe: SpoonacularRecipe): string[] {
  const steps = (recipe.analyzedInstructions ?? [])
    .flatMap((block) => block.steps ?? [])
    .map((step) => step.step.replace(/\s+/g, ' ').trim())
    .filter((step) => step !== '')
  return steps.length > 0 ? steps : splitSteps(htmlToText(recipe.instructions ?? ''))
}

/** Spoonacular's own flags; vegetarian food is pescatarian too, as in the local tags. */
function dietsOf(recipe: SpoonacularRecipe): Diet[] {
  const tags = new Set(recipe.diets ?? [])
  const diets: Diet[] = []
  if (recipe.vegetarian) diets.push('vegetarian')
  if (recipe.vegan) diets.push('vegan')
  if (recipe.glutenFree) diets.push('gluten-free')
  if (recipe.dairyFree) diets.push('dairy-free')
  if (recipe.vegetarian || tags.has('pescatarian')) diets.push('pescatarian')
  return consistentDiets(sortDiets(diets))
}

/** One Spoonacular recipe → a record, or null when it is not a usable recipe. */
export function toSpoonacularRecord(recipe: SpoonacularRecipe): RecipeRecord | null {
  const sourceUrl = UrlSchema.safeParse(recipe.sourceUrl?.trim())
  return parseRecord({
    id: `spoonacular:${recipe.id}`,
    source: 'spoonacular',
    title: recipe.title.trim(),
    imageUrl: imageOf(recipe.image),
    readyInMinutes: positiveInt(recipe.readyInMinutes),
    servings: positiveInt(recipe.servings),
    diets: dietsOf(recipe),
    // Spoonacular computes its flags automatically; nobody here reviewed them.
    dietsEstimated: true,
    ingredients: ingredientsOf(recipe),
    instructions: stepsOf(recipe),
    cuisine: recipe.cuisines?.find((cuisine) => cuisine.trim() !== '')?.trim(),
    sourceUrl: sourceUrl.success ? sourceUrl.data : undefined,
    attribution: 'spoonacular',
  })
}

/** complexSearch's query for a search, with the user's staples left out when they are assumed. */
export function complexSearchQuery(params: SearchParams): Record<string, string> | null {
  const wanted = params.ingredients.filter(
    (ingredient) => !(params.assumeStaples && isStaple(ingredient)),
  )
  if (wanted.length === 0) return null
  const diets = params.diets.flatMap((diet) => SPOONACULAR_DIETS[diet] ?? [])
  return {
    includeIngredients: wanted.join(','),
    ...(diets.length > 0 ? { diet: diets.join(',') } : {}),
    ...(params.diets.includes('dairy-free') ? { intolerances: 'dairy' } : {}),
    fillIngredients: 'true',
    addRecipeInformation: 'true',
    addRecipeInstructions: 'true',
    instructionsRequired: 'true',
    ignorePantry: String(params.assumeStaples),
    sort: 'min-missing-ingredients',
    number: String(RESULTS_PER_SEARCH),
  }
}

/** Midnight UTC after `time`: when Spoonacular's daily points reset. */
export function nextUtcMidnight(time: number): number {
  const date = new Date(time)
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1)
}

export interface SpoonacularProviderOptions {
  apiKey: string
  fetchImpl?: typeof fetch
  now?: () => number
}

/**
 * Spoonacular as a provider: one complexSearch per search, re-scored by the shared engine. The key
 * travels in the x-api-key header from the server only. After a 402 (daily points used up) the
 * provider stops calling until the points reset at midnight UTC, and after a 429 or an auth error
 * it pauses, so a busy page cannot burn the quota on calls that are bound to fail.
 */
export function createSpoonacularProvider(options: SpoonacularProviderOptions): RecipeProvider {
  const { apiKey, fetchImpl, now = Date.now } = options
  const cacheOptions = { ttlMs: SPOONACULAR_CACHE_MS, now }
  const searchCache = createTtlCache<RecipeRecord[]>({ ...cacheOptions, maxEntries: 500 })
  const detailCache = createTtlCache<RecipeRecord | null>({ ...cacheOptions, maxEntries: 1_000 })
  let blocked: { until: number; kind: ProviderErrorKind } | undefined

  const call = async (path: string, query: Record<string, string>, label: string) => {
    if (blocked && now() < blocked.until) {
      throw new ProviderError('spoonacular', blocked.kind, `${label} (paused)`)
    }
    const url = new URL(path, BASE)
    for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value)
    try {
      return await fetchJson(url, {
        provider: 'spoonacular',
        label,
        headers: { 'x-api-key': apiKey },
        fetchImpl,
      })
    } catch (error) {
      if (error instanceof ProviderError) {
        if (error.kind === 'quota') blocked = { until: nextUtcMidnight(now()), kind: 'quota' }
        if (error.kind === 'rate-limit') {
          const pause = error.retryAfter ? error.retryAfter * 1000 : RATE_LIMIT_PAUSE_MS
          blocked = { until: now() + pause, kind: 'rate-limit' }
        }
        if (error.kind === 'auth') blocked = { until: now() + AUTH_PAUSE_MS, kind: 'auth' }
      }
      throw error
    }
  }

  const search = (query: Record<string, string>) =>
    searchCache.get(new URLSearchParams(query).toString(), async () => {
      const json = await call('recipes/complexSearch', query, 'complexSearch')
      const body = ComplexSearchSchema.safeParse(json)
      if (!body.success) throw new ProviderError('spoonacular', 'invalid-response', 'complexSearch')
      return body.data.results.flatMap((result) => {
        const recipe = SpoonacularRecipeSchema.safeParse(result)
        const record = recipe.success ? toSpoonacularRecord(recipe.data) : null
        return record ? [record] : []
      })
    })

  const detail = (key: string) =>
    detailCache.get(key, async () => {
      let json: unknown
      try {
        json = await call(
          `recipes/${key}/information`,
          { includeNutrition: 'false' },
          'information',
        )
      } catch (error) {
        if (error instanceof ProviderError && error.kind === 'not-found') return null
        throw error
      }
      const recipe = SpoonacularRecipeSchema.safeParse(json)
      if (!recipe.success) throw new ProviderError('spoonacular', 'invalid-response', 'information')
      return toSpoonacularRecord(recipe.data)
    })

  return {
    id: 'spoonacular',

    async search(input: SearchParams) {
      const params = SearchParamsSchema.parse(input)
      const query = complexSearchQuery(params)
      return query ? rankRecords(await search(query), params) : []
    },

    async getById(id, context = { ingredients: [], assumeStaples: true }) {
      const pantry = MatchContextSchema.parse(context)
      const match = /^spoonacular:(\d+)$/.exec(id)
      if (!match) throw new RecipeNotFoundError(id)
      const record = await detail(match[1]!)
      if (record === null) throw new RecipeNotFoundError(id)
      return scoreRecord(record, pantry)
    },
  }
}
