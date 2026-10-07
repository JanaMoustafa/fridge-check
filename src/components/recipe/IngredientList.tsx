'use client'

import { useTranslations } from 'next-intl'
import { useSettings } from '@/hooks/useSettings'
import { formatAmount } from '@/lib/units/convert'
import { convertForDisplay, unitMessageKey } from '@/lib/units/display'
import type { Ingredient } from '@/types/recipe'

/** The recipe's lines verbatim (English), plus a converted amount where the data allows. */
export function IngredientList({ ingredients }: { ingredients: readonly Ingredient[] }) {
  const t = useTranslations('recipe')
  const tu = useTranslations('unit')
  const { settings } = useSettings()

  return (
    <ul className="divide-y divide-line">
      {ingredients.map((ingredient, index) => {
        const converted = convertForDisplay(ingredient, settings.units)
        return (
          <li
            key={`${ingredient.raw}-${index}`}
            className="flex flex-wrap items-baseline gap-x-3 py-2.5"
          >
            <span lang="en" dir="ltr">
              {ingredient.raw}
            </span>
            {converted && (
              <span className="text-sm text-fg-muted tabular-nums">
                {t('converted', {
                  amount: `${formatAmount(converted.amount, converted.unit)} ${tu(
                    // Units with a message key; the set is closed (see unit messages).
                    unitMessageKey(converted.unit) as Parameters<typeof tu>[0],
                  )}`,
                })}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
