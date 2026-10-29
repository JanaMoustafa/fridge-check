import 'server-only'
import type { ReadValues } from '@/lib/nutritionist/inbody-reply'
import { INBODY_MEDIA_TYPES, type InbodyMediaType, type ReadOutcome } from './inbody-reader'
import type { RateLimitVerdict } from './rate-limit'

/** The browser shrinks photos well below this; anything bigger is refused before reading. */
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024
/** Photo reads per member per hour (each one is a paid Claude request). */
export const READS_PER_HOUR = 10

export type ReadFailure =
  | 'signed_out'
  | 'not_pro'
  | 'no_photo'
  | 'bad_type'
  | 'too_large'
  | 'rate_limited'
  | 'not_configured'
  | 'no_credit'
  | 'not_inbody'
  | 'unreadable'
  | 'refused'
  | 'upstream'

export type ReadResponse =
  { ok: true; values: ReadValues; found: number } | { ok: false; error: ReadFailure }

const STATUS: Record<ReadFailure, number> = {
  signed_out: 401,
  not_pro: 403,
  no_photo: 400,
  bad_type: 415,
  too_large: 413,
  rate_limited: 429,
  not_configured: 503,
  no_credit: 503,
  not_inbody: 422,
  unreadable: 422,
  refused: 422,
  upstream: 502,
}

export interface ReadRequestDeps {
  userId: () => Promise<string | null>
  isPro: (userId: string) => Promise<boolean>
  limiter: { check: (key: string) => RateLimitVerdict }
  read: (image: { mediaType: InbodyMediaType; base64: string }) => Promise<ReadOutcome>
}

function fail(error: ReadFailure, headers: Record<string, string> = {}): Response {
  const body: ReadResponse = { ok: false, error }
  return Response.json(body, {
    status: STATUS[error],
    headers: { 'Cache-Control': 'no-store', ...headers },
  })
}

const isMediaType = (type: string): type is InbodyMediaType =>
  (INBODY_MEDIA_TYPES as readonly string[]).includes(type)

/**
 * POST /api/inbody/read: a signed-in Pro member sends one photo (form field `photo`) and gets the
 * numbers read from it back to check. Nothing is saved here; the member confirms the numbers and
 * saves them with the scan form.
 */
export async function handleReadRequest(
  request: Request,
  deps: ReadRequestDeps,
): Promise<Response> {
  const userId = await deps.userId()
  if (!userId) return fail('signed_out')
  if (!(await deps.isPro(userId))) return fail('not_pro')

  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_PHOTO_BYTES + 64 * 1024) return fail('too_large')
  let photo: FormDataEntryValue | null
  try {
    photo = (await request.formData()).get('photo')
  } catch {
    return fail('no_photo')
  }
  if (!(photo instanceof File) || photo.size === 0) return fail('no_photo')
  if (!isMediaType(photo.type)) return fail('bad_type')
  if (photo.size > MAX_PHOTO_BYTES) return fail('too_large')

  const verdict = deps.limiter.check(userId)
  if (!verdict.allowed) {
    return fail('rate_limited', { 'Retry-After': String(verdict.retryAfterSeconds) })
  }

  const base64 = Buffer.from(await photo.arrayBuffer()).toString('base64')
  const outcome = await deps.read({ mediaType: photo.type, base64 })
  if (!outcome.ok) return fail(outcome.reason)
  if (!outcome.result.isInBody || outcome.result.found === 0) {
    console.warn('[inbody] photo read but unusable:', {
      isInBody: outcome.result.isInBody,
      found: outcome.result.found,
    })
    return fail(outcome.result.isInBody ? 'unreadable' : 'not_inbody')
  }
  const body: ReadResponse = {
    ok: true,
    values: outcome.result.values,
    found: outcome.result.found,
  }
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' } })
}
