import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { TrainingForm } from '@/components/burn/TrainingForm'
import { BackTo, proGate } from '@/components/pro/ProGate'
import { DEFAULT_DAYS, daysOf } from '@/lib/burn/programme'
import { weekdayNames } from '@/lib/burn/text'
import { getDb } from '@/lib/db/client'
import { isLocale } from '@/lib/i18n/locale'
import { getTrainingChoice } from '@/lib/server/training'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('burn.setup')
  return { title: t('metaTitle'), robots: { index: false } }
}

/** Choosing (or changing) the training style and days. */
export default async function BurnSetupPage() {
  const gate = await proGate('/burn/setup', 'burn')
  if (!gate.ready) return gate.page
  const [choice, t, rawLocale] = await Promise.all([
    getTrainingChoice(getDb(), gate.user.id),
    getTranslations('burn'),
    getLocale(),
  ])
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      {choice && <BackTo href="/burn" label={t('back')} />}
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold">{t('setup.title')}</h1>
        <p className="text-fg-muted">{t('setup.intro')}</p>
      </header>
      <TrainingForm
        initial={choice && { style: choice.style, days: daysOf(choice.days) }}
        dayNames={weekdayNames(locale, 'long')}
        defaultDays={daysOf(DEFAULT_DAYS)}
      />
    </div>
  )
}
