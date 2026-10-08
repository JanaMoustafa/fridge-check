import { describe, expect, it } from 'vitest'
import { parseServerEnv, serverEnv } from './env'

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
