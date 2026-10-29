'use client'

import { AlertCircle, Camera, CheckCircle2, LoaderCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActionState, useId, useState } from 'react'
import { saveScanAction, type ScanFormState } from '@/app/nutritionist/actions'
import { buttonClasses } from '@/components/ui/button'
import { SCAN_FIELDS, SCAN_LIMITS, type ScanField } from '@/lib/nutritionist/inbody'
import type { ReadFailure, ReadResponse } from '@/lib/server/inbody-read-request'

/** Long side of the photo sent for reading: plenty for printed numbers, small to upload. */
const MAX_SIDE_PX = 1600
const UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const UNITS: Record<ScanField, 'kg' | 'percent' | 'kcal' | 'litre' | null> = {
  weightKg: 'kg',
  smmKg: 'kg',
  bfmKg: 'kg',
  pbf: 'percent',
  bmrKcal: 'kcal',
  vfl: null,
  tbwL: 'litre',
}

type Reading =
  | { state: 'idle' }
  | { state: 'reading' }
  | { state: 'read'; found: number }
  | { state: 'failed'; error: ReadFailure }

/** A smaller JPEG of the photo; the original when the browser can't decode it (it may still read). */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85),
    )
    if (blob) return blob
  } catch {
    // Fall through to the original file.
  }
  return file
}

interface ScanFormProps {
  /** Whether photo reading is switched on (an Anthropic key is set on the server). */
  photoReading: boolean
  /** Today in Cairo, the latest date a scan can have. */
  today: string
}

/**
 * Adding an InBody result: a photo of the sheet is read into the fields for the member to check,
 * or they type the numbers. Only what they save is kept; the photo never is.
 */
export function ScanForm({ photoReading, today }: ScanFormProps) {
  const t = useTranslations('nutritionist.scan')
  const [state, action, pending] = useActionState<ScanFormState, FormData>(saveScanAction, {})
  const ids = useId()
  const [values, setValues] = useState<Record<string, string>>(() => ({
    scannedOn: today,
    ...state.values,
  }))
  const [source, setSource] = useState<'photo' | 'typed'>('typed')
  const [reading, setReading] = useState<Reading>({ state: 'idle' })
  const errors = state.errors ?? {}

  async function readPhoto(file: File) {
    setReading({ state: 'reading' })
    const photo = await shrink(file)
    if (!UPLOAD_TYPES.includes(photo.type)) {
      setReading({ state: 'failed', error: 'bad_type' })
      return
    }
    const form = new FormData()
    form.set('photo', photo, 'inbody.jpg')
    let body: ReadResponse
    try {
      const response = await fetch('/api/inbody/read', { method: 'POST', body: form })
      body = (await response.json()) as ReadResponse
    } catch {
      setReading({ state: 'failed', error: 'upstream' })
      return
    }
    if (!body.ok) {
      setReading({ state: 'failed', error: body.error })
      return
    }
    setValues((current) => {
      const next = { ...current }
      for (const [field, value] of Object.entries(body.values)) if (value) next[field] = value
      return next
    })
    setSource('photo')
    setReading({ state: 'read', found: body.found })
  }

  const errorMessage = (field: ScanField | 'scannedOn') => {
    const error = errors[field]
    if (!error) return undefined
    if (error === 'range' && field !== 'scannedOn') return t('errors.range', SCAN_LIMITS[field])
    return t(`errors.${error}`)
  }

  const set = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setValues((current) => ({ ...current, [field]: event.target.value }))

  const inputClasses =
    'min-h-11 w-full rounded-btn border border-line-strong bg-surface px-3 text-base tabular-nums outline-none transition-colors focus-visible:border-primary aria-[invalid=true]:border-danger'

  const field = (
    name: ScanField | 'scannedOn',
    input: React.ReactNode,
    unit: (typeof UNITS)[ScanField],
  ) => (
    <div>
      <label htmlFor={`${ids}-${name}`} className="text-sm font-semibold">
        {t(`fields.${name}`)}
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        {input}
        {unit && (
          <span className="w-9 shrink-0 text-sm font-semibold text-fg-muted">
            {t(`units.${unit}`)}
          </span>
        )}
      </div>
      {errorMessage(name) && (
        <p
          id={`${ids}-${name}-error`}
          className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-danger"
        >
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
          {errorMessage(name)}
        </p>
      )}
    </div>
  )

  const hasErrors = Object.keys(errors).length > 0
  return (
    <div className="space-y-6">
      {photoReading && (
        <section aria-labelledby={`${ids}-photo`} className="space-y-3 rounded-card bg-surface p-5">
          <h2 id={`${ids}-photo`} className="text-lg font-extrabold">
            {t('photoTitle')}
          </h2>
          <p className="text-sm text-fg-muted">{t('photoBody')}</p>
          <label
            className={buttonClasses({
              className:
                'cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary',
            })}
          >
            {reading.state === 'reading' ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Camera aria-hidden="true" className="size-4" />
            )}
            {reading.state === 'reading' ? t('reading') : t('choosePhoto')}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={reading.state === 'reading'}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) void readPhoto(file)
              }}
            />
          </label>
          <div aria-live="polite">
            {reading.state === 'read' && (
              <p className="flex items-start gap-2 rounded-btn bg-have-soft px-4 py-3 text-sm font-semibold">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-have" />
                {t('readDone', { found: reading.found })}
              </p>
            )}
            {reading.state === 'failed' && (
              <p className="flex items-start gap-2 rounded-btn bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
                <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {t(`readErrors.${reading.error}`)}
              </p>
            )}
          </div>
          <p className="text-xs text-fg-muted">{t('photoPrivacy')}</p>
        </section>
      )}

      <form action={action} noValidate className="space-y-5">
        <input type="hidden" name="source" value={source} />
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold">{t('numbersTitle')}</h2>
          <p className="text-sm text-fg-muted">
            {t(photoReading ? 'numbersBody' : 'numbersBodyTyped')}
          </p>
        </div>
        {(hasErrors || state.failed) && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-btn bg-danger/10 px-4 py-3 text-sm font-semibold text-danger"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {t(state.failed ? 'saveFailed' : 'errorSummary')}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {field(
            'scannedOn',
            <input
              id={`${ids}-scannedOn`}
              name="scannedOn"
              type="date"
              max={today}
              value={values.scannedOn ?? ''}
              onChange={set('scannedOn')}
              aria-invalid={errors.scannedOn ? true : undefined}
              aria-describedby={errors.scannedOn ? `${ids}-scannedOn-error` : undefined}
              className={inputClasses}
            />,
            null,
          )}
          {SCAN_FIELDS.map((name) => (
            <div key={name}>
              {field(
                name,
                <input
                  id={`${ids}-${name}`}
                  name={name}
                  inputMode={name === 'bmrKcal' || name === 'vfl' ? 'numeric' : 'decimal'}
                  autoComplete="off"
                  required={name === 'weightKg'}
                  value={values[name] ?? ''}
                  onChange={set(name)}
                  aria-invalid={errors[name] ? true : undefined}
                  aria-describedby={errors[name] ? `${ids}-${name}-error` : undefined}
                  className={inputClasses}
                />,
                UNITS[name],
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-fg-muted">{t('optionalNote')}</p>
        <button type="submit" disabled={pending} className={buttonClasses()}>
          {pending ? t('saving') : t('save')}
        </button>
      </form>
    </div>
  )
}
