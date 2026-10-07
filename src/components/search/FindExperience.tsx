'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Collapsible } from 'radix-ui'
import { useEffect, useRef, useState } from 'react'
import { useAnnounce } from '@/components/providers/Announcer'
import { useRecipeSearch } from '@/hooks/useRecipeSearch'
import { takeReturnScroll } from '@/lib/navigation/return-to'
import { useSettings } from '@/hooks/useSettings'
import { parseSearchUrl, toSearchUrl, type SearchUrlState } from '@/lib/search/url-state'
import { MAX_INGREDIENTS, type Diet, type SortKey } from '@/types/recipe'
import { Filters } from './Filters'
import { IngredientInput, type Chip } from './IngredientInput'
import { QuickAddRow } from './QuickAddRow'
import { Results } from './Results'

const EXAMPLE_PANTRY = ['egg', 'tomato', 'onion']

/**
 * The find screen. Chips live in component state (so changes animate as React transitions) and
 * are mirrored into the URL with history.replaceState — shareable and bookmarkable, but without a
 * server round trip on every chip. The URL is read once, on mount: returning from a recipe or
 * opening a shared link remounts the page with the right state, and reading it on every change
 * would let a not-yet-written URL roll back newer chips.
 */
export function FindExperience() {
  const t = useTranslations('results')
  const tf = useTranslations('find')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const announce = useAnnounce()
  const { settings, update } = useSettings()
  const [state, setState] = useState(() => parseSearchUrl(searchParams))
  const [originals, setOriginals] = useState<Record<string, string>>({})

  useEffect(() => {
    const next = `${pathname}${toSearchUrl(state)}`
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, '', next)
    }
  }, [pathname, state])

  // Plain (urgent) updates, not transitions: a transition would start a document view transition,
  // and keystrokes typed while one is in flight can be dropped.
  const change = (patch: Partial<SearchUrlState>) =>
    setState((current) => ({ ...current, ...patch }))

  const query = useRecipeSearch({
    ingredients: state.ingredients,
    diets: state.diets,
    sort: state.sort,
    assumeStaples: settings.assumeStaples,
  })

  // Coming back from a recipe: put the list where it was. Next (and the browser) may scroll the
  // restored page after it renders, so the position is applied now and re-applied twice in the
  // next ~350 ms — unless the user scrolls, swipes or presses a key first. The record is consumed,
  // so this happens once; no ref guard, because Next keeps this page alive while hidden and only
  // re-runs its effects when it is shown again.
  useEffect(() => {
    if (query.status !== 'success') return
    const y = takeReturnScroll(`${window.location.pathname}${window.location.search}`)
    if (y === null) return
    let userMoved = false
    const stop = () => {
      userMoved = true
    }
    const apply = () => {
      if (!userMoved) window.scrollTo({ top: y, behavior: 'instant' })
    }
    const events = ['wheel', 'touchstart', 'keydown'] as const
    events.forEach((type) => window.addEventListener(type, stop, { passive: true }))
    const frame = requestAnimationFrame(apply)
    const timers = [setTimeout(apply, 120), setTimeout(apply, 350)]
    return () => {
      cancelAnimationFrame(frame)
      timers.forEach(clearTimeout)
      events.forEach((type) => window.removeEventListener(type, stop))
    }
  }, [query.status])

  // Announce the result count once per completed search.
  const total = query.data?.pages[0]?.total
  const lastAnnounced = useRef<string>('')
  useEffect(() => {
    if (total === undefined || state.ingredients.length === 0) return
    const key = `${query.dataUpdatedAt}:${total}`
    if (key === lastAnnounced.current) return
    lastAnnounced.current = key
    announce(t('count', { count: total }))
  }, [announce, query.dataUpdatedAt, state.ingredients.length, t, total])

  const chips: Chip[] = state.ingredients.map((canonical) => ({
    canonical,
    original: originals[canonical],
  }))
  const chosen = new Set(state.ingredients)
  const pages = query.data?.pages
  const showQuickest = pages?.some((page) => page.results.some((r) => r.readyInMinutes)) ?? false

  function addChips(added: Chip[]) {
    setOriginals((current) => {
      const next = { ...current }
      for (const chip of added) if (chip.original) next[chip.canonical] = chip.original
      return next
    })
    // Functional update: two quick additions must both land, whatever the render timing.
    setState((current) => ({
      ...current,
      ingredients: [
        ...current.ingredients,
        ...added
          .map((chip) => chip.canonical)
          .filter((name) => !current.ingredients.includes(name)),
      ].slice(0, MAX_INGREDIENTS),
    }))
  }

  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-[22rem_minmax(0,1fr)] xl:gap-10">
      <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
        <IngredientInput
          chips={chips}
          onAdd={addChips}
          onRemove={(canonical) =>
            setState((current) => ({
              ...current,
              ingredients: current.ingredients.filter((name) => name !== canonical),
            }))
          }
          onClear={() => change({ ingredients: [] })}
        />
        <QuickAddRow
          chosen={chosen}
          disabled={state.ingredients.length >= MAX_INGREDIENTS}
          onAdd={(canonical) => addChips([{ canonical }])}
        />
        {/* Below xl the filters fold away so results start sooner; in the xl rail they stay open. */}
        <Collapsible.Root>
          <Collapsible.Trigger className="group/refine inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold xl:hidden">
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            {tf('filtersTitle')}
            {state.diets.length > 0 && (
              <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs text-on-primary">
                {state.diets.length}
              </span>
            )}
          </Collapsible.Trigger>
          <Collapsible.Content
            forceMount
            className="mt-4 data-[state=closed]:hidden xl:mt-0 xl:block!"
          >
            <Filters
              diets={state.diets}
              sort={state.sort}
              assumeStaples={settings.assumeStaples}
              showQuickest={showQuickest || state.sort === 'quickest'}
              onDietsChange={(diets: Diet[]) => change({ diets })}
              onSortChange={(sort: SortKey) => change({ sort })}
              onStaplesChange={(assumeStaples) => update({ assumeStaples })}
            />
          </Collapsible.Content>
        </Collapsible.Root>
      </div>
      <section aria-labelledby="results-heading" className="min-w-0">
        <h2 id="results-heading" className="sr-only">
          {t('heading')}
        </h2>
        <Results
          pantry={state.ingredients}
          pages={pages}
          status={query.status}
          hasNextPage={query.hasNextPage}
          isFetchingNextPage={query.isFetchingNextPage}
          onLoadMore={() => void query.fetchNextPage()}
          onRetry={() => void query.refetch()}
          onTryExample={() => addChips(EXAMPLE_PANTRY.map((canonical) => ({ canonical })))}
          onClearDiets={state.diets.length > 0 ? () => change({ diets: [] }) : null}
        />
      </section>
    </div>
  )
}
