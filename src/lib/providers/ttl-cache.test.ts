import { describe, expect, it, vi } from 'vitest'
import { createTtlCache } from './ttl-cache'

function clock(start = 0) {
  let time = start
  return { now: () => time, advance: (ms: number) => (time += ms) }
}

describe('createTtlCache', () => {
  it('loads once and serves the value until it expires', async () => {
    const time = clock()
    const cache = createTtlCache<number>({ ttlMs: 1000, maxEntries: 10, now: time.now })
    const load = vi.fn(async () => 42)
    expect(await cache.get('a', load)).toBe(42)
    time.advance(999)
    expect(await cache.get('a', load)).toBe(42)
    expect(load).toHaveBeenCalledTimes(1)
    time.advance(1)
    expect(await cache.get('a', load)).toBe(42)
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('shares one load between concurrent callers', async () => {
    const cache = createTtlCache<string>({ ttlMs: 1000, maxEntries: 10 })
    let resolve!: (value: string) => void
    const load = vi.fn(() => new Promise<string>((r) => (resolve = r)))
    const first = cache.get('k', load)
    const second = cache.get('k', load)
    resolve('done')
    expect(await Promise.all([first, second])).toEqual(['done', 'done'])
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('forgets a failed load, so the next call retries', async () => {
    const cache = createTtlCache<string>({ ttlMs: 1000, maxEntries: 10 })
    await expect(cache.get('k', async () => Promise.reject(new Error('down')))).rejects.toThrow(
      'down',
    )
    expect(cache.size).toBe(0)
    expect(await cache.get('k', async () => 'up')).toBe('up')
  })

  it('keeps a newer entry when an older load for the same key fails late', async () => {
    const time = clock()
    const cache = createTtlCache<string>({ ttlMs: 10, maxEntries: 10, now: time.now })
    let fail!: (error: Error) => void
    const slow = cache.get('k', () => new Promise<string>((_, reject) => (fail = reject)))
    time.advance(10)
    expect(await cache.get('k', async () => 'fresh')).toBe('fresh')
    fail(new Error('late'))
    await expect(slow).rejects.toThrow('late')
    expect(await cache.get('k', async () => 'unused')).toBe('fresh')
  })

  it('evicts the least recently used entry beyond maxEntries', async () => {
    const cache = createTtlCache<string>({ ttlMs: 1000, maxEntries: 2 })
    await cache.get('a', async () => 'a')
    await cache.get('b', async () => 'b')
    await cache.get('a', async () => 'unused') // a is now the most recent
    await cache.get('c', async () => 'c')
    expect(cache.size).toBe(2)
    expect(await cache.get('a', async () => 'reloaded')).toBe('a')
    expect(await cache.get('b', async () => 'reloaded')).toBe('reloaded')
  })

  it('clears everything', async () => {
    const cache = createTtlCache<string>({ ttlMs: 1000, maxEntries: 2 })
    await cache.get('a', async () => 'a')
    cache.clear()
    expect(cache.size).toBe(0)
  })
})
