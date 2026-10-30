import { act, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import en from '../../../messages/en.json'
import { FeatureIntro } from './FeatureIntro'

let pathname = '/'
vi.mock('next/navigation', () => ({ usePathname: () => pathname }))

function renderAt(path: string) {
  pathname = path
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <FeatureIntro />
    </NextIntlClientProvider>,
  )
}

let reduce = false

describe('FeatureIntro', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: query.includes('reduce') && reduce,
        addEventListener() {},
        removeEventListener() {},
      }),
    })
  })
  afterEach(() => vi.useRealTimers())

  it('plays the programme intro on entry and clears itself after about three seconds', () => {
    reduce = false
    renderAt('/burn')
    expect(screen.getByRole('dialog', { name: 'BurnToReturn' })).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(3400 + 10))
    expect(screen.getByRole('dialog')).toHaveAttribute('data-leaving', 'true')
    act(() => vi.advanceTimersByTime(240 + 10))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('ends at once on Skip', () => {
    reduce = false
    renderAt('/')
    expect(screen.getByRole('dialog', { name: 'Find recipes' })).toBeInTheDocument()
    act(() => screen.getByRole('button', { name: 'Skip' }).click())
    act(() => vi.advanceTimersByTime(300))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows nothing outside the three programmes, or under reduced motion', () => {
    reduce = false
    renderAt('/saved')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    reduce = true
    renderAt('/nutritionist')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
