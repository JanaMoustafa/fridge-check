import { z } from 'zod'
import { sessionStore } from '@/lib/storage/safe-storage'

const KEY = 'fc:return-to'

const ReturnSchema = z.object({
  from: z.string(),
  to: z.string(),
  scrollY: z.number().nonnegative(),
})
type ReturnRecord = z.infer<typeof ReturnSchema>

function read(): ReturnRecord | null {
  const raw = sessionStore.get(KEY)
  if (!raw) return null
  try {
    const parsed = ReturnSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/** Remembers that `to` was opened from the results at `from`, scrolled to `scrollY`. */
export function rememberReturn(from: string, to: string, scrollY = 0): void {
  sessionStore.set(KEY, JSON.stringify({ from, to, scrollY: Math.max(0, Math.round(scrollY)) }))
}

/**
 * True when the current page was opened from the results list, so "Back to recipes" can use the
 * browser history (instant, no network) instead of loading the list again.
 */
export function cameFromResults(current: string): boolean {
  return read()?.to === current
}

/**
 * The scroll position to restore when returning to the results at `current` (once: the record
 * is consumed). Null when the list was not left for a recipe.
 */
export function takeReturnScroll(current: string): number | null {
  const record = read()
  if (record?.from !== current) return null
  sessionStore.remove(KEY)
  return record.scrollY
}
