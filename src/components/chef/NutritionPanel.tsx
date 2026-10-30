'use client'

import { Minus, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'

export interface DishTotals {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
}

const ROWS = [
  ['calories', 'kcal'],
  ['protein', 'proteinG'],
  ['carbs', 'carbsG'],
  ['fat', 'fatG'],
  ['fibre', 'fiberG'],
] as const satisfies ReadonlyArray<readonly [string, keyof DishTotals]>

const MAX_SERVINGS = 24

/**
 * Calories, protein, carbohydrate, fat and fibre for one serving and for the whole dish. The
 * member can split the dish into more or fewer servings; a recipe that doesn't say how many it
 * serves starts at four and says so.
 */
export function NutritionPanel({
  total,
  servings: initialServings,
  servingsKnown,
  fiberComplete,
}: {
  total: DishTotals
  servings: number
  servingsKnown: boolean
  fiberComplete: boolean
}) {
  const t = useTranslations('chef')
  const id = useId()
  const [servings, setServings] = useState(initialServings)

  const value = (key: keyof DishTotals, amount: number) => {
    if (key === 'kcal') return t('kcalValue', { value: Math.round(amount) })
    const grams =
      amount > 0 && amount < 1 ? t('gramsUnderOne') : t('gramsValue', { value: Math.round(amount) })
    return key === 'fiberG' && !fiberComplete ? t('atLeast', { value: grams }) : grams
  }
  const stepClasses =
    'grid size-11 place-items-center rounded-full border border-line-strong bg-surface transition-[scale,background-color] duration-150 hover:bg-surface-2 disabled:opacity-40 motion-safe:active:scale-95'

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-4 rounded-card bg-surface p-5">
      <div className="space-y-1">
        <h2 id={`${id}-title`} className="text-lg font-extrabold">
          {t('nutritionTitle')}
        </h2>
        <p className="text-sm text-fg-muted">{t('nutritionIntro')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span id={`${id}-servings`} className="text-sm font-semibold">
          {t('servingsLabel')}
        </span>
        <div role="group" aria-labelledby={`${id}-servings`} className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t('fewerServings')}
            disabled={servings <= 1}
            onClick={() => setServings((n) => Math.max(1, n - 1))}
            className={stepClasses}
          >
            <Minus aria-hidden="true" className="size-4" />
          </button>
          <output
            aria-live="polite"
            className="min-w-8 text-center text-lg font-extrabold tabular-nums"
          >
            {servings}
          </output>
          <button
            type="button"
            aria-label={t('moreServings')}
            disabled={servings >= MAX_SERVINGS}
            onClick={() => setServings((n) => Math.min(MAX_SERVINGS, n + 1))}
            className={stepClasses}
          >
            <Plus aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
      {!servingsKnown && <p className="text-sm text-fg-muted">{t('servingsUnknown')}</p>}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-fg-muted">
            <th scope="col" className="py-2 pe-3 text-start font-semibold">
              {t('nutrient')}
            </th>
            <th scope="col" className="py-2 pe-3 text-end font-semibold">
              {t('perServing')}
            </th>
            <th scope="col" className="py-2 text-end font-semibold">
              {t('wholeDish')}
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([label, key]) => (
            <tr key={key} className="border-b border-line last:border-0">
              <th scope="row" className="py-2 pe-3 text-start font-semibold">
                {t(label)}
              </th>
              <td className="py-2 pe-3 text-end font-extrabold tabular-nums">
                {value(key, total[key] / servings)}
              </td>
              <td className="py-2 text-end text-fg-muted tabular-nums">{value(key, total[key])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!fiberComplete && <p className="text-xs text-fg-muted">{t('fibrePartial')}</p>}
    </section>
  )
}
