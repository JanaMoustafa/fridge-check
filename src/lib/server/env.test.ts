import { describe, expect, it } from 'vitest'
import { parseServerEnv, proConfig, serverEnv } from './env'

describe('parseServerEnv', () => {
  it('defaults to the local provider with no keys', () => {
    expect(parseServerEnv({})).toEqual({
      RECIPE_PROVIDER: 'local',
      THEMEALDB_API_KEY: '1',
      RATE_LIMIT_PER_MINUTE: 60,
    })
  })

  it('treats empty strings as unset', () => {
    expect(parseServerEnv({ RECIPE_PROVIDER: '', SPOONACULAR_API_KEY: '' }).RECIPE_PROVIDER).toBe(
      'local',
    )
  })

  it('reads every setting', () => {
    expect(
      parseServerEnv({
        RECIPE_PROVIDER: 'spoonacular',
        SPOONACULAR_API_KEY: 'key',
        THEMEALDB_API_KEY: 'patreon',
        RATE_LIMIT_PER_MINUTE: '0',
      }),
    ).toEqual({
      RECIPE_PROVIDER: 'spoonacular',
      SPOONACULAR_API_KEY: 'key',
      THEMEALDB_API_KEY: 'patreon',
      RATE_LIMIT_PER_MINUTE: 0,
    })
  })

  it('rejects an unknown provider or a negative limit', () => {
    expect(() => parseServerEnv({ RECIPE_PROVIDER: 'edamam' })).toThrow()
    expect(() => parseServerEnv({ RATE_LIMIT_PER_MINUTE: '-1' })).toThrow()
  })

  it('requires a key for Spoonacular', () => {
    expect(() => parseServerEnv({ RECIPE_PROVIDER: 'spoonacular' })).toThrow(/SPOONACULAR_API_KEY/)
  })

  it('caches the process environment', () => {
    expect(serverEnv()).toBe(serverEnv())
  })
})

describe('proConfig', () => {
  const pro = {
    DATABASE_URL: 'postgresql://u:p@db.example/neondb',
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    BETTER_AUTH_URL: 'https://fridge-check.example',
    GOOGLE_CLIENT_ID: 'id.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 'GOCSPX-secret',
  }

  it('is complete only with the database, auth secret and URL, and Google credentials', () => {
    expect(proConfig(parseServerEnv(pro))).toEqual({
      databaseUrl: pro.DATABASE_URL,
      authSecret: pro.BETTER_AUTH_SECRET,
      authUrl: pro.BETTER_AUTH_URL,
      google: { clientId: pro.GOOGLE_CLIENT_ID, clientSecret: pro.GOOGLE_CLIENT_SECRET },
    })
    for (const key of Object.keys(pro)) {
      expect(proConfig(parseServerEnv({ ...pro, [key]: '' })), key).toBeNull()
    }
  })

  it('rejects a short auth secret or a URL that is not http(s)', () => {
    expect(() => parseServerEnv({ ...pro, BETTER_AUTH_SECRET: 'short' })).toThrow()
    expect(() => parseServerEnv({ ...pro, BETTER_AUTH_URL: 'ftp://x' })).toThrow()
  })
})
