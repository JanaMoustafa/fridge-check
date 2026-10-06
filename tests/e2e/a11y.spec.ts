import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { setLocaleCookie } from './helpers'

const PAGES = ['/', '/saved', '/shopping-list', '/does-not-exist']
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

for (const locale of ['en', 'ar'] as const) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`accessibility · ${locale} · ${colorScheme}`, () => {
      test.use({ colorScheme })

      for (const path of PAGES) {
        test(`${path} has no axe violations`, async ({ page, context, baseURL }) => {
          await setLocaleCookie(context, baseURL!, locale)
          await page.goto(path)
          const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
          expect(
            results.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              nodes: v.nodes.map((n) => n.target),
            })),
          ).toEqual([])
        })
      }

      test('settings dialog has no axe violations', async ({ page, context, baseURL }) => {
        await setLocaleCookie(context, baseURL!, locale)
        await page.goto('/')
        await page
          .getByRole('button', { name: locale === 'ar' ? 'فتح الإعدادات' : 'Open settings' })
          .click()
        await expect(page.getByRole('dialog')).toBeVisible()
        const results = await new AxeBuilder({ page })
          .withTags(WCAG_TAGS)
          .include('[role="dialog"]')
          .analyze()
        expect(results.violations.map((v) => v.id)).toEqual([])
      })
    })
  }
}
