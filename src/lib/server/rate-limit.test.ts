import { describe, expect, it } from 'vitest'
import { ApiErrorSchema } from '@/types/api'
import {
  checkRateLimit,
  clientKey,
  createRateLimitGuard,
  createRateLimiter,
  rateLimitedResponse,
} from './rate-limit'

function clock(start = 0) {
  let time = start
  return { now: () => time, advance: (ms: number) => (time += ms) }
}

describe('createRateLimiter', () => {
  it('allows `limit` requests per window, then says when to retry', () => {
    const time = clock()
    const limiter = createRateLimiter({ limit: 2, now: time.now })
    expect(limiter.check('a')).toEqual({ allowed: true })
    expect(limiter.check('a')).toEqual({ allowed: true })
    time.advance(20_500)
    expect(limiter.check('a')).toEqual({ allowed: false, retryAfterSeconds: 40 })
    expect(limiter.check('b')).toEqual({ allowed: true })
    time.advance(39_500)
    expect(limiter.check('a')).toEqual({ allowed: true })
  })

  it('never asks to wait less than a second', () => {
    const time = clock()
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: time.now })
    limiter.check('a')
    time.advance(999)
    expect(limiter.check('a')).toEqual({ allowed: false, retryAfterSeconds: 1 })
  })

  it('bounds memory: expired keys go first, then the oldest', () => {
    const time = clock()
    const limiter = createRateLimiter({ limit: 5, windowMs: 1000, maxKeys: 3, now: time.now })
    limiter.check('a')
    limiter.check('b')
    time.advance(1000)
    limiter.check('c')
    limiter.check('d') // a and b expired: pruned
    expect(limiter.size).toBe(2)
    limiter.check('e')
    limiter.check('f') // nothing expired: the oldest (c) goes
    expect(limiter.size).toBe(3)
  })
})

describe('clientKey', () => {
  it('prefers x-real-ip, then the first x-forwarded-for address', () => {
    expect(clientKey(new Headers({ 'x-real-ip': ' 1.2.3.4 ', 'x-forwarded-for': '9.9.9.9' }))).toBe(
      '1.2.3.4',
    )
    expect(clientKey(new Headers({ 'x-forwarded-for': '5.6.7.8, 10.0.0.1' }))).toBe('5.6.7.8')
    expect(clientKey(new Headers())).toBe('unknown')
  })
})

describe('rate-limit responses', () => {
  it('answers 429 with Retry-After, uncached, in the API error shape', async () => {
    const response = rateLimitedResponse(12)
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('12')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(ApiErrorSchema.parse(await response.json()).error.code).toBe('rate-limited')
  })

  it('guards requests per client', () => {
    const guard = createRateLimitGuard({ limit: 1 })
    const from = (ip: string) =>
      new Request('http://localhost/api/recipes/search', { headers: { 'x-real-ip': ip } })
    expect(guard(from('1.1.1.1'))).toBeNull()
    expect(guard(from('1.1.1.1'))?.status).toBe(429)
    expect(guard(from('2.2.2.2'))).toBeNull()
  })

  it('is off under NODE_ENV=test', () => {
    const request = new Request('http://localhost/api/recipes/search')
    for (let i = 0; i < 100; i++) expect(checkRateLimit(request)).toBeNull()
  })
})
