'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { buttonClasses } from '@/components/ui/button'

/** Google's "G" mark, as its sign-in branding guidelines allow on a sign-in button. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-5 shrink-0">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  )
}

/**
 * Starts Google sign-in. The auth client is only downloaded when the button is pressed, so
 * visitors who never sign in never load it. After Google, the profile page decides where to go
 * (onboarding the first time, otherwise `next`).
 */
export function GoogleSignInButton({ next }: { next: string | null }) {
  const t = useTranslations('account')
  const [state, setState] = useState<'idle' | 'pending' | 'failed'>('idle')

  async function signIn() {
    setState('pending')
    try {
      const { createAuthClient } = await import('better-auth/client')
      const callbackURL = `/profile?welcome=1${next ? `&next=${encodeURIComponent(next)}` : ''}`
      const { error } = await createAuthClient().signIn.social({
        provider: 'google',
        callbackURL,
        errorCallbackURL: '/account?signin=failed',
      })
      if (error) setState('failed')
    } catch {
      setState('failed')
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={signIn}
        disabled={state === 'pending'}
        aria-busy={state === 'pending' || undefined}
        className={buttonClasses({ variant: 'secondary', className: 'w-full sm:w-auto' })}
      >
        <GoogleMark />
        {state === 'pending' ? t('signingIn') : t('continueWithGoogle')}
      </button>
      {state === 'failed' && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {t('signInFailed')}
        </p>
      )}
    </div>
  )
}
