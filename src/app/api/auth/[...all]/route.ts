import { getAuth } from '@/lib/auth/auth'

/** Better Auth's endpoints (Google sign-in, callback, session, sign-out). 404 when Pro is off. */
async function handle(request: Request): Promise<Response> {
  const auth = getAuth()
  if (!auth) return new Response('Not found', { status: 404 })
  return auth.handler(request)
}

export const GET = handle
export const POST = handle
