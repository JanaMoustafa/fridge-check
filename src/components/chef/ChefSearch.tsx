'use client'

import { ChefHat, Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useId, useMemo, useState } from 'react'
import { buttonClasses } from '@/components/ui/button'
import { foldForSearch as fold } from '@/lib/chef/search'
import { cx } from '@/lib/cx'

export interface ChefDish {
  /** The dish's address, /chef/<id>: a TheMealDB id or a Cooking Companion recipe id. */
  id: string
  title: string
  /** Every name the dish answers to (English and Arabic), already folded for search. */
  search: string
  cuisine: string
  cuisineLabel: string
  imageUrl: string | null
}

/** Cuisines shown as quick filters, in the owner's order of focus; "asian" groups several. */
const FOCUS: { key: string; cuisines: string[] }[] = [
  { key: 'Egyptian', cuisines: ['Egyptian'] },
  { key: 'Italian', cuisines: ['Italian'] },
  { key: 'Mexican', cuisines: ['Mexican'] },
  { key: 'Moroccan', cuisines: ['Moroccan'] },
  { key: 'Saudi Arabian', cuisines: ['Saudi Arabian', 'Arabian'] },
  {
    key: 'asian',
    cuisines: ['Chinese', 'Japanese', 'Thai', 'Vietnamese', 'Malaysian', 'Filipino', 'Indian'],
  },
]
/** Shown at first and added per "show more". */
const PAGE = 30

/** Search as you type over every built-in dish, with the focus cuisines one tap away. */
export function ChefSearch({
  dishes,
  labels,
}: {
  dishes: ChefDish[]
  labels: Record<string, string>
}) {
  const t = useTranslations('chef')
  const id = useId()
  const [query, setQuery] = useState('')
  const [cuisine, setCuisine] = useState<string | null>(null)
  const [shown, setShown] = useState(PAGE)
  const matches = useMemo(() => {
    const q = fold(query.trim())
    const allowed = cuisine ? new Set(FOCUS.find((f) => f.key === cuisine)?.cuisines) : null
    return dishes.filter(
      (dish) => (!allowed || allowed.has(dish.cuisine)) && (!q || dish.search.includes(q)),
    )
  }, [dishes, query, cuisine])
  const results = matches.slice(0, shown)

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor={id} className="text-sm font-semibold">
          {t('searchLabel')}
        </label>
        <div className="relative mt-1.5">
          <Search
            aria-hidden="true"
            className="absolute start-3 top-1/2 size-5 -translate-y-1/2 text-fg-muted"
          />
          <input
            id={id}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setShown(PAGE)
            }}
            placeholder={t('searchPlaceholder')}
            autoComplete="off"
            className="min-h-12 w-full rounded-btn border border-line-strong bg-surface ps-10 pe-3 text-base transition-colors outline-none focus-visible:border-primary"
          />
        </div>
      </div>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4" aria-label={t('allCuisines')}>
        {[null, ...FOCUS.map((f) => f.key)].map((key) => (
          <li key={key ?? 'all'} className="shrink-0">
            <button
              type="button"
              aria-pressed={cuisine === key}
              onClick={() => {
                setCuisine(key)
                setShown(PAGE)
              }}
              className={cx(
                'min-h-10 rounded-chip border px-3.5 text-sm font-semibold transition-colors',
                cuisine === key
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-line-strong bg-surface',
              )}
            >
              {key === null
                ? t('allCuisines')
                : key === 'asian'
                  ? t('asian')
                  : (labels[key] ?? key)}
            </button>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="text-sm text-fg-muted">
        {t('results', { count: matches.length })}
      </p>
      {results.length === 0 ? (
        <p className="rounded-btn bg-surface-2 px-4 py-3 text-sm">{t('noResults')}</p>
      ) : (
        <ul className="chef-results grid gap-2 sm:grid-cols-2">
          {results.map((dish, i) => (
            <li key={dish.id} style={{ '--i': i } as React.CSSProperties}>
              <Link
                href={`/chef/${dish.id}`}
                className="flex min-h-16 items-center gap-3 rounded-btn bg-surface p-2 pe-3 transition-[scale] duration-150 motion-safe:active:scale-[0.98]"
              >
                <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-btn bg-surface-2">
                  {dish.imageUrl ? (
                    <Image src={dish.imageUrl} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <ChefHat aria-hidden="true" className="size-6 text-fg-muted" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold">{dish.title}</span>
                  <span className="block text-xs text-fg-muted">{dish.cuisineLabel}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {matches.length > shown && (
        <button
          type="button"
          onClick={() => setShown((count) => count + PAGE)}
          className={buttonClasses({ variant: 'secondary' })}
        >
          {t('showMore')}
        </button>
      )}
    </div>
  )
}
