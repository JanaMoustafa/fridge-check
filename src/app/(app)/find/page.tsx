import { Heart, ReceiptText } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { NavCount } from '@/components/layout/NavCount'
import { PageTransition } from '@/components/layout/PageTransition'
import { IngredientLabelsProvider } from '@/components/providers/IngredientLabels'
import { FindExperience } from '@/components/search/FindExperience'
import { arabicIngredientNamesFor } from '@/lib/i18n/ingredient-names.server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav')
  return { title: t('find'), alternates: { canonical: '/find' } }
}

/** The lists made from recipes, one tap from the search (they have no tab of their own). */
const LISTS = [
  { href: '/saved', tab: 'saved', icon: Heart },
  { href: '/shopping-list', tab: 'shopping', icon: ReceiptText },
] as const

export default async function FindPage() {
  const [t, tn, locale] = await Promise.all([
    getTranslations('find'),
    getTranslations('nav'),
    getLocale(),
  ])
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
        <ul className="mt-4 flex flex-wrap gap-2">
          {LISTS.map(({ href, tab, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="inline-flex min-h-11 items-center gap-2 rounded-chip border border-line-strong px-4 text-sm font-semibold transition-colors duration-150 hover:bg-surface-2"
              >
                <Icon aria-hidden="true" className="size-4 text-accent" />
                {tn(tab)}
                <NavCount tab={tab} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <IngredientLabelsProvider names={await arabicIngredientNamesFor(locale)}>
        <Suspense>
          <FindExperience />
        </Suspense>
      </IngredientLabelsProvider>
    </PageTransition>
  )
}
