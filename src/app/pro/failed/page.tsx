import { XCircle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { buttonClasses } from '@/components/ui/button'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pro')
  return { title: t('metaTitle'), robots: { index: false } }
}

/** XPay's cancelUrl: a decline, a failed 3-D Secure check or a processor error. */
export default async function CheckoutFailedPage() {
  const t = await getTranslations('billing')
  return (
    <section className="mx-auto max-w-xl space-y-4 rounded-card bg-surface p-6 text-center shadow-[inset_0_1px_0_var(--color-highlight),0_0_0_1px_var(--color-line)]">
      <XCircle aria-hidden="true" className="mx-auto size-12 text-missing" />
      <h1 className="text-2xl font-extrabold">{t('failedTitle')}</h1>
      <p className="text-fg-muted">{t('failedBody')}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/pro" className={buttonClasses()}>
          {t('tryAgain')}
        </Link>
        <Link href="/account" className={buttonClasses({ variant: 'secondary' })}>
          {t('yourAccount')}
        </Link>
      </div>
    </section>
  )
}
