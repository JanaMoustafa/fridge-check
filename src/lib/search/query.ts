import { z } from 'zod'
import {
  CanonicalNameSchema,
  DietSchema,
  MAX_INGREDIENT_LENGTH,
  MAX_INGREDIENTS,
  SortKeySchema,
  type SearchParams,
} from '@/types/recipe'

/** Comma-separated list in a query string → trimmed, non-empty items. */
function list(value: string | null): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

/**
 * GET /api/recipes/search?ingredients=a,b&diets=vegan&sort=best&staples=0&page=2
 * Strict: anything unexpected is a 400, so a malformed request never reaches a provider.
 */
export const SearchQuerySchema = z.object({
  ingredients: z
    .array(CanonicalNameSchema.max(MAX_INGREDIENT_LENGTH))
    .min(1, 'add at least one ingredient')
    .max(MAX_INGREDIENTS, `at most ${MAX_INGREDIENTS} ingredients`)
    .refine((items) => new Set(items).size === items.length, 'ingredients must be unique'),
  diets: z.array(DietSchema).refine((d) => new Set(d).size === d.length, 'diets must be unique'),
  sort: SortKeySchema,
  assumeStaples: z.boolean(),
  page: z.number().int().min(1).max(50),
})
export type SearchQuery = z.infer<typeof SearchQuerySchema>

export function parseSearchQuery(params: URLSearchParams) {
  const page = params.get('page')
  const staples = params.get('staples')
  return SearchQuerySchema.safeParse({
    ingredients: list(params.get('ingredients')),
    diets: list(params.get('diets')),
    sort: params.get('sort') ?? 'fewest-missing',
    assumeStaples:
      staples === null ? true : staples === '1' ? true : staples === '0' ? false : null,
    page: page === null ? 1 : /^\d+$/.test(page) ? Number(page) : Number.NaN,
  })
}

/**
 * One canonical query string per search (sorted lists, defaults omitted), so identical searches
 * share one CDN cache entry and one client cache key no matter the chip order.
 */
export function toSearchQueryString(params: SearchParams, page = 1): string {
  const query = new URLSearchParams()
  query.set('ingredients', [...params.ingredients].sort().join(','))
  if (params.diets.length > 0) query.set('diets', [...params.diets].sort().join(','))
  if (params.sort !== 'fewest-missing') query.set('sort', params.sort)
  if (!params.assumeStaples) query.set('staples', '0')
  if (page > 1) query.set('page', String(page))
  return query.toString()
}
