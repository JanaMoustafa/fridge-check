import { ReceiptText } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PageTransition } from '@/components/layout/PageTransition'
import { EmptyState } from '@/components/ui/EmptyState'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('shopping')
  return { title: t('metaTitle') }
}

export default async function ShoppingListPage() {
  const t = await getTranslations('shopping')
  return (
    <PageTransition>
      <h1 className="mb-8 text-3xl font-extrabold">{t('heading')}</h1>
      <EmptyState
        icon={ReceiptText}
        title={t('emptyTitle')}
        body={t('emptyBody')}
        action={{ href: '/', label: t('emptyCta') }}
      />
    </PageTransition>
  )
}
