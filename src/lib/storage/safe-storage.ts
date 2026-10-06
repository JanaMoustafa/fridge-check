export type StorageMode = 'persistent' | 'memory'

export interface SafeStorage {
  get(key: string): string | null
  /** Returns true when the value was persisted, false when it only lives in memory for this session. */
  set(key: string, value: string): boolean
  remove(key: string): void
  mode(): StorageMode
  /** Notified once, the first time storage degrades to memory (for a one-time notice). */
  onDegrade(listener: () => void): () => void
}

const PROBE_KEY = '__fc_probe__'

/**
 * Wraps Web Storage so callers never see an exception.
 * - Storage missing or blocked (Safari private mode, disabled cookies) → memory only.
 * - A failed write (quota exceeded) → writes go to an in-memory overlay; persisted values stay readable.
 */
export function createSafeStorage(resolveBacking: () => Storage | null | undefined): SafeStorage {
  const memory = new Map<string, string>()
  const removed = new Set<string>()
  const listeners = new Set<() => void>()
  let backing: Storage | null | undefined
  let writable = true
  let degraded = false

  function getBacking(): Storage | null {
    if (backing !== undefined) return backing
    try {
      const candidate = resolveBacking() ?? null
      if (candidate) {
        candidate.setItem(PROBE_KEY, PROBE_KEY)
        candidate.removeItem(PROBE_KEY)
      }
      backing = candidate
      if (!candidate) degrade()
    } catch {
      backing = null
      degrade()
    }
    return backing
  }

  function degrade() {
    writable = false
    if (degraded) return
    degraded = true
    listeners.forEach((listener) => listener())
  }

  return {
    get(key) {
      if (memory.has(key)) return memory.get(key) ?? null
      if (removed.has(key)) return null
      const store = getBacking()
      if (!store) return null
      try {
        return store.getItem(key)
      } catch {
        return null
      }
    },
    set(key, value) {
      removed.delete(key)
      const store = getBacking()
      if (store && writable) {
        try {
          store.setItem(key, value)
          memory.delete(key)
          return true
        } catch {
          degrade()
        }
      }
      memory.set(key, value)
      return false
    },
    remove(key) {
      memory.delete(key)
      const store = getBacking()
      if (store && writable) {
        try {
          store.removeItem(key)
          return
        } catch {
          degrade()
        }
      }
      removed.add(key)
    },
    mode() {
      getBacking()
      return writable ? 'persistent' : 'memory'
    },
    onDegrade(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export const localStore = createSafeStorage(() =>
  typeof window === 'undefined' ? null : window.localStorage,
)

export const sessionStore = createSafeStorage(() =>
  typeof window === 'undefined' ? null : window.sessionStorage,
)
