import type { NextRequest } from 'next/server'
import { getRegistry } from '@/lib/providers/registry'
import { parseSearchQuery } from '@/lib/search/query'
import { searchCacheControl } from '@/lib/server/cache-control'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { searchRecipes } from '@/lib/server/search'
import type { ApiError } from '@/types/api'

export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request)
  if (limited) return limited

  const parsed = parseSearchQuery(request.nextUrl.searchParams)
  if (!parsed.success) {
    const body: ApiError = {
      error: {
        code: 'invalid-request',
        message: 'The search parameters are not valid.',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    }
    return Response.json(body, { status: 400 })
  }

  try {
    const body = await searchRecipes(getRegistry(), parsed.data)
    return Response.json(body, { headers: { 'Cache-Control': searchCacheControl(body) } })
  } catch (error) {
    console.error('[api/recipes/search]', error instanceof Error ? error.message : error)
    const body: ApiError = { error: { code: 'internal', message: 'Search failed.' } }
    return Response.json(body, { status: 500 })
  }
}
