'use client'

import { HardDriveDownload, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useSyncExternalStore } from 'react'
import { localStore, sessionStore } from '@/lib/storage/safe-storage'

const DISMISSED_KEY = 'fc:storage-notice-dismissed'

const subscribe = (onChange: () => void) => localStore.onDegrade(onChange)
const getSnapshot = () => localStore.mode()
const getServerSnapshot = () => 'persistent' as const

/**
 * One-time notice when the browser refuses to store data (Safari private mode, storage full):
 * favorites and the shopping list then live only in memory until the tab closes.
 */
export function StorageNotice() {
  const t = useTranslations('storage')
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [dismissed, setDismissed] = useState(() => sessionStore.get(DISMISSED_KEY) === '1')
  if (mode === 'persistent' || dismissed) return null

  return (
    <div
      role="status"
      className="mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-[1440px] items-start gap-3 rounded-btn bg-missing-soft px-4 py-3 text-sm sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)] print:hidden"
    >
      <HardDriveDownload aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-missing" />
      <p className="flex-1">{t('unavailable')}</p>
      <button
        type="button"
        onClick={() => {
          sessionStore.set(DISMISSED_KEY, '1')
          setDismissed(true)
        }}
        aria-label={t('dismiss')}
        className="-m-2 grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}
