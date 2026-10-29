import { NextResponse, type NextRequest } from 'next/server'
import { entryDecision, SESSION_COOKIES, signInRequired } from '@/lib/auth/entry'
import { buildCsp, createNonce } from '@/lib/security/csp'

export function proxy(request: NextRequest) {
  const entry = entryDecision({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    hasSession: SESSION_COOKIES.some((name) => request.cookies.get(name)?.value),
    required: signInRequired(process.env),
  })
  if (entry.kind === 'welcome') {
    return NextResponse.redirect(new URL(entry.location, request.url))
  }
  if (entry.kind === 'unauthorized') {
    return Response.json(
      { error: { code: 'signed-out', message: 'Sign in to use BiteDoneRight.' } },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }

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
