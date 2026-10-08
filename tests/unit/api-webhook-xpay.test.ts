import { createHmac } from 'node:crypto'
import type { Kysely } from 'kysely'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createTestDb } from '../db/test-db'
import type { Database } from '@/lib/db/schema'
import { recordCheckoutStarted } from '@/lib/billing/webhook'

const SECRET = 'whsec_route_test_secret'
const state = vi.hoisted(() => ({
  db: undefined as unknown,
  secret: 'whsec_route_test_secret' as string | null,
}))
vi.mock('@/lib/db/client', () => ({ getDb: () => state.db }))
vi.mock('@/lib/billing/config', () => ({ webhookSecret: () => state.secret }))

const { POST } = await import('@/app/api/webhooks/xpay/route')

let db: Kysely<Database>
beforeAll(async () => {
  db = await createTestDb()
  state.db = db
  const now = new Date()
  await db
    .insertInto('user')
    .values({
      id: 'u1',
      name: 'T',
      email: 't@example.com',
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    })
    .execute()
  await recordCheckoutStarted(db, 'u1', 'cs_route', now)
})
afterAll(async () => {
  await db.destroy()
})

function webhook(
  body: unknown,
  { secret = SECRET, signature }: { secret?: string; signature?: string } = {},
) {
  const raw = typeof body === 'string' ? body : JSON.stringify(body)
  const t = Math.floor(Date.now() / 1000)
  const v1 = createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex')
  return new Request('http://localhost/api/webhooks/xpay', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'xpay-signature': signature ?? `t=${t},v1=${v1}`,
    },
    body: raw,
  })
}

const paidEvent = (id: string, amountTotal = 20000) => ({
  id,
  object: 'event',
  type: 'checkout.session.completed',
  livemode: false,
  created: new Date().toISOString(),
  data: {
    object: {
      id: 'cs_route',
      status: 'complete',
      paymentStatus: 'paid',
      paymentIntentId: 'pi_1',
      amountTotal,
      currency: 'EGP',
    },
  },
})

describe('POST /api/webhooks/xpay', () => {
  it('rejects a missing or wrong signature without touching the database', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    expect((await POST(webhook(paidEvent('evt_a'), { signature: '' }))).status).toBe(400)
    expect((await POST(webhook(paidEvent('evt_a'), { secret: 'whsec_wrong' }))).status).toBe(400)
    expect(await db.selectFrom('webhook_event').selectAll().execute()).toEqual([])
  })

  it('rejects a signed body that is not an XPay event', async () => {
    expect((await POST(webhook('not json'))).status).toBe(400)
    expect((await POST(webhook({ hello: 'world' }))).status).toBe(400)
  })

  it('answers 500 when applying fails, so XPay retries', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const response = await POST(webhook(paidEvent('evt_bad', 1)))
    expect(response.status).toBe(500)
  })

  it('applies a verified payment and grants Pro, then acknowledges retries', async () => {
    const first = await POST(webhook(paidEvent('evt_ok')))
    expect(first.status).toBe(200)
    expect(await first.json()).toEqual({ received: true, outcome: 'processed' })
    const sub = await db.selectFrom('subscription').selectAll().executeTakeFirstOrThrow()
    expect(sub.status).toBe('active')
    const retry = await POST(webhook(paidEvent('evt_ok')))
    expect(await retry.json()).toEqual({ received: true, outcome: 'duplicate' })
  })

  it('is not there when payments are not configured', async () => {
    state.secret = null
    expect((await POST(webhook(paidEvent('evt_x')))).status).toBe(404)
    state.secret = SECRET
  })
})
