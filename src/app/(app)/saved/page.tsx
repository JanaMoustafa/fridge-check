import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PageTransition } from '@/components/layout/PageTransition'
import { SavedList } from '@/components/saved/SavedList'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('saved')
  return { title: t('metaTitle'), alternates: { canonical: '/saved' } }
}

export default async function SavedPage() {
  const t = await getTranslations('saved')
  return (
    <PageTransition>
      <h1 className="mb-8 text-3xl font-extrabold">{t('heading')}</h1>
      <SavedList />
    </PageTransition>
  )
}
