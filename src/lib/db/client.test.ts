import { afterEach, describe, expect, it, vi } from 'vitest'

const pools: Array<{ options: { connectionString: string; max: number } }> = []
vi.mock('pg', () => ({
  Pool: class {
    constructor(readonly options: { connectionString: string; max: number }) {
      pools.push(this)
    }
  },
}))
const attachDatabasePool = vi.fn()
vi.mock('@vercel/functions', () => ({ attachDatabasePool }))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  pools.length = 0
})

describe('getDb', () => {
  it('needs DATABASE_URL', async () => {
    vi.stubEnv('DATABASE_URL', '')
    const { getDb } = await import('./client')
    expect(() => getDb()).toThrow(/DATABASE_URL is not set/)
  })

  it('opens one small pool per instance, with strict SSL, and lets Vercel manage it', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://u:p@db.example/neondb?sslmode=require')
    const { getDb } = await import('./client')
    expect(getDb()).toBe(getDb())
    expect(pools).toHaveLength(1)
    expect(pools[0]!.options.connectionString).toContain('sslmode=verify-full')
    expect(pools[0]!.options.max).toBe(5)
    expect(attachDatabasePool).toHaveBeenCalledWith(pools[0])
  })
})
