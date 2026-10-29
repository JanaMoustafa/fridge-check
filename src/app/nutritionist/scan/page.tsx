import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ScanForm } from '@/components/nutritionist/ScanForm'
import { cairoDate } from '@/lib/nutritionist/inbody'
import { photoReadingEnabled } from '@/lib/server/inbody-reader'
import { BackToNutritionist, nutritionistGate } from '../gate'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nutritionist.scan')
  return { title: t('metaTitle'), robots: { index: false } }
}

/** Adding this month's InBody result: from a photo of the sheet, or typed in. */
export default async function ScanPage() {
  const gate = await nutritionistGate('/nutritionist/scan')
  if (!gate.ready) return gate.page
  const t = await getTranslations('nutritionist.scan')
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <BackToNutritionist />
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold">{t('title')}</h1>
        <p className="text-fg-muted">{t('intro')}</p>
      </header>
      <ScanForm photoReading={photoReadingEnabled()} today={cairoDate(gate.now)} />
    </div>
  )
}
