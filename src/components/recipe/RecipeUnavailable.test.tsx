import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it } from 'vitest'
import ar from '../../../messages/ar.json'
import en from '../../../messages/en.json'
import { formatResetTime, RecipeUnavailable } from './RecipeUnavailable'

const RESET = Date.UTC(2026, 9, 9)

function renderNotice(
  props: Partial<Parameters<typeof RecipeUnavailable>[0]>,
  locale: 'en' | 'ar' = 'en',
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === 'ar' ? ar : en} timeZone="UTC">
      <RecipeUnavailable
        source="spoonacular"
        reason="quota"
        retryAt={RESET}
        builtInHref="/?i=rice,onion"
        retryHref="/recipe/spoonacular/715538?i=rice,onion"
        {...props}
      />
    </NextIntlClientProvider>,
  )
}

describe('RecipeUnavailable', () => {
  it('says when a used-up quota resets, in local time, and points to the built-in recipes', () => {
    renderNotice({})
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      "Spoonacular's daily limit is reached",
    )
    expect(
      screen.getByText(
        `This recipe will be available again after ${formatResetTime(RESET, 'en')}. Until then, you can cook from our built-in collection.`,
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Show built-in recipes' })).toHaveAttribute(
      'href',
      '/?i=rice,onion',
    )
    expect(screen.queryByRole('link', { name: 'Try again' })).toBeNull()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Recipe unavailable')
  })

  it('offers a retry when the source is just not answering', () => {
    renderNotice({ source: 'mealdb', reason: 'outage', retryAt: undefined })
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      "This recipe can't be loaded right now",
    )
    expect(screen.getByText(/TheMealDB isn't responding/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Try again' })).toHaveAttribute(
      'href',
      '/recipe/spoonacular/715538?i=rice,onion',
    )
  })

  it('speaks Arabic with Western digits', () => {
    renderNotice({}, 'ar')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'تم بلوغ الحد اليومي لـ Spoonacular',
    )
    expect(screen.getByRole('link', { name: 'عرض الوصفات المدمجة' })).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/[٠-٩]/)
  })
})

describe('formatResetTime', () => {
  it('formats the reset in a given zone, with Western digits in Arabic too', () => {
    expect(formatResetTime(RESET, 'en', 'UTC')).toBe('12:00 AM UTC')
    const arabic = formatResetTime(RESET, 'ar', 'UTC')
    expect(arabic).toContain('12:00')
    expect(arabic).not.toMatch(/[٠-٩]/)
  })
})
