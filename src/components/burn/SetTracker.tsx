'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { buttonClasses } from '@/components/ui/button'
import { cx } from '@/lib/cx'

interface SetTrackerProps {
  /** Where today's ticks are kept on this device, e.g. "btr:sets:2026-10-29:c-squat". */
  storageKey: string
  sets: number
  restSeconds: number
}

function readTicks(key: string, sets: number): boolean[] {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown
    if (Array.isArray(saved)) return Array.from({ length: sets }, (_, i) => saved[i] === true)
  } catch {
    // Storage blocked or unreadable: start fresh.
  }
  return Array.from({ length: sets }, () => false)
}

/**
 * Ticking off today's sets, with a rest timer between them. Ticks stay on this device for the day
 * (a convenience, not a record: workout history arrives with day logging).
 */
export function SetTracker({ storageKey, sets, restSeconds }: SetTrackerProps) {
  const t = useTranslations('burn.exercise')
  const [ticks, setTicks] = useState<boolean[]>(() => Array.from({ length: sets }, () => false))
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => {
    // Read after hydration: the server has no idea what this device ticked.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTicks(readTicks(storageKey, sets))
  }, [storageKey, sets])

  useEffect(() => {
    if (left === null || left <= 0) return
    const timer = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(timer)
  }, [left])

  function toggle(index: number) {
    const next = ticks.map((tick, i) => (i === index ? !tick : tick))
    setTicks(next)
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      // Not saved on this device; the ticks still work for this visit.
    }
    if (next[index] && restSeconds > 0 && next.some((tick) => !tick)) setLeft(restSeconds)
  }

  const done = ticks.filter(Boolean).length
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">{t('setsTitle')}</h2>
        <p className="text-sm text-fg-muted tabular-nums">{t('setsDone', { done, total: sets })}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {ticks.map((tick, index) => (
          <button
            key={index}
            type="button"
            aria-pressed={tick}
            aria-label={t('setLabel', { n: index + 1 })}
            onClick={() => toggle(index)}
            className={cx(
              'grid size-13 place-items-center rounded-btn border-2 text-lg font-extrabold tabular-nums transition-colors',
              tick
                ? 'border-accent bg-accent text-on-accent'
                : 'border-dashed border-line-strong bg-transparent',
            )}
          >
            {index + 1}
          </button>
        ))}
      </div>
      {restSeconds > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setLeft(left !== null && left > 0 ? null : restSeconds)}
            className={buttonClasses({ variant: 'secondary' })}
          >
            {left !== null && left > 0 ? t('stopRest') : t('startRest')}
          </button>
          <p aria-live="polite" className="font-semibold tabular-nums">
            {left !== null && left > 0 && (
              <span aria-hidden="true">{t('resting', { seconds: left })}</span>
            )}
            {left === 0 && t('restOver')}
          </p>
        </div>
      )}
    </div>
  )
}
