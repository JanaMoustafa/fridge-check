import Link from 'next/link'
import type { ReactNode } from 'react'
import { LEGAL_PATHS } from '@/lib/legal/document'

export const inlineLinkClass =
  'font-semibold text-primary underline decoration-2 underline-offset-4'

/** Rich-text tags for messages that point to the legal pages: <terms>, <privacy>, <refunds>. */
export const legalLinks = {
  terms: (chunks: ReactNode) => (
    <Link href={LEGAL_PATHS.terms} className={inlineLinkClass}>
      {chunks}
    </Link>
  ),
  privacy: (chunks: ReactNode) => (
    <Link href={LEGAL_PATHS.privacy} className={inlineLinkClass}>
      {chunks}
    </Link>
  ),
  refunds: (chunks: ReactNode) => (
    <Link href={LEGAL_PATHS.refunds} className={inlineLinkClass}>
      {chunks}
    </Link>
  ),
}
