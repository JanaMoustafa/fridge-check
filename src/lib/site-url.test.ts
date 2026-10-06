import { describe, expect, it } from 'vitest'
import { cx } from './cx'
import { getSiteUrl } from './site-url'

describe('getSiteUrl', () => {
  it('prefers NEXT_PUBLIC_SITE_URL', () => {
    expect(
      getSiteUrl({
        NEXT_PUBLIC_SITE_URL: 'https://fridge.example',
        VERCEL_PROJECT_PRODUCTION_URL: 'x.vercel.app',
      }).origin,
    ).toBe('https://fridge.example')
  })

  it('falls back to the Vercel production host', () => {
    expect(getSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'fridge-check.vercel.app' }).origin).toBe(
      'https://fridge-check.vercel.app',
    )
  })

  it('ignores an invalid explicit URL', () => {
    expect(getSiteUrl({ NEXT_PUBLIC_SITE_URL: 'not a url' }).origin).toBe('http://localhost:3000')
  })

  it('defaults to localhost', () => {
    expect(getSiteUrl({}).origin).toBe('http://localhost:3000')
  })
})

describe('cx', () => {
  it('joins only truthy class names', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b')
  })
})
