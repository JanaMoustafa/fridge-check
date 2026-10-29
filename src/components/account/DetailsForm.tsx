'use client'

import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActionState, useId } from 'react'
import { saveDetailsAction, type DetailsFormState } from '@/app/(app)/account/actions'
import { buttonClasses } from '@/components/ui/button'
import type { MemberDetails } from '@/lib/account/details'

const inputClasses =
  'min-h-11 w-full rounded-btn border border-line-strong bg-bg px-3 text-base outline-none transition-colors focus-visible:border-primary aria-[invalid=true]:border-danger'

/** Full name and phone. Native inputs, so it submits without JavaScript; errors come back per field. */
export function DetailsForm({ initial }: { initial: MemberDetails }) {
  const t = useTranslations('account')
  const [state, action, pending] = useActionState<DetailsFormState, FormData>(saveDetailsAction, {})
  const ids = useId()
  const errors = state.errors ?? {}
  const values = state.values ?? { name: initial.name, phone: initial.phone ?? '' }
  return (
    <form action={action} noValidate className="space-y-4">
      <div>
        <label htmlFor={`${ids}-name`} className="mb-1.5 block text-sm font-semibold">
          {t('detailsName')}
        </label>
        <input
          id={`${ids}-name`}
          name="name"
          autoComplete="name"
          required
          defaultValue={values.name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? `${ids}-name-error` : undefined}
          className={inputClasses}
        />
        {errors.name && (
          <p
            id={`${ids}-name-error`}
            className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-danger"
          >
            <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
            {t(`detailsErrors.name.${errors.name}`)}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${ids}-phone`} className="mb-1.5 block text-sm font-semibold">
          {t('detailsPhone')}
        </label>
        <input
          id={`${ids}-phone`}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          defaultValue={values.phone}
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={`${ids}-phone-hint${errors.phone ? ` ${ids}-phone-error` : ''}`}
          className={`${inputClasses} text-start tabular-nums`}
        />
        <p id={`${ids}-phone-hint`} className="mt-1.5 text-sm text-fg-muted">
          {t('detailsPhoneHint')}
        </p>
        {errors.phone && (
          <p
            id={`${ids}-phone-error`}
            className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-danger"
          >
            <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
            {t(`detailsErrors.phone.${errors.phone}`)}
          </p>
        )}
      </div>
      {state.failed && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {t('detailsFailed')}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
        className={buttonClasses({ variant: 'secondary' })}
      >
        {pending ? t('detailsSaving') : t('detailsSave')}
      </button>
    </form>
  )
}
