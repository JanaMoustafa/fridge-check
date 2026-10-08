import { CheckCircle2, Hourglass, XCircle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { AutoRefresh } from '@/components/billing/AutoRefresh'
import { buttonClasses } from '@/components/ui/button'
import { getSignedInUser } from '@/lib/auth/auth'
import { getProAccess } from '@/lib/billing/access'
import { getXPay } from '@/lib/billing/config'
import { confirmCheckout } from '@/lib/billing/confirm'
import { getDb } from '@/lib/db/client'
import { formatLongDate } from '@/lib/i18n/format-date'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pro')
  return { title: t('metaTitle'), robots: { index: false } }
}

const card =
  'mx-auto max-w-xl space-y-4 rounded-card bg-surface p-6 text-center shadow-[inset_0_1px_0_var(--color-highlight),0_0_0_1px_var(--color-line)]'

/**
 * Where XPay sends the customer after paying. Arriving here proves nothing: the payment counts
 * only once XPay confirms it (webhook, or XPay's own answer about this user's session).
 */
export default async function CheckoutSuccessPage({ searchParams }: PageProps<'/pro/success'>) {
  const query = await searchParams
  const sessionId = typeof query.session === 'string' ? query.session : ''
  const user = await getSignedInUser()
  if (!user) redirect(`/account?next=${encodeURIComponent(`/pro/success?session=${sessionId}`)}`)

  const [t, locale] = await Promise.all([getTranslations('billing'), getLocale()])
  const db = getDb()
  const now = new Date()
  const outcome = sessionId
    ? await confirmCheckout(db, getXPay(), user.id, sessionId, now)
    : 'unknown'
  const access = outcome === 'paid' ? await getProAccess(db, user.id, now) : null

  const links = (
    <div className="flex flex-wrap justify-center gap-3">
      <Link href="/" className={buttonClasses()}>
        {t('browseRecipes')}
      </Link>
      <Link href="/account" className={buttonClasses({ variant: 'secondary' })}>
        {t('yourAccount')}
      </Link>
    </div>
  )

  if (outcome === 'paid') {
    return (
      <section role="status" className={`${card} motion-safe:animate-rise-in`}>
        <CheckCircle2 aria-hidden="true" className="mx-auto size-12 text-have" />
        <h1 className="text-2xl font-extrabold">{t('successTitle')}</h1>
        {access?.periodEnd && (
          <p className="text-fg-muted">
            {t('successBody', { date: formatLongDate(access.periodEnd, locale) })}
          </p>
        )}
        {links}
      </section>
    )
  }
  if (outcome === 'pending') {
    return (
      <section role="status" className={card}>
        <AutoRefresh />
        <Hourglass
          aria-hidden="true"
          className="mx-auto size-12 text-primary motion-safe:animate-pulse"
        />
        <h1 className="text-2xl font-extrabold">{t('pendingTitle')}</h1>
        <p className="text-fg-muted">{t('pendingBody')}</p>
        <p className="text-sm text-fg-muted">{t('pendingFawry')}</p>
        {links}
      </section>
    )
  }
  return (
    <section className={card}>
      <XCircle aria-hidden="true" className="mx-auto size-12 text-missing" />
      <h1 className="text-2xl font-extrabold">
        {outcome === 'failed' ? t('failedTitle') : t('unknownTitle')}
      </h1>
      <p className="text-fg-muted">{outcome === 'failed' ? t('failedBody') : t('unknownBody')}</p>
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
