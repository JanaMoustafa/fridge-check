import type { RecipeSource } from '@/types/recipe'

/** "local:52772" → { source: 'local', key: '52772' }. */
export function splitRecipeId(id: string): { source: RecipeSource; key: string } | null {
  const match = /^(local|mealdb|spoonacular):([A-Za-z0-9_-]+)$/.exec(id)
  return match ? { source: match[1] as RecipeSource, key: match[2]! } : null
}

/**
 * Detail page URL: /recipe/<source>/<key>?i=<pantry> — the pantry makes "You have / You need"
 * work on a shared link too.
 */
export function recipeHref(id: string, ingredients: readonly string[] = []): string {
  const parts = splitRecipeId(id)
  if (!parts) throw new Error(`Invalid recipe id: ${id}`)
  const query = ingredients.length > 0 ? `?i=${ingredients.map(encodeURIComponent).join(',')}` : ''
  return `/recipe/${parts.source}/${parts.key}${query}`
}

/** A CSS-safe view-transition name shared by a card photo and the recipe hero. */
export function recipeViewName(id: string): string {
  return `recipe-${id.replace(/[^A-Za-z0-9-]/g, '-')}`
}
