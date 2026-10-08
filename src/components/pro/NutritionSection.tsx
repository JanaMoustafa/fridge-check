import { CircleSlash, Info } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { getSignedInUser, isProConfigured } from '@/lib/auth/auth'
import { getProAccess } from '@/lib/billing/access'
import { getDb } from '@/lib/db/client'
import { defaultMeal } from '@/lib/nutrition/default-meal'
import { DEFAULT_MEAL_SPLIT } from '@/lib/nutrition/portions'
import { getProfile } from '@/lib/server/profiles'
import { nutritionForRecipe } from '@/lib/server/nutrition'
import type { RecipeDetail } from '@/types/recipe'
import { PortionPlanner, type LeftOutReason } from './PortionPlanner'
import { ProLockedPreview } from './ProLockedPreview'

const card =
  'rounded-card bg-surface p-5 shadow-[inset_0_1px_0_var(--color-highlight),0_0_0_1px_var(--color-line)] sm:p-6'

const LEFT_OUT: ReadonlySet<string> = new Set(['small-amount', 'served-separately', 'frying-oil'])
const isLeftOut = (reason: string): reason is LeftOutReason => LEFT_OUT.has(reason)

/**
 * The recipe page's nutrition section. Pro is checked here, on the server, for every request:
 * free and signed-out users get the locked preview and no numbers at all.
 */
export async function NutritionSection({
  recipe,
  returnTo,
}: {
  recipe: RecipeDetail
  returnTo: string
}) {
  if (!isProConfigured()) return null
  const user = await getSignedInUser()
  const now = new Date()
  const access = user ? await getProAccess(getDb(), user.id, now) : null
  if (!user || !access?.isPro) return <ProLockedPreview />

  const t = await getTranslations('nutrition')
  const nutrition = await nutritionForRecipe(recipe)
  if (nutrition === null) {
    return (
      <section className={`${card} flex items-start gap-3`}>
        <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
        <p>{t('comingSoon')}</p>
      </section>
    )
  }
  if (!nutrition.complete) {
    const missing = nutrition.uncounted.filter((line) => !isLeftOut(line.reason))
    return (
      <section aria-labelledby="nutrition-unavailable" className={`${card} space-y-3`}>
        <h2 id="nutrition-unavailable" className="flex items-center gap-2 text-lg font-extrabold">
          <CircleSlash aria-hidden="true" className="size-5 text-missing" />
          {t('unavailableTitle')}
        </h2>
        <p className="text-fg-muted">{t('unavailableBody')}</p>
        <ul className="list-disc space-y-1 ps-5 text-sm">
          {missing.map((line, index) => (
            <li key={index} lang="en" dir="ltr" className="text-start">
              {line.raw}
            </li>
          ))}
        </ul>
      </section>
    )
  }

  const profile = await getProfile(getDb(), user.id, now)
  return (
    <PortionPlanner
      lines={nutrition.lines}
      uncounted={nutrition.uncounted.flatMap(({ raw, name, reason }) =>
        isLeftOut(reason) ? [{ raw, name, reason }] : [],
      )}
      servings={recipe.servings}
      targets={profile?.targets ?? null}
      split={profile?.values.mealSplit ?? DEFAULT_MEAL_SPLIT}
      initialMeal={defaultMeal(recipe.category)}
      profileHref={`/profile?next=${encodeURIComponent(returnTo)}`}
    />
  )
}
