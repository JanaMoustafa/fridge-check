import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { setLocaleCookie, settleAnimations } from './helpers'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

// Signed-out behaviour of the Pro features. They exist only where Pro is configured (database,
// Google, auth secret); elsewhere (CI) these tests are skipped and the free app is unchanged.
test.describe('Pro, signed out', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pro')
    const configured = await page.getByRole('link', { name: 'Sign in to upgrade' }).isVisible()
    test.skip(!configured, 'Pro is not configured in this environment')
  })

  test('a free visitor sees the locked preview, and the page holds no nutrition numbers', async ({
    page,
  }) => {
    await page.goto('/recipe/local/53027?i=rice,onion')
    await expect(
      page.getByRole('heading', { name: "See this recipe's nutrition with Pro" }),
    ).toBeVisible()
    expect(await page.content()).not.toMatch(/\d[\d,.]*\s?kcal/)
    await page.getByRole('link', { name: 'Upgrade to Pro' }).click()
    await expect(page).toHaveURL(/\/pro$/)
    await expect(page.getByText('200 EGP')).toBeVisible()
  })

  test('Pro pages send signed-out visitors to sign in, then back', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/account\?next=%2Fprofile$/)
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
    await page.goto('/pro/success?session=cs_test_x')
    await expect(page).toHaveURL(/\/account\?next=/)
    await page.goto('/pro')
    await expect(page.getByRole('link', { name: 'Sign in to upgrade' })).toHaveAttribute(
      'href',
      '/account?next=%2Fpro',
    )
  })

  test('the header links to the account page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Account' }).click()
    await expect(page.getByRole('heading', { name: 'Personal nutrition with Pro' })).toBeVisible()
  })

  test('the XPay webhook refuses unsigned requests', async ({ request }) => {
    const response = await request.post('/api/webhooks/xpay', {
      data: { id: 'evt_forged', type: 'checkout.session.completed' },
    })
    expect(response.status()).toBe(400)
  })

  for (const locale of ['en', 'ar'] as const) {
    for (const path of ['/pro', '/account', '/pro/failed']) {
      test(`${path} (${locale}) has no axe violations`, async ({ page, context, baseURL }) => {
        await setLocaleCookie(context, baseURL!, locale)
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        await settleAnimations(page)
        const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
        expect(
          results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
        ).toEqual([])
      })
    }
  }
})
