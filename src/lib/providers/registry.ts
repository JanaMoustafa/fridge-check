import 'server-only'
import { serverEnv, type ServerEnv } from '@/lib/server/env'
import type { RecipeSource } from '@/types/recipe'
import { localProvider } from './local'
import { createMealDbProvider } from './mealdb'
import { createSpoonacularProvider } from './spoonacular'
import type { RecipeProvider } from './types'

export interface ProviderRegistry {
  /** Answers searches (RECIPE_PROVIDER). */
  primary: RecipeProvider
  /** The built-in collection: the fallback whenever a remote API fails. */
  local: RecipeProvider
  /**
   * The provider for a recipe id's source, so a link to a TheMealDB or Spoonacular recipe works
   * whatever answers searches today. Undefined for Spoonacular without a key.
   */
  forSource(source: RecipeSource): RecipeProvider | undefined
}

export interface RegistryDependencies {
  local?: RecipeProvider
  fetchImpl?: typeof fetch
  now?: () => number
}

export function createRegistry(env: ServerEnv, deps: RegistryDependencies = {}): ProviderRegistry {
  const local = deps.local ?? localProvider
  // Created on first use: a local-only deployment never builds the remote clients.
  let mealdb: RecipeProvider | undefined
  let spoonacular: RecipeProvider | undefined
  const providers: Record<RecipeSource, () => RecipeProvider | undefined> = {
    local: () => local,
    mealdb: () =>
      (mealdb ??= createMealDbProvider({
        apiKey: env.THEMEALDB_API_KEY,
        fetchImpl: deps.fetchImpl,
        now: deps.now,
      })),
    spoonacular: () => {
      const apiKey = env.SPOONACULAR_API_KEY
      if (apiKey === undefined) return undefined
      return (spoonacular ??= createSpoonacularProvider({
        apiKey,
        fetchImpl: deps.fetchImpl,
        now: deps.now,
      }))
    },
  }
  return {
    // parseServerEnv guarantees a key when Spoonacular is the configured provider.
    primary: providers[env.RECIPE_PROVIDER]() ?? local,
    local,
    forSource: (source) => providers[source](),
  }
}

let registry: ProviderRegistry | undefined

/** The process-wide registry, built from the validated server environment. */
export function getRegistry(): ProviderRegistry {
  registry ??= createRegistry(serverEnv())
  return registry
}
