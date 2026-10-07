import type { NextRequest } from 'next/server'
import { getRecipeProvider } from '@/lib/providers/registry'
import { RecipeNotFoundError } from '@/lib/providers/types'
import { splitRecipeId } from '@/lib/search/links'
import type { ApiError } from '@/types/api'

// Recipe details change rarely: a day at the CDN, then revalidated in the background.
const CACHE_CONTROL = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'

function error(status: number, code: ApiError['error']['code'], message: string) {
  const body: ApiError = { error: { code, message } }
  return Response.json(body, { status })
}

export async function GET(
  _request: NextRequest,
  context: RouteContext<'/api/recipes/[provider]/[id]'>,
) {
  const { provider, id } = await context.params
  const recipeId = `${provider}:${id}`
  if (!splitRecipeId(recipeId)) return error(400, 'invalid-request', 'Unknown recipe id.')
  try {
    const recipe = await getRecipeProvider().getById(recipeId)
    return Response.json(recipe, { headers: { 'Cache-Control': CACHE_CONTROL } })
  } catch (caught) {
    if (caught instanceof RecipeNotFoundError) return error(404, 'not-found', 'Recipe not found.')
    console.error('[api/recipes/detail]', caught instanceof Error ? caught.message : caught)
    return error(500, 'internal', 'Could not load the recipe.')
  }
}
