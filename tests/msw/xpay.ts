import { http, HttpResponse } from 'msw'

export const XPAY_BASE = 'https://api.xpay.app'
export const TEST_XPAY_KEY = 'sk_test_fake_key_0123456789'

/** A checkout session as XPay returns it (camelCase, minor units). */
export function xpaySession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cs_test_abc123',
    object: 'checkout.session',
    status: 'open',
    paymentStatus: 'unpaid',
    paymentIntentId: null,
    customerId: null,
    amountTotal: 20000,
    currency: 'EGP',
    metadata: { userId: 'u1', plan: 'pro_monthly' },
    livemode: false,
    url: 'https://checkout.xpay.app/c/cs_test_abc123',
    expiresAt: '2026-10-09T13:00:00.000Z',
    createdAt: '2026-10-09T12:00:00.000Z',
    ...overrides,
  }
}

/** POST /checkout/sessions and GET /checkout/sessions/:id; requests are pushed to `requests`. */
export function xpayHandlers(requests: Request[] = [], session = xpaySession()) {
  return [
    http.post(`${XPAY_BASE}/checkout/sessions`, ({ request }) => {
      requests.push(request.clone())
      return HttpResponse.json(session, { status: 201 })
    }),
    http.get(`${XPAY_BASE}/checkout/sessions/:id`, ({ request, params }) => {
      requests.push(request.clone())
      return HttpResponse.json({ ...session, id: params.id })
    }),
  ]
}
