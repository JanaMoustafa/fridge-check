'use client'

import { Direction, Tooltip } from 'radix-ui'
import type { ReactNode } from 'react'
import { AnnouncerProvider } from '@/components/providers/Announcer'
import { QueryProvider } from '@/components/providers/QueryProvider'
import type { Direction as Dir } from '@/lib/i18n/locale'

/** Radix ignores <html dir>, so direction is passed explicitly (keyboard + swipe behaviour in RTL). */
export function AppProviders({ dir, children }: { dir: Dir; children: ReactNode }) {
  return (
    <Direction.Provider dir={dir}>
      <QueryProvider>
        <AnnouncerProvider>
          <Tooltip.Provider delayDuration={300}>{children}</Tooltip.Provider>
        </AnnouncerProvider>
      </QueryProvider>
    </Direction.Provider>
  )
}
