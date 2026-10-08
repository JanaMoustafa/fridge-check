import type { Kysely } from 'kysely'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestDb } from '../../../tests/db/test-db'
import { xpaySession } from '../../../tests/msw/xpay'
import type { Database } from '@/lib/db/schema'
import { getProAccess } from './access'
import { confirmCheckout } from './confirm'
import { recordCheckoutStarted } from './webhook'
import { CheckoutSessionSchema } from './xpay'

const NOW = new Date('2026-10-09T12:00:00Z')
let db: Kysely<Database>

beforeAll(async () => {
  db = await createTestDb()
})
afterAll(async () => {
  await db.destroy()
})
beforeEach(async () => {
  await db.deleteFrom('payment').execute()
  await db.deleteFrom('user').execute()
  for (const id of ['u1', 'u2']) {
    await db
      .insertInto('user')
      .values({
        id,
        name: id,
        email: `${id}@example.com`,
        emailVerified: true,
        image: null,
        createdAt: NOW,
        updatedAt: NOW,
      })
      .execute()
  }
  await recordCheckoutStarted(db, 'u1', 'cs_1', NOW)
})

const xpayReturning = (overrides: Record<string, unknown>) => ({
  getCheckoutSession: vi.fn(async (id: string) =>
    CheckoutSessionSchema.parse(xpaySession({ id, ...overrides })),
  ),
})

describe('confirmCheckout', () => {
  it('asks XPay about a pending payment and grants Pro when it is paid', async () => {
    const xpay = xpayReturning({ status: 'complete', paymentStatus: 'paid' })
    expect(await confirmCheckout(db, xpay, 'u1', 'cs_1', NOW)).toBe('paid')
    expect(xpay.getCheckoutSession).toHaveBeenCalledWith('cs_1')
    expect((await getProAccess(db, 'u1', NOW)).isPro).toBe(true)
    // Settled: XPay is not asked again.
    expect(await confirmCheckout(db, xpay, 'u1', 'cs_1', NOW)).toBe('paid')
    expect(xpay.getCheckoutSession).toHaveBeenCalledTimes(1)
  })

  it('stays pending while XPay has not received the money (e.g. Fawry)', async () => {
    const xpay = xpayReturning({ status: 'complete', paymentStatus: 'unpaid' })
    expect(await confirmCheckout(db, xpay, 'u1', 'cs_1', NOW)).toBe('pending')
    expect((await getProAccess(db, 'u1', NOW)).isPro).toBe(false)
  })

  it('stays pending when XPay cannot be reached, for the webhook to settle', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const xpay = { getCheckoutSession: vi.fn(async () => Promise.reject(new Error('down'))) }
    expect(await confirmCheckout(db, xpay, 'u1', 'cs_1', NOW)).toBe('pending')
    expect(await confirmCheckout(db, null, 'u1', 'cs_1', NOW)).toBe('pending')
  })

  it('never looks up a session that is not this user’s', async () => {
    const xpay = xpayReturning({ paymentStatus: 'paid' })
    expect(await confirmCheckout(db, xpay, 'u2', 'cs_1', NOW)).toBe('unknown')
    expect(await confirmCheckout(db, xpay, 'u1', 'cs_other', NOW)).toBe('unknown')
    expect(xpay.getCheckoutSession).not.toHaveBeenCalled()
  })

  it('reports a failed or expired payment', async () => {
    await db.updateTable('payment').set({ status: 'failed' }).execute()
    expect(await confirmCheckout(db, xpayReturning({}), 'u1', 'cs_1', NOW)).toBe('failed')
  })
})
