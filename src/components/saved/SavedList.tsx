'use client'

import { ChevronDown, Download, Heart, Search, Upload } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Collapsible, ToggleGroup } from 'radix-ui'
import { useId, useRef, useState } from 'react'
import { useAnnounce } from '@/components/providers/Announcer'
import { DietBadges } from '@/components/recipe/DietBadges'
import { HeartButton } from '@/components/recipe/HeartButton'
import { CARD_IMAGE_SIZES } from '@/components/recipe/RecipeCard'
import { buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFavorites } from '@/hooks/useFavorites'
import { recipeHref } from '@/lib/search/links'
import { favorites, FavoritesImportError, type Favorite } from '@/lib/storage/favorites'

type Sort = 'recent' | 'title'

export function SavedList() {
  const t = useTranslations('saved')
  const announce = useAnnounce()
  const list = useFavorites()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('recent')
  const [message, setMessage] = useState<string | null>(null)
  const searchId = useId()

  function report(text: string) {
    setMessage(text)
    announce(text)
  }

  function exportFile() {
    const blob = new Blob([favorites.exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'fridge-check-favorites.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function importFile(file: File) {
    try {
      const result = favorites.importJson(await file.text())
      const parts = [t('importDone', { added: result.added, updated: result.updated })]
      if (result.invalid > 0) parts.push(t('importInvalid', { count: result.invalid }))
      report(parts.join(' '))
    } catch (error) {
      report(
        error instanceof FavoritesImportError && error.reason === 'too-large'
          ? t('importTooLarge')
          : t('importUnreadable'),
      )
    }
  }

  // Server render and hydration: the list is not known yet; reserve space instead of flashing.
  if (list === null) return <div className="min-h-64" aria-busy="true" />

  if (list.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={Heart}
          title={t('emptyTitle')}
          body={t('emptyBody')}
          action={{ href: '/', label: t('emptyCta') }}
        />
        <DataControls
          canExport={false}
          message={message}
          onExport={exportFile}
          onImport={importFile}
        />
      </div>
    )
  }

  const needle = query.trim().toLowerCase()
  const visible = list
    .filter((favorite) => favorite.recipe.title.toLowerCase().includes(needle))
    .toSorted((a, b) =>
      sort === 'title'
        ? a.recipe.title.localeCompare(b.recipe.title, 'en')
        : b.savedAt.localeCompare(a.savedAt),
    )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="w-full max-w-sm space-y-1">
          <label htmlFor={searchId} className="text-sm font-semibold">
            {t('search')}
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
            />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-11 w-full rounded-btn border border-line-strong bg-surface ps-9 pe-3"
            />
          </div>
        </div>
        <div className="space-y-1">
          <p id={`${searchId}-sort`} className="text-sm font-semibold">
            {t('sortLabel')}
          </p>
          <ToggleGroup.Root
            type="single"
            value={sort}
            onValueChange={(value) => (value === 'recent' || value === 'title') && setSort(value)}
            aria-labelledby={`${searchId}-sort`}
            className="flex gap-2"
          >
            {(['recent', 'title'] as const).map((key) => (
              <ToggleGroup.Item
                key={key}
                value={key}
                className="min-h-11 rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold text-fg-muted data-[state=on]:border-primary data-[state=on]:bg-primary-soft data-[state=on]:text-primary"
              >
                {t(key === 'recent' ? 'sortRecent' : 'sortTitle')}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
        </div>
      </div>

      <p className="text-sm font-semibold text-fg-muted">{t('count', { count: list.length })}</p>

      {visible.length === 0 ? (
        <p className="rounded-card bg-surface p-6 text-center text-fg-muted">
          {t('noMatches', { query: query.trim() })}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((favorite) => (
            <li key={favorite.recipe.id} className="grid">
              <SavedCard favorite={favorite} />
            </li>
          ))}
        </ul>
      )}

      <DataControls canExport message={message} onExport={exportFile} onImport={importFile} />
    </div>
  )
}

function DataControls({
  canExport,
  message,
  onExport,
  onImport,
}: {
  canExport: boolean
  message: string | null
  onExport: () => void
  onImport: (file: File) => Promise<void>
}) {
  const t = useTranslations('saved')
  const fileInput = useRef<HTMLInputElement>(null)
  return (
    <div className="flex flex-wrap items-center gap-2">
      {canExport && (
        <button
          type="button"
          onClick={onExport}
          className={buttonClasses({ variant: 'secondary' })}
        >
          <Download aria-hidden="true" className="size-4" />
          {t('export')}
        </button>
      )}
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        className={buttonClasses({ variant: 'secondary' })}
      >
        <Upload aria-hidden="true" className="size-4" />
        {t('import')}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void onImport(file)
          event.target.value = ''
        }}
      />
      {message && <p className="w-full text-sm text-fg-muted">{message}</p>}
    </div>
  )
}

function SavedCard({ favorite }: { favorite: Favorite }) {
  const t = useTranslations('saved')
  const tr = useTranslations('recipe')
  const { recipe } = favorite
  const titleId = useId()
  return (
    <article
      aria-labelledby={titleId}
      className="relative flex flex-col overflow-hidden rounded-card bg-surface shadow-[inset_0_1px_0_var(--color-highlight),0_0_0_1px_var(--color-line)]"
    >
      <div className="absolute inset-e-2 top-2 z-10">
        <HeartButton recipe={recipe} className="bg-surface/90 shadow-sm backdrop-blur-sm" />
      </div>
      <div className="relative aspect-[4/3] bg-surface-2">
        {recipe.imageUrl && (
          <Image
            src={recipe.imageUrl}
            alt=""
            fill
            sizes={CARD_IMAGE_SIZES}
            className="object-cover"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h2 id={titleId} className="text-lg leading-snug font-bold">
          <Link
            href={recipeHref(recipe.id)}
            transitionTypes={['nav-forward']}
            lang="en"
            dir="ltr"
            className="line-clamp-2"
          >
            {recipe.title}
          </Link>
        </h2>
        <DietBadges diets={recipe.diets} estimated={recipe.dietsEstimated} />
        <Collapsible.Root className="mt-auto">
          <Collapsible.Trigger className="group/copy inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary">
            <span className="group-data-[state=open]/copy:hidden">{t('savedCopy')}</span>
            <span className="hidden group-data-[state=open]/copy:inline">{t('hideSavedCopy')}</span>
            <ChevronDown
              aria-hidden="true"
              className="size-4 transition-transform group-data-[state=open]/copy:rotate-180"
            />
          </Collapsible.Trigger>
          <Collapsible.Content className="collapsible-content space-y-3 pt-2 text-sm">
            {recipe.ingredients && recipe.instructions ? (
              <>
                <h3 className="font-bold">{tr('ingredientsTitle')}</h3>
                <ul lang="en" dir="ltr" className="list-disc space-y-1 ps-5 text-start">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index}>{ingredient.raw}</li>
                  ))}
                </ul>
                <h3 className="font-bold">{tr('stepsTitle')}</h3>
                <ol lang="en" dir="ltr" className="list-decimal space-y-2 ps-5 text-start">
                  {recipe.instructions.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="text-fg-muted">{t('noSavedCopy')}</p>
            )}
          </Collapsible.Content>
        </Collapsible.Root>
      </div>
    </article>
  )
}
