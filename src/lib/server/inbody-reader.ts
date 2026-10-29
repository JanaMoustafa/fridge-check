import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { INBODY_PROMPT, parseInbodyReply, type ReadResult } from '@/lib/nutritionist/inbody-reply'
import { serverEnv } from './env'

export const INBODY_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export type InbodyMediaType = (typeof INBODY_MEDIA_TYPES)[number]

export type ReadOutcome =
  | { ok: true; result: ReadResult }
  | { ok: false; reason: 'not_configured' | 'unreadable' | 'refused' | 'rate_limited' | 'upstream' }

/** Only the part of the SDK this module uses, so tests can pass a stand-in. */
export interface MessagesClient {
  beta: { messages: { create: (body: Record<string, unknown>) => Promise<unknown> } }
}

type ReplyBlock = { type: string; text?: string }

/** Whether photo reading is switched on (an Anthropic key is set). */
export function photoReadingEnabled(): boolean {
  return Boolean(serverEnv().ANTHROPIC_API_KEY)
}

/**
 * Reads the numbers on a photo of an InBody sheet with Claude. The photo is sent once and never
 * stored. Refusals, failures and replies without readable numbers come back as a reason, so the
 * member can type the numbers instead.
 */
export async function readInbodyPhoto(
  image: { mediaType: InbodyMediaType; base64: string },
  client: MessagesClient | null = defaultClient(),
): Promise<ReadOutcome> {
  if (!client) return { ok: false, reason: 'not_configured' }
  try {
    const response = (await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 8000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: image.mediaType, data: image.base64 },
            },
            { type: 'text', text: INBODY_PROMPT },
          ],
        },
      ],
    })) as { stop_reason?: string; content?: ReplyBlock[] }
    if (response.stop_reason === 'refusal') return { ok: false, reason: 'refused' }
    const text = (response.content ?? [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('')
    const result = parseInbodyReply(text)
    return result ? { ok: true, result } : { ok: false, reason: 'unreadable' }
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return { ok: false, reason: 'rate_limited' }
    if (
      error instanceof Anthropic.AuthenticationError ||
      error instanceof Anthropic.PermissionDeniedError
    ) {
      return { ok: false, reason: 'not_configured' }
    }
    if (error instanceof Anthropic.BadRequestError) return { ok: false, reason: 'unreadable' }
    console.error(
      '[inbody] read failed',
      error instanceof Anthropic.APIError ? error.status : error,
    )
    return { ok: false, reason: 'upstream' }
  }
}

let client: Anthropic | undefined
function defaultClient(): MessagesClient | null {
  const apiKey = serverEnv().ANTHROPIC_API_KEY
  if (!apiKey) return null
  client ??= new Anthropic({ apiKey })
  return client as unknown as MessagesClient
}
