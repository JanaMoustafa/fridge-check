'use client'

import { Check, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useIngredientLabel } from '@/components/providers/IngredientLabels'
import { useSettings } from '@/hooks/useSettings'
import type { MatchResult } from '@/lib/matching/types'

/**
 * "You have ✓ / You need" for the pantry in the URL. The server scores the recipe both ways; the
 * panel shows the variant that matches the reader's staples setting (stored in this browser).
 */
export function HaveNeedPanel({
  withStaples,
  withoutStaples,
}: {
  withStaples: MatchResult
  withoutStaples: MatchResult
}) {
  const t = useTranslations('recipe')
  const label = useIngredientLabel()
  const { settings } = useSettings()
  const match = settings.assumeStaples ? withStaples : withoutStaples

  return (
    <div className="space-y-5 rounded-card bg-surface p-5 shadow-[inset_0_1px_0_var(--color-highlight),0_0_0_1px_var(--color-line)]">
      <section aria-labelledby="have-heading">
        <h2 id="have-heading" className="mb-2 flex items-center gap-2 font-extrabold text-have">
          <Check aria-hidden="true" className="size-5" strokeWidth={3} />
          {t('haveTitle')}
        </h2>
        {match.usedIngredients.length === 0 ? (
          <p className="text-sm text-fg-muted">{t('haveNothing')}</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {match.usedIngredients.map((name) => (
              <li
                key={name}
                className="inline-flex items-center gap-1 rounded-full bg-have-soft px-2.5 py-1 text-sm font-semibold text-have"
              >
                <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
                <span dir="auto">{label(name)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="need-heading">
        <h2 id="need-heading" className="mb-2 flex items-center gap-2 font-extrabold text-missing">
          <Plus aria-hidden="true" className="size-5" strokeWidth={3} />
          {t('needTitle')}
        </h2>
        {match.missingIngredients.length === 0 ? (
          <p className="text-sm font-semibold text-have">{t('needNothing')}</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {match.missingIngredients.map((name) => (
              <li
                key={name}
                className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-dashed border-missing bg-missing-soft px-2.5 py-1 text-sm font-semibold text-missing"
              >
                <Plus aria-hidden="true" className="size-3.5" strokeWidth={3} />
                <span dir="auto">{label(name)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {settings.assumeStaples && <p className="text-xs text-fg-muted">{t('staplesAssumed')}</p>}
    </div>
  )
}
