import 'server-only'
import { ChefCollectionSchema, type ChefRecipe } from '@/lib/chef/recipes'

let cached: Promise<ChefRecipe[]> | undefined

/**
 * Cooking Companion's own recipes, validated once per server process. Dynamic imports: the JSON
 * is only loaded the first time a Cooking Companion page needs it, and never reaches a client.
 * A failed load is forgotten, so the next call retries instead of caching the error.
 */
export function getChefRecipes(): Promise<ChefRecipe[]> {
  cached ??= Promise.all([
    import('../../../data/chef/egyptian.json'),
    import('../../../data/chef/italian.json'),
    import('../../../data/chef/mexican.json'),
    import('../../../data/chef/moroccan.json'),
    import('../../../data/chef/saudi.json'),
  ])
    .then((modules) => modules.flatMap((module) => ChefCollectionSchema.parse(module.default)))
    .catch((error: unknown) => {
      cached = undefined
      throw error
    })
  return cached
}

/** The video for this language, falling back to the other one. */
export function chefVideo(recipe: ChefRecipe, locale: 'en' | 'ar') {
  return locale === 'ar'
    ? (recipe.video?.ar ?? recipe.video?.en)
    : (recipe.video?.en ?? recipe.video?.ar)
}
