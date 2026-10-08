'use client'

import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActionState, useId, useState } from 'react'
import { saveProfileAction, type ProfileFormState } from '@/app/profile/actions'
import { buttonClasses } from '@/components/ui/button'
import { ACTIVITY_LEVELS, GOALS, SEXES } from '@/lib/nutrition/calculator'
import { DEFAULT_MEAL_SPLIT, MEALS } from '@/lib/nutrition/portions'
import type { ProfileError, ProfileField, ProfileValues } from '@/lib/nutrition/profile'

/** Which message explains an error code for a field. */
function errorKey(field: ProfileField, error: ProfileError) {
  if (error === 'required') {
    return ['sex', 'activityLevel', 'goal'].includes(field) ? 'choose' : 'required'
  }
  if (error === 'range') {
    return field === 'weightKg'
      ? 'weightRange'
      : field === 'heightCm'
        ? 'heightRange'
        : 'birthYearRange'
  }
  return error
}

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-danger">
      <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
      {message}
    </p>
  )
}

const inputClasses =
  'min-h-11 w-full rounded-btn border border-line-strong bg-surface px-3 text-base tabular-nums outline-none transition-colors focus-visible:border-primary aria-[invalid=true]:border-danger'

const cardClasses =
  'flex min-h-11 cursor-pointer flex-col justify-center rounded-btn border border-line-strong bg-surface px-3 py-2 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary'

interface ProfileFormProps {
  initial: ProfileValues | null
  next: string | null
}

/**
 * The nutrition profile: body measures, sex, activity, goal, meal split and consent. Native inputs,
 * so it submits without JavaScript too; errors come back per field from the server.
 */
export function ProfileForm({ initial, next }: ProfileFormProps) {
  const t = useTranslations('profile')
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(saveProfileAction, {})
  const ids = useId()
  const errors = state.errors ?? {}
  const message = (field: ProfileField) => {
    const error = errors[field]
    return error ? t(`errors.${errorKey(field, error)}`) : undefined
  }
  const value = (name: string, fallback: string | number | undefined) =>
    state.values?.[name] ?? (fallback === undefined ? '' : String(fallback))
  const split = initial?.mealSplit ?? DEFAULT_MEAL_SPLIT
  const [shares, setShares] = useState<Record<string, string>>(() =>
    Object.fromEntries(MEALS.map((meal) => [meal, value(meal, split[meal])])),
  )
  const total = MEALS.reduce((sum, meal) => sum + (Number(shares[meal]) || 0), 0)
  const describedBy = (field: ProfileField, hint?: string) =>
    [hint, errors[field] ? `${ids}-${field}-error` : undefined].filter(Boolean).join(' ') ||
    undefined

  const numberField = (
    field: 'weightKg' | 'heightCm' | 'birthYear',
    label: string,
    unit: string | null,
    fallback: number | undefined,
    hint?: string,
  ) => (
    <div>
      <label htmlFor={`${ids}-${field}`} className="text-sm font-semibold">
        {label}
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          id={`${ids}-${field}`}
          name={field}
          inputMode={field === 'birthYear' ? 'numeric' : 'decimal'}
          autoComplete="off"
          defaultValue={value(field, fallback)}
          aria-invalid={errors[field] ? true : undefined}
          aria-describedby={describedBy(field, hint ? `${ids}-${field}-hint` : undefined)}
          className={inputClasses}
        />
        {unit && <span className="shrink-0 text-sm font-semibold text-fg-muted">{unit}</span>}
      </div>
      {hint && (
        <p id={`${ids}-${field}-hint`} className="mt-1.5 text-sm text-fg-muted">
          {hint}
        </p>
      )}
      <FieldError id={`${ids}-${field}-error`} message={message(field)} />
    </div>
  )

  const choices = <K extends 'sex' | 'activityLevel' | 'goal'>(
    field: K,
    legend: string,
    options: readonly string[],
    label: (option: string) => string,
    hint?: (option: string) => string,
    hintText?: string,
  ) => (
    <fieldset aria-describedby={describedBy(field, hintText ? `${ids}-${field}-hint` : undefined)}>
      <legend className="text-sm font-semibold">{legend}</legend>
      {hintText && (
        <p id={`${ids}-${field}-hint`} className="mt-1 text-sm text-fg-muted">
          {hintText}
        </p>
      )}
      <div className={`mt-2 grid gap-2 ${options.length === 2 ? 'grid-cols-2' : 'sm:grid-cols-2'}`}>
        {options.map((option) => (
          <label key={option} className={cardClasses}>
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name={field}
                value={option}
                defaultChecked={value(field, initial?.[field]) === option}
                className="size-4 accent-[var(--color-primary)]"
              />
              <span className="font-semibold">{label(option)}</span>
            </span>
            {hint && <span className="ms-6 text-sm text-fg-muted">{hint(option)}</span>}
          </label>
        ))}
      </div>
      <FieldError id={`${ids}-${field}-error`} message={message(field)} />
    </fieldset>
  )

  const hasErrors = Object.keys(errors).length > 0
  return (
    <form action={action} noValidate className="space-y-8">
      {next && <input type="hidden" name="next" value={next} />}
      {(hasErrors || state.failed) && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-btn bg-danger/10 px-4 py-3 text-sm font-semibold text-danger"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {state.failed ? t('saveFailed') : t('errorSummary')}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        {numberField('weightKg', t('weight'), t('kg'), initial?.weightKg)}
        {numberField('heightCm', t('height'), t('cm'), initial?.heightCm)}
        {numberField('birthYear', t('birthYear'), null, initial?.birthYear, t('birthYearHint'))}
      </div>

      {choices(
        'sex',
        t('sex'),
        SEXES,
        (o) => t(`sexes.${o as (typeof SEXES)[number]}`),
        undefined,
        t('sexHint'),
      )}
      {choices(
        'activityLevel',
        t('activity'),
        ACTIVITY_LEVELS,
        (o) => t(`activityLevels.${o as (typeof ACTIVITY_LEVELS)[number]}.label`),
        (o) => t(`activityLevels.${o as (typeof ACTIVITY_LEVELS)[number]}.hint`),
      )}
      {choices(
        'goal',
        t('goal'),
        GOALS,
        (o) => t(`goals.${o as (typeof GOALS)[number]}.label`),
        (o) => t(`goals.${o as (typeof GOALS)[number]}.hint`),
      )}

      <fieldset aria-describedby={describedBy('mealSplit', `${ids}-split-hint`)}>
        <legend className="text-sm font-semibold">{t('mealSplit')}</legend>
        <p id={`${ids}-split-hint`} className="mt-1 text-sm text-fg-muted">
          {t('mealSplitHint')}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MEALS.map((meal) => (
            <div key={meal}>
              <label htmlFor={`${ids}-${meal}`} className="text-sm text-fg-muted">
                {t(`meals.${meal}`)}
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id={`${ids}-${meal}`}
                  name={meal}
                  inputMode="numeric"
                  value={shares[meal]}
                  onChange={(event) =>
                    setShares((current) => ({ ...current, [meal]: event.target.value }))
                  }
                  aria-invalid={errors.mealSplit ? true : undefined}
                  className={inputClasses}
                />
                <span className="text-sm font-semibold text-fg-muted">%</span>
              </div>
            </div>
          ))}
        </div>
        <p
          aria-live="polite"
          className={`mt-2 text-sm font-semibold ${total === 100 ? 'text-fg-muted' : 'text-danger'}`}
        >
          {t('mealSplitTotal', { total })}
        </p>
        <FieldError id={`${ids}-mealSplit-error`} message={message('mealSplit')} />
      </fieldset>

      <div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="consent"
            defaultChecked={state.values ? state.values.consent === 'on' : initial !== null}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? `${ids}-consent-error` : undefined}
            className="mt-1 size-5 shrink-0 accent-[var(--color-primary)]"
          />
          <span className="text-sm">{t('consent')}</span>
        </label>
        <FieldError id={`${ids}-consent-error`} message={message('consent')} />
      </div>

      <div className="space-y-3">
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending || undefined}
          className={buttonClasses()}
        >
          {pending ? t('saving') : t('save')}
        </button>
        <p className="text-sm text-fg-muted">{t('disclaimer')}</p>
      </div>
    </form>
  )
}
