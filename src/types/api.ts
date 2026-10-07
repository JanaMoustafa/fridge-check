import { z } from 'zod'
import { RecipeSourceSchema, RecipeSummarySchema } from './recipe'

export const SEARCH_PAGE_SIZE = 20

/** Shown to the user when results come from the built-in collection instead of a remote API. */
export const SearchNoticeSchema = z.enum(['fallback-local'])
export type SearchNotice = z.infer<typeof SearchNoticeSchema>

export const SearchResponseSchema = z.object({
  results: z.array(RecipeSummarySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  hasMore: z.boolean(),
  provider: RecipeSourceSchema,
  notice: SearchNoticeSchema.optional(),
})
export type SearchResponse = z.infer<typeof SearchResponseSchema>

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.enum(['invalid-request', 'not-found', 'rate-limited', 'internal']),
    message: z.string(),
    issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
})
export type ApiError = z.infer<typeof ApiErrorSchema>
