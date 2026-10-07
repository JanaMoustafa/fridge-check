'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cameFromResults } from '@/lib/navigation/return-to'

/**
 * "Back to recipes": a real link (works without JS, from a shared URL, in a new tab), but when the
 * page was opened from the results it goes back through history — the list, its chips and its
 * scroll position come back from the router cache with no network request.
 */
export function BackLink({ href }: { href: string }) {
  const t = useTranslations('recipe')
  const router = useRouter()
  return (
    <Link
      href={href}
      transitionTypes={['nav-back']}
      onClick={(event) => {
        const here = `${window.location.pathname}${window.location.search}`
        if (cameFromResults(here) && window.history.length > 1) {
          event.preventDefault()
          router.back()
        }
      }}
      className="inline-flex min-h-11 items-center gap-2 rounded-btn text-sm font-semibold text-primary print:hidden"
    >
      <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
      {t('back')}
    </Link>
  )
}
