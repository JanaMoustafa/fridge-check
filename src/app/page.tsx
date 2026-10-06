import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PageTransition } from '@/components/layout/PageTransition'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata')
  return { title: { absolute: t('title') } }
}

export default async function FindPage() {
  const t = await getTranslations('find')
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
    </PageTransition>
  )
}
