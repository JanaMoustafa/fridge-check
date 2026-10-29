import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { prescriptionFor } from '@/lib/burn/programme'
import { say } from '@/lib/burn/text'
import type { Exercise } from '@/lib/burn/types'
import type { Locale } from '@/lib/i18n/locale'
import type { Goal } from '@/lib/nutrition/calculator'

/** One exercise in a list: name, sets × work for the member's goal, and rest. */
export async function ExerciseCard({
  exercise,
  goal,
  locale,
}: {
  exercise: Exercise
  goal: Goal
  locale: Locale
}) {
  const t = await getTranslations('burn')
  const { sets, restSeconds } = prescriptionFor(exercise, goal)
  const work = say(exercise.work, locale)
  return (
    <Link
      href={`/burn/exercise/${exercise.id}`}
      className="flex min-h-16 items-center gap-3 rounded-btn bg-bg px-4 py-3 transition-colors hover:bg-surface-2"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold">{say(exercise.name, locale)}</span>
        <span className="block text-sm text-fg-muted tabular-nums">
          <span className="whitespace-nowrap">
            {sets > 1 ? t('prescription', { sets, work }) : t('single', { work })}
          </span>
          {restSeconds > 0 && (
            <>
              {' · '}
              <span className="whitespace-nowrap">{t('rest', { seconds: restSeconds })}</span>
            </>
          )}
        </span>
      </span>
      <span className="shrink-0 rounded-chip bg-primary-soft px-2.5 py-1 text-xs font-semibold">
        {t(`areas.${exercise.area}`)}
      </span>
      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-fg-muted rtl:-scale-x-100" />
    </Link>
  )
}
