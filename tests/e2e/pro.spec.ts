import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { setLocaleCookie, settleAnimations } from './helpers'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

// Signed-out behaviour. With accounts on (a developer's machine), the app sits behind sign-in:
// signed-out visitors meet the intro page and come back to where they were going. Without
// accounts (CI) these tests are skipped and the app is open.
test.describe('Signed out', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/pro')
    const configured = await page.getByRole('link', { name: 'Sign in to upgrade' }).isVisible()
    test.skip(!configured, 'Accounts are not configured in this environment')
  })

  test('meet the intro page: the mark, the line and Google sign-in', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/welcome$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Every bite, done right.' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'privacy policy' })).toHaveAttribute(
      'href',
      '/privacy',
    )
    // The intro page stands alone: no app navigation before signing in.
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0)
  })

  test('are sent to the intro page from any app page, and come back after signing in', async ({
    page,
  }) => {
    for (const path of [
      '/saved',
      '/recipe/local/53027?i=rice,onion',
      '/profile',
      '/nutritionist/scan',
      '/burn/exercise/c-squat',
      '/pro/success?session=cs_test_x',
    ]) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/welcome\?next=/)
      // The way back, once decoded, is the page they asked for (commas may arrive as %2C).
      const next = new URL(page.url()).searchParams.get('next')!
      expect(decodeURIComponent(next), path).toBe(path)
    }
    await page.goto('/pro')
    await expect(page.getByRole('link', { name: 'Sign in to upgrade' })).toHaveAttribute(
      'href',
      '/welcome?next=%2Fpro',
    )
  })

  test('can still read the legal and pricing pages', async ({ page }) => {
    for (const path of ['/privacy', '/terms', '/refunds', '/pro']) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(200)
      await expect(page).toHaveURL(path)
    }
  })

  test('get 401 from the APIs, and the XPay webhook still refuses unsigned calls', async ({
    request,
  }) => {
    expect((await request.get('/api/recipes/search?i=rice')).status()).toBe(401)
    const read = await request.post('/api/inbody/read', {
      multipart: { photo: { name: 'sheet.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('x') } },
    })
    expect(read.status()).toBe(401)
    const webhook = await request.post('/api/webhooks/xpay', {
      data: { id: 'evt_forged', type: 'checkout.session.completed' },
    })
    expect(webhook.status()).toBe(400)
  })

  for (const locale of ['en', 'ar'] as const) {
    for (const path of ['/welcome', '/pro']) {
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
