import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import en from '../../../messages/en.json'
import { LanguageToggle } from './LanguageToggle'

const refresh = vi.fn()
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useRouter: () => ({ refresh }),
}))

function renderToggle(locale: 'en' | 'ar' = 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={en}>
      <LanguageToggle />
    </NextIntlClientProvider>,
  )
}

const radio = (name: RegExp) => screen.getByRole('radio', { name })

describe('LanguageToggle', () => {
  beforeEach(() => refresh.mockClear())
  afterEach(() => {
    Reflect.deleteProperty(document, 'cookie')
  })

  it('marks the current language as selected and names each option in its language', () => {
    renderToggle('en')
    expect(radio(/EN/)).toHaveAttribute('aria-checked', 'true')
    expect(radio(/AR/)).toHaveAttribute('aria-checked', 'false')
    expect(radio(/AR/)).toHaveAccessibleName('AR العربية')
    expect(screen.getByRole('radiogroup', { name: 'Language' })).toBeInTheDocument()
  })

  it('writes the cookie and the localStorage mirror, then refreshes server components', async () => {
    renderToggle('en')
    await userEvent.click(radio(/AR/))
    expect(document.cookie).toContain('NEXT_LOCALE=ar')
    expect(localStorage.getItem('fc:locale')).toBe('ar')
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('does nothing when the selected language is pressed and already stored', async () => {
    document.cookie = 'NEXT_LOCALE=en; Path=/'
    renderToggle('en')
    await userEvent.click(radio(/EN/))
    expect(refresh).not.toHaveBeenCalled()
  })

  it('re-asserts the shown language when another tab changed the cookie', async () => {
    document.cookie = 'NEXT_LOCALE=ar; Path=/'
    renderToggle('en')
    await userEvent.click(radio(/EN/))
    expect(document.cookie).toContain('NEXT_LOCALE=en')
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('explains the problem instead of refreshing when cookies are blocked', async () => {
    Object.defineProperty(document, 'cookie', { configurable: true, get: () => '', set: () => {} })
    renderToggle('en')
    await userEvent.click(radio(/AR/))
    expect(refresh).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent(/blocking cookies/)
    expect(localStorage.getItem('fc:locale')).toBeNull()
  })
})
