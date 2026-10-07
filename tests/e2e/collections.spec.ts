import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

const cards = (page: Page) => page.locator('article.recipe-card')
const savedNav = (page: Page) =>
  page
    .getByRole('navigation', { name: 'Main navigation' })
    .filter({ visible: true })
    .getByRole('link', { name: /Saved/ })

test.describe('favorites', () => {
  test('a recipe favorited from the results appears in Saved and survives a reload', async ({
    page,
  }) => {
    await page.goto('/?i=rice,lentil,onion')
    const card = cards(page).first()
    const title = (await card.getByRole('heading').textContent())!.trim()
    const heart = card.getByRole('button', { name: `Save ${title} to favorites` })
    await heart.click()
    await expect(
      card.getByRole('button', { name: `Remove ${title} from favorites` }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(savedNav(page)).toContainText('1')

    await savedNav(page).click()
    await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible()
    await expect(page.getByRole('main').getByText('1 saved recipe')).toBeVisible()
  })

  test('the saved copy of a recipe works offline', async ({ page, context }) => {
    await page.goto('/recipe/local/53027')
    await page.getByRole('button', { name: 'Save Koshari to favorites' }).click()
    await page.goto('/saved')
    await expect(page.getByRole('heading', { level: 2, name: 'Koshari' })).toBeVisible()
    await context.setOffline(true)
    await page.getByRole('button', { name: 'Show saved copy' }).click()
    await expect(page.getByText('1 1/2 cups Brown Lentils')).toBeVisible()
    await expect(page.locator('ol li').first()).toBeVisible()
    await context.setOffline(false)
  })

  test('removing from Saved, search and sort', async ({ page }) => {
    for (const id of ['53027', '53025', '53026']) {
      await page.goto(`/recipe/local/${id}`)
      await page.getByRole('button', { name: /^Save .* to favorites$/ }).click()
    }
    await page.goto('/saved')
    await expect(page.getByRole('main').getByText('3 saved recipes')).toBeVisible()
    await page.getByRole('searchbox', { name: 'Search saved recipes' }).fill('ful')
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Ful Medames'])
    await page.getByRole('searchbox').fill('')
    await page.getByRole('radio', { name: 'A–Z' }).click()
    await expect(page.getByRole('heading', { level: 2 })).toHaveText([
      'Ful Medames',
      'Koshari',
      'Tamiya',
    ])
    await page.getByRole('button', { name: 'Remove Koshari from favorites' }).click()
    await expect(page.getByRole('main').getByText('2 saved recipes')).toBeVisible()
  })

  test('exporting and importing favorites round-trips', async ({ page }) => {
    await page.goto('/recipe/local/53027')
    await page.getByRole('button', { name: 'Save Koshari to favorites' }).click()
    await page.goto('/saved')
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export' }).click()
    const file = await (await download).path()
    const exported = readFileSync(file, 'utf8')
    expect(JSON.parse(exported)).toMatchObject({ app: 'fridge-check', kind: 'favorites' })

    await page.evaluate(() => localStorage.removeItem('fc:favorites:v1'))
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Nothing saved yet' })).toBeVisible()
    await page.locator('input[type=file]').setInputFiles({
      name: 'favorites.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exported),
    })
    await expect(page.getByText('Imported 1 new and 0 updated.')).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Koshari' })).toBeVisible()
  })

  test('favorites sync to other open tabs', async ({ context }) => {
    const first = await context.newPage()
    const second = await context.newPage()
    await first.goto('/saved')
    await second.goto('/recipe/local/53027')
    await second.getByRole('button', { name: 'Save Koshari to favorites' }).click()
    await expect(first.getByRole('heading', { level: 2, name: 'Koshari' })).toBeVisible()
  })

  test('explains when the browser will not store data, and still works for the session', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('denied', 'SecurityError')
        },
      })
    })
    await page.goto('/recipe/local/53027')
    await expect(page.getByText(/isn't letting us save data/)).toBeVisible()
    await page.getByRole('button', { name: 'Save Koshari to favorites' }).click()
    await expect(page.getByRole('button', { name: 'Remove Koshari from favorites' })).toBeVisible()
  })
})

test.describe('shopping list', () => {
  test('adds a recipe’s missing ingredients, with undo, check-off and clear', async ({ page }) => {
    await page.goto('/recipe/local/53027?i=rice,onion')
    await page.getByRole('button', { name: 'Add missing to shopping list' }).click()
    await expect(page.getByText(/Added \d+ items to your shopping list\./).first()).toBeVisible()
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.getByText('Removed them again.').first()).toBeVisible()
    await page.getByRole('button', { name: 'Add missing to shopping list' }).click()
    await page.getByRole('link', { name: 'View list' }).click()

    await expect(page).toHaveURL(/\/shopping-list$/)
    const items = page.getByRole('checkbox')
    await expect(items.first()).toBeVisible()
    const total = await items.count()
    expect(total).toBeGreaterThan(0)
    await expect(page.getByText('Chickpea')).toBeVisible()
    await page.getByRole('checkbox', { name: /Chickpea/ }).check()
    await expect(
      page.getByRole('main').getByText(`${total - 1} item${total - 1 === 1 ? '' : 's'} left`),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Clear checked' }).click()
    await expect(page.getByRole('checkbox')).toHaveCount(total - 1)

    await page.getByRole('radio', { name: 'By recipe' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Koshari' })).toBeVisible()
  })

  test('combines the same ingredient from two recipes', async ({ page }) => {
    await page.goto('/recipe/local/53027')
    await page.getByRole('button', { name: 'Add missing to shopping list' }).click()
    await page.goto('/recipe/local/53031')
    await page.getByRole('button', { name: 'Add missing to shopping list' }).click()
    await page.goto('/shopping-list')
    // Rice is missing from both Koshari and Egyptian Fatteh: one combined line.
    await expect(page.getByRole('checkbox', { name: /^Rice/ })).toHaveCount(1)
    await expect(
      page.getByRole('listitem').filter({ has: page.getByRole('checkbox', { name: /^Rice/ }) }),
    ).toContainText('For: Koshari, Egyptian Fatteh')
  })

  test('copies the list as text', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only here')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/recipe/local/53025')
    await page.getByRole('button', { name: 'Add missing to shopping list' }).click()
    await page.goto('/shopping-list')
    await page.getByRole('button', { name: 'Copy list' }).click()
    await expect(page.getByText('List copied.').first()).toBeVisible()
    const text = await page.evaluate(() => navigator.clipboard.readText())
    expect(text).toMatch(/^Shopping list\n☐ /)
  })
})
