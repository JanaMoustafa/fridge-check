import { ArrowLeft, Lock, Salad, UserRound } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { buttonClasses } from '@/components/ui/button'
import { getSignedInUser, isProConfigured, type SignedInUser } from '@/lib/auth/auth'
import { getProAccess } from '@/lib/billing/access'
import { PRO_PRICE_EGP } from '@/lib/billing/plan'
import { getDb } from '@/lib/db/client'
import { getProfile, type StoredProfile } from '@/lib/server/profiles'

export type NutritionistGate =
  | { ready: true; user: SignedInUser; profile: StoredProfile; now: Date }
  | { ready: false; page: ReactNode }

/**
 * Who may see Your Nutritionist: a signed-in Pro member (trial included) with a nutrition profile.
 * Everyone else gets the one step that gets them there, coming back to `path` afterwards.
 */
export async function nutritionistGate(path: string): Promise<NutritionistGate> {
  const t = await getTranslations('nutritionist')
  const blocked = (page: ReactNode): NutritionistGate => ({
    ready: false,
    page: (
      <div className="py-8">
        <h1 className="sr-only">{t('title')}</h1>
        {page}
      </div>
    ),
  })
  if (!isProConfigured()) {
    return blocked(<EmptyState icon={Salad} title={t('title')} body={t('unavailable')} />)
  }
  const user = await getSignedInUser()
  if (!user) {
    return blocked(
      <EmptyState
        icon={UserRound}
        title={t('signedOutTitle')}
        body={t('signedOutBody')}
        action={{ href: `/account?next=${encodeURIComponent(path)}`, label: t('signIn') }}
      />,
    )
  }
  const now = new Date()
  const [access, profile] = await Promise.all([
    getProAccess(getDb(), user.id, now),
    getProfile(getDb(), user.id, now),
  ])
  if (!access.isPro) {
    return blocked(
      <section className="mx-auto max-w-md space-y-4 rounded-card bg-surface px-6 py-10 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
          <Lock aria-hidden="true" className="size-6" />
        </span>
        <h2 className="text-xl font-extrabold">{t('lockedTitle')}</h2>
        <p className="text-fg-muted">{t('lockedBody')}</p>
        <Link href="/pro" className={buttonClasses()}>
          {t('upgrade')}
        </Link>
        <p className="text-xs text-fg-muted">{t('price', { price: PRO_PRICE_EGP })}</p>
      </section>,
    )
  }
  if (!profile) {
    return blocked(
      <EmptyState
        icon={UserRound}
        title={t('noProfileTitle')}
        body={t('noProfileBody')}
        action={{ href: `/profile?next=${encodeURIComponent(path)}`, label: t('setUpProfile') }}
      />,
    )
  }
  return { ready: true, user, profile, now }
}

export const card =
  'rounded-card bg-surface p-5 shadow-[inset_0_1px_0_var(--color-highlight),0_0_0_1px_var(--color-line)] sm:p-6'

/** Back to the Nutritionist overview from its scan and report pages. */
export async function BackToNutritionist() {
  const t = await getTranslations('nutritionist')
  return (
    <Link
      href="/nutritionist"
      className="inline-flex min-h-11 items-center gap-2 rounded-btn text-sm font-semibold text-primary print:hidden"
    >
      <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
      {t('back')}
    </Link>
  )
}
