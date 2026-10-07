'use client'

import { useCallback, useSyncExternalStore } from 'react'
import {
  DEFAULT_SETTINGS,
  parseSettings,
  serializeSettings,
  SETTINGS_STORAGE_KEY,
  type Settings,
} from '@/lib/settings/settings'
import { localStore } from '@/lib/storage/safe-storage'

const CHANGE_EVENT = 'fc:settings-change'

// Cached so useSyncExternalStore sees a stable snapshot until the stored value changes.
let cachedRaw: string | null | undefined
let cachedSettings: Settings = DEFAULT_SETTINGS

function getSnapshot(): Settings {
  const raw = localStore.get(SETTINGS_STORAGE_KEY)
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedSettings = parseSettings(raw)
  }
  return cachedSettings
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === SETTINGS_STORAGE_KEY) onChange()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

/** Device-wide preferences (staples, units), synced across tabs. */
export function useSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_SETTINGS)

  const update = useCallback((patch: Partial<Settings>) => {
    localStore.set(SETTINGS_STORAGE_KEY, serializeSettings({ ...getSnapshot(), ...patch }))
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return { settings, update }
}
