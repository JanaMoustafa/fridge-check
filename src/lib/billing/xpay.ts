import 'server-only'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { PRO_CURRENCY, PRO_PERIOD_DAYS, PRO_PRICE_MINOR } from './plan'

/**
 * XPay Egypt's API (https://docs.xpay.app): hosted checkout sessions only. Card details are
 * entered on XPay's page and never reach this server; we keep XPay's ids, never card data.
 */
export const XPAY_API = 'https://api.xpay.app/'
const TIMEOUT_MS = 10_000

export class XPayError extends Error {
  constructor(
    readonly status: number | null,
    readonly code: string,
  ) {
    super(`XPay request failed: ${status ?? 'network'} ${code}`)
    this.name = 'XPayError'
  }
}

export const CheckoutSessionSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['open', 'complete', 'expired']),
  paymentStatus: z.enum(['paid', 'unpaid', 'no_payment_required']),
  paymentIntentId: z.string().nullish(),
  customerId: z.string().nullish(),
  amountTotal: z.number().int().nonnegative(),
  currency: z.string().min(3),
  metadata: z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]).nullish(),
  livemode: z.boolean().optional(),
  url: z.string().nullish(),
})
export type CheckoutSession = z.infer<typeof CheckoutSessionSchema>

const ErrorBodySchema = z.object({
  error: z.object({ code: z.string().optional(), type: z.string().optional() }).optional(),
})

export interface XPayClientOptions {
  secretKey: string
  fetchImpl?: typeof fetch
}

export interface CheckoutRequest {
  userId: string
  email: string
  name: string
  /** Absolute origin of this site, e.g. https://fridge-check-sooty.vercel.app */
  siteUrl: string
  locale: 'en' | 'ar'
}

/** The body of POST /checkout/sessions for one 30-day Pro pass. */
export function checkoutSessionBody({ userId, email, name, siteUrl, locale }: CheckoutRequest) {
  const site = siteUrl.replace(/\/$/, '')
  return {
    mode: 'payment',
    uiMode: 'hosted',
    currency: PRO_CURRENCY,
    lineItems: [
      {
        quantity: 1,
        priceData: {
          currency: PRO_CURRENCY,
          unitAmount: PRO_PRICE_MINOR,
          productData: {
            name: `Fridge Check Pro — ${PRO_PERIOD_DAYS} days`,
            description:
              locale === 'ar' ? 'القيم الغذائية وحصصك الشخصية' : 'Nutrition and personal portions',
          },
        },
      },
    ],
    customerDetails: { email, ...(name ? { name } : {}) },
    afterCompletion: {
      type: 'redirect',
      redirect: { url: `${site}/pro/success?session={CHECKOUT_SESSION_ID}` },
    },
    cancelUrl: `${site}/pro/failed`,
    metadata: { userId, plan: 'pro_monthly' },
    expiresAfterMinutes: 60,
  }
}

export function createXPayClient({ secretKey, fetchImpl = fetch }: XPayClientOptions) {
  async function request(method: 'GET' | 'POST', path: string, body?: unknown): Promise<unknown> {
    let response: Response
    try {
      response = await fetchImpl(new URL(path, XPAY_API), {
        method,
        headers: {
          authorization: `Bearer ${secretKey}`,
          accept: 'application/json',
          ...(body === undefined
            ? {}
            : { 'content-type': 'application/json', 'idempotency-key': randomUUID() }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: 'no-store',
      })
    } catch {
      throw new XPayError(null, 'network')
    }
    const json: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const parsed = ErrorBodySchema.safeParse(json)
      const code = parsed.success ? (parsed.data.error?.code ?? parsed.data.error?.type) : undefined
      throw new XPayError(response.status, code ?? 'http_error')
    }
    return json
  }

  const parseSession = (json: unknown): CheckoutSession => {
    const session = CheckoutSessionSchema.safeParse(json)
    if (!session.success) throw new XPayError(200, 'unexpected_response')
    return session.data
  }

  return {
    async createCheckoutSession(
      input: CheckoutRequest,
    ): Promise<CheckoutSession & { url: string }> {
      const session = parseSession(
        await request('POST', 'checkout/sessions', checkoutSessionBody(input)),
      )
      if (!session.url) throw new XPayError(200, 'no_checkout_url')
      return { ...session, url: session.url }
    },
    async getCheckoutSession(id: string): Promise<CheckoutSession> {
      return parseSession(await request('GET', `checkout/sessions/${encodeURIComponent(id)}`))
    },
  }
}
export type XPayClient = ReturnType<typeof createXPayClient>
