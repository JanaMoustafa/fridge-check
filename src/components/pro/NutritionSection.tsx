import { CircleSlash, Info } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { isProConfigured } from '@/lib/auth/auth'
import { getProUser, nutritionView } from '@/lib/billing/gate'
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

const isLeftOut = (reason: string): reason is LeftOutReason =>
  reason === 'small-amount' || reason === 'served-separately' || reason === 'frying-oil'

/**
 * The recipe page's nutrition section. Pro is checked here, on the server, on every request:
 * free and signed-out users get the locked preview, and no nutrition is computed for them.
 */
export async function NutritionSection({
  recipe,
  returnTo,
}: {
  recipe: RecipeDetail
  returnTo: string
}) {
  if (!isProConfigured()) return null
  const now = new Date()
  const pro = await getProUser(now)
  if (!pro?.access.isPro) return <ProLockedPreview />

  const t = await getTranslations('nutrition')
  const view = nutritionView(true, await nutritionForRecipe(recipe))
  if (view.kind === 'locked') return <ProLockedPreview />
  if (view.kind === 'source-without-data') {
    return (
      <section className={`${card} flex items-start gap-3`}>
        <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
        <p>{t('notAvailableSource')}</p>
      </section>
    )
  }
  if (view.kind === 'incomplete') {
    return (
      <section aria-labelledby="nutrition-unavailable" className={`${card} space-y-3`}>
        <h2 id="nutrition-unavailable" className="flex items-center gap-2 text-lg font-extrabold">
          <CircleSlash aria-hidden="true" className="size-5 text-missing" />
          {t('unavailableTitle')}
        </h2>
        <p className="text-fg-muted">{t('unavailableBody')}</p>
        <ul className="list-disc space-y-1 ps-5 text-sm">
          {view.missing.map((line, index) => (
            <li key={index} lang="en" dir="ltr" className="text-start">
              {line.raw}
            </li>
          ))}
        </ul>
      </section>
    )
  }

  const { nutrition } = view
  const profile = await getProfile(getDb(), pro.user.id, now)
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
