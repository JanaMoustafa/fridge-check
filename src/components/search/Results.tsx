'use client'

import { AlertTriangle, Info, Refrigerator, SearchX } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { buttonClasses } from '@/components/ui/button'
import type { SearchResponse } from '@/types/api'

const SKELETON_DELAY_MS = 150
const PRIORITY_CARDS = 2

interface ResultsProps {
  pantry: readonly string[]
  pages: readonly SearchResponse[] | undefined
  status: 'idle' | 'pending' | 'error' | 'success'
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
  onRetry: () => void
  onTryExample: () => void
  onClearDiets: (() => void) | null
}

export function Results(props: ResultsProps) {
  const t = useTranslations('results')
  const { pantry, pages, status } = props

  if (pantry.length === 0) {
    return (
      <StateBlock icon={Refrigerator} title={t('emptyTitle')} body={t('emptyBody')}>
        <p className="mt-3 text-sm text-fg-muted">{t('emptyExample')}</p>
        <button
          type="button"
          onClick={props.onTryExample}
          className={buttonClasses({ className: 'mt-4' })}
        >
          {t('tryExample')}
        </button>
      </StateBlock>
    )
  }
  if (status === 'pending') return <Skeletons />
  if (status === 'error') {
    return (
      <StateBlock icon={AlertTriangle} title={t('errorTitle')} body={t('errorBody')} role="alert">
        <button
          type="button"
          onClick={props.onRetry}
          className={buttonClasses({ className: 'mt-4' })}
        >
          {t('retry')}
        </button>
      </StateBlock>
    )
  }

  const results = pages?.flatMap((page) => page.results) ?? []
  const total = pages?.[0]?.total ?? 0
  const notice = pages?.[0]?.notice

  return (
    <div className="@container space-y-4">
      {notice === 'fallback-local' && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-btn bg-primary-soft px-4 py-3 text-sm"
        >
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          {t('fallbackNotice')}
        </p>
      )}
      <p className="text-sm font-semibold text-fg-muted">{t('count', { count: total })}</p>
      {results.length === 0 ? (
        <StateBlock icon={SearchX} title={t('noResultsTitle')} body={t('noResultsBody')}>
          {props.onClearDiets && (
            <button
              type="button"
              onClick={props.onClearDiets}
              className={buttonClasses({ variant: 'secondary', className: 'mt-4' })}
            >
              {t('clearFilters')}
            </button>
          )}
        </StateBlock>
      ) : (
        <ul className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @3xl:grid-cols-3 @6xl:grid-cols-4">
          {results.map((recipe, index) => (
            <li key={recipe.id} className="grid">
              <RecipeCard
                recipe={recipe}
                pantry={pantry}
                index={index}
                priority={index < PRIORITY_CARDS}
              />
            </li>
          ))}
        </ul>
      )}
      {props.hasNextPage && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={props.onLoadMore}
            disabled={props.isFetchingNextPage}
            aria-busy={props.isFetchingNextPage || undefined}
            className={buttonClasses({ variant: 'secondary' })}
          >
            {props.isFetchingNextPage ? t('loading') : t('loadMore')}
          </button>
        </div>
      )}
    </div>
  )
}

function StateBlock({
  icon: Icon,
  title,
  body,
  role,
  children,
}: {
  icon: typeof Info
  title: string
  body: string
  role?: 'alert'
  children?: React.ReactNode
}) {
  return (
    <section
      role={role}
      className="flex flex-col items-center rounded-card bg-surface px-6 py-10 text-center shadow-[inset_0_1px_0_var(--color-highlight),0_0_0_1px_var(--color-line)] motion-safe:animate-rise-in"
    >
      <span className="mb-4 grid size-14 place-items-center rounded-chip bg-surface-2 text-primary shadow-[inset_0_-2px_0_var(--color-line)]">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <h3 className="text-lg font-extrabold">{title}</h3>
      <p className="mt-2 max-w-md text-fg-muted">{body}</p>
      {children}
    </section>
  )
}

/** Shown only when loading takes longer than 150 ms, so fast results never flash a skeleton. */
function Skeletons() {
  const t = useTranslations('results')
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), SKELETON_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])
  return (
    <div aria-busy="true" className="@container">
      <p className="sr-only">{t('loading')}</p>
      {visible && (
        <ul aria-hidden="true" className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @3xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index} className="overflow-hidden rounded-card bg-surface">
              <div className="skeleton aspect-[4/3]" />
              <div className="space-y-3 p-4">
                <div className="skeleton h-5 w-3/4 rounded-full" />
                <div className="skeleton h-4 w-1/2 rounded-full" />
                <div className="skeleton h-2.5 w-full rounded-full" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
