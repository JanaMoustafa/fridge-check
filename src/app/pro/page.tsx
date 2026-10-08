import { Check, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { EmptyState } from '@/components/ui/EmptyState'
import { buttonClasses } from '@/components/ui/button'
import { getSignedInUser, isProConfigured } from '@/lib/auth/auth'
import { getProAccess } from '@/lib/billing/access'
import { PRO_PRICE_EGP } from '@/lib/billing/plan'
import { getDb } from '@/lib/db/client'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pro')
  return { title: t('metaTitle') }
}

const BENEFITS = ['nutrition', 'portions', 'progress'] as const

/** Pro: what it includes, the price, and the way in (sign in, then pay with XPay). */
export default async function ProPage() {
  const [t, locale] = await Promise.all([getTranslations('pro'), getLocale()])
  if (!isProConfigured()) {
    return (
      <div className="py-8">
        <h1 className="sr-only">{t('title')}</h1>
        <EmptyState icon={Sparkles} title={t('title')} body={t('unavailable')} />
      </div>
    )
  }
  const user = await getSignedInUser()
  const access = user ? await getProAccess(getDb(), user.id, new Date()) : null
  const until =
    access?.isPro && access.periodEnd
      ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
          dateStyle: 'long',
          numberingSystem: 'latn',
        }).format(access.periodEnd)
      : null

  return (
    <div className="mx-auto max-w-xl space-y-6 py-4">
      <header className="space-y-2 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
          <Sparkles aria-hidden="true" className="size-6" />
        </span>
        <h1 lang="en" className="text-3xl font-extrabold">
          {t('title')}
        </h1>
        <p className="text-fg-muted">{t('tagline')}</p>
      </header>
      <section className="space-y-5 rounded-card bg-surface p-6 shadow-[inset_0_1px_0_var(--color-highlight),0_0_0_1px_var(--color-line)]">
        <ul className="space-y-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3">
              <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-have" />
              <span>{t(`benefits.${benefit}`)}</span>
            </li>
          ))}
        </ul>
        <p className="text-center">
          <span className="text-3xl font-extrabold tabular-nums">
            {t('price', { price: PRO_PRICE_EGP })}
          </span>{' '}
          <span className="text-fg-muted">{t('period')}</span>
        </p>
        <p className="text-center text-sm text-fg-muted">{t('noAutoRenew')}</p>
        <div className="text-center">
          {until ? (
            <p role="status" className="font-semibold text-have">
              {t('youHavePro', { date: until })}
            </p>
          ) : user ? (
            <p className="font-semibold text-fg-muted">{t('comingSoon')}</p>
          ) : (
            <Link href={`/account?next=${encodeURIComponent('/pro')}`} className={buttonClasses()}>
              {t('signInToUpgrade')}
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
