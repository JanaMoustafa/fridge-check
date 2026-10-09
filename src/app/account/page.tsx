import { CheckCircle2, LogOut, UserRound } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { DeleteAccountDialog } from '@/components/account/DeleteAccountDialog'
import { GoogleSignInButton } from '@/components/account/GoogleSignInButton'
import { TargetsCard } from '@/components/account/TargetsCard'
import { legalLinks } from '@/components/legal/legal-links'
import { EmptyState } from '@/components/ui/EmptyState'
import { buttonClasses } from '@/components/ui/button'
import { getSignedInUser, isProConfigured } from '@/lib/auth/auth'
import { getProAccess } from '@/lib/billing/access'
import { PRO_PRICE_EGP } from '@/lib/billing/plan'
import { daysLeft } from '@/lib/billing/subscription'
import { getDb } from '@/lib/db/client'
import { formatLongDate } from '@/lib/i18n/format-date'
import { safeNext } from '@/lib/navigation/safe-next'
import { getProfile } from '@/lib/server/profiles'
import { cancelRenewalAction, resumeRenewalAction, signOutAction } from './actions'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account')
  return { title: t('metaTitle'), robots: { index: false } }
}

/** Days before the end of a Pro period when the account page starts reminding to renew. */
const RENEWAL_REMINDER_DAYS = 5

const card =
  'rounded-card bg-surface p-6 shadow-[inset_0_1px_0_var(--color-highlight),0_0_0_1px_var(--color-line)]'

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="flex items-start gap-2 rounded-btn bg-have-soft px-4 py-3 text-sm font-semibold"
    >
      <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-have" />
      {children}
    </p>
  )
}

export default async function AccountPage({ searchParams }: PageProps<'/account'>) {
  const [t, query] = await Promise.all([getTranslations('account'), searchParams])
  const param = (name: string) => (typeof query[name] === 'string' ? query[name] : undefined)

  if (!isProConfigured()) {
    return (
      <div className="py-8">
        <h1 className="sr-only">{t('title')}</h1>
        <EmptyState icon={UserRound} title={t('title')} body={t('unavailable')} />
      </div>
    )
  }

  const user = await getSignedInUser()
  if (!user) {
    return (
      <div className="mx-auto max-w-xl space-y-6 py-4">
        {param('deleted') === '1' && <Notice>{t('deleted')}</Notice>}
        <section className={`${card} space-y-4`}>
          <h1 className="text-2xl font-extrabold">{t('signedOutTitle')}</h1>
          <p className="text-fg-muted">{t('signedOutBody')}</p>
          {param('signin') === 'failed' && (
            <p role="alert" className="text-sm font-semibold text-danger">
              {t('signInFailed')}
            </p>
          )}
          <GoogleSignInButton next={safeNext(param('next'))} />
          <p className="text-sm text-fg-muted">{t('privacy')}</p>
          <p className="text-sm text-fg-muted">{t.rich('agree', legalLinks)}</p>
          <p className="text-sm text-fg-muted">{t('signedOutNote')}</p>
        </section>
      </div>
    )
  }

  const now = new Date()
  const [profile, access, tBilling, locale] = await Promise.all([
    getProfile(getDb(), user.id, now),
    getProAccess(getDb(), user.id, now),
    getTranslations('billing'),
    getLocale(),
  ])
  const remaining = access.periodEnd ? daysLeft(access.periodEnd, now) : 0
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <header className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-soft text-xl font-extrabold text-primary"
        >
          {(user.name || user.email).slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold">{user.name || t('title')}</h1>
          <p className="truncate text-sm text-fg-muted" dir="ltr">
            {t('signedInAs', { email: user.email })}
          </p>
        </div>
      </header>

      {param('saved') === 'profile' && <Notice>{t('profileSaved')}</Notice>}

      <section aria-labelledby="targets-title" className={`${card} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="targets-title" className="text-lg font-extrabold">
            {t('targetsTitle')}
          </h2>
          {profile && (
            <Link href="/profile" className={buttonClasses({ variant: 'secondary' })}>
              {t('editProfile')}
            </Link>
          )}
        </div>
        {profile ? (
          <TargetsCard targets={profile.targets} />
        ) : (
          <>
            <p className="text-fg-muted">{t('targetsMissing')}</p>
            <Link href="/profile" className={buttonClasses()}>
              {t('setUpProfile')}
            </Link>
          </>
        )}
        <p className="text-xs text-fg-muted">{t('disclaimer')}</p>
      </section>

      <section aria-labelledby="plan-title" className={`${card} space-y-4`}>
        <div className="flex items-center justify-between gap-3">
          <h2 id="plan-title" className="text-lg font-extrabold">
            {t('planTitle')}
          </h2>
          <span
            className={`rounded-chip px-3 py-1 text-sm font-semibold ${access.isPro ? 'bg-primary text-on-primary' : 'bg-surface-2'}`}
          >
            {access.isPro ? tBilling('planPro') : t('planFree')}
          </span>
        </div>
        {access.isPro && access.periodEnd ? (
          <>
            <p>
              {tBilling(access.cancelAtPeriodEnd ? 'proUntilCanceled' : 'proUntil', {
                date: formatLongDate(access.periodEnd, locale),
              })}
            </p>
            {!access.cancelAtPeriodEnd && remaining <= RENEWAL_REMINDER_DAYS && (
              <p
                role="status"
                className="rounded-btn bg-missing-soft px-4 py-3 text-sm font-semibold"
              >
                {tBilling('endsSoon', { days: remaining })}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/pro" className={buttonClasses()}>
                {tBilling('renew', { price: PRO_PRICE_EGP })}
              </Link>
              <form action={access.cancelAtPeriodEnd ? resumeRenewalAction : cancelRenewalAction}>
                <button type="submit" className={buttonClasses({ variant: 'ghost' })}>
                  {tBilling(access.cancelAtPeriodEnd ? 'resumeReminders' : 'cancelReminders')}
                </button>
              </form>
            </div>
            <p className="text-xs text-fg-muted">{tBilling('cancelNote')}</p>
          </>
        ) : (
          <Link href="/pro" className={buttonClasses()}>
            {tBilling('upgrade')}
          </Link>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <form action={signOutAction}>
          <button type="submit" className={buttonClasses({ variant: 'secondary' })}>
            <LogOut aria-hidden="true" className="size-4" />
            {t('signOut')}
          </button>
        </form>
        <DeleteAccountDialog />
      </div>
    </div>
  )
}
