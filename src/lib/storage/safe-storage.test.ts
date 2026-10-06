import { describe, expect, it, vi } from 'vitest'
import { createSafeStorage, localStore, sessionStore } from './safe-storage'

class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  failWrites = false
  failReads = false
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(key: string) {
    if (this.failReads) throw new Error('SecurityError')
    return this.data.get(key) ?? null
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null
  }
  removeItem(key: string) {
    if (this.failWrites) throw new Error('SecurityError')
    this.data.delete(key)
  }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new DOMException('quota', 'QuotaExceededError')
    this.data.set(key, value)
  }
}

describe('createSafeStorage', () => {
  it('persists through working storage', () => {
    const backing = new MemoryStorage()
    const store = createSafeStorage(() => backing)
    expect(store.set('k', 'v')).toBe(true)
    expect(store.get('k')).toBe('v')
    expect(backing.getItem('k')).toBe('v')
    expect(store.mode()).toBe('persistent')
    store.remove('k')
    expect(store.get('k')).toBeNull()
  })

  it('falls back to memory when storage is missing', () => {
    const onDegrade = vi.fn()
    const store = createSafeStorage(() => null)
    store.onDegrade(onDegrade)
    expect(store.set('k', 'v')).toBe(false)
    expect(store.get('k')).toBe('v')
    expect(store.mode()).toBe('memory')
    expect(onDegrade).toHaveBeenCalledTimes(1)
    store.remove('k')
    expect(store.get('k')).toBeNull()
  })

  it('falls back to memory when accessing storage throws (Safari private mode)', () => {
    const store = createSafeStorage(() => {
      throw new Error('SecurityError')
    })
    expect(store.get('k')).toBeNull()
    expect(store.set('k', 'v')).toBe(false)
    expect(store.get('k')).toBe('v')
    expect(store.mode()).toBe('memory')
  })

  it('treats a storage whose probe write fails as memory-only', () => {
    const backing = new MemoryStorage()
    backing.failWrites = true
    const store = createSafeStorage(() => backing)
    expect(store.mode()).toBe('memory')
  })

  it('keeps persisted values readable after a quota error and overlays new writes in memory', () => {
    const backing = new MemoryStorage()
    backing.setItem('old', 'persisted')
    const onDegrade = vi.fn()
    const store = createSafeStorage(() => backing)
    store.onDegrade(onDegrade)
    expect(store.mode()).toBe('persistent')

    backing.failWrites = true
    expect(store.set('new', 'value')).toBe(false)
    expect(store.get('new')).toBe('value')
    expect(store.get('old')).toBe('persisted')
    expect(store.mode()).toBe('memory')

    store.remove('old')
    expect(store.get('old')).toBeNull()
    expect(store.set('again', 'x')).toBe(false)
    expect(onDegrade).toHaveBeenCalledTimes(1)
  })

  it('degrades when a remove fails', () => {
    const backing = new MemoryStorage()
    backing.setItem('k', 'v')
    const store = createSafeStorage(() => backing)
    store.get('k')
    backing.failWrites = true
    store.remove('k')
    expect(store.get('k')).toBeNull()
    expect(store.mode()).toBe('memory')
  })

  it('returns null when a read throws', () => {
    const backing = new MemoryStorage()
    const store = createSafeStorage(() => backing)
    store.mode()
    backing.failReads = true
    expect(store.get('k')).toBeNull()
  })

  it('stops notifying an unsubscribed listener', () => {
    const listener = vi.fn()
    const store = createSafeStorage(() => null)
    const unsubscribe = store.onDegrade(listener)
    unsubscribe()
    store.mode()
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('default stores outside the browser', () => {
  it('work in memory when window is undefined', () => {
    expect(localStore.set('k', 'v')).toBe(false)
    expect(localStore.get('k')).toBe('v')
    expect(sessionStore.mode()).toBe('memory')
  })
})
