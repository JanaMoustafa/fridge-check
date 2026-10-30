/**
 * Checks Cooking Companion's recipes (data/chef/*.json): the schema, unique ids and titles, every
 * food known to the nutrition table (or proposed in data/chef/new-foods.*.json), and a sane
 * energy per serving. `--report` prints each dish's numbers per serving.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  CHEF_FILES,
  ChefCollectionSchema,
  chefNutrition,
  type ChefRecipe,
} from '@/lib/chef/recipes'
import { NutritionFoodsSchema } from '@/lib/nutrition/data-files'

const DATA = join(process.cwd(), 'data')
const CHEF = join(DATA, 'chef')

/** Energy per serving outside this range is almost always a weighing slip. */
const KCAL_PER_SERVING = { min: 60, max: 1500 }

export interface ChefProblem {
  recipe?: string
  problem: string
}

/** Foods proposed by the recipe authors and not yet in the nutrition table. */
function proposedFoods(): Set<string> {
  if (!existsSync(CHEF)) return new Set()
  const names = new Set<string>()
  for (const file of readdirSync(CHEF).filter((f) => /^new-foods\..+\.json$/.test(f))) {
    const parsed = JSON.parse(readFileSync(join(CHEF, file), 'utf8')) as Record<string, unknown>
    for (const name of Object.keys(parsed)) names.add(name)
  }
  return names
}

export function chefProblems(options: { allowProposed: boolean; report?: boolean }): {
  problems: ChefProblem[]
  recipes: ChefRecipe[]
} {
  const problems: ChefProblem[] = []
  const foods = NutritionFoodsSchema.parse(
    JSON.parse(readFileSync(join(DATA, 'nutrition', 'foods.json'), 'utf8')),
  ).foods
  const proposed = options.allowProposed ? proposedFoods() : new Set<string>()
  const recipes: ChefRecipe[] = []
  for (const [cuisine, file] of Object.entries(CHEF_FILES)) {
    const path = join(CHEF, file)
    if (!existsSync(path)) {
      problems.push({ problem: `data/chef/${file} is missing` })
      continue
    }
    const parsed = ChefCollectionSchema.safeParse(JSON.parse(readFileSync(path, 'utf8')))
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        problems.push({ problem: `data/chef/${file} ${issue.path.join('.')}: ${issue.message}` })
      }
      continue
    }
    for (const recipe of parsed.data) {
      if (recipe.cuisine !== cuisine) {
        problems.push({ recipe: recipe.id, problem: `cuisine "${recipe.cuisine}" in ${file}` })
      }
      recipes.push(recipe)
    }
  }

  const seen = new Map<string, string>()
  for (const recipe of recipes) {
    for (const key of [`id:${recipe.id}`, `en:${recipe.title.en.toLowerCase()}`]) {
      if (seen.has(key)) problems.push({ recipe: recipe.id, problem: `duplicate ${key}` })
      seen.set(key, recipe.id)
    }
    for (const { food } of recipe.ingredients) {
      if (food !== null && !Object.hasOwn(foods, food) && !proposed.has(food)) {
        problems.push({
          recipe: recipe.id,
          problem: `food "${food}" is not in the nutrition table`,
        })
      }
    }
    const { perServing, missing } = chefNutrition(recipe, foods)
    if (missing.length === 0 && options.report !== true) {
      if (perServing.kcal < KCAL_PER_SERVING.min || perServing.kcal > KCAL_PER_SERVING.max) {
        problems.push({
          recipe: recipe.id,
          problem: `${Math.round(perServing.kcal)} kcal per serving looks wrong (check the grams)`,
        })
      }
    }
    if (options.report === true) {
      const round = (n: number) => Math.round(n)
      console.log(
        `${recipe.id.padEnd(34)} ${String(round(perServing.kcal)).padStart(5)} kcal  P ${round(perServing.proteinG)}  C ${round(perServing.carbsG)}  F ${round(perServing.fatG)}  fibre ${round(perServing.fiberG)}${missing.length ? `  (no values yet: ${missing.join(', ')})` : ''}`,
      )
    }
  }
  return { problems, recipes }
}

if (process.argv[1]?.endsWith('validate-chef.ts')) {
  const report = process.argv.includes('--report')
  const { problems, recipes } = chefProblems({ allowProposed: true, report })
  const counts = new Map<string, number>()
  for (const recipe of recipes) counts.set(recipe.cuisine, (counts.get(recipe.cuisine) ?? 0) + 1)
  console.log([...counts].map(([cuisine, n]) => `${cuisine} ${n}`).join(' · '))
  for (const { recipe, problem } of problems)
    console.error(`✗ ${recipe ? `${recipe}: ` : ''}${problem}`)
  if (problems.length > 0) process.exit(1)
  console.log(`✓ ${recipes.length} Cooking Companion recipes are valid.`)
}
