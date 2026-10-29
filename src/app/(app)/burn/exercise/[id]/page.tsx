import { Check, PlayCircle, X } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { SetTracker } from '@/components/burn/SetTracker'
import { VideoGuide } from '@/components/burn/VideoGuide'
import { BackTo, card, proGate } from '@/components/pro/ProGate'
import { EXERCISES } from '@/lib/burn/exercises'
import { prescriptionFor } from '@/lib/burn/programme'
import { say } from '@/lib/burn/text'
import { videoFor } from '@/lib/burn/videos'
import { isLocale } from '@/lib/i18n/locale'
import { cairoDate } from '@/lib/nutritionist/inbody'

const exerciseOf = (id: string) => EXERCISES.find((exercise) => exercise.id === id)

export async function generateMetadata({
  params,
}: PageProps<'/burn/exercise/[id]'>): Promise<Metadata> {
  const [{ id }, rawLocale] = await Promise.all([params, getLocale()])
  const exercise = exerciseOf(id)
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  return { title: exercise ? say(exercise.name, locale) : undefined, robots: { index: false } }
}

/** One exercise: sets and rest for the member's goal, how to do it, what to avoid, set ticks. */
export default async function ExercisePage({ params }: PageProps<'/burn/exercise/[id]'>) {
  const { id } = await params
  const exercise = exerciseOf(id)
  if (!exercise) notFound()
  const gate = await proGate(`/burn/exercise/${id}`, 'burn')
  if (!gate.ready) return gate.page
  const [t, rawLocale] = await Promise.all([getTranslations('burn'), getLocale()])
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  const { sets, restSeconds } = prescriptionFor(exercise, gate.profile.values.goal)
  const work = say(exercise.work, locale)
  const video = videoFor(exercise.id)

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <BackTo href="/burn" label={t('back')} />
      <header className="space-y-3">
        <h1 className="text-3xl font-extrabold">{say(exercise.name, locale)}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-chip bg-accent px-3 py-1 font-bold text-on-accent tabular-nums">
            {sets > 1 ? t('prescription', { sets, work }) : t('single', { work })}
          </span>
          {restSeconds > 0 && (
            <span className="text-fg-muted tabular-nums">
              {t('rest', { seconds: restSeconds })}
            </span>
          )}
          <span className="text-fg-muted">
            · {t('exercise.area', { area: t(`areas.${exercise.area}`) })}
          </span>
        </div>
      </header>

      <section aria-labelledby="video-title" className="space-y-3">
        <h2 id="video-title" className="text-lg font-extrabold">
          {t('exercise.videoTitle')}
        </h2>
        {video ? (
          <>
            <VideoGuide video={video} />
            <p className="text-xs text-fg-muted">{t('exercise.videoNote')}</p>
          </>
        ) : (
          <div className="flex items-start gap-3 rounded-card bg-primary-soft p-5">
            <PlayCircle aria-hidden="true" className="size-8 shrink-0 text-accent" />
            <p className="text-sm">{t('exercise.videoSoon')}</p>
          </div>
        )}
      </section>

      <section aria-labelledby="how-title" className={`${card} space-y-3`}>
        <h2 id="how-title" className="text-lg font-extrabold">
          {t('exercise.howTitle')}
        </h2>
        <ul className="space-y-2">
          {exercise.cues[locale].map((cue) => (
            <li key={cue} className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-have-soft text-have">
                <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
              </span>
              <span>{cue}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="avoid-title"
        className="space-y-3 rounded-card bg-surface p-5 shadow-[0_0_0_2px_var(--color-accent)] sm:p-6"
      >
        <h2 id="avoid-title" className="text-lg font-extrabold text-accent">
          {t('exercise.avoidTitle')}
        </h2>
        <ul className="space-y-2">
          {exercise.avoid[locale].map((note) => (
            <li key={note} className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-accent">
                <X aria-hidden="true" className="size-3.5" strokeWidth={3} />
              </span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <SetTracker
          storageKey={`btr:sets:${cairoDate(gate.now)}:${exercise.id}`}
          sets={sets}
          restSeconds={restSeconds}
        />
      </section>

      <p className="text-xs text-fg-muted">{t('disclaimer')}</p>
    </div>
  )
}
