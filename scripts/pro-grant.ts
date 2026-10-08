/**
 * TESTING ONLY: gives a user Pro without paying, or takes it away, so the Pro screens can be
 * checked before (or without) a real XPay payment. Runs from a developer's machine against
 * DATABASE_URL; it is not part of the website and cannot be reached from a browser.
 *
 *   pnpm pro:grant <email> [days=30]   start (or extend from today) a Pro period
 *   pnpm pro:revoke <email>            end Pro now
 */
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { withStrictSsl } from '@/lib/db/connection'
import type { Database } from '@/lib/db/schema'

const DAY_MS = 24 * 60 * 60 * 1000

async function main([command, email, daysText]: string[]) {
  if ((command !== 'grant' && command !== 'revoke') || !email) {
    throw new Error('Usage: pnpm pro:grant <email> [days] | pnpm pro:revoke <email>')
  }
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not set (add it to .env.local).')
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString: withStrictSsl(connectionString), max: 1 }),
    }),
  })
  try {
    const user = await db
      .selectFrom('user')
      .select(['id', 'email'])
      .where('email', '=', email.toLowerCase())
      .executeTakeFirst()
    if (!user) throw new Error(`No user with email ${email}: sign in once first.`)
    const now = new Date()
    if (command === 'revoke') {
      await db
        .updateTable('subscription')
        .set({ status: 'expired', current_period_end: now, updated_at: now })
        .where('user_id', '=', user.id)
        .execute()
      console.log(`✓ Pro ended for ${user.email}.`)
      return
    }
    const days = Number(daysText ?? 30)
    if (!Number.isInteger(days) || days < 1 || days > 366) throw new Error('days must be 1-366.')
    const end = new Date(now.getTime() + days * DAY_MS)
    const period = {
      status: 'active' as const,
      cancel_at_period_end: false,
      current_period_start: now,
      current_period_end: end,
    }
    await db
      .insertInto('subscription')
      .values({
        user_id: user.id,
        plan: 'pro_monthly',
        xpay_customer_id: null,
        xpay_subscription_id: null,
        xpay_checkout_session_id: null,
        ...period,
      })
      .onConflict((conflict) =>
        conflict.column('user_id').doUpdateSet({ ...period, updated_at: now }),
      )
      .execute()
    console.log(
      `✓ ${user.email} has Pro until ${end.toISOString().slice(0, 10)} (testing grant, no payment).`,
    )
  } finally {
    await db.destroy()
  }
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
