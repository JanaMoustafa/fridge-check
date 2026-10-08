import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ProfileForm } from '@/components/account/ProfileForm'
import { getSignedInUser } from '@/lib/auth/auth'
import { getDb } from '@/lib/db/client'
import { safeNext } from '@/lib/navigation/safe-next'
import { getProfile } from '@/lib/server/profiles'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('profile')
  return { title: t('metaTitle'), robots: { index: false } }
}

/**
 * The nutrition profile form. Google sign-in lands here with ?welcome=1: someone who already has
 * a profile goes straight on to `next`; a new user fills it in first (onboarding).
 */
export default async function ProfilePage({ searchParams }: PageProps<'/profile'>) {
  const query = await searchParams
  const next = safeNext(typeof query.next === 'string' ? query.next : undefined)
  const user = await getSignedInUser()
  if (!user) redirect(`/account?next=${encodeURIComponent('/profile')}`)

  const profile = await getProfile(getDb(), user.id, new Date())
  const welcome = query.welcome === '1'
  if (welcome && profile) redirect(next ?? '/account')

  const t = await getTranslations('profile')
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold">{t('title')}</h1>
        {welcome && <p className="font-semibold text-primary">{t('welcome')}</p>}
        <p className="text-fg-muted">{t('intro')}</p>
      </header>
      <ProfileForm initial={profile?.values ?? null} next={next} />
    </div>
  )
}
