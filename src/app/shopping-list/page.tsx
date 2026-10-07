import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { PageTransition } from '@/components/layout/PageTransition'
import { IngredientLabelsProvider } from '@/components/providers/IngredientLabels'
import { ShoppingListView } from '@/components/shopping/ShoppingListView'
import { arabicIngredientNamesFor } from '@/lib/i18n/ingredient-names.server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('shopping')
  return { title: t('metaTitle'), alternates: { canonical: '/shopping-list' } }
}

export default async function ShoppingListPage() {
  const [t, locale] = await Promise.all([getTranslations('shopping'), getLocale()])
  return (
    <PageTransition>
      <h1 className="mb-8 text-3xl font-extrabold">{t('heading')}</h1>
      <IngredientLabelsProvider names={await arabicIngredientNamesFor(locale)}>
        <ShoppingListView />
      </IngredientLabelsProvider>
    </PageTransition>
  )
}
