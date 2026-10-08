import { describe, expect, it, vi } from 'vitest'
import { databaseUrl, withoutFlags } from './database-url'

describe('databaseUrl', () => {
  const env = {
    DATABASE_URL: 'postgresql://local/dev',
    PRODUCTION_DATABASE_URL: 'postgresql://neon/prod',
  }

  it('uses the local database by default', () => {
    expect(databaseUrl(['up'], env)).toBe('postgresql://local/dev')
  })

  it('uses the live database only with --production, and says so', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    expect(databaseUrl(['up', '--production'], env)).toBe('postgresql://neon/prod')
    expect(warn).toHaveBeenCalledWith('⚠ Using the LIVE database.')
    warn.mockRestore()
  })

  it('refuses to run without the setting it needs', () => {
    expect(() => databaseUrl([], {})).toThrow('DATABASE_URL is not set')
    expect(() => databaseUrl(['--production'], { DATABASE_URL: 'x' })).toThrow(
      'PRODUCTION_DATABASE_URL is not set',
    )
  })

  it('drops the flag from the remaining arguments', () => {
    expect(withoutFlags(['grant', '--production', 'a@b.c'])).toEqual(['grant', 'a@b.c'])
  })
})
