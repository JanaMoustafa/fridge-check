# Launch checklist

What has to happen before Fridge Check takes real money, in order. Everything here happens in
outside dashboards; the code is ready. After changing any setting in Vercel, redeploy
(Vercel → Deployments → ⋯ → Redeploy) so the site picks it up.

## 1. Must do before charging anyone

### Replace the keys that were shared in chat

These keys were pasted into a chat while the app was built, so treat them as exposed. Make new
ones, put each new value in **both** `.env.local` (your computer) and Vercel → Settings →
Environment Variables (Production), then delete the old one.

| Key                                      | Where to make a new one                                                  | Notes                                                                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GOOGLE_CLIENT_SECRET`                   | Google Cloud → Google Auth Platform → Clients → your client → Add secret | Disable the old secret after the new one works.                                                                                                   |
| Neon database password                   | Neon → your project → Roles → `neondb_owner` → Reset password            | Then check `DATABASE_URL` in Vercel (set by the Neon integration) carries the new password, and update `PRODUCTION_DATABASE_URL` in `.env.local`. |
| `XPAY_SECRET_KEY`, `XPAY_WEBHOOK_SECRET` | Replaced by the live keys in step 3                                      | The test keys can also be rolled in XPay → Developers.                                                                                            |
| `SPOONACULAR_API_KEY`                    | spoonacular.com/food-api/console → Profile                               |                                                                                                                                                   |
| `FDC_API_KEY`                            | fdc.nal.usda.gov/api-key-signup                                          | Used only on your computer for `pnpm seed:nutrition`.                                                                                             |

`BETTER_AUTH_SECRET` was generated on your computer and never shared. Changing it signs everyone
out, so leave it unless it leaks.

### Move Vercel off the Hobby plan

The project runs on Vercel's **Hobby** plan, which Vercel allows for non-commercial use only. A
paid Pro pass makes the site commercial, so upgrade to **Vercel Pro** (Vercel → Settings →
Billing) before the first real payment.

### Publish the Google sign-in

While Google's app is in "Testing", only the test users you added can sign in.

1. Google Cloud → Google Auth Platform → **Branding**: app name "Fridge Check", a support
   email, and these links:
   - home page: `https://fridge-check-sooty.vercel.app`
   - privacy policy: `https://fridge-check-sooty.vercel.app/privacy`
   - terms of service: `https://fridge-check-sooty.vercel.app/terms`
2. **Audience** → **Publish app** → status "In production".
   - Fridge Check asks only for name, email and profile picture, so Google does not need to review
     the app.
   - Uploading a logo does start a brand check, which can take a few days.

### Switch XPay to live payments

1. Finish XPay's account activation: the identity and payout (bank) details XPay asks for. If
   XPay asks for the site's policies, they are at `/terms`, `/privacy` and `/refunds`.
2. In XPay's dashboard, switch to **live mode**:
   - **Developers → API keys:** create the live secret key (`sk_live_…`).
   - **Developers → Webhooks:** add the endpoint
     `https://fridge-check-sooty.vercel.app/api/webhooks/xpay` (or your own domain) with these
     events, then copy its signing secret (`whsec_…`):
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
     - `checkout.session.expired`
     - `refund.created`
3. Vercel → Production: set `XPAY_SECRET_KEY` and `XPAY_WEBHOOK_SECRET` to the live values,
   then redeploy.
4. Keep the test keys only in `.env.local`, so your computer never charges real cards.

### Have the legal pages checked

The privacy policy, terms of use and refund policy are on the site in English and Arabic
(`/privacy`, `/terms`, `/refunds`), linked from the footer, the sign-in card, the Pro page and the
health-data consent box. They were drafted to match exactly what the app does, but they are not
legal advice:

- Ask a local lawyer to review both languages before the first real payment.
- Egypt's Personal Data Protection Law (No. 151 of 2020) treats health data as sensitive and
  limits sending personal data abroad (the database is in Germany). Ask whether you need a license
  or registration before collecting it.
- Ask whether the terms need a business name or address instead of the brand alone, and which
  language prevails if the two versions differ.
- The texts live in `src/lib/legal/` (one file per page, English and Arabic together). After any
  change in meaning, update `LEGAL_UPDATED` in `src/lib/legal/document.ts`.

**Refunds in practice:** when someone asks within 14 days, refund the **full** amount from XPay's
dashboard. The app treats every refund as full and removes the Pro days that payment bought.

### Make one real payment

After the steps above:

1. Buy Pro with a real card on the live site and check the account page shows Pro.
2. Refund it from XPay's dashboard and check Pro ends.
3. Check the database recorded both:

   ```sql
   select status, amount_minor, created_at from payment order by created_at desc limit 3;
   select id, type, livemode, error from webhook_event order by received_at desc limit 5;
   ```

   The newest events should show `livemode = true` and no error.

## 2. Strongly recommended

- **TheMealDB supporter key.**
  - The built-in recipes and their photos come from TheMealDB, and its free key `1` is meant for
    development and education.
  - Become a supporter at themealdb.com and set `THEMEALDB_API_KEY` in Vercel.
- **Spoonacular plan.** The free plan allows 50 points a day for everyone together, fewer than 20
  searches. Read its terms for a paid app, then either:
  - keep the free plan (searches fall back to the built-in recipes when it runs out), or
  - upgrade to a paid plan, or
  - set `RECIPE_PROVIDER=local` to use only the built-in recipes.
- **Neon backups.** Check how far back Neon's free plan can restore. A paid plan keeps a longer
  history, which matters once real payments are in the database.
- **Your own domain** (optional). If you add one in Vercel → Domains, update these in the same
  sitting:
  - `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` in Vercel.
  - Google's authorized JavaScript origin and redirect URI (`<domain>/api/auth/callback/google`).
  - XPay's webhook endpoint.
- **Remove test Pro.** Revoke Pro from accounts used only for testing:
  `pnpm pro:revoke:prod <email>`.

## 3. After launch: what to watch

- **Payment problems:** any webhook XPay couldn't deliver or that failed is recorded with its
  error:
  ```sql
  select id, type, error, received_at from webhook_event
  where error is not null and error <> 'ignored' order by received_at desc;
  ```
  XPay retries failed deliveries by itself; an error that keeps repeating needs a look.
- **Server errors:** Vercel → your project → Logs, filtered to errors.
- **Spoonacular points:** the console shows daily use. A banner on the site says when the day's
  points are used up.
- **Renewals:** passes don't renew automatically. The account page reminds people 5 days before
  the end; there are no reminder emails yet.
