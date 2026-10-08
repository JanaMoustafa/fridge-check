/**
 * Build-time data check (runs as `prebuild`): the app must never ship a recipe file that is
 * invalid, unreviewed, or missing translations. Same invariants as the data tests, readable output.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { normalizeIngredient } from '@/lib/matching/normalize'
import { FdcMappingSchema, NutritionFoodsSchema } from '@/lib/nutrition/data-files'
import { DietOverridesSchema } from '@/lib/seed/data-files'
import { LocalRecipeCollectionSchema } from '@/types/recipe'

export interface DataProblem {
  recipe?: string
  problem: string
}

/**
 * Nutrition data: every ingredient of the collection has a reviewed USDA mapping (or a reason
 * why there is none), and foods.json was generated from the current mapping.
 */
function nutritionProblems(names: ReadonlySet<string>, mappingFile: unknown, foodsFile: unknown) {
  const mapping = FdcMappingSchema.safeParse(mappingFile)
  if (!mapping.success) return [{ problem: `nutrition/fdc-mapping.json: ${mapping.error.message}` }]
  const foods = NutritionFoodsSchema.safeParse(foodsFile)
  if (!foods.success) return [{ problem: `nutrition/foods.json: ${foods.error.message}` }]
  const problems: DataProblem[] = []
  for (const name of [...names].sort()) {
    if (!Object.hasOwn(mapping.data.foods, name)) {
      problems.push({ problem: `ingredient "${name}" has no entry in nutrition/fdc-mapping.json` })
    }
  }
  const stale = (name: string) =>
    problems.push({
      problem: `nutrition/foods.json is out of date for "${name}" (run pnpm seed:nutrition)`,
    })
  for (const [name, entry] of Object.entries(mapping.data.foods)) {
    const food = Object.hasOwn(foods.data.foods, name) ? foods.data.foods[name] : undefined
    if (entry.fdcId === null ? food !== undefined : food?.fdcId !== entry.fdcId) stale(name)
    const minor = entry.fdcId === null && entry.minor === true
    if (minor !== foods.data.minorWithoutFood.includes(name)) stale(name)
  }
  for (const name of Object.keys(foods.data.foods)) {
    if (!Object.hasOwn(mapping.data.foods, name)) stale(name)
  }
  return problems
}

export function findDataProblems(files: {
  recipes: unknown
  dietOverrides: unknown
  arabicNames: Readonly<Record<string, string>>
  fdcMapping: unknown
  nutritionFoods: unknown
}): DataProblem[] {
  const problems: DataProblem[] = []
  const collection = LocalRecipeCollectionSchema.safeParse(files.recipes)
  if (!collection.success) {
    return collection.error.issues
      .slice(0, 20)
      .map((issue) => ({ problem: `${issue.path.join('.')}: ${issue.message}` }))
  }
  const overrides = DietOverridesSchema.safeParse(files.dietOverrides)
  if (!overrides.success) return [{ problem: `diet-overrides.json: ${overrides.error.message}` }]

  const seen = new Set<string>()
  const names = new Set<string>()
  for (const recipe of collection.data.recipes) {
    const label = `${recipe.id} ${recipe.title}`
    if (seen.has(recipe.id)) problems.push({ recipe: label, problem: 'duplicate id' })
    seen.add(recipe.id)
    if (recipe.dietsEstimated || !overrides.data.recipes[recipe.mealDbId]) {
      problems.push({ recipe: label, problem: 'diet tags not reviewed' })
    }
    for (const { name } of recipe.ingredients) {
      names.add(name)
      if (normalizeIngredient(name) !== name) {
        problems.push({ recipe: label, problem: `ingredient "${name}" is not canonical` })
      }
      if (!files.arabicNames[name]) {
        problems.push({ recipe: label, problem: `ingredient "${name}" has no Arabic name` })
      }
    }
  }
  return [...problems, ...nutritionProblems(names, files.fdcMapping, files.nutritionFoods)]
}

if (process.argv[1]?.endsWith('validate-data.ts')) {
  const read = (path: string) => JSON.parse(readFileSync(join(process.cwd(), path), 'utf8'))
  const problems = findDataProblems({
    recipes: read('data/recipes.json'),
    dietOverrides: read('data/diet-overrides.json'),
    arabicNames: read('data/i18n/ingredients.ar.json'),
    fdcMapping: read('data/nutrition/fdc-mapping.json'),
    nutritionFoods: read('data/nutrition/foods.json'),
  })
  if (problems.length === 0) {
    console.log(
      '✓ data/recipes.json is valid, reviewed and fully translated; nutrition data is current.',
    )
  } else {
    console.error(`✗ ${problems.length} data problem(s):`)
    for (const { recipe, problem } of problems.slice(0, 50)) {
      console.error(`  ${recipe ? `${recipe}: ` : ''}${problem}`)
    }
    process.exitCode = 1
  }
}
