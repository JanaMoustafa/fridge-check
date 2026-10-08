import 'server-only'

export interface TtlCacheOptions {
  ttlMs: number
  /** Oldest entries are evicted first beyond this many, so memory stays bounded. */
  maxEntries: number
  now?: () => number
}

export interface TtlCache<V> {
  /**
   * The cached value for key, or load() once: concurrent callers share one load. A failed load
   * is not cached, so the next call tries again.
   */
  get(key: string, load: () => Promise<V>): Promise<V>
  /** Entries currently held (expired ones included until they are touched or evicted). */
  readonly size: number
  clear(): void
}

interface Entry<V> {
  value: Promise<V>
  expiresAt: number
}

/**
 * In-memory cache for parsed API answers. It lives as long as the server instance does, so on
 * serverless hosts it only saves repeated calls within one warm instance; the CDN (Cache-Control
 * on the API routes) is the shared cache.
 */
export function createTtlCache<V>({
  ttlMs,
  maxEntries,
  now = Date.now,
}: TtlCacheOptions): TtlCache<V> {
  const entries = new Map<string, Entry<V>>()

  return {
    get(key, load) {
      const hit = entries.get(key)
      if (hit && hit.expiresAt > now()) {
        // Re-insert so eviction drops the least recently used entry.
        entries.delete(key)
        entries.set(key, hit)
        return hit.value
      }
      const value = load()
      const entry = { value, expiresAt: now() + ttlMs }
      entries.delete(key)
      entries.set(key, entry)
      value.catch(() => {
        if (entries.get(key) === entry) entries.delete(key)
      })
      while (entries.size > maxEntries) entries.delete(entries.keys().next().value!)
      return value
    },
    get size() {
      return entries.size
    },
    clear() {
      entries.clear()
    },
  }
}
