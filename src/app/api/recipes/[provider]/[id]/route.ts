import type { NextRequest } from 'next/server'
import { splitRecipeId } from '@/lib/search/links'
import { detailCacheControl } from '@/lib/server/cache-control'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { getRecipe, unavailableFrom, unavailableResponse } from '@/lib/server/recipe'
import type { ApiError } from '@/types/api'

function error(status: number, code: ApiError['error']['code'], message: string) {
  const body: ApiError = { error: { code, message } }
  return Response.json(body, { status })
}

export async function GET(
  request: NextRequest,
  context: RouteContext<'/api/recipes/[provider]/[id]'>,
) {
  const limited = checkRateLimit(request)
  if (limited) return limited

  const { provider, id } = await context.params
  const recipeId = `${provider}:${id}`
  const parts = splitRecipeId(recipeId)
  if (!parts) return error(400, 'invalid-request', 'Unknown recipe id.')
  try {
    const recipe = await getRecipe(recipeId, { ingredients: [], assumeStaples: true })
    if (!recipe) return error(404, 'not-found', 'Recipe not found.')
    return Response.json(recipe, {
      headers: { 'Cache-Control': detailCacheControl(parts.source, recipe.source) },
    })
  } catch (caught) {
    const unavailable = unavailableFrom(caught)
    if (unavailable) return unavailableResponse(unavailable)
    console.error('[api/recipes/detail]', caught instanceof Error ? caught.message : caught)
    return error(500, 'internal', 'Could not load the recipe.')
  }
}
