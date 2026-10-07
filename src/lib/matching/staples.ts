/**
 * Pantry basics the "Assume I have basic staples" switch treats as always on hand. Explicit on
 * purpose: no family inference, so "brown sugar" or "self-raising flour" are never assumed. Only
 * neutral cooking oils that canonicalize to their own name are added beyond the spec's list.
 */
export const STAPLES: ReadonlySet<string> = new Set([
  'salt',
  'black pepper',
  'water',
  'oil',
  'olive oil',
  'vegetable oil',
  'sunflower oil',
  'canola oil',
  'sugar',
  'flour',
  'butter',
])

export function isStaple(name: string): boolean {
  return STAPLES.has(name)
}
