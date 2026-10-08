import { CheckCircle2, LogOut, UserRound } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { DeleteAccountDialog } from '@/components/account/DeleteAccountDialog'
import { GoogleSignInButton } from '@/components/account/GoogleSignInButton'
import { TargetsCard } from '@/components/account/TargetsCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { buttonClasses } from '@/components/ui/button'
import { getSignedInUser, isProConfigured } from '@/lib/auth/auth'
import { getDb } from '@/lib/db/client'
import { safeNext } from '@/lib/navigation/safe-next'
import { getProfile } from '@/lib/server/profiles'
import { signOutAction } from './actions'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account')
  return { title: t('metaTitle'), robots: { index: false } }
}

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
          <p className="text-sm text-fg-muted">{t('signedOutNote')}</p>
        </section>
      </div>
    )
  }

  const profile = await getProfile(getDb(), user.id, new Date())
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

      <section
        aria-labelledby="plan-title"
        className={`${card} flex items-center justify-between gap-3`}
      >
        <h2 id="plan-title" className="text-lg font-extrabold">
          {t('planTitle')}
        </h2>
        <span className="rounded-chip bg-surface-2 px-3 py-1 text-sm font-semibold">
          {t('planFree')}
        </span>
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
