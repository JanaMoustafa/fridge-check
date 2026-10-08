import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it } from 'vitest'
import ar from '../../../messages/ar.json'
import en from '../../../messages/en.json'
import { IngredientLabelsProvider } from '@/components/providers/IngredientLabels'
import type { NutritionLine } from '@/lib/nutrition/portions'
import { PortionPlanner, type PortionPlannerProps } from './PortionPlanner'

const lines: NutritionLine[] = [
  { name: 'rice', grams: 400, per100g: { kcal: 365, proteinG: 7.1, fatG: 0.7, carbsG: 80 } },
  {
    name: 'chicken breast',
    grams: 500,
    per100g: { kcal: 120, proteinG: 22.5, fatG: 2.6, carbsG: 0 },
  },
  { name: 'cumin', grams: 4, per100g: { kcal: 375, proteinG: 18, fatG: 22, carbsG: 44 } },
]
const targets = { calorieTargetKcal: 2000, proteinG: 120, fatG: 60, carbsG: 245 }
const split = { breakfast: 25, lunch: 35, dinner: 30, snacks: 10 }

function renderPlanner(props: Partial<PortionPlannerProps> = {}, locale: 'en' | 'ar' = 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === 'ar' ? ar : en} timeZone="UTC">
      <IngredientLabelsProvider
        names={
          locale === 'ar' ? { rice: 'أرز', 'chicken breast': 'صدر دجاج', cumin: 'كمون' } : undefined
        }
      >
        <PortionPlanner
          lines={lines}
          uncounted={[]}
          targets={targets}
          split={split}
          initialMeal="lunch"
          profileHref="/profile?next=%2Frecipe%2Flocal%2F1"
          {...props}
        />
      </IngredientLabelsProvider>
    </NextIntlClientProvider>,
  )
}

const portionTable = () => screen.getAllByRole('table')[0]!

describe('PortionPlanner', () => {
  it('shows the whole recipe’s totals', () => {
    renderPlanner()
    // 400 g rice 1460 + 500 g chicken 600 + 4 g cumin 15 = 2075 kcal
    expect(screen.getAllByText('2,075 kcal')[0]).toBeInTheDocument()
  })

  it('scales the recipe to the chosen meal and rounds portions to 5 g', async () => {
    renderPlanner()
    expect(screen.getByRole('radio', { name: /Lunch/ })).toBeChecked()
    // Lunch: 35 % of 2000 = 700 kcal → scale 700 / 2075.
    const lunchRice = Math.round((400 * 700) / 2075 / 5) * 5
    expect(within(portionTable()).getByRole('row', { name: /^rice/i })).toHaveTextContent(
      `${lunchRice} g`,
    )
    expect(within(portionTable()).getByRole('row', { name: /^cumin/i })).toHaveTextContent(
      '(a little)',
    )

    await userEvent.click(screen.getByRole('radio', { name: /Snacks/ }))
    const snackRice = Math.round((400 * 200) / 2075 / 5) * 5
    expect(within(portionTable()).getByRole('row', { name: /^rice/i })).toHaveTextContent(
      `${snackRice} g`,
    )
    expect(screen.getByText("Meal's share of the day: 10%")).toBeInTheDocument()
  })

  it('compares the meal with the daily targets', () => {
    renderPlanner()
    expect(screen.getByText('This meal against your day')).toBeInTheDocument()
    const day = screen.getByText('This meal against your day').parentElement!
    expect(within(day).getAllByRole('listitem')).toHaveLength(4)
    expect(within(day).getAllByText(/% of your day/)).toHaveLength(4)
  })

  it('asks for a profile when there are no targets, and still shows totals', () => {
    renderPlanner({ targets: null })
    expect(screen.getByText(/Set up your nutrition profile to see/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Set up nutrition profile' })).toHaveAttribute(
      'href',
      '/profile?next=%2Frecipe%2Flocal%2F1',
    )
    expect(screen.queryByRole('radio')).toBeNull()
  })

  it('shows per-serving totals when the recipe states its servings', () => {
    renderPlanner({ servings: 4 })
    expect(screen.getByText('Per serving (4 servings)')).toBeInTheDocument()
  })

  it('lists what is not counted and warns about frying oil', () => {
    renderPlanner({
      uncounted: [
        { raw: 'To taste salt', name: 'salt', reason: 'small-amount' },
        { raw: '2 quarts frying oil', name: 'oil', reason: 'frying-oil' },
      ],
    })
    expect(screen.getByText('To taste salt')).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent("Oil for frying isn't counted")
  })

  it('speaks Arabic, with Western digits and Arabic ingredient names', () => {
    renderPlanner({}, 'ar')
    expect(screen.getByRole('heading', { name: 'القيم الغذائية' })).toBeInTheDocument()
    expect(within(portionTable()).getByText('أرز')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/[٠-٩]/)
  })
})
