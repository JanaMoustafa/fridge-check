'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Re-renders the page from the server every few seconds while a payment is being confirmed,
 * then stops (after about two minutes) so a forgotten tab does not poll forever.
 */
export function AutoRefresh({
  everyMs = 4000,
  maxTimes = 30,
}: {
  everyMs?: number
  maxTimes?: number
}) {
  const router = useRouter()
  useEffect(() => {
    let times = 0
    const timer = setInterval(() => {
      times += 1
      router.refresh()
      if (times >= maxTimes) clearInterval(timer)
    }, everyMs)
    return () => clearInterval(timer)
  }, [router, everyMs, maxTimes])
  return null
}
