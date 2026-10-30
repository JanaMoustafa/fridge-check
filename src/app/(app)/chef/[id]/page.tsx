import { Clock, PlayCircle, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { NutritionPanel } from '@/components/chef/NutritionPanel'
import { BackTo, card } from '@/components/pro/ProGate'
import { YouTubeFacade } from '@/components/ui/YouTubeFacade'
import { buttonClasses } from '@/components/ui/button'
import { chefNutrition, dishNutrition } from '@/lib/chef/recipes'
import { chefVideo, getChefRecipes } from '@/lib/data/chef-recipes'
import { getLocalRecipes } from '@/lib/data/local-recipes'
import { labelSlug } from '@/lib/i18n/cuisines'
import { ingredientLabel, loadArabicIngredientNames } from '@/lib/i18n/ingredient-names'
import { isLocale } from '@/lib/i18n/locale'
import { macrosFor } from '@/lib/nutrition/portions'
import { recipeNutrition } from '@/lib/nutrition/recipe-nutrition'
import { getNutritionFoods } from '@/lib/server/nutrition'

/** A recipe the TheMealDB collection doesn't give servings for is split in four to start. */
const DEFAULT_SERVINGS = 4

async function dishOf(id: string) {
  if (/^\d+$/.test(id)) {
    const recipe = (await getLocalRecipes()).find((r) => r.mealDbId === id)
    return recipe ? ({ kind: 'local', recipe } as const) : null
  }
  const recipe = (await getChefRecipes()).find((r) => r.id === id)
  return recipe ? ({ kind: 'chef', recipe } as const) : null
}

export async function generateMetadata({ params }: PageProps<'/chef/[id]'>): Promise<Metadata> {
  const [{ id }, rawLocale] = await Promise.all([params, getLocale()])
  const dish = await dishOf(id)
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  const title = dish?.kind === 'chef' ? dish.recipe.title[locale] : dish?.recipe.title
  return { title, robots: { index: false } }
}

interface Row {
  key: string
  name: string
  /** The line as the source wrote it, when that differs from the name. */
  note?: string
  grams?: number
  kcal?: number
}

/** One dish: a video of it being cooked, its nutrition, every ingredient in grams, the method. */
export default async function DishPage({ params }: PageProps<'/chef/[id]'>) {
  const { id } = await params
  const dish = await dishOf(id)
  if (!dish) notFound()
  const [t, tc, rawLocale, nutrition] = await Promise.all([
    getTranslations('chef'),
    getTranslations('cuisine'),
    getLocale(),
    getNutritionFoods(),
  ])
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  const slug = labelSlug(dish.recipe.cuisine) as Parameters<typeof tc>[0]
  const cuisine = tc.has(slug) ? tc(slug) : dish.recipe.cuisine

  let title: string
  let video: { id: string; channel?: string } | undefined
  let rows: Row[]
  let steps: string[]
  let stepsDir: 'ltr' | undefined
  let panel: React.ReactNode

  if (dish.kind === 'chef') {
    const { recipe } = dish
    const weighed = chefNutrition(recipe, nutrition.foods)
    title = recipe.title[locale]
    video = chefVideo(recipe, locale)
    rows = recipe.ingredients.map((line, i) => ({
      key: `${i}`,
      name: line[locale],
      grams: line.grams,
      kcal: weighed.lines[i]?.kcal,
    }))
    steps = recipe.steps[locale]
    panel = (
      <NutritionPanel
        total={weighed.total}
        servings={recipe.servings}
        servingsKnown
        fiberComplete={weighed.fiberComplete}
      />
    )
  } else {
    const { recipe } = dish
    const arabicNames = locale === 'ar' ? await loadArabicIngredientNames() : undefined
    const weighed = recipeNutrition(recipe.ingredients, nutrition)
    title = recipe.title
    video = recipe.videoId ? { id: recipe.videoId } : undefined
    rows = recipe.ingredients.map((ingredient, i) => {
      // Each line weighed on its own: two lines can name the same food.
      const [line] = recipeNutrition([ingredient], nutrition).lines
      return {
        key: `${ingredient.name}-${i}`,
        name: ingredientLabel(ingredient.name, locale, arabicNames),
        note: ingredient.raw,
        grams: line?.grams,
        kcal: line ? macrosFor(line.grams, line.per100g).kcal : undefined,
      }
    })
    steps = recipe.instructions
    stepsDir = 'ltr'
    const { total, fiberComplete } = dishNutrition(
      weighed.lines.map((line) => ({
        ...line,
        category: nutrition.foods[line.name]?.category,
      })),
      DEFAULT_SERVINGS,
    )
    const unweighed = weighed.uncounted
      .filter((line) => line.reason !== 'small-amount' && line.reason !== 'served-separately')
      .map((line) => ingredientLabel(line.name, locale, arabicNames))
    panel = weighed.complete ? (
      <NutritionPanel
        total={total}
        servings={DEFAULT_SERVINGS}
        servingsKnown={false}
        fiberComplete={fiberComplete}
      />
    ) : (
      <section className={`${card} space-y-1`}>
        <h2 className="text-lg font-extrabold">{t('nutritionTitle')}</h2>
        <p className="text-sm text-fg-muted">
          {t('nutritionIncomplete', {
            names: new Intl.ListFormat(locale, { type: 'conjunction' }).format(unweighed),
          })}
        </p>
      </section>
    )
  }

  const grams = (value: number | undefined) =>
    value === undefined
      ? '–'
      : value < 1
        ? t('gramsUnderOne')
        : t('gramsValue', { value: Math.round(value) })
  const duration = (total: number) => {
    const hours = Math.floor(total / 60)
    const minutes = total % 60
    if (hours === 0) return t('minutes', { count: minutes })
    if (minutes === 0) return t('hours', { count: hours })
    return t('duration', {
      hours: t('hours', { count: hours }),
      minutes: t('minutes', { count: minutes }),
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <BackTo href="/chef" label={t('back')} />
      <header className="space-y-3">
        {dish.kind === 'local' && (
          <div className="relative aspect-[16/9] overflow-hidden rounded-card bg-surface-2">
            <Image
              src={dish.recipe.imageUrl}
              alt=""
              fill
              sizes="(min-width: 768px) 672px, 100vw"
              priority
              className="object-cover"
            />
          </div>
        )}
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
          <span>{cuisine}</span>
          {dish.kind === 'chef' && (
            <>
              <span className="inline-flex items-center gap-1.5">
                <Users aria-hidden="true" className="size-4" />
                {t('serves', { count: dish.recipe.servings })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock aria-hidden="true" className="size-4" />
                {duration(dish.recipe.minutes)}
              </span>
            </>
          )}
        </p>
      </header>

      <section aria-labelledby="video-title" className="space-y-3">
        <h2 id="video-title" className="text-lg font-extrabold">
          {t('videoTitle')}
        </h2>
        {video ? (
          <figure className="space-y-2">
            <YouTubeFacade
              videoId={video.id}
              title={title}
              playLabel={`${t('videoTitle')}: ${title}`}
              lang={locale}
            />
            <figcaption className="text-sm text-fg-muted">
              <a
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary"
              >
                {/* The channel's name keeps its own direction inside the sentence. */}
                {video.channel
                  ? t('videoBy', { channel: `\u2068${video.channel}\u2069` })
                  : t('videoCredit')}
              </a>
            </figcaption>
          </figure>
        ) : (
          <div className="flex items-start gap-3 rounded-card bg-primary-soft p-5">
            <PlayCircle aria-hidden="true" className="size-8 shrink-0 text-accent" />
            <p className="text-sm">{t('videoSoon')}</p>
          </div>
        )}
      </section>

      {panel}

      <section aria-labelledby="ingredients-title" className={`${card} space-y-3`}>
        <div className="space-y-1">
          <h2 id="ingredients-title" className="text-lg font-extrabold">
            {t('ingredientsTitle')}
          </h2>
          <p className="text-sm text-fg-muted">{t('ingredientsIntro')}</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-fg-muted">
              <th scope="col" className="py-2 pe-3 text-start font-semibold">
                {t('ingredient')}
              </th>
              <th scope="col" className="py-2 pe-3 text-end font-semibold">
                {t('grams')}
              </th>
              <th scope="col" className="py-2 text-end font-semibold">
                {t('calories')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.key}
                className="chef-row border-b border-line align-top last:border-0"
                style={{ '--i': i } as React.CSSProperties}
              >
                <th scope="row" className="py-2 pe-3 text-start font-semibold">
                  {row.name}
                  {row.note && (
                    <span className="block text-xs font-normal text-fg-muted" dir="ltr">
                      {row.note}
                    </span>
                  )}
                </th>
                <td className="py-2 pe-3 text-end font-bold whitespace-nowrap tabular-nums">
                  {grams(row.grams)}
                </td>
                <td className="py-2 text-end whitespace-nowrap text-fg-muted tabular-nums">
                  {row.kcal === undefined ? '–' : t('kcalValue', { value: Math.round(row.kcal) })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="steps-title" className={`${card} space-y-3`}>
        <h2 id="steps-title" className="text-lg font-extrabold">
          {t('stepsTitle')}
        </h2>
        <ol className="list-decimal space-y-3 ps-5" dir={stepsDir}>
          {steps.map((step, i) => (
            <li key={i} className="ps-1">
              {step}
            </li>
          ))}
        </ol>
      </section>

      {dish.kind === 'local' ? (
        <Link
          href={`/recipe/local/${dish.recipe.mealDbId}`}
          className={buttonClasses({ variant: 'secondary' })}
        >
          {t('nutritionLink')}
        </Link>
      ) : (
        <p className="text-sm text-fg-muted">{t('authoredNote')}</p>
      )}
      <p className="text-xs text-fg-muted">{t('disclaimer')}</p>
    </div>
  )
}
