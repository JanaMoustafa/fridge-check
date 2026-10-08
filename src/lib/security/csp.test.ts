import { describe, expect, it } from 'vitest'
import { buildCsp, createNonce } from './csp'

describe('createNonce', () => {
  it('returns a fresh base64 value each call', () => {
    const a = createNonce()
    const b = createNonce()
    expect(a).not.toBe(b)
    expect(a).toMatch(/^[A-Za-z0-9+/]+=*$/)
  })
})

describe('buildCsp', () => {
  const prod = buildCsp('abc', { dev: false, https: true })

  it('allows only nonce-bearing scripts in production', () => {
    expect(prod).toContain(`script-src 'self' 'nonce-abc' 'strict-dynamic'`)
    expect(prod).not.toContain('unsafe-eval')
  })

  it('allows unsafe-eval only in development', () => {
    expect(buildCsp('abc', { dev: true, https: false })).toContain(`'unsafe-eval'`)
  })

  it('limits images to self and the recipe providers', () => {
    expect(prod).toContain(
      `img-src 'self' data: blob: https://www.themealdb.com https://img.spoonacular.com`,
    )
  })

  it('forbids framing, plugins and foreign connections', () => {
    expect(prod).toContain(`frame-ancestors 'none'`)
    expect(prod).toContain(`object-src 'none'`)
    expect(prod).toContain(`connect-src 'self'`)
  })

  it('upgrades insecure requests only over https', () => {
    expect(prod).toContain('upgrade-insecure-requests')
    expect(buildCsp('abc', { dev: false, https: false })).not.toContain('upgrade-insecure-requests')
  })

  it('lets forms go only to this site and to XPay’s hosted checkout', () => {
    expect(buildCsp('abc', { dev: false, https: true })).toContain(
      "form-action 'self' https://checkout.xpay.app",
    )
  })
})
