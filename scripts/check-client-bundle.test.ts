import { describe, expect, it } from 'vitest'
import { findLeaks, secretNeedles, SECRET_NAMES } from './check-client-bundle'

describe('secretNeedles', () => {
  it('always includes the secret names', () => {
    expect(secretNeedles({})).toEqual([...SECRET_NAMES])
  })

  it('adds long secret values but skips short public ones', () => {
    expect(
      secretNeedles({ SPOONACULAR_API_KEY: 'ci-canary-1234567', THEMEALDB_API_KEY: '1' }),
    ).toEqual([...SECRET_NAMES, 'ci-canary-1234567'])
  })
})

describe('findLeaks', () => {
  it('finds names and values in bundle text', () => {
    const bundle = 'var a="ci-canary-1234567";process.env.SPOONACULAR_API_KEY'
    expect(findLeaks(bundle, ['SPOONACULAR_API_KEY', 'ci-canary-1234567', 'absent'])).toEqual([
      'SPOONACULAR_API_KEY',
      'ci-canary-1234567',
    ])
  })
})
