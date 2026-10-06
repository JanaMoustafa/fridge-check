import { NextResponse, type NextRequest } from 'next/server'
import { buildCsp, createNonce } from '@/lib/security/csp'

export function proxy(request: NextRequest) {
  const nonce = createNonce()
  const csp = buildCsp(nonce, {
    dev: process.env.NODE_ENV === 'development',
    https: request.nextUrl.protocol === 'https:',
  })

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: [
    {
      // Exclusions are anchored to real static assets only, so every page — including 404s for
      // unknown paths such as /api/x or /favicon.ico — gets the CSP and nonces.
      source: '/((?!_next/static/|_next/image|icon\\.svg$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
