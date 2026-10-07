'use client'

import { Printer, Share2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useAnnounce } from '@/components/providers/Announcer'
import { buttonClasses } from '@/components/ui/button'

/** Share (Web Share API, copy-link fallback) and Print. */
export function RecipeActions({ title }: { title: string }) {
  const t = useTranslations('recipe')
  const announce = useAnnounce()
  const [status, setStatus] = useState<string | null>(null)

  function report(message: string) {
    setStatus(message)
    announce(message)
  }

  async function share() {
    const url = window.location.href
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url })
        return
      } catch (error) {
        // The user closed the share sheet: nothing to report.
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      report(t('copied'))
    } catch {
      report(t('shareFailed'))
    }
  }

  return (
    <div className="space-y-2 print:hidden">
      <div role="group" aria-label={t('actions')} className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void share()}
          className={buttonClasses({ variant: 'secondary' })}
        >
          <Share2 aria-hidden="true" className="size-4" />
          {t('share')}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className={buttonClasses({ variant: 'secondary' })}
        >
          <Printer aria-hidden="true" className="size-4" />
          {t('print')}
        </button>
      </div>
      {status && <p className="text-sm text-fg-muted">{status}</p>}
    </div>
  )
}
