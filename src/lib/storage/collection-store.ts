import { z } from 'zod'
import type { SafeStorage } from './safe-storage'

export interface CollectionStore<T> {
  /** Current items; the same array instance until something changes (for useSyncExternalStore). */
  getAll(): readonly T[]
  /** Replaces every item (validated) and notifies subscribers. Returns false when only in memory. */
  setAll(items: readonly T[]): boolean
  update(change: (items: readonly T[]) => readonly T[]): boolean
  /** Same-tab and cross-tab (storage event) changes. */
  subscribe(listener: () => void): () => void
}

export interface StorageEventTarget {
  addEventListener(type: 'storage', listener: (event: StorageEvent) => void): void
  removeEventListener(type: 'storage', listener: (event: StorageEvent) => void): void
}

interface Options<T> {
  key: string
  itemSchema: z.ZodType<T>
  storage: SafeStorage
  version?: number
  /** Where cross-tab `storage` events arrive (window in the browser). */
  events?: StorageEventTarget
}

/**
 * A versioned list in Web Storage: `{ version, items }`. Reads are validated item by item, so a
 * corrupt or outdated entry is dropped (and the cleaned list written back) while every valid one
 * is kept. Storage failures degrade to memory via SafeStorage.
 */
export function createCollectionStore<T>({
  key,
  itemSchema,
  storage,
  version = 1,
  events = typeof window === 'undefined' ? undefined : window,
}: Options<T>): CollectionStore<T> {
  const Envelope = z.object({ version: z.literal(version), items: z.array(z.unknown()) })
  const listeners = new Set<() => void>()
  let cachedRaw: string | null | undefined
  let cachedItems: readonly T[] = []

  function parse(raw: string | null): { items: T[]; dropped: number } {
    if (!raw) return { items: [], dropped: 0 }
    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch {
      return { items: [], dropped: 1 }
    }
    const envelope = Envelope.safeParse(json)
    if (!envelope.success) return { items: [], dropped: 1 }
    const items: T[] = []
    for (const item of envelope.data.items) {
      const parsed = itemSchema.safeParse(item)
      if (parsed.success) items.push(parsed.data)
    }
    return { items, dropped: envelope.data.items.length - items.length }
  }

  function serialize(items: readonly T[]): string {
    return JSON.stringify({ version, items })
  }

  function getAll(): readonly T[] {
    const raw = storage.get(key)
    if (raw === cachedRaw) return cachedItems
    const { items, dropped } = parse(raw)
    cachedItems = items
    if (dropped > 0) {
      // Persist the cleaned list so the corrupt part is gone for good.
      cachedRaw = serialize(items)
      storage.set(key, cachedRaw)
    } else {
      cachedRaw = raw
    }
    return cachedItems
  }

  function notify() {
    listeners.forEach((listener) => listener())
  }

  function setAll(items: readonly T[]): boolean {
    const valid = items.map((item) => itemSchema.parse(item))
    const raw = serialize(valid)
    const persisted = storage.set(key, raw)
    cachedRaw = raw
    cachedItems = valid
    notify()
    return persisted
  }

  return {
    getAll,
    setAll,
    update: (change) => setAll(change(getAll())),
    subscribe(listener) {
      listeners.add(listener)
      const onStorage = (event: StorageEvent) => {
        if (event.key === key || event.key === null) listener()
      }
      events?.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(listener)
        events?.removeEventListener('storage', onStorage)
      }
    },
  }
}
