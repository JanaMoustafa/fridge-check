/**
 * Build-time data check (runs as `prebuild`): the app must never ship a recipe file that is
 * invalid, unreviewed, or missing translations. Same invariants as the data tests, readable output.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { normalizeIngredient } from '@/lib/matching/normalize'
import { DietOverridesSchema } from '@/lib/seed/data-files'
import { LocalRecipeCollectionSchema } from '@/types/recipe'

export interface DataProblem {
  recipe?: string
  problem: string
}

export function findDataProblems(files: {
  recipes: unknown
  dietOverrides: unknown
  arabicNames: Readonly<Record<string, string>>
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
  for (const recipe of collection.data.recipes) {
    const label = `${recipe.id} ${recipe.title}`
    if (seen.has(recipe.id)) problems.push({ recipe: label, problem: 'duplicate id' })
    seen.add(recipe.id)
    if (recipe.dietsEstimated || !overrides.data.recipes[recipe.mealDbId]) {
      problems.push({ recipe: label, problem: 'diet tags not reviewed' })
    }
    for (const { name } of recipe.ingredients) {
      if (normalizeIngredient(name) !== name) {
        problems.push({ recipe: label, problem: `ingredient "${name}" is not canonical` })
      }
      if (!files.arabicNames[name]) {
        problems.push({ recipe: label, problem: `ingredient "${name}" has no Arabic name` })
      }
    }
  }
  return problems
}

if (process.argv[1]?.endsWith('validate-data.ts')) {
  const read = (path: string) => JSON.parse(readFileSync(join(process.cwd(), path), 'utf8'))
  const problems = findDataProblems({
    recipes: read('data/recipes.json'),
    dietOverrides: read('data/diet-overrides.json'),
    arabicNames: read('data/i18n/ingredients.ar.json'),
  })
  if (problems.length === 0) {
    console.log('✓ data/recipes.json is valid, reviewed and fully translated.')
  } else {
    console.error(`✗ ${problems.length} data problem(s):`)
    for (const { recipe, problem } of problems.slice(0, 50)) {
      console.error(`  ${recipe ? `${recipe}: ` : ''}${problem}`)
    }
    process.exitCode = 1
  }
}
