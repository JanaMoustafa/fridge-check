'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

const AnnounceContext = createContext<(message: string) => void>(() => {})

/**
 * One polite live region for the whole app: result counts, chip additions/removals and favorite
 * toggles are announced through it. The region is cleared first so a repeated message is read again.
 */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const announce = useCallback((next: string) => {
    setMessage('')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(next), 60)
  }, [])

  return (
    <AnnounceContext value={announce}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </div>
    </AnnounceContext>
  )
}

export function useAnnounce() {
  return useContext(AnnounceContext)
}
