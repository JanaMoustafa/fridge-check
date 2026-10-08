import { PGlite } from '@electric-sql/pglite'
import { Kysely } from 'kysely'
import { PGliteDialect } from 'kysely-pglite-dialect'
import { assertMigrated, createMigrator } from '@/lib/db/migrator'
import type { Database } from '@/lib/db/schema'

/**
 * A fresh, fully migrated Postgres for one test file: PGlite runs real Postgres in-process, so
 * integration tests exercise the real SQL (constraints, unique keys, cascades) with no server.
 */
export async function createTestDb(): Promise<Kysely<Database>> {
  const db = new Kysely<Database>({ dialect: new PGliteDialect(new PGlite()) })
  assertMigrated(await createMigrator(db as Kysely<unknown>).migrateToLatest())
  return db
}
