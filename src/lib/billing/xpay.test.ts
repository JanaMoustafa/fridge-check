import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server, interceptExternalApis } from '../../../tests/msw/server'
import { TEST_XPAY_KEY, XPAY_BASE, xpayHandlers, xpaySession } from '../../../tests/msw/xpay'
import { checkoutSessionBody, createXPayClient, XPayError } from './xpay'

interceptExternalApis()

const input = {
  userId: 'u1',
  email: 'cook@example.com',
  name: 'Cook',
  siteUrl: 'https://fridge.example/',
  locale: 'en' as const,
}

describe('checkoutSessionBody', () => {
  it('asks XPay for a hosted page selling one 30-day pass at 200 EGP', () => {
    expect(checkoutSessionBody(input)).toMatchObject({
      mode: 'payment',
      uiMode: 'hosted',
      currency: 'EGP',
      lineItems: [{ quantity: 1, priceData: { currency: 'EGP', unitAmount: 20000 } }],
      customerDetails: { email: 'cook@example.com', name: 'Cook' },
      afterCompletion: {
        type: 'redirect',
        redirect: { url: 'https://fridge.example/pro/success?session={CHECKOUT_SESSION_ID}' },
      },
      cancelUrl: 'https://fridge.example/pro/failed',
      metadata: { userId: 'u1', plan: 'pro_monthly' },
    })
  })

  it('leaves out an empty name and describes the pass in Arabic for Arabic users', () => {
    const body = checkoutSessionBody({ ...input, name: '', locale: 'ar' })
    expect(body.customerDetails).toEqual({ email: 'cook@example.com' })
    expect(body.lineItems[0]!.priceData.productData.description).toMatch(/[؀-ۿ]/)
  })
})

describe('createXPayClient', () => {
  it('creates a checkout session with the secret key and an idempotency key', async () => {
    const requests: Request[] = []
    server.use(...xpayHandlers(requests))
    const session = await createXPayClient({ secretKey: TEST_XPAY_KEY }).createCheckoutSession(
      input,
    )
    expect(session).toMatchObject({
      id: 'cs_test_abc123',
      url: 'https://checkout.xpay.app/c/cs_test_abc123',
    })
    const sent = requests[0]!
    expect(sent.headers.get('authorization')).toBe(`Bearer ${TEST_XPAY_KEY}`)
    expect(sent.headers.get('idempotency-key')).toMatch(/^[0-9a-f-]{36}$/)
    expect(sent.url).not.toContain(TEST_XPAY_KEY)
    expect(await sent.json()).toMatchObject({ lineItems: [{ priceData: { unitAmount: 20000 } }] })
  })

  it('reads a session back', async () => {
    server.use(...xpayHandlers([], xpaySession({ status: 'complete', paymentStatus: 'paid' })))
    const session = await createXPayClient({ secretKey: TEST_XPAY_KEY }).getCheckoutSession(
      'cs_test_x',
    )
    expect(session).toMatchObject({ id: 'cs_test_x', paymentStatus: 'paid' })
  })

  it('reports XPay errors by status and code, network failures and odd answers', async () => {
    const client = createXPayClient({ secretKey: TEST_XPAY_KEY })
    server.use(
      http.post(`${XPAY_BASE}/checkout/sessions`, () =>
        HttpResponse.json({ error: { code: 'invalid_api_key' } }, { status: 401 }),
      ),
    )
    await expect(client.createCheckoutSession(input)).rejects.toMatchObject({
      status: 401,
      code: 'invalid_api_key',
    })
    server.use(http.post(`${XPAY_BASE}/checkout/sessions`, () => HttpResponse.error()))
    await expect(client.createCheckoutSession(input)).rejects.toMatchObject({
      status: null,
      code: 'network',
    })
    server.use(http.post(`${XPAY_BASE}/checkout/sessions`, () => HttpResponse.json({ nope: true })))
    await expect(client.createCheckoutSession(input)).rejects.toBeInstanceOf(XPayError)
    server.use(
      http.post(`${XPAY_BASE}/checkout/sessions`, () =>
        HttpResponse.json(xpaySession({ url: null })),
      ),
    )
    await expect(client.createCheckoutSession(input)).rejects.toMatchObject({
      code: 'no_checkout_url',
    })
    server.use(
      http.post(`${XPAY_BASE}/checkout/sessions`, () => new HttpResponse('down', { status: 503 })),
    )
    await expect(client.createCheckoutSession(input)).rejects.toMatchObject({
      status: 503,
      code: 'http_error',
    })
  })
})
