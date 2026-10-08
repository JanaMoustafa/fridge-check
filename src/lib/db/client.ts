import 'server-only'
import { attachDatabasePool } from '@vercel/functions'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { withStrictSsl } from './connection'
import type { Database } from './schema'

let db: Kysely<Database> | undefined

/**
 * The app's database (Neon Postgres in production, through its connection pooler). One small pool
 * per server instance; on Vercel, attachDatabasePool closes idle connections before an instance
 * is suspended. Throws when DATABASE_URL is not set: callers check isProConfigured() first.
 */
export function getDb(): Kysely<Database> {
  if (db) return db
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not set (see .env.example).')
  const pool = new Pool({
    connectionString: withStrictSsl(connectionString),
    max: 5,
    idleTimeoutMillis: 10_000,
  })
  attachDatabasePool(pool)
  db = new Kysely<Database>({ dialect: new PostgresDialect({ pool }) })
  return db
}
