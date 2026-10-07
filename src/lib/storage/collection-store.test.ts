import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createCollectionStore } from './collection-store'
import { createSafeStorage } from './safe-storage'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return createSafeStorage(
    () =>
      ({
        getItem: (k: string) => data.get(k) ?? null,
        setItem: (k: string, v: string) => void data.set(k, v),
        removeItem: (k: string) => void data.delete(k),
        clear: () => data.clear(),
        key: () => null,
        get length() {
          return data.size
        },
      }) as Storage,
  )
}

class Events {
  private handlers = new Set<(e: StorageEvent) => void>()
  addEventListener = (_: string, handler: (e: StorageEvent) => void) =>
    void this.handlers.add(handler)
  removeEventListener = (_: string, handler: (e: StorageEvent) => void) =>
    void this.handlers.delete(handler)
  fire(key: string | null) {
    this.handlers.forEach((h) => h({ key } as StorageEvent))
  }
}

const Item = z.object({ id: z.string(), n: z.number() })
const store = (initial?: Record<string, string>, events = new Events()) => ({
  events,
  storage: memoryStorage(initial),
  get s() {
    return createCollectionStore({ key: 'k', itemSchema: Item, storage: this.storage, events })
  },
})

describe('createCollectionStore', () => {
  it('starts empty and round-trips items', () => {
    const { s, storage } = store()
    expect(s.getAll()).toEqual([])
    expect(s.setAll([{ id: 'a', n: 1 }])).toBe(true)
    expect(s.getAll()).toEqual([{ id: 'a', n: 1 }])
    expect(JSON.parse(storage.get('k')!)).toEqual({ version: 1, items: [{ id: 'a', n: 1 }] })
  })

  it('returns the same array until something changes', () => {
    const { s } = store()
    s.setAll([{ id: 'a', n: 1 }])
    expect(s.getAll()).toBe(s.getAll())
  })

  it('keeps valid entries, drops corrupt ones, and writes the cleaned list back', () => {
    const raw = JSON.stringify({ version: 1, items: [{ id: 'a', n: 1 }, { id: 2 }, 'junk'] })
    const { s, storage } = store({ k: raw })
    expect(s.getAll()).toEqual([{ id: 'a', n: 1 }])
    expect(JSON.parse(storage.get('k')!).items).toEqual([{ id: 'a', n: 1 }])
  })

  it.each([
    ['unparseable JSON', '{oops'],
    ['a wrong version', JSON.stringify({ version: 2, items: [{ id: 'a', n: 1 }] })],
    ['a wrong shape', JSON.stringify([{ id: 'a', n: 1 }])],
  ])('recovers from %s with an empty list', (_label, raw) => {
    const { s } = store({ k: raw })
    expect(s.getAll()).toEqual([])
  })

  it('refuses to write invalid items', () => {
    const { s } = store()
    expect(() => s.setAll([{ id: 'a' } as never])).toThrow()
  })

  it('notifies subscribers on change and on cross-tab storage events for its key', () => {
    const { s, events } = store()
    const listener = vi.fn()
    const unsubscribe = s.subscribe(listener)
    s.update((items) => [...items, { id: 'a', n: 1 }])
    events.fire('k')
    events.fire(null)
    events.fire('other')
    expect(listener).toHaveBeenCalledTimes(3)
    unsubscribe()
    s.setAll([])
    events.fire('k')
    expect(listener).toHaveBeenCalledTimes(3)
  })

  it('works in memory when storage is unavailable', () => {
    const storage = createSafeStorage(() => null)
    const s = createCollectionStore({ key: 'k', itemSchema: Item, storage, events: new Events() })
    expect(s.setAll([{ id: 'a', n: 1 }])).toBe(false)
    expect(s.getAll()).toEqual([{ id: 'a', n: 1 }])
  })
})
