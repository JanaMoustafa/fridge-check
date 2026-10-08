'use client'

import { ChevronDown, Clock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Collapsible } from 'radix-ui'
import { useId, ViewTransition } from 'react'
import { useIngredientLabel } from '@/components/providers/IngredientLabels'
import { rememberReturn } from '@/lib/navigation/return-to'
import { recipeHref, recipeViewName } from '@/lib/search/links'
import type { RecipeSummary } from '@/types/recipe'
import { DietBadges } from './DietBadges'
import { HeartButton } from './HeartButton'
import { PantryMeter } from './PantryMeter'

export const CARD_IMAGE_SIZES =
  '(min-width: 1536px) 22vw, (min-width: 1280px) 26vw, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw'

interface RecipeCardProps {
  recipe: RecipeSummary
  pantry: readonly string[]
  /** Above-the-fold cards load eagerly (LCP); the rest lazy-load. */
  priority?: boolean
  index: number
}

export function RecipeCard({ recipe, pantry, priority = false, index }: RecipeCardProps) {
  const t = useTranslations('results')
  const label = useIngredientLabel()
  const titleId = useId()
  const href = recipeHref(recipe.id, pantry)
  const used = recipe.matchedUserIngredients.length
  const missing = recipe.missingIngredients.length

  return (
    <article
      aria-labelledby={titleId}
      style={{ '--stagger': Math.min(index, 8) } as React.CSSProperties}
      className="recipe-card group @container relative flex flex-col overflow-hidden rounded-card bg-surface shadow-[inset_0_1px_0_var(--color-highlight),0_0_0_1px_var(--color-line)]"
    >
      <div className="absolute inset-e-2 top-2 z-10">
        <HeartButton recipe={recipe} className="bg-surface/90 shadow-sm backdrop-blur-sm" />
      </div>
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        {recipe.imageUrl && (
          <ViewTransition name={recipeViewName(recipe.id)} share="morph" default="none">
            <Image
              src={recipe.imageUrl}
              // The title right below names the recipe; the photo would only repeat it.
              alt=""
              fill
              sizes={CARD_IMAGE_SIZES}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              className="object-cover transition-transform duration-500 ease-[var(--ease-move)] motion-safe:group-hover:scale-[1.03]"
            />
          </ViewTransition>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 id={titleId} className="text-lg leading-snug font-bold">
          <Link
            href={href}
            transitionTypes={['nav-forward']}
            onClick={() =>
              rememberReturn(`${location.pathname}${location.search}`, href, window.scrollY)
            }
            lang="en"
            dir="ltr"
            className="line-clamp-2 outline-none after:absolute after:inset-0 after:rounded-card after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-ring"
          >
            {recipe.title}
          </Link>
        </h3>
        {(recipe.readyInMinutes !== undefined || recipe.servings !== undefined) && (
          <p className="flex items-center gap-1.5 text-sm text-fg-muted">
            {recipe.readyInMinutes !== undefined && (
              <>
                <Clock aria-hidden="true" className="size-4" />
                {t('time', { minutes: recipe.readyInMinutes })}
              </>
            )}
          </p>
        )}
        <DietBadges diets={recipe.diets} estimated={recipe.dietsEstimated} />
        <div className="mt-auto space-y-2">
          <PantryMeter used={recipe.usedIngredients.length} missing={missing} />
          <p className="text-sm">
            <span className="font-semibold text-have">{t('uses', { used })}</span>
            <span aria-hidden="true"> · </span>
            <span className={missing === 0 ? 'font-semibold text-have' : 'text-fg-muted'}>
              {t('missing', { missing })}
            </span>
          </p>
          {missing > 0 && (
            <Collapsible.Root>
              <Collapsible.Trigger className="group/trigger relative z-10 inline-flex min-h-11 items-center gap-1 rounded-btn text-sm font-semibold text-primary">
                <span className="group-data-[state=open]/trigger:hidden">{t('showMissing')}</span>
                <span className="hidden group-data-[state=open]/trigger:inline">
                  {t('hideMissing')}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 transition-transform duration-200 group-data-[state=open]/trigger:rotate-180"
                />
              </Collapsible.Trigger>
              <Collapsible.Content className="collapsible-content relative z-10">
                <ul aria-label={t('missingTitle')} className="flex flex-wrap gap-1.5 pt-1">
                  {recipe.missingIngredients.map((name) => (
                    <li
                      key={name}
                      className="rounded-full border-[1.5px] border-dashed border-missing bg-missing-soft px-2.5 py-1 text-xs font-semibold text-missing"
                    >
                      {label(name)}
                    </li>
                  ))}
                </ul>
              </Collapsible.Content>
            </Collapsible.Root>
          )}
        </div>
      </div>
    </article>
  )
}
