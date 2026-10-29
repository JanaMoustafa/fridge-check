import { CalendarClock, Droplets, ScanLine } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { SuccessTick } from '@/components/ui/SuccessTick'
import { buttonClasses } from '@/components/ui/button'
import { getDb } from '@/lib/db/client'
import { formatLongDate } from '@/lib/i18n/format-date'
import { ingredientLabel, loadArabicIngredientNames } from '@/lib/i18n/ingredient-names'
import { isLocale } from '@/lib/i18n/locale'
import { PROTEIN_G_PER_KG } from '@/lib/nutrition/calculator'
import { cairoDate, nextScanDue } from '@/lib/nutritionist/inbody'
import type { PlannedMeal } from '@/lib/nutritionist/meal-plan'
import { dailyFibreG, dailyWaterL, TRAINING_DAY_EXTRA_L } from '@/lib/nutritionist/report'
import { recipeHref } from '@/lib/search/links'
import { weekdayOf, weekSchedule } from '@/lib/burn/programme'
import { latestScan } from '@/lib/server/inbody'
import { mealPlanFor } from '@/lib/server/meal-plan'
import { getTrainingChoice } from '@/lib/server/training'
import { card, proGate } from '@/components/pro/ProGate'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nutritionist')
  return { title: t('metaTitle'), robots: { index: false } }
}

const dateOf = (day: string) => new Date(`${day}T12:00:00Z`)
/** Suggest fruit or salad when today's meals bring this much less fibre than the target. */
const FIBRE_TIP_MARGIN_G = 2

/**
 * Your Nutritionist: the member's daily targets (calories, macros, fibre, water), how they were
 * worked out, the InBody scan they come from, and today's meals sized to them.
 */
export default async function NutritionistPage({ searchParams }: PageProps<'/nutritionist'>) {
  const gate = await proGate('/nutritionist', 'nutritionist')
  if (!gate.ready) return gate.page
  const { user, profile, now } = gate
  const [t, tp, rawLocale, query, scan, training] = await Promise.all([
    getTranslations('nutritionist'),
    getTranslations('profile'),
    getLocale(),
    searchParams,
    latestScan(getDb(), user.id),
    getTrainingChoice(getDb(), user.id),
  ])
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  const today = cairoDate(now)
  const { targets, values } = profile
  const [plan, arabicNames] = await Promise.all([
    mealPlanFor(user.id, today, targets, values.mealSplit),
    locale === 'ar' ? loadArabicIngredientNames() : Promise.resolve(undefined),
  ])
  const food = (name: string) => ingredientLabel(name, locale, arabicNames)
  const due = scan ? nextScanDue(scan.scannedOn) : null
  const overdue = due !== null && due <= today
  // A BurnToReturn training day adds half a litre to today's water.
  const trainingToday = training !== null && weekSchedule(training.days)[weekdayOf(today)] !== null
  const water = dailyWaterL(values.weightKg) + (trainingToday ? TRAINING_DAY_EXTRA_L : 0)
  const fibre = dailyFibreG(targets.calorieTargetKcal)

  const tiles = [
    { key: 'calories', value: t('kcal', { value: targets.calorieTargetKcal }), wide: true },
    { key: 'protein', value: t('grams', { value: targets.proteinG }) },
    { key: 'carbs', value: t('grams', { value: targets.carbsG }) },
    { key: 'fat', value: t('grams', { value: targets.fatG }) },
    { key: 'fibre', value: t('grams', { value: fibre }) },
  ] as const

  const mealName = (meal: PlannedMeal) =>
    meal.kind === 'recipe' ? meal.title : t(`plates.${meal.plateId}`)

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold">{t('title')}</h1>
        <p className="text-fg-muted">{t('intro')}</p>
      </header>

      {query.saved === 'scan' && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-btn bg-have-soft px-4 py-3 text-sm font-semibold"
        >
          <SuccessTick className="mt-0.5 size-4 shrink-0 text-have" />
          {t('savedScan')}
        </p>
      )}

      <section aria-labelledby="scan-title" className={`${card} space-y-3`}>
        <h2 id="scan-title" className="flex items-center gap-2 text-lg font-extrabold">
          <ScanLine aria-hidden="true" className="size-5 text-primary" />
          {t('scanCard.title')}
        </h2>
        {scan && due ? (
          <>
            <p>{t('scanCard.latest', { date: formatLongDate(dateOf(scan.scannedOn), locale) })}</p>
            <p
              role={overdue ? 'status' : undefined}
              className={
                overdue
                  ? 'flex items-start gap-2 rounded-btn bg-highlight-soft px-4 py-3 text-sm font-semibold'
                  : 'text-sm text-fg-muted'
              }
            >
              {overdue && <CalendarClock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />}
              {overdue
                ? t('scanCard.overdue')
                : t('scanCard.due', { date: formatLongDate(dateOf(due), locale) })}
            </p>
          </>
        ) : (
          <p className="text-fg-muted">{t('scanCard.none')}</p>
        )}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/nutritionist/scan"
            className={buttonClasses({ variant: scan && !overdue ? 'secondary' : 'primary' })}
          >
            {t(scan ? 'scanCard.uploadNew' : 'scanCard.upload')}
          </Link>
          {scan && (
            <Link
              href="/nutritionist/report"
              className={buttonClasses({ variant: overdue ? 'secondary' : 'primary' })}
            >
              {t('scanCard.report')}
            </Link>
          )}
        </div>
      </section>

      <section aria-labelledby="targets-title" className={`${card} space-y-4`}>
        <h2 id="targets-title" className="text-lg font-extrabold">
          {t('targetsTitle')}
        </h2>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tiles.map((tile) => (
            <div
              key={tile.key}
              className={`rounded-btn bg-surface-2 px-3 py-2 ${'wide' in tile ? 'col-span-2 sm:col-span-4' : ''}`}
            >
              <dt className="text-xs font-semibold text-fg">{t(tile.key)}</dt>
              <dd
                className={`font-extrabold tabular-nums ${'wide' in tile ? 'text-3xl' : 'text-lg'}`}
              >
                {tile.value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex items-center gap-3 rounded-btn bg-highlight-soft px-4 py-3">
          <Droplets aria-hidden="true" className="size-6 shrink-0 text-primary" />
          <p>
            <span className="font-extrabold tabular-nums">{t('waterValue', { value: water })}</span>{' '}
            <span className="text-sm text-fg">
              {t(trainingToday ? 'waterTrainingToday' : 'waterTraining', {
                extra: TRAINING_DAY_EXTRA_L,
              })}
            </span>
          </p>
        </div>
        <details className="smooth-details group rounded-btn bg-bg px-4 py-3">
          <summary className="cursor-pointer font-semibold">{t('how.title')}</summary>
          <ul className="mt-3 list-disc space-y-2 ps-5 text-sm">
            <li>
              {scan?.bmrKcal
                ? t('how.bmrMeasured', {
                    bmr: targets.bmrKcal,
                    date: formatLongDate(dateOf(scan.scannedOn), locale),
                  })
                : t('how.bmrEstimated', { bmr: targets.bmrKcal })}
            </li>
            <li>
              {t('how.tdee', {
                activity: tp(`activityLevels.${values.activityLevel}.label`),
                tdee: targets.tdeeKcal,
              })}
            </li>
            <li>{t(`how.goal.${values.goal}`, { target: targets.calorieTargetKcal })}</li>
            <li>{t('how.protein', { perKg: PROTEIN_G_PER_KG[values.goal] })}</li>
            <li>{t('how.fibre')}</li>
            <li>{t('how.water')}</li>
          </ul>
        </details>
      </section>

      <section aria-labelledby="plan-title" className={`${card} space-y-4`}>
        <div className="space-y-1">
          <h2 id="plan-title" className="text-lg font-extrabold">
            {t('plan.title')}
          </h2>
          <p className="text-sm text-fg-muted">{t('plan.intro')}</p>
        </div>
        <ol className="space-y-3">
          {plan.meals.map((meal) => (
            <li key={meal.meal} className="rounded-btn bg-bg p-4">
              <p className="text-xs font-bold tracking-wide text-primary uppercase">
                {tp(`meals.${meal.meal}`)}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3">
                <h3 className="font-extrabold">
                  {meal.kind === 'recipe' ? (
                    <Link
                      href={recipeHref(meal.recipeId)}
                      className="underline-offset-4 hover:underline"
                    >
                      {mealName(meal)}
                    </Link>
                  ) : (
                    mealName(meal)
                  )}
                </h3>
                <p className="text-sm text-fg-muted tabular-nums">
                  {t('plan.mealKcal', {
                    kcal: Math.round(meal.portion.totals.kcal),
                    protein: Math.round(meal.portion.totals.proteinG),
                  })}
                </p>
              </div>
              <details className="smooth-details mt-2" open={meal.kind === 'plate'}>
                <summary className="cursor-pointer text-sm font-semibold">
                  {t('plan.weigh', { count: meal.portion.lines.length })}
                </summary>
                <ul className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                  {meal.portion.lines.map((line) => (
                    <li key={line.name} className="flex justify-between gap-3">
                      <span>{food(line.name)}</span>
                      <span className="shrink-0 font-semibold tabular-nums">
                        {line.small ? t('plan.aLittle') : t('grams', { value: line.grams })}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ol>
        <p className="rounded-btn bg-surface-2 px-4 py-3 text-sm font-semibold tabular-nums">
          {t('plan.totals', {
            kcal: Math.round(plan.totals.kcal),
            protein: Math.round(plan.totals.proteinG),
            fibre: Math.round(plan.fibre.grams),
          })}
        </p>
        {plan.fibre.grams < fibre - FIBRE_TIP_MARGIN_G && (
          <p className="text-sm text-fg-muted">{t('plan.fibreTip', { target: fibre })}</p>
        )}
      </section>

      <p className="text-xs text-fg-muted">{t('disclaimer')}</p>
    </div>
  )
}
