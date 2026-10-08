/**
 * Builds data/nutrition/foods.json from USDA FoodData Central, for the ingredients listed in the
 * reviewed data/nutrition/fdc-mapping.json. Parsing lives in src/lib/nutrition/fdc.ts (pure and
 * tested); this file fetches, caches and writes. Run `pnpm seed:nutrition --help`.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { CANONICAL_NAMES } from '@/lib/matching/synonyms'
import {
  FdcMappingSchema,
  NutritionFoodsSchema,
  type FoodValues,
  type NutritionFoods,
} from '@/lib/nutrition/data-files'
import {
  extractPer100g,
  extractPortions,
  FdcFoodSchema,
  FdcSearchSchema,
  type FdcFood,
  type PortionKey,
} from '@/lib/nutrition/fdc'
import { LocalRecipeCollectionSchema } from '@/types/recipe'

const HELP = `Builds data/nutrition/foods.json from USDA FoodData Central.

Usage: pnpm seed:nutrition [--suggest [--all] --out <file>]

  (no flag)   Fetch every food in data/nutrition/fdc-mapping.json and write foods.json.
  --suggest   For ingredients the mapping does not cover yet, search FoodData Central and
              write candidate foods to --out for review (the mapping is never edited).
              Covers the ingredients of data/recipes.json; --all covers every name the
              matching engine knows.

Environment
  FDC_API_KEY          FoodData Central key (https://fdc.nal.usda.gov/api-key-signup)
  NUTRITION_CACHE_DIR  Keep API responses here and reuse them (outside the repository).`

const DATA = join(process.cwd(), 'data')
const FILES = {
  mapping: join(DATA, 'nutrition', 'fdc-mapping.json'),
  foods: join(DATA, 'nutrition', 'foods.json'),
  recipes: join(DATA, 'recipes.json'),
}
const API = 'https://api.nal.usda.gov/fdc/v1/'
const CACHE_DIR = process.env.NUTRITION_CACHE_DIR
const BATCH = 20

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8'))
}

/** GET with the key in a header (never in the URL), cached when NUTRITION_CACHE_DIR is set. */
async function get(path: string, query: Record<string, string>): Promise<unknown> {
  const url = new URL(path, API)
  for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value)
  const cacheFile =
    CACHE_DIR && join(CACHE_DIR, `${(path + url.search).replace(/[^a-z0-9]+/gi, '_')}.json`)
  if (cacheFile) {
    const cached = await readFile(cacheFile, 'utf8').catch(() => undefined)
    if (cached !== undefined) return JSON.parse(cached)
  }
  const key = process.env.FDC_API_KEY
  if (!key) throw new Error('FDC_API_KEY is not set (add it to .env.local).')
  const response = await fetch(url, { headers: { 'X-Api-Key': key, accept: 'application/json' } })
  if (!response.ok) throw new Error(`FoodData Central ${path}: HTTP ${response.status}`)
  const body: unknown = await response.json()
  if (cacheFile) {
    await mkdir(CACHE_DIR!, { recursive: true })
    await writeFile(cacheFile, JSON.stringify(body))
  }
  return body
}

async function fetchFoods(ids: readonly number[]): Promise<Map<number, FdcFood>> {
  const foods = new Map<number, FdcFood>()
  for (let start = 0; start < ids.length; start += BATCH) {
    const batch = ids.slice(start, start + BATCH)
    const body = await get('foods', { fdcIds: batch.join(','), format: 'full' })
    for (const item of body as unknown[]) {
      const food = FdcFoodSchema.parse(item)
      foods.set(food.fdcId, food)
    }
  }
  const missing = ids.filter((id) => !foods.has(id))
  if (missing.length > 0) throw new Error(`FoodData Central has no food ${missing.join(', ')}`)
  return foods
}

/** USDA's weights with the mapping's reviewed additions (numbers) and removals (null). */
function withOverrides(
  portions: FoodValues['portions'],
  overrides: Partial<Record<PortionKey, number | null>> | undefined,
): FoodValues['portions'] {
  const result = { ...portions }
  for (const [key, grams] of Object.entries(overrides ?? {}) as Array<
    [PortionKey, number | null]
  >) {
    if (grams === null) delete result[key]
    else result[key] = grams
  }
  return result
}

async function build() {
  const mapping = FdcMappingSchema.parse(await readJson(FILES.mapping))
  const mapped = Object.entries(mapping.foods).flatMap(([name, entry]) =>
    entry.fdcId === null ? [] : [{ name, ...entry }],
  )
  const ids = mapped.flatMap((entry) => [
    entry.fdcId,
    ...Object.values(entry.variants ?? {}).map((variant) => variant.fdcId),
  ])
  const fetched = await fetchFoods([...new Set(ids)])
  const values = (fdcId: number): FoodValues => {
    const food = fetched.get(fdcId)!
    return {
      fdcId,
      description: food.description,
      dataType: food.dataType,
      ...(food.foodCategory ? { category: food.foodCategory.description } : {}),
      per100g: extractPer100g(food),
      portions: extractPortions(food),
    }
  }
  const foods: NutritionFoods['foods'] = {}
  for (const entry of mapped.sort((a, b) => a.name.localeCompare(b.name))) {
    const base = values(entry.fdcId)
    const variants = Object.entries(entry.variants ?? {}).map(([kind, ref]) => [
      kind,
      values(ref.fdcId),
    ])
    foods[entry.name] = {
      ...base,
      portions: withOverrides(base.portions, entry.portions),
      ...(variants.length > 0 ? { variants: Object.fromEntries(variants) } : {}),
    }
  }
  const minorWithoutFood = Object.entries(mapping.foods)
    .filter(([, entry]) => entry.fdcId === null && entry.minor === true)
    .map(([name]) => name)
    .sort()
  const output = NutritionFoodsSchema.parse({
    version: 1,
    source: 'USDA FoodData Central',
    foods,
    minorWithoutFood,
  })
  await mkdir(join(DATA, 'nutrition'), { recursive: true })
  await writeFile(FILES.foods, `${JSON.stringify(output, null, 2)}\n`)
  const unmapped = Object.values(mapping.foods).filter((entry) => entry.fdcId === null).length
  console.log(
    `✓ ${Object.keys(foods).length} foods written (${unmapped} ingredients have no USDA food).`,
  )
}

async function suggest(all: boolean, out: string) {
  const mapping = await readJson(FILES.mapping)
    .then((raw) => FdcMappingSchema.parse(raw))
    .catch(() => ({ version: 1 as const, foods: {} }))
  const recipes = LocalRecipeCollectionSchema.parse(await readJson(FILES.recipes)).recipes
  const used = new Map<string, number>()
  for (const recipe of recipes)
    for (const line of recipe.ingredients) used.set(line.name, (used.get(line.name) ?? 0) + 1)
  const names = (all ? [...CANONICAL_NAMES] : [...used.keys()])
    .filter((name) => !(name in mapping.foods))
    .sort()
  const candidates: Record<string, unknown> = {}
  for (const name of names) {
    const seen = new Set<number>()
    const options: unknown[] = []
    for (const query of [name, `${name} raw`]) {
      const body = FdcSearchSchema.parse(
        await get('foods/search', { query, dataType: 'SR Legacy,Foundation', pageSize: '8' }),
      )
      for (const food of body.foods) {
        if (seen.has(food.fdcId)) continue
        seen.add(food.fdcId)
        options.push(food)
      }
    }
    candidates[name] = { usedInRecipes: used.get(name) ?? 0, options }
  }
  await writeFile(out, `${JSON.stringify(candidates, null, 2)}\n`)
  console.log(`✓ Candidates for ${names.length} ingredients written to ${out}.`)
}

async function main(args: string[]) {
  if (args.includes('--help')) return console.log(HELP)
  if (args.includes('--suggest')) {
    const out = args[args.indexOf('--out') + 1]
    if (!args.includes('--out') || !out) throw new Error('--suggest needs --out <file>.')
    return suggest(args.includes('--all'), out)
  }
  return build()
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
