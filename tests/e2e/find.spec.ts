import { expect, test, type Page } from '@playwright/test'
import { setLocaleCookie } from './helpers'

const input = (page: Page) => page.getByRole('combobox')
const chips = (page: Page) =>
  page.getByRole('list', { name: /Your ingredients|مكوناتك/ }).getByRole('listitem')
const cards = (page: Page) => page.locator('article.recipe-card')

async function addIngredients(page: Page, text: string) {
  await input(page).fill(text)
  await input(page).press('Enter')
}

/** Below xl the filters are folded behind "Refine". */
async function openFilters(page: Page) {
  const refine = page.getByRole('button', { name: /Refine/ })
  if (await refine.isVisible()) await refine.click()
}

test.describe('find recipes', () => {
  test('adding ingredients shows ranked results', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Start with what you have' })).toBeVisible()
    await addIngredients(page, 'tomatoes, onion, garlic')
    await expect(chips(page)).toHaveCount(3)
    await expect(page).toHaveURL(/\?i=tomato,onion,garlic$/)
    await expect(cards(page).first()).toBeVisible()
    await expect(page.getByText(/\d+ recipes? found/).first()).toBeVisible()
    await expect(
      cards(page)
        .first()
        .getByText(/Uses \d+ of your ingredients/),
    ).toBeVisible()
  })

  test('a diet filter updates the results and the URL', async ({ page }) => {
    await page.goto('/?i=tomato,onion,garlic')
    await expect(cards(page).first()).toBeVisible()
    await openFilters(page)
    await page.getByRole('button', { name: 'Vegan', exact: true }).click()
    await expect(page).toHaveURL(/diet=vegan/)
    await expect(cards(page).first()).toBeVisible()
    const count = await cards(page).count()
    for (let i = 0; i < count; i++) {
      await expect(cards(page).nth(i).getByText('Vegan', { exact: true })).toBeVisible()
    }
  })

  test('opening a recipe and going back restores the list with no network request', async ({
    page,
  }) => {
    await page.goto('/?i=tomato,onion,garlic,rice')
    // A card further down the list, so returning must restore a real scroll position.
    const card = cards(page).nth(5)
    await card.scrollIntoViewIfNeeded()
    await card.getByRole('link').click()
    await expect(page).toHaveURL(/\/recipe\/local\/\d+\?i=tomato,onion,garlic,rice/)
    await expect(page.getByRole('heading', { name: 'You have' }).first()).toBeAttached()

    // Where the list was at the moment of the tap (Playwright may scroll a little before clicking,
    // e.g. to clear the mobile tab bar), as recorded by the app.
    const scrollBefore = await page.evaluate(
      () => JSON.parse(sessionStorage.getItem('fc:return-to') ?? '{}').scrollY as number,
    )
    expect(scrollBefore).toBeGreaterThan(200)

    const requests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/recipes')) requests.push(request.url())
    })
    await page.goBack()
    await expect(page).toHaveURL(/\?i=tomato,onion,garlic,rice$/)
    await expect(chips(page)).toHaveCount(4)
    await expect(cards(page).first()).toBeVisible()
    await page.waitForTimeout(500)
    expect(requests).toEqual([])
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore)).toBeLessThan(5)
  })

  test('"Back to recipes" also returns without reloading the list', async ({ page }) => {
    await page.goto('/?i=egg,tomato')
    await cards(page).first().getByRole('link').click()
    await expect(page).toHaveURL(/\/recipe\//)
    const requests: string[] = []
    page.on('request', (r) => r.url().includes('/api/recipes') && requests.push(r.url()))
    await page.getByRole('link', { name: 'Back to recipes' }).click()
    await expect(page).toHaveURL(/\?i=egg,tomato$/)
    await expect(cards(page).first()).toBeVisible()
    expect(requests).toEqual([])
  })

  test('a shared link restores ingredients and filters', async ({ page }) => {
    await page.goto('/?i=egg,tomato&diet=vegetarian&sort=best')
    await expect(chips(page)).toHaveCount(2)
    await openFilters(page)
    await expect(page.getByRole('button', { name: 'Vegetarian', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByRole('radio', { name: 'Best match' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  test('Arabic input resolves to the same ingredients', async ({ page, context, baseURL }) => {
    await setLocaleCookie(context, baseURL!, 'ar')
    await page.goto('/')
    await addIngredients(page, 'طماطم، بصل، توم')
    await expect(chips(page)).toHaveCount(3)
    await expect(chips(page).first()).toContainText('طماطم')
    await expect(page).toHaveURL(/\?i=tomato,onion,garlic$/)
    await expect(cards(page).first()).toBeVisible()
  })

  test('the whole flow works with the keyboard only', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard flow runs on desktop')
    await page.goto('/')
    // Tab to the ingredient box.
    for (
      let i = 0;
      i < 12 && !(await input(page).evaluate((el) => el === document.activeElement));
      i++
    ) {
      await page.keyboard.press('Tab')
    }
    await expect(input(page)).toBeFocused()
    await page.keyboard.type('chick')
    await expect(page.getByRole('option').first()).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(chips(page)).toHaveCount(1)
    await page.keyboard.type('rice')
    await page.keyboard.press('Enter')
    await expect(chips(page)).toHaveCount(2)
    await expect(cards(page).first()).toBeVisible()
    // Tab forward to the first recipe link and open it.
    const firstLink = cards(page).first().getByRole('link')
    for (
      let i = 0;
      i < 40 && !(await firstLink.evaluate((el) => el === document.activeElement));
      i++
    ) {
      await page.keyboard.press('Tab')
    }
    await expect(firstLink).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/recipe\//)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('the recipe page shows have/need, steps and the allergy note', async ({ page }) => {
    await page.goto('/recipe/local/53027?i=rice,onion,lentil')
    await expect(page.getByRole('heading', { level: 1, name: 'Koshari' })).toBeVisible()
    const panel = page
      .getByRole('heading', { name: 'You have' })
      .locator('..')
      .locator('..')
      .first()
    await expect(panel).toBeAttached()
    await expect(page.getByRole('list').filter({ hasText: 'Rice' }).first()).toBeVisible()
    await expect(page.locator('ol li').first()).toBeVisible()
    await expect(
      page.getByText('Always check ingredient labels if you have a food allergy.'),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'TheMealDB' }).first()).toBeVisible()
  })

  test('the units setting converts measures where the data allows', async ({ page }) => {
    await page.goto('/recipe/local/53027')
    const lentils = page.locator('li', { hasText: '1 1/2 cups Brown Lentils' })
    await expect(lentils).toContainText('about 360 ml')
    await page.getByRole('button', { name: 'Open settings' }).click()
    await page.getByRole('radio', { name: 'US (cups, oz)' }).click()
    await page.keyboard.press('Escape')
    await expect(lentils).not.toContainText('about')
  })

  test('an unknown recipe is a 404', async ({ page }) => {
    const response = await page.goto('/recipe/local/99999999')
    expect(response?.status()).toBe(404)
  })
})
