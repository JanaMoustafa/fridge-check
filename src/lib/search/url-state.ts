import { isCanonicalName } from '@/lib/matching/canonical'
import {
  DIETS,
  MAX_INGREDIENT_LENGTH,
  MAX_INGREDIENTS,
  SORT_KEYS,
  type Diet,
  type SortKey,
} from '@/types/recipe'

/** The search as it lives in the page URL: ?i=chicken,garlic&diet=vegetarian&sort=best */
export interface SearchUrlState {
  ingredients: string[]
  diets: Diet[]
  sort: SortKey
}

export const DEFAULT_SORT: SortKey = 'fewest-missing'

function list(value: string | null | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Lenient: a shared or hand-edited link keeps whatever is valid (unknown items are dropped,
 * duplicates removed, the 20-ingredient limit applied) instead of failing the whole page.
 */
export function parseSearchUrl(params: { get(name: string): string | null }): SearchUrlState {
  const ingredients = [
    ...new Set(
      list(params.get('i')).filter(
        (name) => name.length <= MAX_INGREDIENT_LENGTH && isCanonicalName(name),
      ),
    ),
  ].slice(0, MAX_INGREDIENTS)
  const diets = DIETS.filter((diet) => list(params.get('diet')).includes(diet))
  const sort = SORT_KEYS.find((key) => key === params.get('sort')) ?? DEFAULT_SORT
  return { ingredients, diets, sort }
}

/** Chip order is kept (it is the user's list); defaults are omitted for short, shareable links. */
export function toSearchUrl(state: SearchUrlState): string {
  const query = new URLSearchParams()
  if (state.ingredients.length > 0) query.set('i', state.ingredients.join(','))
  if (state.diets.length > 0) query.set('diet', state.diets.join(','))
  if (state.sort !== DEFAULT_SORT) query.set('sort', state.sort)
  const search = query.toString().replace(/%2C/g, ',')
  return search ? `?${search}` : ''
}
