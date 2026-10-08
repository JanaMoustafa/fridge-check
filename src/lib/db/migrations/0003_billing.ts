import { sql, type Kysely } from 'kysely'

/**
 * Pro billing: the user's access (subscription), each XPay checkout (payment) and every verified
 * webhook (webhook_event). XPay's webhooks are the only thing that marks a payment paid.
 */
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('subscription')
    .addColumn('id', 'text', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()::text`))
    .addColumn('user_id', 'text', (col) =>
      col.notNull().unique().references('user.id').onDelete('cascade'),
    )
    .addColumn('plan', 'text', (col) => col.notNull().check(sql`plan in ('pro_monthly')`))
    .addColumn('status', 'text', (col) =>
      col.notNull().check(sql`status in ('active', 'past_due', 'canceled', 'expired')`),
    )
    .addColumn('cancel_at_period_end', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('xpay_customer_id', 'text')
    .addColumn('xpay_subscription_id', 'text')
    .addColumn('xpay_checkout_session_id', 'text')
    .addColumn('current_period_start', 'timestamptz', (col) => col.notNull())
    .addColumn('current_period_end', 'timestamptz', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addCheckConstraint('subscription_period_order', sql`current_period_end > current_period_start`)
    .execute()

  await db.schema
    .createTable('payment')
    .addColumn('id', 'text', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()::text`))
    .addColumn('user_id', 'text', (col) => col.references('user.id').onDelete('set null'))
    .addColumn('plan', 'text', (col) => col.notNull().check(sql`plan in ('pro_monthly')`))
    .addColumn('status', 'text', (col) =>
      col.notNull().check(sql`status in ('pending', 'paid', 'failed', 'expired', 'refunded')`),
    )
    .addColumn('xpay_checkout_session_id', 'text', (col) => col.notNull().unique())
    .addColumn('xpay_payment_intent_id', 'text')
    .addColumn('xpay_customer_id', 'text')
    .addColumn('amount_minor', 'integer', (col) => col.notNull().check(sql`amount_minor > 0`))
    .addColumn('currency', 'text', (col) => col.notNull())
    .addColumn('period_start', 'timestamptz')
    .addColumn('period_end', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute()
  await db.schema.createIndex('payment_user_id_idx').on('payment').column('user_id').execute()

  await db.schema
    .createTable('webhook_event')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('livemode', 'boolean', (col) => col.notNull())
    .addColumn('payload', 'jsonb', (col) => col.notNull())
    .addColumn('received_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('processed_at', 'timestamptz')
    .addColumn('error', 'text')
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('webhook_event').execute()
  await db.schema.dropTable('payment').execute()
  await db.schema.dropTable('subscription').execute()
}
