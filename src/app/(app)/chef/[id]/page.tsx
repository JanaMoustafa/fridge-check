import { PlayCircle } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { BackTo, card } from '@/components/pro/ProGate'
import { YouTubeFacade } from '@/components/ui/YouTubeFacade'
import { buttonClasses } from '@/components/ui/button'
import { getLocalRecipes } from '@/lib/data/local-recipes'
import { labelSlug } from '@/lib/i18n/cuisines'
import { ingredientLabel, loadArabicIngredientNames } from '@/lib/i18n/ingredient-names'
import { isLocale } from '@/lib/i18n/locale'
import { recipeNutrition } from '@/lib/nutrition/recipe-nutrition'
import { getNutritionFoods } from '@/lib/server/nutrition'

async function dishOf(id: string) {
  if (!/^\d+$/.test(id)) return null
  const recipes = await getLocalRecipes()
  return recipes.find((recipe) => recipe.mealDbId === id) ?? null
}

export async function generateMetadata({ params }: PageProps<'/chef/[id]'>): Promise<Metadata> {
  const { id } = await params
  const dish = await dishOf(id)
  return { title: dish?.title, robots: { index: false } }
}

/** One dish: a video of it being cooked, every ingredient in grams, and the method. */
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
  const arabicNames = locale === 'ar' ? await loadArabicIngredientNames() : undefined
  const label = (name: string) => ingredientLabel(name, locale, arabicNames)
  const slug = labelSlug(dish.cuisine) as Parameters<typeof tc>[0]
  const cuisine = tc.has(slug) ? tc(slug) : dish.cuisine
  const weighed = recipeNutrition(dish.ingredients, nutrition)
  const grams = new Map(weighed.lines.map((line) => [line.name, line.grams]))

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <BackTo href="/chef" label={t('back')} />
      <header className="space-y-3">
        <div className="relative aspect-[16/9] overflow-hidden rounded-card bg-surface-2">
          <Image
            src={dish.imageUrl}
            alt=""
            fill
            sizes="(min-width: 768px) 672px, 100vw"
            priority
            className="object-cover"
          />
        </div>
        <h1 className="text-3xl font-extrabold">{dish.title}</h1>
        <p className="text-sm text-fg-muted">{cuisine}</p>
      </header>

      <section aria-labelledby="video-title" className="space-y-3">
        <h2 id="video-title" className="text-lg font-extrabold">
          {t('videoTitle')}
        </h2>
        {dish.videoId ? (
          <figure className="space-y-2">
            <YouTubeFacade
              videoId={dish.videoId}
              title={dish.title}
              playLabel={`${t('videoTitle')}: ${dish.title}`}
              lang={locale}
            />
            <figcaption className="text-sm text-fg-muted">
              <a
                href={`https://www.youtube.com/watch?v=${dish.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary"
              >
                {t('videoCredit')}
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
              <th scope="col" className="py-2 pe-3 text-start font-semibold">
                {t('grams')}
              </th>
              <th scope="col" className="py-2 text-start font-semibold">
                {t('asWritten')}
              </th>
            </tr>
          </thead>
          <tbody>
            {dish.ingredients.map((ingredient, i) => {
              const g = grams.get(ingredient.name)
              return (
                <tr
                  key={`${ingredient.name}-${i}`}
                  className="chef-row border-b border-line last:border-0"
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <th scope="row" className="py-2 pe-3 text-start font-semibold">
                    {label(ingredient.name)}
                  </th>
                  <td className="py-2 pe-3 font-bold tabular-nums">
                    {g === undefined
                      ? '–'
                      : g < 1
                        ? t('gramsUnderOne')
                        : t('gramsValue', { value: Math.round(g) })}
                  </td>
                  <td className="py-2 text-fg-muted" dir="ltr">
                    {ingredient.raw}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="steps-title" className={`${card} space-y-3`}>
        <h2 id="steps-title" className="text-lg font-extrabold">
          {t('stepsTitle')}
        </h2>
        <ol className="list-decimal space-y-3 ps-5" dir="ltr">
          {dish.instructions.map((step, i) => (
            <li key={i} className="ps-1">
              {step}
            </li>
          ))}
        </ol>
      </section>

      <Link
        href={`/recipe/local/${dish.mealDbId}`}
        className={buttonClasses({ variant: 'secondary' })}
      >
        {t('nutritionLink')}
      </Link>
      <p className="text-xs text-fg-muted">{t('disclaimer')}</p>
    </div>
  )
}
