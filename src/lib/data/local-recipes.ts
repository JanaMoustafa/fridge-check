import 'server-only'
import type { z } from 'zod'
import { LocalRecipeCollectionSchema, type LocalRecipe } from '@/types/recipe'

/** Enough to point at the problem without burying it when a whole column is wrong. */
const MAX_LISTED_ISSUES = 10

/**
 * The collection schema plus the invariants it cannot express per recipe: ids are unique (getById
 * and React keys rely on it) and every id is `local:<mealDbId>`, so detail URLs stay stable.
 */
const CollectionSchema = LocalRecipeCollectionSchema.superRefine((collection, ctx) => {
  const seen = new Set<string>()
  collection.recipes.forEach((recipe, index) => {
    const path = ['recipes', index, 'id']
    if (seen.has(recipe.id)) {
      ctx.addIssue({ code: 'custom', path, message: `duplicate id ${recipe.id}` })
    }
    seen.add(recipe.id)
    if (recipe.id !== `local:${recipe.mealDbId}`) {
      ctx.addIssue({ code: 'custom', path, message: `id must be local:${recipe.mealDbId}` })
    }
  })
})

/** "recipes[12].ingredients[0].name" */
function formatPath(path: readonly PropertyKey[]): string {
  const text = path
    .map((key) => (typeof key === 'number' ? `[${key}]` : `.${String(key)}`))
    .join('')
    .replace(/^\./, '')
  return text === '' ? '(root)' : text
}

/** The id of the recipe an issue points into, when the raw data has one: names the bad record. */
function recipeIdAt(raw: unknown, path: readonly PropertyKey[]): string | undefined {
  const [field, index] = path
  if (field !== 'recipes' || typeof index !== 'number') return undefined
  // Zod only reports a path into recipes[index] after it found an array there.
  const record = (raw as { recipes: unknown[] }).recipes[index] as { id?: unknown } | null
  const id = record?.id
  return typeof id === 'string' ? id : undefined
}

function describeIssues(error: z.ZodError, raw: unknown): string {
  const lines = error.issues.slice(0, MAX_LISTED_ISSUES).map((issue) => {
    const id = recipeIdAt(raw, issue.path)
    return `  - ${formatPath(issue.path)}${id === undefined ? '' : ` (${id})`}: ${issue.message}`
  })
  const hidden = error.issues.length - lines.length
  if (hidden > 0) lines.push(`  …and ${hidden} more`)
  const count = error.issues.length
  return `Invalid local recipe data (${count} issue${count === 1 ? '' : 's'}):\n${lines.join('\n')}`
}

/**
 * Validates the contents of data/recipes.json. Throws an Error listing the first issues, each with
 * its path and the id of the recipe it is in, so a bad seed fails the build-time test readably.
 */
export function loadLocalRecipes(raw: unknown): LocalRecipe[] {
  const result = CollectionSchema.safeParse(raw)
  if (!result.success) throw new Error(describeIssues(result.error, raw))
  return result.data.recipes
}

/**
 * Wraps a dataset import so it is loaded and validated on the first call only. Concurrent first
 * calls share one load; a failed load is forgotten, so the next call retries instead of caching
 * the error.
 */
export function createLocalRecipesLoader(
  importDataset: () => Promise<{ default: unknown }>,
): () => Promise<LocalRecipe[]> {
  let cached: Promise<LocalRecipe[]> | undefined
  return () => {
    cached ??= importDataset()
      .then((module) => loadLocalRecipes(module.default))
      .catch((error: unknown) => {
        cached = undefined
        throw error
      })
    return cached
  }
}

/**
 * The built-in collection, validated once per server process. The JSON (~600 KB) is a dynamic
 * import, so it is only loaded and parsed the first time the local provider is used, and this
 * module is server-only, so it never reaches a client bundle.
 */
export const getLocalRecipes = createLocalRecipesLoader(() => import('../../../data/recipes.json'))
