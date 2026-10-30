import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ChefSearch, type ChefDish } from '@/components/chef/ChefSearch'
import { getLocalRecipes } from '@/lib/data/local-recipes'
import { labelSlug } from '@/lib/i18n/cuisines'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('chef')
  return { title: t('metaTitle'), robots: { index: false } }
}

/** Cooking Companion: find a dish by name and get its ingredients in grams, the method and a video. */
export default async function ChefPage() {
  const [t, tc, recipes] = await Promise.all([
    getTranslations('chef'),
    getTranslations('cuisine'),
    getLocalRecipes(),
  ])
  const label = (cuisine: string) => {
    const slug = labelSlug(cuisine) as Parameters<typeof tc>[0]
    return tc.has(slug) ? tc(slug) : cuisine
  }
  const dishes: ChefDish[] = recipes
    .map((recipe) => ({
      id: recipe.mealDbId,
      title: recipe.title,
      cuisine: recipe.cuisine,
      cuisineLabel: label(recipe.cuisine),
      imageUrl: recipe.imageUrl,
      hasVideo: Boolean(recipe.videoId),
    }))
    .sort((a, b) => a.title.localeCompare(b.title))
  const labels = Object.fromEntries(
    ['Egyptian', 'Italian', 'Mexican', 'Moroccan', 'Saudi Arabian'].map((c) => [c, label(c)]),
  )
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold">{t('title')}</h1>
        <p className="text-fg-muted">{t('intro')}</p>
      </header>
      <ChefSearch dishes={dishes} labels={labels} />
      <p className="text-xs text-fg-muted">{t('disclaimer')}</p>
    </div>
  )
}
