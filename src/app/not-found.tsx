import { CookingPot } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AppChrome } from '@/components/layout/AppChrome'
import { EmptyState } from '@/components/ui/EmptyState'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notFound')
  return { title: t('metaTitle'), robots: { index: false } }
}

export default async function NotFound() {
  const t = await getTranslations('notFound')
  // Rendered outside the (app) group, so it brings the app's chrome itself.
  return (
    <AppChrome>
      <div className="py-8">
        <h1 className="sr-only">{t('metaTitle')}</h1>
        <EmptyState
          icon={CookingPot}
          title={t('heading')}
          body={t('body')}
          action={{ href: '/', label: t('cta') }}
        />
      </div>
    </AppChrome>
  )
}
