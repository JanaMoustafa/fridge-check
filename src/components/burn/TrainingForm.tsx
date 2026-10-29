'use client'

import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActionState, useId } from 'react'
import { saveTrainingAction, type TrainingFormState } from '@/app/(app)/burn/actions'
import { buttonClasses } from '@/components/ui/button'
import { STYLES } from '@/lib/burn/types'

const cardClasses =
  'flex min-h-11 cursor-pointer gap-3 rounded-btn border border-line-strong bg-surface px-4 py-3 transition-colors has-[:checked]:border-accent has-[:checked]:bg-primary-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary'

interface TrainingFormProps {
  initial: { style: string; days: number[] } | null
  /** Weekday names, Sunday first, in the reader's language. */
  dayNames: string[]
  defaultDays: number[]
}

/** Style and training days. Native inputs, so it submits without JavaScript too. */
export function TrainingForm({ initial, dayNames, defaultDays }: TrainingFormProps) {
  const t = useTranslations('burn')
  const [state, action, pending] = useActionState<TrainingFormState, FormData>(
    saveTrainingAction,
    {},
  )
  const ids = useId()
  const errors = state.errors ?? {}
  const style = state.values?.style ?? initial?.style ?? null
  const days = state.values?.days ?? initial?.days ?? defaultDays

  const error = (key: 'style' | 'days') =>
    errors[key] && (
      <p
        id={`${ids}-${key}-error`}
        className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-danger"
      >
        <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
        {t(`setup.errors.${key}`)}
      </p>
    )

  return (
    <form action={action} noValidate className="space-y-8">
      {(errors.style || errors.days || state.failed) && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-btn bg-danger/10 px-4 py-3 text-sm font-semibold text-danger"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {t(state.failed ? 'setup.saveFailed' : 'setup.errorSummary')}
        </p>
      )}
      <fieldset aria-describedby={errors.style ? `${ids}-style-error` : undefined}>
        <legend className="text-sm font-semibold">{t('setup.styleLegend')}</legend>
        <div className="mt-2 grid gap-2">
          {STYLES.map((key) => (
            <label key={key} className={cardClasses}>
              <input
                type="radio"
                name="style"
                value={key}
                defaultChecked={style === key}
                className="mt-1 size-4 shrink-0 accent-[var(--color-accent)]"
              />
              <span>
                <span className="block font-extrabold">{t(`styles.${key}.name`)}</span>
                <span className="block text-sm text-fg-muted">{t(`styles.${key}.blurb`)}</span>
              </span>
            </label>
          ))}
        </div>
        {error('style')}
      </fieldset>
      <fieldset
        aria-describedby={[`${ids}-days-hint`, errors.days ? `${ids}-days-error` : '']
          .filter(Boolean)
          .join(' ')}
      >
        <legend className="text-sm font-semibold">{t('setup.daysLegend')}</legend>
        <p id={`${ids}-days-hint`} className="mt-1 text-sm text-fg-muted">
          {t('setup.daysHint')}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {dayNames.map((name, day) => (
            <label key={day} className={`${cardClasses} items-center`}>
              <input
                type="checkbox"
                name="day"
                value={day}
                defaultChecked={days.includes(day)}
                className="size-4 shrink-0 accent-[var(--color-accent)]"
              />
              <span className="font-semibold">{name}</span>
            </label>
          ))}
        </div>
        {error('days')}
      </fieldset>
      <button type="submit" disabled={pending} className={buttonClasses()}>
        {pending ? t('setup.saving') : t('setup.save')}
      </button>
    </form>
  )
}
