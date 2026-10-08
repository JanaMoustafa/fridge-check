import 'server-only'
import type { ApiError } from '@/types/api'
import { serverEnv } from './env'

const WINDOW_MS = 60 * 1000

export type RateLimitVerdict = { allowed: true } | { allowed: false; retryAfterSeconds: number }

export interface RateLimiterOptions {
  /** Requests per key per window. */
  limit: number
  windowMs?: number
  /** Keys tracked at most; expired ones go first, then the oldest. */
  maxKeys?: number
  now?: () => number
}

/**
 * Fixed-window counter per key, in memory. On serverless hosts every instance counts on its own,
 * so this is a best-effort guard against one client hammering the API (and through it, the
 * recipe APIs' quotas), not an exact global limit; repeated searches are served by the CDN first.
 */
export function createRateLimiter({
  limit,
  windowMs = WINDOW_MS,
  maxKeys = 10_000,
  now = Date.now,
}: RateLimiterOptions) {
  const windows = new Map<string, { count: number; resetAt: number }>()

  const prune = (time: number) => {
    for (const [key, window] of windows) if (window.resetAt <= time) windows.delete(key)
    while (windows.size >= maxKeys) windows.delete(windows.keys().next().value!)
  }

  return {
    check(key: string): RateLimitVerdict {
      const time = now()
      let window = windows.get(key)
      if (!window || window.resetAt <= time) {
        if (!window && windows.size >= maxKeys) prune(time)
        window = { count: 0, resetAt: time + windowMs }
        windows.set(key, window)
      }
      window.count++
      if (window.count <= limit) return { allowed: true }
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((window.resetAt - time) / 1000)),
      }
    },
    get size() {
      return windows.size
    },
  }
}

/**
 * The client's address as the host's proxy reports it (Vercel sets both headers and does not pass
 * on values a client sent). Without a proxy every request shares one bucket.
 */
export function clientKey(headers: Headers): string {
  const realIp = headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || 'unknown'
}

export function rateLimitedResponse(retryAfterSeconds: number): Response {
  const body: ApiError = {
    error: { code: 'rate-limited', message: 'Too many requests. Try again in a minute.' },
  }
  return Response.json(body, {
    status: 429,
    headers: { 'Retry-After': String(retryAfterSeconds), 'Cache-Control': 'no-store' },
  })
}

/** A guard for route handlers: a 429 response when the client is over the limit, else null. */
export function createRateLimitGuard(options: RateLimiterOptions) {
  const limiter = createRateLimiter(options)
  return (request: Request): Response | null => {
    const verdict = limiter.check(clientKey(request.headers))
    return verdict.allowed ? null : rateLimitedResponse(verdict.retryAfterSeconds)
  }
}

let guard: ((request: Request) => Response | null) | undefined

/**
 * The API routes' shared guard, RATE_LIMIT_PER_MINUTE per client ("0" turns it off). Off under
 * NODE_ENV=test, where route tests make many requests from one "client".
 */
export function checkRateLimit(request: Request): Response | null {
  const limit = serverEnv().RATE_LIMIT_PER_MINUTE
  if (limit === 0 || process.env.NODE_ENV === 'test') return null
  guard ??= createRateLimitGuard({ limit })
  return guard(request)
}
