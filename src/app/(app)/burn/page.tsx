import { Clock, Flame } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ExerciseCard } from '@/components/burn/ExerciseCard'
import { card, proGate } from '@/components/pro/ProGate'
import { SuccessTick } from '@/components/ui/SuccessTick'
import { EXERCISES } from '@/lib/burn/exercises'
import {
  areaExercises,
  nextTraining,
  weekdayOf,
  weekIndexOf,
  weekSchedule,
  workoutExercises,
  workoutMinutes,
} from '@/lib/burn/programme'
import { weekdayNames } from '@/lib/burn/text'
import { AREAS, type Area } from '@/lib/burn/types'
import { cx } from '@/lib/cx'
import { getDb } from '@/lib/db/client'
import { isLocale } from '@/lib/i18n/locale'
import { cairoDate } from '@/lib/nutritionist/inbody'
import { getTrainingChoice } from '@/lib/server/training'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('burn')
  return { title: t('metaTitle'), robots: { index: false } }
}

const isArea = (value: unknown): value is Area =>
  typeof value === 'string' && (AREAS as readonly string[]).includes(value)

/**
 * BurnToReturn: today's workout (or the next one on a rest day), the member's week, and every
 * exercise of their style by body area. Sets and rest follow their goal.
 */
export default async function BurnPage({ searchParams }: PageProps<'/burn'>) {
  const gate = await proGate('/burn', 'burn')
  if (!gate.ready) return gate.page
  const { user, profile, now } = gate
  const [choice, t, rawLocale, query] = await Promise.all([
    getTrainingChoice(getDb(), user.id),
    getTranslations('burn'),
    getLocale(),
    searchParams,
  ])
  if (!choice) redirect('/burn/setup')
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  const goal = profile.values.goal
  const today = cairoDate(now)
  const weekday = weekdayOf(today)
  const schedule = weekSchedule(choice.days)
  const next = nextTraining(choice.days, weekday)!
  const shortDays = weekdayNames(locale, 'short')
  const longDays = weekdayNames(locale, 'long')
  const workoutName = (key: 'a' | 'b' | 'c') => t(`workouts.${choice.style}.${key}`)
  const workout = workoutExercises(
    EXERCISES,
    choice.style,
    next.workout,
    weekIndexOf(today) + (next.weekday < weekday ? 1 : 0),
  )
  const area = isArea(query.area) ? query.area : null
  const list = area ? areaExercises(EXERCISES, choice.style, area) : workout

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      {query.saved === '1' && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-btn bg-have-soft px-4 py-3 text-sm font-semibold"
        >
          <SuccessTick className="mt-0.5 size-4 shrink-0 text-have" />
          {t('saved')}
        </p>
      )}

      <section className="relative space-y-3 overflow-hidden rounded-card bg-primary-soft p-5 sm:p-6">
        <Flame
          aria-hidden="true"
          className="absolute -end-4 -bottom-6 size-36 text-accent opacity-15"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold tracking-wide text-accent uppercase">{t('title')}</p>
          <Link
            href="/burn/setup"
            className="rounded-chip bg-bg/60 px-3 py-1.5 text-sm font-semibold text-fg"
          >
            {t(`styles.${choice.style}.name`)} · {t('changeStyle')}
          </Link>
        </div>
        <p className="text-sm font-semibold">
          {next.inDays === 0
            ? t('todayEyebrow')
            : t('nextEyebrow', { day: longDays[next.weekday]! })}
        </p>
        <h1 className="text-3xl font-extrabold">
          {next.inDays === 0 ? workoutName(next.workout) : t('restDay')}
        </h1>
        <p className="flex items-center gap-1.5 text-sm">
          {next.inDays === 0 ? (
            <>
              <Clock aria-hidden="true" className="size-4" />
              {t('workoutMeta', {
                minutes: workoutMinutes(workout, goal),
                count: workout.length,
              })}
            </>
          ) : (
            t('restDayBody', {
              day: longDays[next.weekday]!,
              workout: workoutName(next.workout),
            })
          )}
        </p>
        <div>
          <h2 className="sr-only">{t('weekTitle')}</h2>
          <ol className={cx('grid grid-cols-7 gap-1', query.saved === '1' && 'week-intro')}>
            {schedule.map((key, day) => (
              <li
                style={
                  {
                    '--n': key ? schedule.slice(0, day).filter(Boolean).length : 0,
                  } as React.CSSProperties
                }
                key={day}
                className={cx(
                  'flex flex-col items-center gap-1 rounded-btn py-2 text-xs font-semibold',
                  key ? 'bg-bg/70' : 'opacity-70',
                  day === weekday && 'ring-2 ring-accent',
                )}
              >
                <span aria-hidden="true">{shortDays[day]}</span>
                <span
                  aria-hidden="true"
                  className={cx(
                    'week-badge grid size-6 place-items-center rounded-full text-[0.6875rem]',
                    key ? 'bg-accent text-on-accent' : 'bg-transparent',
                  )}
                >
                  {key ? t(`letters.${key}`) : '·'}
                </span>
                <span className="sr-only">
                  {longDays[day]}
                  {day === weekday ? ` (${t('weekToday')})` : ''}:{' '}
                  {key ? t('weekTraining', { workout: workoutName(key) }) : t('weekRest')}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <nav aria-label={t('filterLabel')} className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {[null, ...AREAS].map((key) => {
            const current = key === area
            return (
              <li key={key ?? 'workout'} className="shrink-0">
                <Link
                  href={key ? `/burn?area=${key}` : '/burn'}
                  aria-current={current ? 'page' : undefined}
                  className={cx(
                    'inline-flex min-h-11 items-center rounded-chip border px-4 text-sm font-semibold',
                    current
                      ? 'border-accent bg-accent text-on-accent'
                      : 'border-line-strong bg-surface',
                  )}
                >
                  {key ? t(`areas.${key}`) : t('filterWorkout')}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <section aria-label={area ? t(`areas.${area}`) : workoutName(next.workout)} className={card}>
        <ul className="space-y-2">
          {list.map((exercise) => (
            <li key={exercise.id}>
              <ExerciseCard exercise={exercise} goal={goal} locale={locale} />
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-fg-muted">{t('disclaimer')}</p>
    </div>
  )
}
