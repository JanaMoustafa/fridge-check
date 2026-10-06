'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { localStore } from '@/lib/storage/safe-storage'
import {
  applyTheme,
  DEFAULT_THEME,
  parseTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from '@/lib/theme/theme'

const CHANGE_EVENT = 'fc:theme-change'

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return
    // Another tab changed the theme: apply it here too.
    applyTheme(document, parseTheme(event.newValue))
    onChange()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

const getSnapshot = () => parseTheme(localStore.get(THEME_STORAGE_KEY))
const getServerSnapshot = () => DEFAULT_THEME

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setTheme = useCallback((next: Theme) => {
    if (next === 'system') localStore.remove(THEME_STORAGE_KEY)
    else localStore.set(THEME_STORAGE_KEY, next)
    applyTheme(document, next)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return { theme, setTheme }
}
