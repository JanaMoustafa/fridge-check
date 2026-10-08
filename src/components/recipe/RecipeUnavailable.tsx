'use client'

import { CloudOff, Hourglass } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useSyncExternalStore } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'

const SOURCE_NAMES = { mealdb: 'TheMealDB', spoonacular: 'Spoonacular' } as const

interface RecipeUnavailableProps {
  source: keyof typeof SOURCE_NAMES
  reason: 'quota' | 'outage'
  /** When the source answers again (ms since epoch), for a used-up quota. */
  retryAt?: number
  /** The search for the same pantry: answered from the built-in collection meanwhile. */
  builtInHref: string
  /** This page again. */
  retryHref: string
}

const noSubscription = () => () => {}

/** "3:00 AM" / "3:00 ص", always with Western digits (owner decision). */
export function formatResetTime(time: number, locale: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
    numberingSystem: 'latn',
    ...(timeZone ? { timeZone, timeZoneName: 'short' } : {}),
  }).format(time)
}

/**
 * Shown instead of a recipe whose source is out of quota or not answering, pointing to the
 * built-in recipes. The reset time is the visitor's local time; the server, which cannot know
 * that time zone, renders it in UTC ("12:00 AM UTC") until the page hydrates.
 */
export function RecipeUnavailable({
  source,
  reason,
  retryAt,
  builtInHref,
  retryHref,
}: RecipeUnavailableProps) {
  const t = useTranslations('recipe')
  const locale = useLocale()
  const time = useSyncExternalStore(
    noSubscription,
    () => (retryAt === undefined ? '' : formatResetTime(retryAt, locale)),
    () => (retryAt === undefined ? '' : formatResetTime(retryAt, locale, 'UTC')),
  )
  const name = SOURCE_NAMES[source]
  const quota = reason === 'quota' && retryAt !== undefined

  return (
    <div className="py-8">
      <h1 className="sr-only">{t('unavailableMetaTitle')}</h1>
      <EmptyState
        icon={quota ? Hourglass : CloudOff}
        title={quota ? t('unavailableQuotaTitle', { source: name }) : t('unavailableTitle')}
        body={quota ? t('unavailableQuotaBody', { time }) : t('unavailableBody', { source: name })}
        action={{ href: builtInHref, label: t('showBuiltIn') }}
        secondaryAction={quota ? undefined : { href: retryHref, label: t('tryAgain') }}
      />
    </div>
  )
}
