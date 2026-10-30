import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { settleAnimations } from './helpers'

// The programme intros play on entry unless motion is reduced (the suite's default).
test.describe('programme intros', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('play on entering Find recipes, pass axe, and end on Skip', async ({ page }) => {
    await page.goto('/')
    const intro = page.getByRole('dialog', { name: 'Find recipes' })
    await expect(intro).toBeVisible()
    // Axe reads the settled scene: text mid-fade would count as low contrast.
    await settleAnimations(page)
    const results = await new AxeBuilder({ page })
      .include('.feature-intro')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    expect(
      results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([])
    await intro.getByRole('button', { name: 'Skip' }).click()
    await expect(intro).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('clear themselves after about three seconds, and do not replay within a programme', async ({
    page,
  }) => {
    await page.goto('/recipe/local/53027')
    await expect(page.getByRole('dialog', { name: 'Find recipes' })).toBeVisible()
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 7000 })
    await page.getByRole('link', { name: 'Back to recipes' }).click()
    await expect(page).toHaveURL(/\/(\?.*)?$/)
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})
