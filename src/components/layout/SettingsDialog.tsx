'use client'

import { Settings, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Dialog } from 'radix-ui'
import { PreferenceSettings } from '@/components/settings/PreferenceSettings'
import { ThemeSelector } from '@/components/settings/ThemeSelector'

/** Bottom sheet on small screens, inline-end side panel from md up. */
export function SettingsDialog() {
  const t = useTranslations('settings')
  const tc = useTranslations('common')

  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-label={t('open')}
        className="grid size-11 shrink-0 place-items-center rounded-full text-fg-muted transition-colors duration-150 hover:bg-surface-2 hover:text-fg"
      >
        <Settings aria-hidden="true" className="size-5" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="settings-overlay fixed inset-0 z-[100] bg-fg/40" />
        <Dialog.Content className="settings-sheet fixed inset-x-0 bottom-0 z-[101] max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-card bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-1px_0_var(--color-line)] md:inset-y-0 md:inset-s-auto md:inset-e-0 md:max-h-none md:w-96 md:rounded-none md:rounded-s-card">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-extrabold">{t('title')}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-fg-muted">
                {t('description')}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label={tc('close')}
              className="-me-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-full text-fg-muted transition-colors duration-150 hover:bg-surface-2 hover:text-fg"
            >
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </div>
          <div className="space-y-8">
            <ThemeSelector />
            <PreferenceSettings />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
