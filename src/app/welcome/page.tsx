import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { GoogleSignInButton } from '@/components/account/GoogleSignInButton'
import { LanguageToggle } from '@/components/layout/LanguageToggle'
import { LogoMark } from '@/components/layout/Logo'
import { legalLinks } from '@/components/legal/legal-links'
import { BitePlate } from '@/components/welcome/BitePlate'
import { getSignedInUser, isProConfigured } from '@/lib/auth/auth'
import { safeNext } from '@/lib/navigation/safe-next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('welcome')
  return { title: { absolute: t('metaTitle') }, description: t('body') }
}

/**
 * The way in: the mark, one line about the app, and Google sign-in (the same button for new and
 * returning members). Members who are already signed in go straight on.
 */
export default async function WelcomePage({ searchParams }: PageProps<'/welcome'>) {
  const query = await searchParams
  const next = safeNext(typeof query.next === 'string' ? query.next : undefined)
  // Without accounts (the account-free build) there is nothing to sign in to.
  if (!isProConfigured()) redirect(next ?? '/')
  if (await getSignedInUser()) redirect(next ?? '/')

  const [t, ta] = await Promise.all([getTranslations('welcome'), getTranslations('account')])
  return (
    <main
      id="main"
      className="welcome relative isolate flex min-h-dvh flex-1 flex-col overflow-hidden px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 lg:px-12"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <LogoMark className="size-8" />
          BiteDoneRight
        </p>
        <LanguageToggle />
      </div>

      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        <div className="justify-self-end lg:order-2 lg:justify-self-center">
          <BitePlate className="w-[min(66vw,24rem)] lg:w-[min(38vw,32rem)]" />
        </div>

        <div className="max-w-xl space-y-6 lg:order-1">
          <h1 className="welcome-headline text-[clamp(2.75rem,1.6rem+6vw,5.75rem)] leading-[0.95] font-extrabold tracking-[-0.03em] text-heading rtl:leading-[1.2] rtl:tracking-normal">
            <span className="welcome-line block" style={{ '--line': 0 } as React.CSSProperties}>
              {t('headlineA')}
            </span>
            <span className="welcome-line block" style={{ '--line': 1 } as React.CSSProperties}>
              {t('headlineB')}
            </span>
          </h1>
          <p className="max-w-[34ch] text-lg text-fg-muted">{t('body')}</p>

          {query.deleted === '1' && (
            <p role="status" className="rounded-btn bg-have-soft px-4 py-3 text-sm font-semibold">
              {ta('deleted')}
            </p>
          )}
          {query.signin === 'failed' && (
            <p role="alert" className="text-sm font-semibold text-danger">
              {ta('signInFailed')}
            </p>
          )}

          <div className="max-w-sm space-y-3">
            <GoogleSignInButton next={next} prominent />
            <p className="text-sm text-fg-muted">{t('sameButton')}</p>
          </div>
          <p className="text-sm font-semibold text-primary">{t('trial')}</p>
          <p className="max-w-md text-xs text-fg-muted">{ta.rich('agree', legalLinks)}</p>
        </div>
      </div>
    </main>
  )
}
