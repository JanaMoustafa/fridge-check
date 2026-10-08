export const IMAGE_HOSTS = ['https://www.themealdb.com', 'https://img.spoonacular.com'] as const

/** Where a checkout form may send the browser: XPay Egypt's hosted payment page. */
export const PAYMENT_HOSTS = ['https://checkout.xpay.app'] as const

export function createNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64')
}

export function buildCsp(nonce: string, { dev, https }: { dev: boolean; https: boolean }): string {
  const directives = [
    `default-src 'self'`,
    // 'unsafe-eval' is only needed by React's development tooling.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? ` 'unsafe-eval'` : ''}`,
    // Nonces cannot cover style attributes (next/image sizing, CSS custom properties), so inline styles stay allowed.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: ${IMAGE_HOSTS.join(' ')}`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    // XPay's hosted checkout: without JavaScript, the checkout form's redirect goes there.
    `form-action 'self' ${PAYMENT_HOSTS.join(' ')}`,
    `frame-ancestors 'none'`,
    `manifest-src 'self'`,
  ]
  if (https) directives.push('upgrade-insecure-requests')
  return directives.join('; ')
}
