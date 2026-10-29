import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { PageTransition } from '@/components/layout/PageTransition'
import { IngredientLabelsProvider } from '@/components/providers/IngredientLabels'
import { FindExperience } from '@/components/search/FindExperience'
import { arabicIngredientNamesFor } from '@/lib/i18n/ingredient-names.server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata')
  return { title: { absolute: t('title') }, alternates: { canonical: '/' } }
}

export default async function FindPage() {
  const [t, locale] = await Promise.all([getTranslations('find'), getLocale()])
  return (
    <PageTransition>
      <section aria-labelledby="find-heading" className="max-w-2xl">
        <h1
          id="find-heading"
          className="text-[clamp(2rem,1.25rem+3.2vw,3.25rem)] leading-[1.05] font-extrabold rtl:leading-[1.35]"
        >
          {t('heading')}
        </h1>
        <p className="mt-3 text-lg text-fg-muted">{t('intro')}</p>
      </section>
      <IngredientLabelsProvider names={await arabicIngredientNamesFor(locale)}>
        <Suspense>
          <FindExperience />
        </Suspense>
      </IngredientLabelsProvider>
    </PageTransition>
  )
}
