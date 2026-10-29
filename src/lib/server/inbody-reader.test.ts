import Anthropic from '@anthropic-ai/sdk'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readInbodyPhoto, type MessagesClient } from './inbody-reader'

const image = { mediaType: 'image/jpeg' as const, base64: 'aGVsbG8=' }
const replying = (response: unknown): MessagesClient => ({
  beta: { messages: { create: vi.fn().mockResolvedValue(response) } },
})
const failing = (error: unknown): MessagesClient => ({
  beta: { messages: { create: vi.fn().mockRejectedValue(error) } },
})

describe('readInbodyPhoto', () => {
  it('sends the photo with the reading instructions to Claude Opus 5.5', async () => {
    const client = replying({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: '{"isInBody": true, "weightKg": 68}' }],
    })
    const outcome = await readInbodyPhoto(image, client)
    expect(outcome).toMatchObject({ ok: true, result: { found: 1, values: { weightKg: '68' } } })
    const body = vi.mocked(client.beta.messages.create).mock.calls[0]![0] as Record<string, unknown>
    expect(body).toMatchObject({ model: 'claude-opus-5-5', fallbacks: 'default' })
    expect(JSON.stringify(body.messages)).toContain('"media_type":"image/jpeg"')
  })

  it('says why when it cannot read', async () => {
    expect(await readInbodyPhoto(image, null)).toEqual({ ok: false, reason: 'not_configured' })
    expect(await readInbodyPhoto(image, replying({ stop_reason: 'refusal', content: [] }))).toEqual(
      { ok: false, reason: 'refused' },
    )
    expect(
      await readInbodyPhoto(
        image,
        replying({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Sorry.' }] }),
      ),
    ).toEqual({
      ok: false,
      reason: 'unreadable',
    })
    const headers = new Headers()
    expect(
      await readInbodyPhoto(
        image,
        failing(new Anthropic.RateLimitError(429, {}, 'slow down', headers)),
      ),
    ).toEqual({
      ok: false,
      reason: 'rate_limited',
    })
    expect(
      await readInbodyPhoto(
        image,
        failing(new Anthropic.AuthenticationError(401, {}, 'bad key', headers)),
      ),
    ).toEqual({
      ok: false,
      reason: 'not_configured',
    })
    expect(
      await readInbodyPhoto(
        image,
        failing(new Anthropic.BadRequestError(400, {}, 'bad image', headers)),
      ),
    ).toEqual({
      ok: false,
      reason: 'unreadable',
    })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(await readInbodyPhoto(image, failing(new Error('network')))).toEqual({
      ok: false,
      reason: 'upstream',
    })
  })
})

describe('photo reading switch', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  async function freshReader(key: string | undefined) {
    vi.stubEnv('ANTHROPIC_API_KEY', key)
    vi.resetModules()
    return import('./inbody-reader')
  }

  it('is off without an Anthropic key, and members type their numbers instead', async () => {
    const reader = await freshReader(undefined)
    expect(reader.photoReadingEnabled()).toBe(false)
    expect(await reader.readInbodyPhoto(image)).toEqual({ ok: false, reason: 'not_configured' })
  })

  it('is on with a key', async () => {
    const reader = await freshReader('sk-ant-test')
    expect(reader.photoReadingEnabled()).toBe(true)
  })
})
