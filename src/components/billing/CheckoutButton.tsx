'use client'

import { CreditCard } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActionState } from 'react'
import { startCheckoutAction, type CheckoutState } from '@/app/pro/actions'
import { buttonClasses } from '@/components/ui/button'

/** Opens XPay's hosted checkout (a server action creates the session, then redirects). */
export function CheckoutButton({ label }: { label: string }) {
  const t = useTranslations('billing')
  const [state, action, pending] = useActionState<CheckoutState, FormData>(
    () => startCheckoutAction(),
    {},
  )
  return (
    <form action={action} className="space-y-3">
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
        className={buttonClasses()}
      >
        <CreditCard aria-hidden="true" className="size-4" />
        {pending ? t('redirecting') : label}
      </button>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {t(`errors.${state.error}`)}
        </p>
      )}
    </form>
  )
}
