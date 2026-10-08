import 'server-only'
import type { RecipeSource } from '@/types/recipe'

/** Per request: a slow API falls back to the built-in collection instead of hanging the page. */
export const REQUEST_TIMEOUT_MS = 8_000

/**
 * Why a remote call failed. quota (402) and rate-limit (429) open the provider's circuit breaker;
 * not-found is a normal answer for a detail lookup; everything else is an outage.
 */
export type ProviderErrorKind =
  | 'quota'
  | 'rate-limit'
  | 'auth'
  | 'not-found'
  | 'timeout'
  | 'network'
  | 'http'
  | 'invalid-response'

/**
 * A failed call to a recipe API. The message names the provider, the endpoint label and the
 * status only: never the URL, a header or the body, so a key can never end up in a log.
 */
export class ProviderError extends Error {
  constructor(
    readonly provider: Exclude<RecipeSource, 'local'>,
    readonly kind: ProviderErrorKind,
    readonly label: string,
    readonly status?: number,
    /** Seconds from a 429's Retry-After header, when it sent one. */
    readonly retryAfter?: number,
  ) {
    super(`${provider} ${label}: ${kind}${status === undefined ? '' : ` (HTTP ${status})`}`)
    this.name = 'ProviderError'
  }
}

export interface FetchJsonOptions {
  provider: Exclude<RecipeSource, 'local'>
  /** Endpoint name for errors and logs, e.g. "filter.php" (never the URL: it may hold a key). */
  label: string
  headers?: Record<string, string>
  timeoutMs?: number
  /** Aborts too when the whole search runs out of time. */
  signal?: AbortSignal
  fetchImpl?: typeof fetch
}

function kindOf(status: number): ProviderErrorKind {
  if (status === 402) return 'quota'
  if (status === 429) return 'rate-limit'
  if (status === 401 || status === 403) return 'auth'
  if (status === 404) return 'not-found'
  return 'http'
}

/** Retry-After in seconds (the HTTP-date form is not used by these APIs). */
function retryAfterOf(response: Response): number | undefined {
  const value = Number(response.headers.get('retry-after'))
  return Number.isFinite(value) && value > 0 ? value : undefined
}

function isTimeout(error: unknown): boolean {
  return (
    error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')
  )
}

/**
 * GET a JSON document from a recipe API. Fails with a ProviderError on a timeout, a network
 * error, a non-2xx status or a body that is not JSON. Responses are never stored by fetch itself:
 * the providers cache what they parsed, for as long as each API's terms allow.
 */
export async function fetchJson(url: URL, options: FetchJsonOptions): Promise<unknown> {
  const { provider, label, fetchImpl = fetch } = options
  const timeout = AbortSignal.timeout(options.timeoutMs ?? REQUEST_TIMEOUT_MS)
  const signal = options.signal ? AbortSignal.any([timeout, options.signal]) : timeout
  let response: Response
  try {
    response = await fetchImpl(url, {
      headers: { accept: 'application/json', ...options.headers },
      signal,
      cache: 'no-store',
    })
  } catch (error) {
    throw new ProviderError(provider, isTimeout(error) ? 'timeout' : 'network', label)
  }
  if (!response.ok) {
    // Free the connection: the body of an error is never read.
    await response.body?.cancel().catch(() => undefined)
    throw new ProviderError(
      provider,
      kindOf(response.status),
      label,
      response.status,
      retryAfterOf(response),
    )
  }
  try {
    return await response.json()
  } catch (error) {
    throw new ProviderError(provider, isTimeout(error) ? 'timeout' : 'invalid-response', label)
  }
}

/**
 * Runs tasks with at most `limit` in flight, keeping results in input order. The first failure
 * rejects the whole run (tasks already started finish on their own).
 */
export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array<R>(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await task(items[index]!)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}
