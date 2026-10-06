'use client'

import { RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { buttonClasses } from '@/components/ui/button'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('error')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section
      role="alert"
      className="mx-auto mt-8 flex max-w-md flex-col items-center rounded-card bg-surface px-6 py-12 text-center"
    >
      <h1 className="text-2xl font-extrabold">{t('heading')}</h1>
      <p className="mt-2 text-fg-muted">{t('body')}</p>
      <button type="button" onClick={reset} className={buttonClasses({ className: 'mt-6' })}>
        <RotateCcw aria-hidden="true" className="size-4" />
        {t('retry')}
      </button>
    </section>
  )
}
