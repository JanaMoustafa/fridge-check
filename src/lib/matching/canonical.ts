/**
 * Canonical ingredient names: lowercase ASCII words, digits, spaces, hyphens and apostrophes.
 * Kept free of zod so the matching engine stays light enough to load in the browser; the Zod
 * schema in src/types/recipe.ts reuses these constants.
 */
export const CANONICAL_NAME_PATTERN = /^[a-z0-9][a-z0-9 '-]*$/
export const CANONICAL_NAME_MAX_LENGTH = 60

export function isCanonicalName(value: string): boolean {
  return value.length <= CANONICAL_NAME_MAX_LENGTH && CANONICAL_NAME_PATTERN.test(value)
}
