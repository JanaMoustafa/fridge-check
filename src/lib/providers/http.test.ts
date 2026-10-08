import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server, interceptExternalApis } from '../../../tests/msw/server'
import { fetchJson, mapLimit, ProviderError } from './http'

interceptExternalApis()

const URL_WITH_KEY = new URL('https://api.example.test/v1/secret-key-123/thing?apiKey=hunter2')
const options = { provider: 'spoonacular', label: 'thing' } as const

async function failure(promise: Promise<unknown>): Promise<ProviderError> {
  const error = await promise.then(
    () => undefined,
    (caught: unknown) => caught,
  )
  expect(error).toBeInstanceOf(ProviderError)
  return error as ProviderError
}

describe('fetchJson', () => {
  it('returns the parsed body and sends the given headers', async () => {
    let seen: Headers | undefined
    server.use(
      http.get('https://api.example.test/*', ({ request }) => {
        seen = request.headers
        return HttpResponse.json({ ok: true })
      }),
    )
    expect(await fetchJson(URL_WITH_KEY, { ...options, headers: { 'x-api-key': 'k' } })).toEqual({
      ok: true,
    })
    expect(seen?.get('x-api-key')).toBe('k')
    expect(seen?.get('accept')).toBe('application/json')
  })

  it.each([
    [402, 'quota'],
    [429, 'rate-limit'],
    [401, 'auth'],
    [403, 'auth'],
    [404, 'not-found'],
    [500, 'http'],
    [503, 'http'],
  ] as const)('maps HTTP %i to %s', async (status, kind) => {
    server.use(http.get('https://api.example.test/*', () => new HttpResponse('nope', { status })))
    const error = await failure(fetchJson(URL_WITH_KEY, options))
    expect([error.kind, error.status]).toEqual([kind, status])
  })

  it('reads Retry-After seconds from a 429', async () => {
    server.use(
      http.get(
        'https://api.example.test/*',
        () => new HttpResponse(null, { status: 429, headers: { 'Retry-After': '17' } }),
      ),
    )
    expect((await failure(fetchJson(URL_WITH_KEY, options))).retryAfter).toBe(17)
  })

  it('ignores a Retry-After that is not a number of seconds', async () => {
    server.use(
      http.get(
        'https://api.example.test/*',
        () => new HttpResponse(null, { status: 429, headers: { 'Retry-After': 'soon' } }),
      ),
    )
    expect((await failure(fetchJson(URL_WITH_KEY, options))).retryAfter).toBeUndefined()
  })

  it('reports a body that is not JSON', async () => {
    server.use(http.get('https://api.example.test/*', () => HttpResponse.text('<html>')))
    expect((await failure(fetchJson(URL_WITH_KEY, options))).kind).toBe('invalid-response')
  })

  it('reports a network failure', async () => {
    server.use(http.get('https://api.example.test/*', () => HttpResponse.error()))
    expect((await failure(fetchJson(URL_WITH_KEY, options))).kind).toBe('network')
  })

  it('gives up after the timeout', async () => {
    server.use(
      http.get('https://api.example.test/*', async () => {
        await delay(500)
        return HttpResponse.json({})
      }),
    )
    const error = await failure(fetchJson(URL_WITH_KEY, { ...options, timeoutMs: 20 }))
    expect(error.kind).toBe('timeout')
  })

  it('stops when the caller aborts (the whole search ran out of time)', async () => {
    server.use(
      http.get('https://api.example.test/*', async () => {
        await delay(500)
        return HttpResponse.json({})
      }),
    )
    const error = await failure(
      fetchJson(URL_WITH_KEY, { ...options, signal: AbortSignal.timeout(20) }),
    )
    expect(error.kind).toBe('timeout')
  })

  it('never puts the URL (which may hold a key) in the message', async () => {
    server.use(
      http.get('https://api.example.test/*', () => new HttpResponse(null, { status: 500 })),
    )
    const error = await failure(fetchJson(URL_WITH_KEY, options))
    expect(error.message).toBe('spoonacular thing: http (HTTP 500)')
    expect(error.message).not.toMatch(/secret|hunter2|example/)
  })
})

describe('mapLimit', () => {
  it('keeps input order and never runs more than the limit at once', async () => {
    let running = 0
    let peak = 0
    const result = await mapLimit([30, 10, 20, 5, 1], 2, async (ms) => {
      running++
      peak = Math.max(peak, running)
      await new Promise((resolve) => setTimeout(resolve, ms))
      running--
      return ms * 2
    })
    expect(result).toEqual([60, 20, 40, 10, 2])
    expect(peak).toBe(2)
  })

  it('handles an empty list', async () => {
    expect(await mapLimit([], 4, async () => 1)).toEqual([])
  })

  it('rejects with the first failure', async () => {
    await expect(
      mapLimit([1, 2, 3], 2, async (n) => {
        if (n === 2) throw new Error('two')
        return n
      }),
    ).rejects.toThrow('two')
  })
})
