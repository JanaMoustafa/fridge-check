'use client'

import { AlertCircle, Camera, CheckCircle2, LoaderCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActionState, useEffect, useId, useRef, useState } from 'react'
import { saveScanAction, type ScanFormState } from '@/app/(app)/nutritionist/actions'
import { buttonClasses } from '@/components/ui/button'
import { SCAN_FIELDS, SCAN_LIMITS, type ScanField } from '@/lib/nutritionist/inbody'
import type { Worker as OcrWorker } from 'tesseract.js'
import type { Extra } from '@/lib/nutritionist/inbody-extra'
import { parseInbodyText } from '@/lib/nutritionist/inbody-ocr'
import type { ReadFailure, ReadResponse } from '@/lib/server/inbody-read-request'

/** Long side of the photo given to the reader: printed numbers need the detail; ~3 s to read. */
const MAX_SIDE_PX = 3200
/** The on-device OCR's files, served by this site (public/ocr) so the photo never leaves the phone. */
const OCR = {
  workerPath: '/ocr/worker.min.js',
  corePath: '/ocr/tesseract-core-simd-lstm.wasm.js',
  langPath: '/ocr',
  gzip: true,
} as const
/** With fewer core numbers than this read on the device, the optional Claude reader has a go. */
const BACKUP_BELOW = 3
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
  | { state: 'preparing' }
  | { state: 'reading'; percent: number }
  | { state: 'read'; found: number; extras: number }
  | { state: 'failed'; error: ReadFailure | 'ocr_failed' }

/** A smaller JPEG of the photo; the original when the browser can't decode it (it may still read). */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d')
    if (context) {
      // Flat grey with a little more contrast reads better than a warm, shadowed phone photo.
      context.filter = 'grayscale(1) contrast(1.25)'
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    }
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92),
    )
    if (blob) return blob
  } catch {
    // Fall through to the original file.
  }
  return file
}

interface ScanFormProps {
  /** Whether the server's Claude reader may have a second go when the device read too little. */
  claudeBackup: boolean
  /** Today in Cairo, the latest date a scan can have. */
  today: string
}

/**
 * Adding an InBody result: a photo of the sheet is read on the device (Tesseract OCR, no upload)
 * into the fields for the member to check, or they type the numbers. Only what they save is
 * kept; the photo never is.
 */
export function ScanForm({ claudeBackup, today }: ScanFormProps) {
  const t = useTranslations('nutritionist.scan')
  const [state, action, pending] = useActionState<ScanFormState, FormData>(saveScanAction, {})
  const ids = useId()
  const [values, setValues] = useState<Record<string, string>>(() => ({
    scannedOn: today,
    ...state.values,
  }))
  const [source, setSource] = useState<'photo' | 'typed'>('typed')
  const [reading, setReading] = useState<Reading>({ state: 'idle' })
  /** The chosen photo, shown while it is read and afterwards, to check the numbers against. */
  const [preview, setPreview] = useState<string | null>(null)
  /** Fields the photo filled, in form order: they light up one after another. */
  const [landed, setLanded] = useState<string[]>([])
  /** The sheet's other numbers, saved with the scan for the report. */
  const [extra, setExtra] = useState<Extra>({})
  const ocr = useRef<Promise<OcrWorker> | null>(null)

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview])
  const errors = state.errors ?? {}

  function reader(): Promise<OcrWorker> {
    ocr.current ??= import('tesseract.js').then(({ createWorker }) =>
      createWorker('eng', 1, {
        ...OCR,
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setReading({ state: 'reading', percent: Math.round(m.progress * 100) })
          }
        },
      }),
    )
    return ocr.current
  }

  async function readPhoto(file: File) {
    setPreview(URL.createObjectURL(file))
    setLanded([])
    setReading({ state: 'preparing' })
    const photo = await shrink(file)
    if (!UPLOAD_TYPES.includes(photo.type)) {
      setReading({ state: 'failed', error: 'bad_type' })
      return
    }
    let read
    try {
      const worker = await reader()
      setReading({ state: 'reading', percent: 0 })
      const { data } = await worker.recognize(photo)
      read = parseInbodyText(data.text)
    } catch {
      setReading({ state: 'failed', error: 'ocr_failed' })
      return
    }
    const values: Record<string, string> = Object.fromEntries(
      Object.entries(read.values).filter(([, value]) => value),
    )
    let coreFound = Object.keys(values).filter((field) => field !== 'scannedOn').length
    // Too little read on the device: the server's Claude reader may do better (when it is set up).
    if (claudeBackup && coreFound < BACKUP_BELOW) {
      try {
        const form = new FormData()
        form.set('photo', photo, 'inbody.jpg')
        const response = await fetch('/api/inbody/read', { method: 'POST', body: form })
        const body = (await response.json()) as ReadResponse
        if (body.ok) {
          for (const [field, value] of Object.entries(body.values)) {
            if (value && !values[field]) values[field] = value
          }
          coreFound = Object.keys(values).filter((field) => field !== 'scannedOn').length
        }
      } catch {
        // The device's read stands.
      }
    }
    if (coreFound === 0) {
      setReading({ state: 'failed', error: read.isInBody ? 'unreadable' : 'not_inbody' })
      return
    }
    setValues((current) => ({ ...current, ...values }))
    setExtra(read.extra)
    setLanded((['scannedOn', ...SCAN_FIELDS] as const).filter((field) => values[field]))
    setSource('photo')
    setReading({ state: 'read', found: coreFound, extras: Object.keys(read.extra).length })
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
    'field-land min-h-11 w-full rounded-btn border border-line-strong bg-surface px-3 text-base tabular-nums outline-none transition-colors focus-visible:border-primary aria-[invalid=true]:border-danger'

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
      {
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
            {reading.state === 'reading' || reading.state === 'preparing' ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Camera aria-hidden="true" className="size-4" />
            )}
            {reading.state === 'preparing'
              ? t('ocrPreparing')
              : reading.state === 'reading'
                ? t('ocrReading', { percent: reading.percent })
                : t('choosePhoto')}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={reading.state === 'reading' || reading.state === 'preparing'}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) void readPhoto(file)
              }}
            />
          </label>
          {preview && (
            <div
              data-reading={
                reading.state === 'reading' || reading.state === 'preparing' || undefined
              }
              className="scan-preview relative max-w-xs overflow-hidden rounded-btn bg-surface-2"
            >
              {/* A local preview of the member's own photo: next/image adds nothing here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt={t('previewAlt')} className="max-h-64 w-full object-contain" />
              <span aria-hidden="true" className="scan-preview-band" />
            </div>
          )}
          <div aria-live="polite">
            {reading.state === 'read' && (
              <p className="flex items-start gap-2 rounded-btn bg-have-soft px-4 py-3 text-sm font-semibold">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-have" />
                {t('readDone', { found: reading.found })}
                {reading.extras > 0 && <> {t('extrasRead', { count: reading.extras })}</>}
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
      }

      <form action={action} noValidate className="space-y-5">
        <input type="hidden" name="source" value={source} />
        <input type="hidden" name="extra" value={JSON.stringify(extra)} />
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold">{t('numbersTitle')}</h2>
          <p className="text-sm text-fg-muted">{t('numbersBody')}</p>
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
              data-landed={landed.includes('scannedOn') || undefined}
              style={{ '--n': landed.indexOf('scannedOn') } as React.CSSProperties}
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
                  data-landed={landed.includes(name) || undefined}
                  style={{ '--n': landed.indexOf(name) } as React.CSSProperties}
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
