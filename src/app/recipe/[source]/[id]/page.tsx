import { Globe, ShieldAlert } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ViewTransition } from 'react'
import { PageTransition } from '@/components/layout/PageTransition'
import { IngredientLabelsProvider } from '@/components/providers/IngredientLabels'
import { BackLink } from '@/components/recipe/BackLink'
import { AddMissingButton } from '@/components/recipe/AddMissingButton'
import { DietBadges } from '@/components/recipe/DietBadges'
import { HeartButton } from '@/components/recipe/HeartButton'
import { HaveNeedPanel } from '@/components/recipe/HaveNeedPanel'
import { IngredientList } from '@/components/recipe/IngredientList'
import { RecipeActions } from '@/components/recipe/RecipeActions'
import { RecipeUnavailable } from '@/components/recipe/RecipeUnavailable'
import { NutritionSection } from '@/components/pro/NutritionSection'
import { labelSlug } from '@/lib/i18n/cuisines'
import { arabicIngredientNamesFor } from '@/lib/i18n/ingredient-names.server'
import { recipeHref, recipeViewName } from '@/lib/search/links'
import { parseSearchUrl, toSearchUrl } from '@/lib/search/url-state'
import { loadRecipePage } from '@/lib/server/recipe'

type Props = PageProps<'/recipe/[source]/[id]'>

function pantryFrom(query: Awaited<Props['searchParams']>): string[] {
  return parseSearchUrl({
    get: (name) => {
      const value = query[name]
      return (Array.isArray(value) ? value[0] : value) ?? null
    },
  }).ingredients
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { source, id } = await params
  const result = await loadRecipePage(source, id, '')
  if (result.kind === 'not-found') return {}
  const t = await getTranslations('recipe')
  if (result.kind === 'unavailable') {
    return { title: t('unavailableMetaTitle'), robots: { index: false } }
  }
  const { title, imageUrl } = result.recipe
  return {
    title,
    description: t('metaDescription', { title }),
    alternates: { canonical: `/recipe/${source}/${id}` },
    openGraph: {
      type: 'article',
      title,
      images: imageUrl ? [{ url: imageUrl, width: 700, height: 700, alt: title }] : undefined,
    },
    twitter: { card: 'summary_large_image', images: imageUrl ? [imageUrl] : undefined },
  }
}

export default async function RecipePage({ params, searchParams }: Props) {
  const [{ source, id }, query, locale] = await Promise.all([params, searchParams, getLocale()])
  const pantry = pantryFrom(query)
  const result = await loadRecipePage(source, id, pantry.join(','))
  if (result.kind === 'not-found') notFound()
  const backHref = `/${toSearchUrl({ ingredients: pantry, diets: [], sort: 'fewest-missing' })}`
  if (result.kind === 'unavailable') {
    return (
      <RecipeUnavailable
        source={result.source}
        reason={result.reason}
        retryAt={result.retryAt}
        builtInHref={backHref}
        retryHref={recipeHref(`${source}:${id}`, pantry)}
      />
    )
  }
  const data = result

  const [t, tc] = await Promise.all([getTranslations('recipe'), getTranslations('cuisine')])
  const { recipe } = data
  const cuisineKey = recipe.cuisine ? labelSlug(recipe.cuisine) : undefined
  const cuisine =
    recipe.cuisine && cuisineKey && tc.has(cuisineKey as Parameters<typeof tc>[0])
      ? tc(cuisineKey as Parameters<typeof tc>[0])
      : recipe.cuisine
  const site = recipe.sourceUrl ? new URL(recipe.sourceUrl).hostname.replace(/^www\./, '') : null

  return (
    <IngredientLabelsProvider names={await arabicIngredientNamesFor(locale)}>
      <PageTransition>
        <article className="recipe-page">
          <BackLink href={backHref} />
          <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
            <div className="min-w-0 space-y-6">
              {recipe.imageUrl && (
                <ViewTransition name={recipeViewName(recipe.id)} share="morph" default="none">
                  <div className="relative mx-auto aspect-[16/10] max-w-[700px] overflow-hidden rounded-card bg-surface-2 lg:mx-0">
                    <Image
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      fill
                      priority
                      sizes="(min-width: 1024px) 700px, 100vw"
                      className="object-cover"
                    />
                  </div>
                </ViewTransition>
              )}
              <header className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h1
                    lang="en"
                    dir="ltr"
                    className="text-start text-[clamp(1.75rem,1.2rem+2.4vw,2.75rem)] leading-tight font-extrabold"
                  >
                    {recipe.title}
                  </h1>
                  <HeartButton recipe={recipe} className="shrink-0 print:hidden" />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
                  {cuisine && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 font-semibold">
                      <Globe aria-hidden="true" className="size-3.5" />
                      {cuisine}
                    </span>
                  )}
                </div>
                <DietBadges diets={recipe.diets} estimated={recipe.dietsEstimated} />
                {locale === 'ar' && <p className="text-sm text-fg-muted">{t('englishOnly')}</p>}
              </header>
              <div className="flex flex-wrap items-start gap-2">
                <AddMissingButton
                  recipe={{ id: recipe.id, title: recipe.title }}
                  withStaples={data.withStaples.missingIngredients}
                  withoutStaples={data.withoutStaples.missingIngredients}
                />
                <RecipeActions title={recipe.title} />
              </div>

              <div className="lg:hidden">
                <HaveNeedPanel
                  withStaples={data.withStaples}
                  withoutStaples={data.withoutStaples}
                />
              </div>

              <section aria-labelledby="ingredients-heading">
                <h2 id="ingredients-heading" className="mb-2 text-xl font-extrabold">
                  {t('ingredientsTitle')}
                </h2>
                <IngredientList ingredients={recipe.ingredients} />
              </section>

              <NutritionSection recipe={recipe} returnTo={recipeHref(recipe.id, pantry)} />

              <section aria-labelledby="steps-heading">
                <h2 id="steps-heading" className="mb-3 text-xl font-extrabold">
                  {t('stepsTitle')}
                </h2>
                <ol
                  lang="en"
                  dir="ltr"
                  className="max-w-[68ch] list-decimal space-y-4 ps-6 text-start marker:font-bold marker:text-primary"
                >
                  {recipe.instructions.map((step, index) => (
                    <li key={index} className="ps-1 leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </section>

              <p
                role="note"
                className="flex items-start gap-2 rounded-btn bg-missing-soft px-4 py-3 text-sm"
              >
                <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-missing" />
                {t('allergy')}
              </p>

              <footer className="space-y-1 text-sm text-fg-muted">
                {site && recipe.sourceUrl && (
                  <p>
                    {t.rich('source', {
                      site,
                      link: (chunks) => (
                        <a
                          href={recipe.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-primary underline underline-offset-4"
                        >
                          {chunks}
                        </a>
                      ),
                    })}
                  </p>
                )}
                <p>
                  {t.rich(
                    recipe.source === 'spoonacular' ? 'poweredBySpoonacular' : 'attribution',
                    {
                      link: (chunks) => (
                        <a
                          href={
                            recipe.source === 'spoonacular'
                              ? 'https://spoonacular.com/food-api'
                              : 'https://www.themealdb.com'
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          lang="en"
                          className="font-semibold text-primary underline underline-offset-4"
                        >
                          {chunks}
                        </a>
                      ),
                    },
                  )}
                </p>
              </footer>
            </div>
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <HaveNeedPanel
                  withStaples={data.withStaples}
                  withoutStaples={data.withoutStaples}
                />
              </div>
            </aside>
          </div>
        </article>
      </PageTransition>
    </IngredientLabelsProvider>
  )
}
