import 'server-only'
import { localProvider } from './local'
import type { RecipeProvider } from './types'

/** The provider that answers searches and recipe lookups: the built-in collection. */
export function getRecipeProvider(): RecipeProvider {
  return localProvider
}
