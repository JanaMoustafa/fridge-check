import { expect, test } from '@playwright/test'
import { hasHorizontalScroll, htmlAttrs, setLocaleCookie } from './helpers'

test.describe('app shell', () => {
  test('renders English, left-to-right, by default', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.getByRole('heading', { level: 1, name: "What's in your fridge?" }),
    ).toBeVisible()
    expect(await htmlAttrs(page)).toMatchObject({ lang: 'en', dir: 'ltr' })
  })

  test('serves a nonce-based Content-Security-Policy and security headers', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response?.headers() ?? {}
    expect(headers['content-security-policy']).toMatch(
      /script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/,
    )
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['permissions-policy']).toContain('camera=()')
  })

  test('runs without CSP violations or console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()))
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/')
    await page.goto('/saved')
    expect(errors).toEqual([])
  })

  test('switching to Arabic flips direction, translates, and persists in cookie + localStorage', async ({
    page,
    context,
  }) => {
    await page.goto('/')
    await page.getByRole('radio', { name: /AR/ }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ماذا يوجد في ثلاجتك؟')

    expect(await page.evaluate(() => localStorage.getItem('fc:locale'))).toBe('ar')
    expect((await context.cookies()).find((c) => c.name === 'NEXT_LOCALE')?.value).toBe('ar')

    await page.reload()
    expect(await htmlAttrs(page)).toMatchObject({ lang: 'ar', dir: 'rtl' })

    await page.getByRole('radio', { name: /EN/ }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText("What's in your fridge?")
  })

  test('the language toggle keeps client state (no full reload)', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => ((window as unknown as { __marker: number }).__marker = 42))
    await page.getByRole('radio', { name: /AR/ }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(
      42,
    )
  })

  test('restores the language from localStorage when the cookie is missing', async ({
    page,
    context,
  }) => {
    await context.addInitScript(() => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('fc:locale', 'ar')
        sessionStorage.setItem('seeded', '1')
      }
    })
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
    expect((await context.cookies()).find((c) => c.name === 'NEXT_LOCALE')?.value).toBe('ar')
  })

  test('uses the cookie to render Arabic on first paint', async ({ page, context, baseURL }) => {
    await setLocaleCookie(context, baseURL!, 'ar')
    const response = await page.goto('/')
    const html = (await response?.text()) ?? ''
    expect(html).toMatch(/<html[^>]*lang="ar"[^>]*dir="rtl"/)
  })

  test('the theme setting applies immediately and survives a reload', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open settings' }).click()
    const dialog = page.getByRole('dialog', { name: 'Settings' })
    await dialog.getByRole('radio', { name: 'Dark' }).click()
    expect((await htmlAttrs(page)).theme).toBe('dark')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await page.reload()
    expect((await htmlAttrs(page)).theme).toBe('dark')
  })

  test('the skip link moves focus to the main content', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard flow is covered on desktop')
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Skip to main content' })
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main')).toBeFocused()
  })

  test('navigates between tabs and marks the current page', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Main navigation' }).filter({ visible: true })
    await nav.getByRole('link', { name: 'Saved' }).click()
    await expect(page).toHaveURL(/\/saved$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Saved recipes' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Saved' })).toHaveAttribute('aria-current', 'page')
    await nav.getByRole('link', { name: 'Shopping list' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Shopping list' })).toBeVisible()
  })

  test('shows a helpful 404 page', async ({ page }) => {
    const response = await page.goto('/does-not-exist')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: "We couldn't find that page" })).toBeVisible()
  })

  test('the footer links to the privacy, terms and refund pages in both languages', async ({
    browser,
    baseURL,
  }) => {
    const pages = {
      en: [
        ['Privacy', 'Privacy policy'],
        ['Terms', 'Terms of use'],
        ['Refunds', 'Refund policy'],
      ],
      ar: [
        ['الخصوصية', 'سياسة الخصوصية'],
        ['الشروط', 'شروط الاستخدام'],
        ['الاسترداد', 'سياسة الاسترداد'],
      ],
    } as const
    for (const locale of ['en', 'ar'] as const) {
      // A fresh context per locale: no localStorage mirror from the other language.
      const context = await browser.newContext({ baseURL })
      await setLocaleCookie(context, baseURL!, locale)
      const page = await context.newPage()
      for (const [link, title] of pages[locale]) {
        await page.goto('/')
        const legal = page.getByRole('contentinfo').getByRole('navigation')
        await legal.getByRole('link', { name: link, exact: true }).click()
        await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
        await expect(page).toHaveTitle(new RegExp(title))
      }
      // The section index jumps to its section.
      await page
        .getByRole('navigation', { name: locale === 'en' ? 'On this page' : 'في هذه الصفحة' })
        .getByRole('link')
        .first()
        .click()
      await expect(page).toHaveURL(/\/refunds#window$/)
      await context.close()
    }
  })

  test('CSP and nonces cover 404s for unknown paths too', async ({ request }) => {
    for (const path of ['/api/does-not-exist', '/favicon.ico', '/icons/x', '/robots.txt']) {
      const response = await request.get(path)
      expect(response.status(), path).toBe(404)
      const csp = response.headers()['content-security-policy'] ?? ''
      const nonce = csp.match(/'nonce-([^']+)'/)?.[1]
      expect(nonce, path).toBeTruthy()
      const body = await response.text()
      const scripts = body.match(/<script\b[^>]*>/g) ?? []
      expect(scripts.length, path).toBeGreaterThan(0)
      for (const tag of scripts) expect(tag, path).toContain(`nonce="${nonce}"`)
    }
  })

  test('another tab follows a language change, with no mixed-language shell', async ({
    context,
  }) => {
    const first = await context.newPage()
    const second = await context.newPage()
    await first.goto('/')
    await second.goto('/')
    await first.getByRole('radio', { name: /AR/ }).click()
    await expect(first.locator('html')).toHaveAttribute('dir', 'rtl')

    await second.bringToFront()
    await expect(second.locator('html')).toHaveAttribute('lang', 'ar')
    await expect(second.locator('html')).toHaveAttribute('dir', 'rtl')
    await second
      .getByRole('navigation', { name: 'التنقل الرئيسي' })
      .filter({ visible: true })
      .getByRole('link', { name: 'المحفوظة' })
      .click()
    await expect(second.getByRole('heading', { level: 1 })).toHaveText('الوصفات المحفوظة')
    await expect(second.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(second.getByRole('radio', { name: /AR/ })).toHaveAttribute('aria-checked', 'true')
  })

  test('the last language tap wins on a slow connection', async ({ page }) => {
    await page.goto('/')
    // Delay server-component refreshes so the second tap lands while the first is pending.
    await page.route('**/*', async (route) => {
      if (route.request().headers()['rsc'] === '1') await new Promise((r) => setTimeout(r, 1200))
      await route.continue()
    })
    await page.getByRole('radio', { name: /AR/ }).click()
    await expect(page.getByRole('radio', { name: /AR/ })).toHaveAttribute('aria-checked', 'true')
    await page.getByRole('radio', { name: /EN/ }).click()
    await expect(page.getByRole('radio', { name: /EN/ })).toHaveAttribute('aria-checked', 'true')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en', { timeout: 10_000 })
    await page.waitForTimeout(1500)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText("What's in your fridge?")
  })

  test('explains why the language cannot change when cookies are blocked', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Document.prototype, 'cookie', {
        configurable: true,
        get: () => '',
        set: () => {},
      })
    })
    await page.goto('/')
    await page.getByRole('radio', { name: /AR/ }).click()
    await expect(page.getByRole('status').filter({ hasText: 'blocking cookies' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('focused controls are never hidden behind the mobile tab bar', async ({
    page,
    isMobile,
    baseURL,
  }) => {
    test.skip(isMobile, 'keyboard walk runs in the desktop project at a phone-sized viewport')
    for (const locale of ['en', 'ar'] as const) {
      for (const size of [
        { width: 320, height: 480 },
        { width: 375, height: 667 },
      ]) {
        await page.setViewportSize(size)
        await setLocaleCookie(page.context(), baseURL!, locale)
        await page.goto('/shopping-list')
        await page.evaluate((l) => localStorage.setItem('fc:locale', l), locale)
        await page.goto('/shopping-list')
        const barTop = await page
          .locator('nav')
          .last()
          .evaluate((el) => el.getBoundingClientRect().top)
        for (let i = 0; i < 14; i++) {
          await page.keyboard.press('Tab')
          const rect = await page.evaluate(() => {
            const el = document.activeElement as HTMLElement | null
            if (!el || el === document.body || el.closest('nav')) return null
            const r = el.getBoundingClientRect()
            return { top: r.top, bottom: r.bottom }
          })
          if (rect && rect.bottom > 0) {
            expect(
              rect.bottom,
              `${locale} ${size.width}x${size.height} tab ${i}`,
            ).toBeLessThanOrEqual(barTop)
          }
        }
      }
    }
  })

  for (const width of [320, 350, 360, 375, 390, 768, 1024, 1440]) {
    test(`has no horizontal scroll at ${width}px in both directions`, async ({
      browser,
      baseURL,
    }) => {
      for (const locale of ['en', 'ar'] as const) {
        // A fresh context per locale: no localStorage mirror from the other language.
        const context = await browser.newContext({ viewport: { width, height: 800 } })
        await setLocaleCookie(context, baseURL!, locale)
        const page = await context.newPage()
        for (const path of ['/', '/saved', '/shopping-list', '/privacy']) {
          await page.goto(new URL(path, baseURL).toString())
          await expect(page.locator('html')).toHaveAttribute('lang', locale)
          await page.evaluate(() => document.fonts.ready)
          expect(await hasHorizontalScroll(page), `${locale} ${path}`).toBe(false)
        }
        await context.close()
      }
    })
  }
})
