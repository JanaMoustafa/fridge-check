import { CheckCircle2, ScanLine, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { ProjectionChart } from '@/components/nutritionist/ProjectionChart'
import { EmptyState } from '@/components/ui/EmptyState'
import { buttonClasses } from '@/components/ui/button'
import { getDb } from '@/lib/db/client'
import { formatLongDate } from '@/lib/i18n/format-date'
import { fatMassOf, fatPercentOf, nextScanDue } from '@/lib/nutritionist/inbody'
import {
  bmiOf,
  changeBetween,
  HEALTHY_BMI,
  HEALTHY_PBF,
  HEALTHY_VFL_BELOW,
  levelOf,
  NORMAL_BAND,
  planMonthDate,
  projectSixMonths,
  standardsFor,
  type Level,
} from '@/lib/nutritionist/report'
import { listScans } from '@/lib/server/inbody'
import { deleteScanAction } from '../actions'
import { BackTo, card, proGate } from '@/components/pro/ProGate'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nutritionist.report')
  return { title: t('metaTitle'), robots: { index: false } }
}

/** The bars' scale, as % of the typical value for the member's height and sex. */
const AXIS = [40, 200] as const
const dateOf = (day: string) => new Date(`${day}T12:00:00Z`)
const one = (value: number) => Math.round(value * 10) / 10
const position = (percent: number) =>
  `${((Math.min(AXIS[1], Math.max(AXIS[0], percent)) - AXIS[0]) / (AXIS[1] - AXIS[0])) * 100}%`

/**
 * The member's report: where their body is now (against the ranges an InBody sheet prints), what
 * to expect over six months with monthly goals, and every scan so far with what changed.
 */
export default async function ReportPage({ searchParams }: PageProps<'/nutritionist/report'>) {
  const gate = await proGate('/nutritionist/report', 'nutritionist')
  if (!gate.ready) return gate.page
  const { user, profile } = gate
  const [t, tn, locale, query, scans] = await Promise.all([
    getTranslations('nutritionist.report'),
    getTranslations('nutritionist'),
    getLocale(),
    searchParams,
    listScans(getDb(), user.id),
  ])
  const latest = scans[0]
  if (!latest) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-4">
        <BackTo href="/nutritionist" label={tn('back')} />
        <h1 className="sr-only">{t('title')}</h1>
        <EmptyState
          icon={ScanLine}
          title={t('noScanTitle')}
          body={t('noScanBody')}
          action={{ href: '/nutritionist/scan', label: t('upload') }}
        />
      </div>
    )
  }

  const { values } = profile
  const date = (day: string) => formatLongDate(dateOf(day), locale)
  const kg = (value: number) => t('kg', { value: one(value) })
  const fatKg = fatMassOf(latest)
  const pbf = fatPercentOf(latest)
  const bmi = bmiOf(latest.weightKg, values.heightCm)
  const standard = standardsFor(values.heightCm, values.sex)
  const [pbfLow, pbfHigh] = HEALTHY_PBF[values.sex]

  const bars: { key: 'weight' | 'smm' | 'bfm'; value: number; standard: number }[] = [
    { key: 'weight', value: latest.weightKg, standard: standard.weightKg },
  ]
  if (latest.smmKg !== null)
    bars.push({ key: 'smm', value: latest.smmKg, standard: standard.smmKg })
  if (fatKg !== null) bars.push({ key: 'bfm', value: fatKg, standard: standard.bfmKg })

  const projection = projectSixMonths({
    weightKg: latest.weightKg,
    fatKg,
    muscleKg: latest.smmKg,
    goal: values.goal,
    sex: values.sex,
  })
  const end = projection.at(-1)!
  const chartPoints = projection.map((point) => ({
    weightKg: point.weightKg,
    lowKg: point.lowKg,
    highKg: point.highKg,
    label: point.month === 0 ? t('now') : t('monthShort', { month: point.month }),
    value: kg(point.weightKg),
    range: t('likelyRange', { low: one(point.lowKg), high: one(point.highKg) }),
  }))
  const levelText = (level: Level) => t(`levels.${level}`)
  const signed = (value: number | null, unit: 'kg' | 'percent') => {
    if (value === null) return ''
    const rounded = one(value)
    const text = `${rounded > 0 ? '+' : rounded < 0 ? '−' : '±'}${Math.abs(rounded).toFixed(1)}`
    return t(unit === 'kg' ? 'deltaKg' : 'deltaPoints', { value: text })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <BackTo href="/nutritionist" label={tn('back')} />
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold">{t('title')}</h1>
        <p className="text-fg-muted">{t('intro', { date: date(latest.scannedOn) })}</p>
      </header>

      {query.deleted === '1' && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-btn bg-have-soft px-4 py-3 text-sm font-semibold"
        >
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-have" />
          {t('deleted')}
        </p>
      )}

      <section aria-labelledby="case-title" className={`${card} space-y-4`}>
        <h2 id="case-title" className="text-lg font-extrabold">
          {t('caseTitle')}
        </h2>
        <ul className="list-disc space-y-2 ps-5">
          <li>
            {t('caseBmi', {
              weight: one(latest.weightKg),
              height: values.heightCm,
              bmi: one(bmi),
              low: HEALTHY_BMI[0],
              high: HEALTHY_BMI[1],
            })}
          </li>
          {pbf !== null && (
            <li>{t(`casePbf.${values.sex}`, { pbf: one(pbf), low: pbfLow, high: pbfHigh })}</li>
          )}
          {latest.smmKg !== null && (
            <li>
              {t('caseSmm', {
                smm: one(latest.smmKg),
                percent: Math.round((latest.smmKg / standard.smmKg) * 100),
              })}
            </li>
          )}
          {latest.vfl !== null && (
            <li>
              {t(latest.vfl < HEALTHY_VFL_BELOW ? 'caseVflOk' : 'caseVflHigh', {
                vfl: latest.vfl,
                below: HEALTHY_VFL_BELOW,
              })}
            </li>
          )}
          {latest.bmrKcal !== null && <li>{t('caseBmr', { bmr: latest.bmrKcal })}</li>}
        </ul>

        <div className="space-y-4 pt-2">
          <h3 className="font-extrabold">{t('barsTitle')}</h3>
          {bars.map((bar) => {
            const percent = (bar.value / bar.standard) * 100
            const band = NORMAL_BAND[bar.key]
            return (
              <div key={bar.key} className="space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                  <span className="font-semibold">{t(`bars.${bar.key}`)}</span>
                  <span className="tabular-nums">
                    <span className="font-extrabold">{kg(bar.value)}</span>{' '}
                    <span className="text-fg-muted">
                      · {levelText(levelOf(percent, band))} ·{' '}
                      {t('ofTypical', { percent: Math.round(percent) })}
                    </span>
                  </span>
                </div>
                <div className="relative h-3 rounded-full bg-bg shadow-[inset_0_0_0_1px_var(--color-line)]">
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0 bg-have-soft"
                    style={{
                      insetInlineStart: position(band[0]),
                      insetInlineEnd: `calc(100% - ${position(band[1])})`,
                    }}
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0.5 start-0.5 rounded-e-full bg-primary"
                    style={{ width: `calc(${position(percent)} - 2px)` }}
                  />
                </div>
              </div>
            )
          })}
          <p className="flex items-center gap-2 text-xs text-fg-muted">
            <span aria-hidden="true" className="inline-block h-3 w-5 rounded-sm bg-have-soft" />
            {t('normalBand')}
          </p>
        </div>
      </section>

      <section aria-labelledby="outcome-title" className={`${card} space-y-4`}>
        <h2 id="outcome-title" className="text-lg font-extrabold">
          {t('outcomeTitle')}
        </h2>
        <p>
          {t(`outcome.${values.goal}`, {
            weight: one(end.weightKg),
            low: one(end.lowKg),
            high: one(end.highKg),
          })}
          {pbf !== null && end.pbf !== null && (
            <> {t('outcomePbf', { from: one(pbf), to: one(end.pbf) })}</>
          )}
        </p>
        <ProjectionChart points={chartPoints} title={t('chartTitle')} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <caption className="pb-2 text-start font-extrabold">{t('goalsTitle')}</caption>
            <thead>
              <tr className="border-b border-line text-start text-fg-muted">
                <th scope="col" className="py-2 pe-3 text-start font-semibold">
                  {t('goalsMonth')}
                </th>
                <th scope="col" className="py-2 pe-3 text-start font-semibold">
                  {t('goalsWeight')}
                </th>
                {end.pbf !== null && (
                  <th scope="col" className="py-2 pe-3 text-start font-semibold">
                    {t('goalsPbf')}
                  </th>
                )}
                {end.muscleKg !== null && (
                  <th scope="col" className="py-2 text-start font-semibold">
                    {t('goalsMuscle')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {projection.slice(1).map((point) => (
                <tr key={point.month} className="border-b border-line last:border-0">
                  <th scope="row" className="py-2 pe-3 text-start font-semibold">
                    {t('goalsBy', {
                      month: point.month,
                      date: date(planMonthDate(latest.scannedOn, point.month)),
                    })}
                  </th>
                  <td className="py-2 pe-3">{kg(point.weightKg)}</td>
                  {point.pbf !== null && (
                    <td className="py-2 pe-3">{t('percent', { value: one(point.pbf) })}</td>
                  )}
                  {point.muscleKg !== null && <td className="py-2">{kg(point.muscleKg)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-fg-muted">{t('outcomeNote')}</p>
      </section>

      <section aria-labelledby="history-title" className={`${card} space-y-4`}>
        <h2 id="history-title" className="text-lg font-extrabold">
          {t('historyTitle')}
        </h2>
        <p className="text-sm text-fg-muted">
          {t('nextDue', { date: date(nextScanDue(latest.scannedOn)) })}
        </p>
        <ol className="space-y-3">
          {scans.map((scan, index) => {
            const previous = scans[index + 1]
            const change = previous ? changeBetween(previous, scan) : null
            const scanPbf = fatPercentOf(scan)
            return (
              <li key={scan.id} className="rounded-btn bg-bg p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-extrabold">{date(scan.scannedOn)}</h3>
                  <form action={deleteScanAction}>
                    <input type="hidden" name="id" value={scan.id} />
                    <button
                      type="submit"
                      aria-label={t('delete', { date: date(scan.scannedOn) })}
                      className={buttonClasses({ variant: 'ghost', size: 'icon' })}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </button>
                  </form>
                </div>
                <dl className="mt-2 grid grid-cols-3 gap-2 text-sm tabular-nums">
                  <div>
                    <dt className="text-xs font-semibold text-fg-muted">{t('bars.weight')}</dt>
                    <dd className="font-bold">{kg(scan.weightKg)}</dd>
                    {change && <dd className="text-xs">{signed(change.weightKg, 'kg')}</dd>}
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-fg-muted">{t('bars.smm')}</dt>
                    <dd className="font-bold">{scan.smmKg === null ? '–' : kg(scan.smmKg)}</dd>
                    {change && <dd className="text-xs">{signed(change.smmKg, 'kg')}</dd>}
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-fg-muted">{t('goalsPbf')}</dt>
                    <dd className="font-bold">
                      {scanPbf === null ? '–' : t('percent', { value: one(scanPbf) })}
                    </dd>
                    {change && <dd className="text-xs">{signed(change.pbf, 'percent')}</dd>}
                  </div>
                </dl>
              </li>
            )
          })}
        </ol>
      </section>

      <p className="text-xs text-fg-muted">{t('disclaimer')}</p>
    </div>
  )
}
