import 'server-only'
import type { Kysely } from 'kysely'
import { getSignedInUser, type SignedInUser } from '@/lib/auth/auth'
import { getDb } from '@/lib/db/client'
import type { Database } from '@/lib/db/schema'
import type { RecipeNutrition, UncountedLine } from '@/lib/nutrition/recipe-nutrition'
import { getProAccess, type ProAccess } from './access'

/**
 * The one server-side check every Pro feature uses: the signed-in user and their access, from the
 * session cookie and the database only. Never trust anything the browser says about Pro.
 */
export async function getProUser(
  now: Date = new Date(),
  db: Kysely<Database> = getDb(),
): Promise<{ user: SignedInUser; access: ProAccess } | null> {
  const user = await getSignedInUser()
  if (!user) return null
  return { user, access: await getProAccess(db, user.id, now) }
}

export type NutritionView =
  | { kind: 'locked' }
  | { kind: 'source-without-data' }
  | { kind: 'incomplete'; missing: UncountedLine[] }
  | { kind: 'ready'; nutrition: RecipeNutrition }

/**
 * What a recipe's nutrition section may show. Anyone without Pro gets "locked" before any
 * nutrition is even computed, so no number can reach them.
 */
export function nutritionView(
  isPro: boolean,
  nutrition: (() => RecipeNutrition | null) | RecipeNutrition | null,
): NutritionView {
  if (!isPro) return { kind: 'locked' }
  const data = typeof nutrition === 'function' ? nutrition() : nutrition
  if (data === null) return { kind: 'source-without-data' }
  if (!data.complete) {
    const missing = data.uncounted.filter(
      (line) => !['small-amount', 'served-separately', 'frying-oil'].includes(line.reason),
    )
    return { kind: 'incomplete', missing }
  }
  return { kind: 'ready', nutrition: data }
}
