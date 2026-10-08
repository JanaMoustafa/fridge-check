import { describe, expect, it } from 'vitest'
import { parseServerEnv } from '@/lib/server/env'
import { localProvider } from './local'
import { createRegistry, getRegistry } from './registry'

describe('createRegistry', () => {
  it('answers searches locally by default and still opens TheMealDB links', () => {
    const registry = createRegistry(parseServerEnv({}))
    expect(registry.primary).toBe(localProvider)
    expect(registry.local).toBe(localProvider)
    expect(registry.forSource('local')).toBe(localProvider)
    expect(registry.forSource('mealdb')?.id).toBe('mealdb')
    expect(registry.forSource('spoonacular')).toBeUndefined()
  })

  it('uses the configured remote provider, built once', () => {
    const mealdb = createRegistry(parseServerEnv({ RECIPE_PROVIDER: 'mealdb' }))
    expect(mealdb.primary.id).toBe('mealdb')
    expect(mealdb.forSource('mealdb')).toBe(mealdb.primary)

    const spoonacular = createRegistry(
      parseServerEnv({ RECIPE_PROVIDER: 'spoonacular', SPOONACULAR_API_KEY: 'key' }),
    )
    expect(spoonacular.primary.id).toBe('spoonacular')
    expect(spoonacular.forSource('spoonacular')).toBe(spoonacular.primary)
  })

  it('opens Spoonacular links whenever a key is set', () => {
    const registry = createRegistry(parseServerEnv({ SPOONACULAR_API_KEY: 'key' }))
    expect(registry.primary).toBe(localProvider)
    expect(registry.forSource('spoonacular')?.id).toBe('spoonacular')
  })

  it('accepts a stand-in local provider', () => {
    const local = { ...localProvider }
    expect(createRegistry(parseServerEnv({}), { local }).primary).toBe(local)
  })
})

describe('getRegistry', () => {
  it('is built once per process from the environment', () => {
    expect(getRegistry()).toBe(getRegistry())
    expect(getRegistry().primary.id).toBe('local')
  })
})
