import { describe, expect, it, vi } from 'vitest'
import { handleReadRequest, MAX_PHOTO_BYTES, type ReadRequestDeps } from './inbody-read-request'
import type { ReadOutcome } from './inbody-reader'

const VALUES = {
  scannedOn: '',
  weightKg: '68',
  smmKg: '',
  bfmKg: '',
  pbf: '',
  bmrKcal: '',
  vfl: '',
  tbwL: '',
}

function deps(overrides: Partial<ReadRequestDeps> = {}): ReadRequestDeps {
  return {
    userId: async () => 'user-1',
    isPro: async () => true,
    limiter: { check: () => ({ allowed: true }) },
    read: vi.fn(async (): Promise<ReadOutcome> => ({
      ok: true,
      result: { isInBody: true, values: VALUES, found: 1 },
    })),
    ...overrides,
  }
}

function upload(file?: File, headers: Record<string, string> = {}): Request {
  const form = new FormData()
  if (file) form.set('photo', file)
  return new Request('http://localhost/api/inbody/read', { method: 'POST', body: form, headers })
}

const jpeg = (bytes = 10) => new File([new Uint8Array(bytes)], 'sheet.jpg', { type: 'image/jpeg' })

async function result(response: Response) {
  return { status: response.status, body: (await response.json()) as unknown }
}

describe('handleReadRequest', () => {
  it('reads a photo for a signed-in Pro member', async () => {
    const d = deps()
    const response = await handleReadRequest(upload(jpeg()), d)
    expect(await result(response)).toEqual({
      status: 200,
      body: { ok: true, values: VALUES, found: 1 },
    })
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(d.read).toHaveBeenCalledWith({ mediaType: 'image/jpeg', base64: 'AAAAAAAAAAAAAA==' })
  })

  it('checks who is asking before reading anything', async () => {
    expect(
      await result(await handleReadRequest(upload(jpeg()), deps({ userId: async () => null }))),
    ).toEqual({
      status: 401,
      body: { ok: false, error: 'signed_out' },
    })
    expect(
      await result(await handleReadRequest(upload(jpeg()), deps({ isPro: async () => false }))),
    ).toEqual({
      status: 403,
      body: { ok: false, error: 'not_pro' },
    })
  })

  it('refuses missing, wrong and oversized photos', async () => {
    const status = async (request: Request) => (await handleReadRequest(request, deps())).status
    expect(await status(upload())).toBe(400)
    expect(await status(upload(new File([], 'empty.jpg', { type: 'image/jpeg' })))).toBe(400)
    expect(await status(new Request('http://localhost/', { method: 'POST', body: 'x' }))).toBe(400)
    expect(await status(upload(new File(['%PDF'], 'sheet.pdf', { type: 'application/pdf' })))).toBe(
      415,
    )
    expect(await status(upload(jpeg(MAX_PHOTO_BYTES + 1)))).toBe(413)
    expect(await status(upload(jpeg(), { 'content-length': String(MAX_PHOTO_BYTES * 2) }))).toBe(
      413,
    )
  })

  it('limits how often a member can read', async () => {
    const d = deps({ limiter: { check: () => ({ allowed: false, retryAfterSeconds: 900 }) } })
    const response = await handleReadRequest(upload(jpeg()), d)
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('900')
    expect(d.read).not.toHaveBeenCalled()
  })

  it('passes on why a photo could not be read', async () => {
    const reading = (outcome: ReadOutcome) => deps({ read: async () => outcome })
    const check = async (outcome: ReadOutcome) =>
      result(await handleReadRequest(upload(jpeg()), reading(outcome)))
    expect(await check({ ok: false, reason: 'not_configured' })).toMatchObject({ status: 503 })
    expect(await check({ ok: false, reason: 'upstream' })).toMatchObject({ status: 502 })
    expect(
      await check({ ok: true, result: { isInBody: false, values: VALUES, found: 0 } }),
    ).toEqual({
      status: 422,
      body: { ok: false, error: 'not_inbody' },
    })
    expect(await check({ ok: true, result: { isInBody: true, values: VALUES, found: 0 } })).toEqual(
      {
        status: 422,
        body: { ok: false, error: 'unreadable' },
      },
    )
  })
})
