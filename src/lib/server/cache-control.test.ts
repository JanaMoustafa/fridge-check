import { describe, expect, it } from 'vitest'
import { detailCacheControl, searchCacheControl } from './cache-control'

describe('searchCacheControl', () => {
  it('keeps local and TheMealDB results an hour, revalidating in the background', () => {
    expect(searchCacheControl({ provider: 'local' })).toBe(
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    )
    expect(searchCacheControl({ provider: 'mealdb' })).toContain('s-maxage=3600')
  })

  it('keeps Spoonacular results half an hour, never stale', () => {
    expect(searchCacheControl({ provider: 'spoonacular' })).toBe('public, max-age=0, s-maxage=1800')
  })

  it('keeps a fallback answer a minute', () => {
    expect(searchCacheControl({ provider: 'local', notice: 'fallback-local' })).toBe(
      'public, max-age=0, s-maxage=60',
    )
  })
})

describe('detailCacheControl', () => {
  it('caches by the source that answered', () => {
    expect(detailCacheControl('local', 'local')).toContain('s-maxage=86400')
    expect(detailCacheControl('mealdb', 'mealdb')).toContain('s-maxage=86400')
    expect(detailCacheControl('spoonacular', 'spoonacular')).toBe(
      'public, max-age=0, s-maxage=1800',
    )
    expect(detailCacheControl('mealdb', 'local')).toBe('public, max-age=0, s-maxage=60')
  })
})
