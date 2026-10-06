'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  addTransitionType,
  useCallback,
  useEffect,
  useOptimistic,
  useState,
  useTransition,
} from 'react'
import {
  LOCALE_STORAGE_KEY,
  parseLocaleCookie,
  serializeLocaleCookie,
  type Locale,
} from '@/lib/i18n/locale'
import { localStore } from '@/lib/storage/safe-storage'

/**
 * Switching language writes the cookie (read by the server for lang/dir on first paint) and the
 * localStorage mirror, then re-renders server components in place — client state such as the
 * ingredient chips survives, and the page crossfades via the `locale` view-transition type.
 *
 * - The toggle shows the requested language immediately (optimistic), so rapid taps on a slow
 *   connection always end on the last choice.
 * - Other tabs follow: soft navigations only re-render the page segment, so a tab whose cookie
 *   changed elsewhere must refresh its layout (html lang/dir, header, messages) too.
 * - If the browser refuses the cookie, nothing is sent and the caller can explain why.
 */
export function useLocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [target, setTarget] = useOptimistic(locale)
  const [cookieBlocked, setCookieBlocked] = useState(false)

  const refreshTo = useCallback(
    (next: Locale) => {
      startTransition(() => {
        setTarget(next)
        addTransitionType('locale')
        router.refresh()
      })
    },
    [router, setTarget],
  )

  const switchLocale = useCallback(
    (next: Locale) => {
      if (next === target && parseLocaleCookie(document.cookie) === next) return
      document.cookie = serializeLocaleCookie(next, {
        secure: window.location.protocol === 'https:',
      })
      if (parseLocaleCookie(document.cookie) !== next) {
        setCookieBlocked(true)
        return
      }
      setCookieBlocked(false)
      localStore.set(LOCALE_STORAGE_KEY, next)
      refreshTo(next)
    },
    [target, refreshTo],
  )

  useEffect(() => {
    function resync() {
      const cookieLocale = parseLocaleCookie(document.cookie)
      if (cookieLocale && cookieLocale !== locale) refreshTo(cookieLocale)
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === LOCALE_STORAGE_KEY) resync()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') resync()
    }
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) resync()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [locale, refreshTo])

  return { locale: target, switchLocale, isPending, cookieBlocked }
}
