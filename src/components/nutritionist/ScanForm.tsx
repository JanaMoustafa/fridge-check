'use client'

import { AlertCircle, Calculator, Camera, CheckCircle2, LoaderCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActionState, useEffect, useId, useRef, useState } from 'react'
import { saveScanAction, type ScanFormState } from '@/app/(app)/nutritionist/actions'
import { buttonClasses } from '@/components/ui/button'
import { readNumber } from '@/lib/nutrition/profile'
import { SCAN_FIELDS, SCAN_LIMITS, type ScanField } from '@/lib/nutritionist/inbody'
import type { Worker as OcrWorker } from 'tesseract.js'
import { EXTRA_FIELDS, type Extra, type ExtraField } from '@/lib/nutritionist/inbody-extra'
import type { OcrWord } from '@/lib/nutritionist/inbody-sheet'
import type { GrayImage } from '@/lib/nutritionist/ocr-image'
import type { OcrEngine, ReadStep } from '@/lib/nutritionist/ocr-run'
import type { ReadFailure, ReadResponse } from '@/lib/server/inbody-read-request'

/** Long side the photo is decoded at: a 12 MP phone photo at full detail (about 50 MB of pixels). */
const MAX_SIDE_PX = 4096
/** Long side of the copy sent to the optional server reader. */
const UPLOAD_SIDE_PX = 2000
/** The on-device OCR's files, served by this site (public/ocr) so the photo never leaves the phone. */
const OCR = {
  workerPath: '/ocr/worker.min.js',
  corePath: '/ocr/tesseract-core-simd-lstm.wasm.js',
  langPath: '/ocr',
  gzip: true,
} as const
/** With fewer core numbers than this read on the device, the optional Claude reader has a go. */
const BACKUP_BELOW = 3

type Unit = 'kg' | 'percent' | 'kcal' | 'litre' | 'cm' | 'cm2' | 'degree' | 'years'

const UNITS: Record<ScanField, Unit | null> = {
  weightKg: 'kg',
  smmKg: 'kg',
  bfmKg: 'kg',
  pbf: 'percent',
  bmrKcal: 'kcal',
  vfl: null,
  tbwL: 'litre',
}

/** The rest of the sheet, in the order an InBody sheet prints it. */
export const EXTRA_GROUPS: ReadonlyArray<{
  key: 'composition' | 'measures' | 'targets' | 'lean' | 'fat'
  fields: ReadonlyArray<[ExtraField, Unit | null]>
}> = [
  {
    key: 'composition',
    fields: [
      ['proteinKg', 'kg'],
      ['mineralsKg', 'kg'],
      ['slmKg', 'kg'],
      ['ffmKg', 'kg'],
      ['icwL', 'litre'],
      ['ecwL', 'litre'],
      ['ecwRatio', null],
      ['bcmKg', 'kg'],
      ['bmcKg', 'kg'],
    ],
  },
  {
    key: 'measures',
    fields: [
      ['heightCm', 'cm'],
      ['age', 'years'],
      ['bmi', null],
      ['whr', null],
      ['vfaCm2', 'cm2'],
      ['obesityDegree', 'percent'],
      ['smi', null],
      ['phaseAngle', 'degree'],
    ],
  },
  {
    key: 'targets',
    fields: [
      ['inbodyScore', null],
      ['recommendedKcal', 'kcal'],
      ['targetWeightKg', 'kg'],
      ['weightControlKg', 'kg'],
      ['fatControlKg', 'kg'],
      ['muscleControlKg', 'kg'],
    ],
  },
  {
    key: 'lean',
    fields: [
      ['leanRightArmKg', 'kg'],
      ['leanRightArmPct', 'percent'],
      ['leanLeftArmKg', 'kg'],
      ['leanLeftArmPct', 'percent'],
      ['leanTrunkKg', 'kg'],
      ['leanTrunkPct', 'percent'],
      ['leanRightLegKg', 'kg'],
      ['leanRightLegPct', 'percent'],
      ['leanLeftLegKg', 'kg'],
      ['leanLeftLegPct', 'percent'],
    ],
  },
  {
    key: 'fat',
    fields: [
      ['fatRightArmKg', 'kg'],
      ['fatRightArmPct', 'percent'],
      ['fatLeftArmKg', 'kg'],
      ['fatLeftArmPct', 'percent'],
      ['fatTrunkKg', 'kg'],
      ['fatTrunkPct', 'percent'],
      ['fatRightLegKg', 'kg'],
      ['fatRightLegPct', 'percent'],
      ['fatLeftLegKg', 'kg'],
      ['fatLeftLegPct', 'percent'],
    ],
  },
]

type Reading =
  | { state: 'idle' }
  | { state: 'preparing' }
  | { state: 'busy'; step: ReadStep; pass: number; percent: number }
  | { state: 'read'; found: number; calculated: number }
  | { state: 'failed'; error: ReadFailure | 'ocr_failed' }

/** The photo's pixels, at most MAX_SIDE_PX on the long side (EXIF rotation applied). */
async function pixelsOf(file: File): Promise<ImageData> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const context = canvas.getContext('2d', { willReadFrequently: true })!
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return context.getImageData(0, 0, canvas.width, canvas.height)
}

/** A smaller JPEG of the photo for the server reader; the original when it can't be decoded. */
async function uploadCopy(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, UPLOAD_SIDE_PX / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.9),
    )
    if (blob) return blob
  } catch {
    // Fall through to the original file.
  }
  return file
}

/** A grey image as a canvas, the form Tesseract.js takes in the browser. */
function toCanvas(image: GrayImage): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d')!
  const rgba = context.createImageData(image.width, image.height)
  for (let i = 0, j = 0; i < image.data.length; i++, j += 4) {
    const v = image.data[i]!
    rgba.data[j] = v
    rgba.data[j + 1] = v
    rgba.data[j + 2] = v
    rgba.data[j + 3] = 255
  }
  context.putImageData(rgba, 0, 0)
  return canvas
}

/** Tesseract.js as the reader's engine: page mode 11 (scattered words) or 3 (layout). */
function tesseractEngine(worker: OcrWorker): OcrEngine {
  return {
    async read(image, mode, digitsOnly = false) {
      await worker.setParameters({
        tessedit_pageseg_mode: (mode === 'sparse' ? '11' : '3') as never,
        preserve_interword_spaces: '1',
        user_defined_dpi: '300',
        tessedit_char_whitelist: digitsOnly ? '0123456789.,-+%()~/kgL°' : '',
      })
      const { data } = await worker.recognize(toCanvas(image), {}, { blocks: true })
      const words: OcrWord[] = []
      for (const block of data.blocks ?? []) {
        for (const paragraph of block.paragraphs) {
          for (const line of paragraph.lines) {
            for (const word of line.words) {
              words.push({ text: word.text, confidence: word.confidence, ...word.bbox })
            }
          }
        }
      }
      return words
    },
  }
}

const formValue = (value: number) => String(Math.round(value * 1000) / 1000)

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
  const tx = useTranslations('nutritionist.extras')
  const [state, action, pending] = useActionState<ScanFormState, FormData>(saveScanAction, {})
  const ids = useId()
  const [values, setValues] = useState<Record<string, string>>(() => ({
    scannedOn: today,
    ...state.values,
  }))
  const [extraValues, setExtraValues] = useState<Partial<Record<ExtraField, string>>>({})
  const [source, setSource] = useState<'photo' | 'typed'>('typed')
  const [reading, setReading] = useState<Reading>({ state: 'idle' })
  /** The chosen photo, shown while it is read and afterwards, to check the numbers against. */
  const [preview, setPreview] = useState<string | null>(null)
  /** Fields the photo filled, in form order: they light up one after another. */
  const [landed, setLanded] = useState<string[]>([])
  /** Figures the reader worked out from the others rather than read. */
  const [calculated, setCalculated] = useState<string[]>([])
  const [moreOpen, setMoreOpen] = useState(false)
  const ocr = useRef<Promise<OcrWorker> | null>(null)
  /** Which part of the reading Tesseract's progress belongs to. */
  const phase = useRef<{ step: ReadStep; pass: number }>({ step: 'reading', pass: 1 })
  const numbersHeading = useRef<HTMLHeadingElement>(null)

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview])
  const errors = state.errors ?? {}

  function worker(): Promise<OcrWorker> {
    ocr.current ??= import('tesseract.js').then(({ createWorker }) =>
      createWorker('eng', 1, {
        ...OCR,
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text' && phase.current.step === 'reading') {
            setReading({
              state: 'busy',
              step: 'reading',
              pass: phase.current.pass,
              percent: Math.round(m.progress * 100),
            })
          }
        },
      }),
    )
    return ocr.current
  }

  async function readPhoto(file: File) {
    setPreview(URL.createObjectURL(file))
    setLanded([])
    setCalculated([])
    setReading({ state: 'preparing' })
    let sheet
    try {
      const [{ readSheetPhoto }, tesseract, pixels] = await Promise.all([
        import('@/lib/nutritionist/ocr-run'),
        worker(),
        pixelsOf(file),
      ])
      const engine = tesseractEngine(tesseract)
      // The first page pass is the sparse one, then the layout one, then the closer looks.
      let passes = 0
      const counting: OcrEngine = {
        read(image, mode, digitsOnly) {
          if (!digitsOnly) phase.current = { step: 'reading', pass: ++passes }
          return engine.read(image, mode, digitsOnly)
        },
      }
      sheet = await readSheetPhoto(pixels.data, pixels.width, pixels.height, counting, (step) => {
        phase.current = { step, pass: Math.max(1, passes) }
        setReading({ state: 'busy', step, pass: Math.max(1, passes), percent: 0 })
        // Let the progress paint before the next stretch of work.
        return new Promise((resolve) => setTimeout(resolve, 0))
      })
    } catch {
      setReading({ state: 'failed', error: 'ocr_failed' })
      return
    }

    const core: Record<string, string> = {}
    for (const field of SCAN_FIELDS) {
      const value = sheet.values[field]
      if (value !== undefined) core[field] = formValue(value)
    }
    if (sheet.scannedOn && sheet.scannedOn <= today) core.scannedOn = sheet.scannedOn
    const extra: Partial<Record<ExtraField, string>> = {}
    for (const field of Object.keys(EXTRA_FIELDS) as ExtraField[]) {
      const value = sheet.values[field]
      if (value !== undefined) extra[field] = formValue(value)
    }

    let coreFound = SCAN_FIELDS.filter((field) => core[field]).length
    // Too little read on the device: the server's Claude reader may do better (when it is set up).
    if (claudeBackup && coreFound < BACKUP_BELOW) {
      try {
        const form = new FormData()
        form.set('photo', await uploadCopy(file), 'inbody.jpg')
        const response = await fetch('/api/inbody/read', { method: 'POST', body: form })
        const body = (await response.json()) as ReadResponse
        if (body.ok) {
          for (const [field, value] of Object.entries(body.values)) {
            if (value && !core[field]) core[field] = value
          }
          coreFound = SCAN_FIELDS.filter((field) => core[field]).length
        }
      } catch {
        // The device's read stands.
      }
    }
    if (coreFound === 0) {
      setReading({ state: 'failed', error: sheet.isInBody ? 'unreadable' : 'not_inbody' })
      return
    }
    setValues((current) => ({ ...current, ...core }))
    setExtraValues(extra)
    const order = [
      'scannedOn',
      ...SCAN_FIELDS,
      ...EXTRA_GROUPS.flatMap((g) => g.fields.map(([f]) => f)),
    ]
    setLanded(order.filter((field) => core[field] || extra[field as ExtraField]))
    setCalculated(sheet.calculated)
    setSource('photo')
    setMoreOpen(Object.keys(extra).length > 0)
    const found =
      Object.keys(core).filter((f) => f !== 'scannedOn').length + Object.keys(extra).length
    setReading({ state: 'read', found, calculated: sheet.calculated.length })
    // Bring the filled fields into view as they light up.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    numbersHeading.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  /** The extras as the server takes them: numbers only, unreadable ones left out. */
  const extraJson = (): string => {
    const out: Extra = {}
    for (const [field, raw] of Object.entries(extraValues) as Array<[ExtraField, string]>) {
      const value = readNumber(raw.trim())
      if (value !== undefined && Number.isFinite(value)) out[field] = value
    }
    return JSON.stringify(out)
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

  const unitLabel = (unit: Unit | null) =>
    unit && (
      <span className="w-10 shrink-0 text-sm font-semibold text-fg-muted">
        {t(`units.${unit}`)}
      </span>
    )

  const workedOut = (name: string) =>
    calculated.includes(name) && (
      <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-accent">
        <Calculator aria-hidden="true" className="size-3.5 shrink-0" />
        {t('workedOut')}
      </p>
    )

  const field = (name: ScanField | 'scannedOn', input: React.ReactNode, unit: Unit | null) => (
    <div>
      <label htmlFor={`${ids}-${name}`} className="text-sm font-semibold">
        {t(`fields.${name}`)}
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        {input}
        {unitLabel(unit)}
      </div>
      {workedOut(name)}
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

  const busy = reading.state === 'preparing' || reading.state === 'busy'
  const progress = (() => {
    if (reading.state === 'preparing') return t('ocrPreparing')
    if (reading.state !== 'busy') return t('choosePhoto')
    if (reading.step === 'straightening') return t('ocrStraightening')
    if (reading.step === 'checking') return t('ocrChecking')
    return t('ocrReadingPass', { pass: reading.pass, percent: reading.percent })
  })()
  const percent =
    reading.state === 'busy'
      ? reading.step === 'straightening'
        ? 5
        : reading.step === 'checking'
          ? 92
          : 10 + (reading.pass - 1) * 40 + reading.percent * 0.4
      : undefined

  const hasErrors = Object.keys(errors).length > 0
  return (
    <div className="space-y-6">
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
          {busy ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Camera aria-hidden="true" className="size-4" />
          )}
          {progress}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) void readPhoto(file)
            }}
          />
        </label>
        {preview && (
          <div
            data-reading={busy || undefined}
            className="scan-preview relative max-w-xs overflow-hidden rounded-btn bg-surface-2"
          >
            {/* A local preview of the member's own photo: next/image adds nothing here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={t('previewAlt')} className="max-h-64 w-full object-contain" />
            <span aria-hidden="true" className="scan-preview-band" />
            {/* The reader's own progress; indeterminate while its files download the first time. */}
            {busy && (
              <div
                role="progressbar"
                aria-label={t('ocrProgress')}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent === undefined ? undefined : Math.round(percent)}
                data-indeterminate={reading.state === 'preparing' || undefined}
                className="scan-progress absolute inset-x-0 bottom-0 h-1.5 bg-bg/60"
                style={{ '--p': (percent ?? 0) / 100 } as React.CSSProperties}
              >
                <span className="scan-progress-fill block h-full bg-accent" />
              </div>
            )}
          </div>
        )}
        <div aria-live="polite">
          {reading.state === 'read' && (
            <div className="space-y-1 rounded-btn bg-have-soft px-4 py-3 text-sm font-semibold">
              <p className="flex items-start gap-2">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-have" />
                {t('readDone', { found: reading.found })}
              </p>
              {reading.calculated > 0 && (
                <p className="ps-6 text-xs font-normal">
                  {t('calculatedRead', { count: reading.calculated })}
                </p>
              )}
            </div>
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

      <form action={action} noValidate className="space-y-5">
        <input type="hidden" name="source" value={source} />
        <input type="hidden" name="extra" value={extraJson()} />
        <div className="space-y-1">
          <h2 ref={numbersHeading} className="scroll-mt-24 text-lg font-extrabold">
            {t('numbersTitle')}
          </h2>
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

        <details
          open={moreOpen}
          onToggle={(event) => setMoreOpen(event.currentTarget.open)}
          className="smooth-details rounded-card bg-surface p-5"
        >
          <summary className="cursor-pointer text-base font-extrabold">{t('moreTitle')}</summary>
          <p className="mt-1 text-sm text-fg-muted">{t('moreBody')}</p>
          <div className="mt-4 space-y-6">
            {EXTRA_GROUPS.map((group) => (
              <fieldset key={group.key} className="space-y-3">
                <legend className="text-sm font-extrabold text-heading">
                  {t(`groups.${group.key}`)}
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  {group.fields.map(([name, unit]) => (
                    <div key={name}>
                      <label htmlFor={`${ids}-${name}`} className="text-sm font-semibold">
                        {tx(name)}
                      </label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          id={`${ids}-${name}`}
                          inputMode="decimal"
                          autoComplete="off"
                          value={extraValues[name] ?? ''}
                          onChange={(event) =>
                            setExtraValues((current) => ({
                              ...current,
                              [name]: event.target.value,
                            }))
                          }
                          data-landed={landed.includes(name) || undefined}
                          style={{ '--n': landed.indexOf(name) } as React.CSSProperties}
                          className={inputClasses}
                        />
                        {unitLabel(unit)}
                      </div>
                      {workedOut(name)}
                    </div>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </details>

        <p className="text-sm text-fg-muted">{t('optionalNote')}</p>
        <button type="submit" disabled={pending} className={buttonClasses()}>
          {pending ? t('saving') : t('save')}
        </button>
      </form>
    </div>
  )
}
