import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import en from '../../../messages/en.json'
import type { SearchResponse } from '@/types/api'
import { Results } from './Results'

function page(overrides: Partial<SearchResponse> = {}): SearchResponse {
  return {
    results: [],
    total: 0,
    page: 1,
    pageSize: 20,
    hasMore: false,
    provider: 'local',
    ...overrides,
  }
}

function renderResults(props: Partial<ComponentProps<typeof Results>>) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <Results
        pantry={['rice']}
        pages={undefined}
        status="success"
        hasNextPage={false}
        isFetchingNextPage={false}
        onLoadMore={vi.fn()}
        onRetry={vi.fn()}
        onTryExample={vi.fn()}
        onClearDiets={null}
        {...props}
      />
    </NextIntlClientProvider>,
  )
}

describe('Results', () => {
  it('says when the built-in collection answered instead of the remote source', () => {
    renderResults({ pages: [page({ notice: 'fallback-local' })] })
    expect(screen.getByRole('status')).toHaveTextContent(
      'Showing results from our built-in collection.',
    )
  })

  it('credits Spoonacular with a link when it answered', () => {
    renderResults({ pages: [page({ provider: 'spoonacular' })] })
    expect(screen.getByRole('link', { name: 'spoonacular' })).toHaveAttribute(
      'href',
      'https://spoonacular.com/food-api',
    )
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('does not credit Spoonacular for other sources', () => {
    renderResults({ pages: [page({ provider: 'mealdb' })] })
    expect(screen.queryByRole('link', { name: 'spoonacular' })).toBeNull()
  })

  it('explains a rate limit instead of blaming the connection', () => {
    renderResults({ status: 'error', errorCode: 'rate-limited' })
    expect(screen.getByRole('alert')).toHaveTextContent('Wait a moment, then try again.')
  })

  it('suggests checking the connection for other errors', () => {
    renderResults({ status: 'error', errorCode: 'internal' })
    expect(screen.getByRole('alert')).toHaveTextContent('Check your connection and try again.')
  })
})
