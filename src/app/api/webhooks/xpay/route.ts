import { webhookSecret } from '@/lib/billing/config'
import { handleXPayEvent, verifySignature, XPayEventSchema } from '@/lib/billing/webhook'
import { getDb } from '@/lib/db/client'

/**
 * XPay's webhooks: the source of truth for payments. The raw body is verified against the
 * XPay-Signature header before anything is parsed; events are stored and applied idempotently.
 * Answers 2xx once handled (or deliberately ignored), 400 for a bad signature or body, and 500
 * when applying failed, so XPay retries.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = webhookSecret()
  if (!secret) return new Response('Not found', { status: 404 })

  const raw = await request.text()
  const check = verifySignature(raw, request.headers.get('xpay-signature'), secret, new Date())
  if (!check.ok) {
    console.warn(`[xpay] rejected webhook: signature ${check.reason}`)
    return Response.json({ error: 'invalid signature' }, { status: 400 })
  }
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return Response.json({ error: 'invalid body' }, { status: 400 })
  }
  const event = XPayEventSchema.safeParse(json)
  if (!event.success) return Response.json({ error: 'invalid event' }, { status: 400 })

  try {
    // Every event is stored in webhook_event (the audit log), with its outcome.
    const outcome = await handleXPayEvent(getDb(), event.data, new Date())
    return Response.json({ received: true, outcome })
  } catch (error) {
    console.error(
      `[xpay] ${event.data.id} ${event.data.type} failed:`,
      error instanceof Error ? error.message : error,
    )
    return Response.json({ error: 'processing failed' }, { status: 500 })
  }
}
