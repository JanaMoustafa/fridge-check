/**
 * The e2e member. Where accounts are switched on (a developer's machine with .env.local), the
 * whole app sits behind sign-in, so the suite runs as a member: global setup creates this user
 * and a session in the local database and hands Playwright the signed session cookie; teardown
 * removes them. Without accounts (CI) the app is open and the suite runs signed out.
 */
import { createHmac, randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { Pool } from 'pg'
import { signInRequired } from '../../src/lib/auth/entry'

export const MEMBER_ID = 'e2e-member'
export const STORAGE_STATE = 'tests/e2e/.auth/member.json'

export function loadLocalEnv(): void {
  if (existsSync('.env.local')) process.loadEnvFile('.env.local')
}

export function accountsOn(): boolean {
  loadLocalEnv()
  return signInRequired(process.env)
}

export async function createMember(baseURL: string): Promise<void> {
  mkdirSync(dirname(STORAGE_STATE), { recursive: true })
  if (!accountsOn()) {
    writeFileSync(STORAGE_STATE, JSON.stringify({ cookies: [], origins: [] }))
    return
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 })
  try {
    const now = new Date()
    await pool.query('delete from "user" where id = $1', [MEMBER_ID])
    await pool.query(
      `insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       values ($1, 'E2E Member', 'e2e@bitedoneright.test', true, $2, $2)`,
      [MEMBER_ID, now],
    )
    const token = randomBytes(24).toString('hex')
    await pool.query(
      `insert into session (id, token, "userId", "expiresAt", "createdAt", "updatedAt")
       values ($1, $2, $3, $4, $5, $5)`,
      [`${MEMBER_ID}-session`, token, MEMBER_ID, new Date(now.getTime() + 86_400_000), now],
    )
    // Better Auth's signed cookie: token + "." + base64 HMAC-SHA256 of the token.
    const signature = createHmac('sha256', process.env.BETTER_AUTH_SECRET!)
      .update(token)
      .digest('base64')
    const { hostname } = new URL(baseURL)
    writeFileSync(
      STORAGE_STATE,
      JSON.stringify({
        cookies: [
          {
            name: 'better-auth.session_token',
            value: encodeURIComponent(`${token}.${signature}`),
            domain: hostname,
            path: '/',
            expires: -1,
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
          },
        ],
        origins: [],
      }),
    )
  } finally {
    await pool.end()
  }
}

export async function removeMember(): Promise<void> {
  if (!accountsOn()) return
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 })
  try {
    await pool.query('delete from "user" where id = $1', [MEMBER_ID])
  } finally {
    await pool.end()
  }
}
