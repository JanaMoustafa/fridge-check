'use client'

import { Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useAnnounce } from '@/components/providers/Announcer'
import { useIsFavorite } from '@/hooks/useFavorites'
import { cx } from '@/lib/cx'
import { fetchRecipeDetail } from '@/lib/search/client'
import { favorites } from '@/lib/storage/favorites'
import type { RecipeDetail, RecipeSummary } from '@/types/recipe'

const PARTICLES = 6

/**
 * Save / unsave. Optimistic: the heart fills at once. Saved from a card (summary only), the full
 * recipe is fetched in the background so the favorite also works offline later.
 */
export function HeartButton({
  recipe,
  className,
}: {
  recipe: RecipeSummary | RecipeDetail
  className?: string
}) {
  const t = useTranslations('favorites')
  const announce = useAnnounce()
  const saved = useIsFavorite(recipe.id)
  const [burst, setBurst] = useState(0)

  function toggle() {
    const nowSaved = favorites.toggle(recipe)
    announce(t(nowSaved ? 'saved' : 'removed', { title: recipe.title }))
    if (!nowSaved) return
    setBurst((count) => count + 1)
    if (!('instructions' in recipe)) {
      fetchRecipeDetail(recipe.id)
        .then((detail) => favorites.upgrade(detail))
        // The summary snapshot stays usable; the Saved page links to the full recipe.
        .catch(() => undefined)
    }
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={t(saved ? 'unsave' : 'save', { title: recipe.title })}
      onClick={toggle}
      className={cx(
        'heart relative grid size-11 place-items-center rounded-full transition-colors duration-150 motion-safe:active:scale-90',
        saved ? 'text-accent' : 'text-fg-muted hover:text-accent',
        className,
      )}
    >
      <span
        key={burst}
        className={cx('heart-icon grid place-items-center', burst > 0 && saved && 'heart-pop')}
      >
        <Heart
          aria-hidden="true"
          className="size-6"
          fill={saved ? 'currentColor' : 'none'}
          strokeWidth={2.2}
        />
      </span>
      {burst > 0 && saved && (
        <span
          key={`p${burst}`}
          aria-hidden="true"
          className="heart-burst pointer-events-none absolute inset-0"
        >
          {Array.from({ length: PARTICLES }, (_, index) => (
            <span
              key={index}
              style={{ '--angle': `${(360 / PARTICLES) * index}deg` } as React.CSSProperties}
            />
          ))}
        </span>
      )}
    </button>
  )
}
