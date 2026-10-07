/**
 * Seeds data/recipes.json with real recipes from TheMealDB (run `pnpm seed --help`). All selection
 * and transformation logic lives in src/lib/seed (pure and unit-tested); this file only fetches,
 * reads and writes files, and prints the report.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import type { z } from 'zod'
import { buildCollection, datasetStats, formatStats, toJson } from '@/lib/seed/collection'
import {
  CuisineOverridesSchema,
  DietOverridesSchema,
  SeedAllowlistSchema,
  toAllowlist,
} from '@/lib/seed/data-files'
import {
  MealDbCategorySchema,
  MealDbFilterEntrySchema,
  MealDbMealSchema,
  parseMealsField,
  type MealDbMeal,
  type MealsField,
} from '@/lib/seed/mealdb-schema'
import { SEED_PLAN, selectRecipes, type Selection } from '@/lib/seed/select'
import { toLocalRecipe, type SeedOverrides, type SeedRecipe } from '@/lib/seed/transform'
import type { LocalRecipe } from '@/types/recipe'

const HELP = `Seeds data/recipes.json with real recipes from TheMealDB.

Usage: pnpm seed [--reselect]

  (no flag)    Rebuild data/recipes.json from the meals listed in data/seed-allowlist.json,
               with the latest TheMealDB data. The same allowlist gives the same recipes.
  --reselect   Choose the meals again with the owner's quotas and quality gates
               (SEED_PLAN in src/lib/seed/select.ts), rewrite data/seed-allowlist.json,
               then rebuild data/recipes.json. Fails, writing nothing, when a balance
               target or a required recipe is missed.
  --help       Show this help.

Reads   data/seed-allowlist.json, data/cuisine-overrides.json, data/diet-overrides.json
Writes  data/recipes.json (and data/seed-allowlist.json with --reselect)

Environment
  THEMEALDB_API_KEY  TheMealDB key (default "1", the free key)
  SEED_CACHE_DIR     Keep raw API responses in this directory and reuse them on the next
                     run (fast, offline re-runs). Use a directory outside the repository.`

const DATA_DIR = join(process.cwd(), 'data')
const FILES = {
  recipes: join(DATA_DIR, 'recipes.json'),
  allowlist: join(DATA_DIR, 'seed-allowlist.json'),
  cuisineOverrides: join(DATA_DIR, 'cuisine-overrides.json'),
  dietOverrides: join(DATA_DIR, 'diet-overrides.json'),
}

const BASE_URL = `https://www.themealdb.com/api/json/v1/${process.env.THEMEALDB_API_KEY || '1'}/`
const CACHE_DIR = process.env.SEED_CACHE_DIR
const CONCURRENCY = 4
const TIMEOUT_MS = 8_000
const ATTEMPTS = 4
const FIRST_BACKOFF_MS = 1_000
/** search.php?f= takes one letter or digit and returns full records. */
const SEARCH_KEYS = [...'abcdefghijklmnopqrstuvwxyz0123456789']

const warnings: string[] = []

class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`)
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Timeouts, network errors, empty or non-JSON bodies, 429 and 5xx are worth another try. */
function isTransient(error: unknown): boolean {
  return !(error instanceof HttpError) || error.status === 429 || error.status >= 500
}

async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  run: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array<R>(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await run(items[index] as T)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

async function readCache(file: string): Promise<string | undefined> {
  try {
    return await readFile(file, 'utf8')
  } catch {
    return undefined
  }
}

/**
 * GET one endpoint and read its `meals` field with Zod. Retries transient failures with
 * exponential backoff; with SEED_CACHE_DIR set, a response that parsed is kept and reused.
 */
async function request<T>(path: string, item: z.ZodType<T>): Promise<MealsField<T>> {
  const cacheFile = CACHE_DIR && join(CACHE_DIR, `${path.replace(/[^a-z0-9]+/gi, '_')}.json`)
  const cached = cacheFile ? await readCache(cacheFile) : undefined
  if (cached !== undefined) return parseMealsField(JSON.parse(cached), item)
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(new URL(path, BASE_URL), {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      if (!response.ok) throw new HttpError(response.status)
      const text = await response.text()
      const field = parseMealsField(JSON.parse(text), item)
      if (cacheFile) await writeFile(cacheFile, text)
      return field
    } catch (error) {
      if (attempt === ATTEMPTS || !isTransient(error)) {
        throw new Error(`GET ${path} failed after ${attempt} attempt(s): ${describe(error)}`)
      }
      await sleep(FIRST_BACKOFF_MS * 2 ** (attempt - 1))
    }
  }
}

function noteProblems(path: string, field: MealsField<unknown>): void {
  if (field.notice !== undefined) warnings.push(`${path}: TheMealDB answered "${field.notice}"`)
  field.invalid.forEach((line) => warnings.push(`${path}: invalid record ${line}`))
}

async function fetchMeals(paths: readonly string[]): Promise<MealDbMeal[]> {
  const fields = await mapLimit(paths, CONCURRENCY, (path) => request(path, MealDbMealSchema))
  fields.forEach((field, index) => noteProblems(paths[index] as string, field))
  return fields.flatMap((field) => field.items)
}

/** Every meal id TheMealDB lists: letter search misses a few, the category lists do not. */
async function listAllIds(): Promise<string[]> {
  const categories = await request('list.php?c=list', MealDbCategorySchema)
  noteProblems('list.php?c=list', categories)
  const paths = categories.items.map(
    ({ strCategory }) => `filter.php?c=${encodeURIComponent(strCategory)}`,
  )
  const lists = await mapLimit(paths, CONCURRENCY, (path) => request(path, MealDbFilterEntrySchema))
  lists.forEach((list, index) => noteProblems(paths[index] as string, list))
  return lists.flatMap((list) => list.items.map((entry) => entry.idMeal))
}

/** Full records for `wanted` (or every meal when undefined): letter search, then one lookup per gap. */
async function fetchRecords(
  wanted: readonly string[] | undefined,
): Promise<Map<string, MealDbMeal>> {
  console.log(`Fetching TheMealDB (${SEARCH_KEYS.length} letter searches)…`)
  const meals = new Map<string, MealDbMeal>()
  const add = (list: readonly MealDbMeal[]) => list.forEach((meal) => meals.set(meal.idMeal, meal))
  add(await fetchMeals(SEARCH_KEYS.map((key) => `search.php?f=${key}`)))
  const ids = wanted ?? [...new Set([...meals.keys(), ...(await listAllIds())])]
  const gaps = ids.filter((id) => !meals.has(id))
  if (gaps.length > 0) {
    console.log(
      `Looking up ${gaps.length} meal(s) letter search did not return: ${gaps.join(', ')}`,
    )
    add(await fetchMeals(gaps.map((id) => `lookup.php?i=${id}`)))
  }
  console.log(`Fetched ${meals.size} meals.`)
  return meals
}

async function readJson<T>(file: string, schema: z.ZodType<T>): Promise<T> {
  const result = schema.safeParse(JSON.parse(await readFile(file, 'utf8')))
  if (!result.success) throw new Error(`${file} is invalid:\n${result.error.message}`)
  return result.data
}

function transformAll(meals: Iterable<MealDbMeal>, overrides: SeedOverrides) {
  const seeds = new Map<string, SeedRecipe>()
  const failures = new Map<string, string>()
  for (const meal of meals) {
    try {
      seeds.set(meal.idMeal, toLocalRecipe(meal, overrides))
    } catch (error) {
      failures.set(meal.idMeal, describe(error))
    }
  }
  return { seeds, failures }
}

function printSelection(selection: Selection): void {
  console.log(`\nSelected ${selection.recipes.length} recipes:`)
  let cuisine = ''
  for (const recipe of selection.recipes) {
    if (recipe.cuisine !== cuisine) console.log(`  ${(cuisine = recipe.cuisine)}`)
    const tags = recipe.diets.length > 0 ? `  [${recipe.diets.join(', ')}]` : ''
    console.log(`    ${recipe.mealDbId}  ${recipe.title}${tags}`)
  }
  if (selection.shortfalls.length > 0) {
    console.log(`\nQuotas not filled (too few recipes pass the gates):`)
    selection.shortfalls.forEach((line) => console.log(`  ${line}`))
  }
  const quotaRejections = selection.rejected.filter(({ recipe }) =>
    Object.hasOwn(SEED_PLAN.quotas, recipe.cuisine),
  )
  console.log(
    `\nRejected by the quality gates: ${selection.rejected.length} ` +
      `(${quotaRejections.length} in quota cuisines, listed):`,
  )
  for (const { recipe, reason } of quotaRejections) {
    console.log(`  ${recipe.mealDbId}  ${recipe.title} (${recipe.cuisine}): ${reason}`)
  }
}

/** Warnings about overrides that point at nothing or at a different recipe than intended. */
function checkOverrides(recipes: readonly LocalRecipe[], overrides: SeedOverrides): void {
  const byId = new Map(recipes.map((recipe) => [recipe.mealDbId, recipe]))
  for (const [id, override] of Object.entries(overrides.dietOverrides)) {
    const recipe = byId.get(id)
    if (recipe === undefined) warnings.push(`diet override ${id} matches no recipe in the dataset`)
    else if (recipe.title !== override.title) {
      warnings.push(
        `diet override ${id} is titled "${override.title}", recipe is "${recipe.title}"`,
      )
    }
  }
  for (const id of Object.keys(overrides.cuisineOverrides)) {
    if (!byId.has(id)) warnings.push(`cuisine override ${id} matches no recipe in the dataset`)
  }
}

async function main(args: readonly string[]): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP)
    return 0
  }
  const unknown = args.filter((arg) => arg !== '--reselect')
  if (unknown.length > 0) {
    console.error(`Unknown option: ${unknown.join(' ')}\n\n${HELP}`)
    return 1
  }
  const reselect = args.includes('--reselect')
  if (CACHE_DIR) {
    await mkdir(CACHE_DIR, { recursive: true })
    console.log(`Caching raw API responses in ${CACHE_DIR}`)
  }

  const overrides: SeedOverrides = {
    cuisineOverrides: (await readJson(FILES.cuisineOverrides, CuisineOverridesSchema)).recipes,
    dietOverrides: (await readJson(FILES.dietOverrides, DietOverridesSchema)).recipes,
  }
  const allowlist = reselect ? undefined : await readJson(FILES.allowlist, SeedAllowlistSchema)
  const allowed = allowlist && Object.keys(allowlist.recipes)
  const meals = await fetchRecords(allowed)
  const pool = allowed ? allowed.flatMap((id) => meals.get(id) ?? []) : [...meals.values()]
  const { seeds, failures } = transformAll(pool, overrides)

  let ids: string[]
  let selection: Selection | undefined
  if (allowed) {
    ids = allowed
    const missing = ids.flatMap((id) => {
      if (seeds.has(id)) return []
      return [`  ${id}: ${failures.get(id) ?? 'TheMealDB no longer has this meal'}`]
    })
    if (missing.length > 0) {
      console.error(`Allowlisted meals that cannot be seeded:\n${missing.join('\n')}`)
      return 1
    }
  } else {
    for (const [id, reason] of failures) warnings.push(`meal ${id} skipped: ${reason}`)
    selection = selectRecipes([...seeds.values()], SEED_PLAN)
    printSelection(selection)
    if (selection.problems.length > 0) {
      console.error('\nThe selection breaks the plan, so nothing was written:')
      selection.problems.forEach((problem) => console.error(`  ${problem}`))
      return 1
    }
    ids = selection.recipes.map((recipe) => recipe.mealDbId)
  }

  const chosen = ids.map((id) => seeds.get(id) as SeedRecipe)
  for (const { recipe, dropped, gaps, doubts } of chosen) {
    const label = `${recipe.mealDbId} ${recipe.title}`
    dropped.forEach((raw) => warnings.push(`${label}: dropped line "${raw}" (no ingredient name)`))
    gaps.forEach((gap) => warnings.push(`${label}: ${gap}`))
    if (doubts.length > 0) {
      warnings.push(`${label}: review ${doubts.join(', ')} (the title suggests otherwise)`)
    }
  }
  const collection = buildCollection(chosen.map(({ recipe }) => recipe))
  checkOverrides(collection.recipes, overrides)
  if (selection) {
    await writeFile(FILES.allowlist, toJson(toAllowlist(selection.recipes)))
    console.log(`\nWrote ${FILES.allowlist}`)
  }
  await writeFile(FILES.recipes, toJson(collection))
  console.log(`Wrote ${FILES.recipes}\n`)
  console.log(formatStats(datasetStats(collection.recipes)))
  console.log(`\nWarnings: ${warnings.length}`)
  warnings.forEach((warning) => console.warn(`  ${warning}`))
  return 0
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code
  },
  (error: unknown) => {
    console.error(describe(error))
    process.exitCode = 1
  },
)
