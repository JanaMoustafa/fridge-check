'use client'

import { AlertTriangle, Flame } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useId, useState } from 'react'
import { useIngredientLabel } from '@/components/providers/IngredientLabels'
import { buttonClasses } from '@/components/ui/button'
import type { NutritionTargets } from '@/lib/nutrition/calculator'
import {
  macrosFor,
  MEALS,
  perServing,
  planPortion,
  recipeTotals,
  type Macros,
  type Meal,
  type MealSplit,
  type NutritionLine,
} from '@/lib/nutrition/portions'
import type { UncountedLine } from '@/lib/nutrition/recipe-nutrition'

export type LeftOutReason = 'small-amount' | 'served-separately' | 'frying-oil'

export interface PortionPlannerProps {
  lines: NutritionLine[]
  /** Only the lines that do not block nutrition: small amounts, sides, frying oil. */
  uncounted: Array<Pick<UncountedLine, 'raw' | 'name'> & { reason: LeftOutReason }>
  servings?: number
  targets: Pick<NutritionTargets, 'calorieTargetKcal' | 'proteinG' | 'fatG' | 'carbsG'> | null
  split: MealSplit
  initialMeal: Meal
  /** Where "Set up nutrition profile" goes (returns to this recipe afterwards). */
  profileHref: string
}

/** Whole grams, or one decimal below 10 g so small values do not read as 0. */
const round = (value: number) => (value < 10 ? Math.round(value * 10) / 10 : Math.round(value))

const MACROS = ['protein', 'carbs', 'fat'] as const
const MACRO_KEY = { protein: 'proteinG', carbs: 'carbsG', fat: 'fatG' } as const

function Totals({ macros, label }: { macros: Macros; label: string }) {
  const t = useTranslations('nutrition')
  return (
    <div>
      <p className="text-sm font-semibold text-fg-muted">{label}</p>
      <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-btn bg-primary-soft px-3 py-2">
          <dt className="text-xs font-semibold text-primary">{t('calories')}</dt>
          <dd className="text-lg font-extrabold tabular-nums">
            {t('kcal', { value: Math.round(macros.kcal) })}
          </dd>
        </div>
        {MACROS.map((macro) => (
          <div key={macro} className="rounded-btn bg-surface-2 px-3 py-2">
            <dt className="text-xs font-semibold text-fg-muted">{t(macro)}</dt>
            <dd className="text-lg font-extrabold tabular-nums">
              {t('grams', { value: round(macros[MACRO_KEY[macro]]) })}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/**
 * Pro nutrition for one recipe: totals, the user's portion for the chosen meal (whole recipe
 * scaled to that meal's calories, rounded to 5 g), and how the meal compares with the day.
 * Rendered only for Pro users: the server never sends these numbers to anyone else.
 */
export function PortionPlanner(props: PortionPlannerProps) {
  const { lines, uncounted, servings, targets, split, profileHref } = props
  const t = useTranslations('nutrition')
  const tMeals = useTranslations('profile.meals')
  const label = useIngredientLabel()
  const ids = useId()
  const [meal, setMeal] = useState<Meal>(props.initialMeal)

  const totals = recipeTotals(lines)
  const plan = targets ? planPortion(lines, targets, split, meal) : null
  const frying = uncounted.some((line) => line.reason === 'frying-oil')

  return (
    <section
      aria-labelledby={`${ids}-title`}
      className="space-y-6 rounded-card bg-surface p-5 shadow-[inset_0_1px_0_var(--color-highlight),0_0_0_1px_var(--color-line)] sm:p-6"
    >
      <header className="flex items-center gap-2">
        <h2 id={`${ids}-title`} className="text-xl font-extrabold">
          {t('title')}
        </h2>
        <span className="rounded-chip bg-primary px-2 py-0.5 text-xs font-bold text-on-primary">
          {t('pro')}
        </span>
      </header>

      <div className="space-y-4">
        <Totals macros={totals} label={t('wholeRecipe')} />
        {servings && servings > 1 && (
          <Totals macros={perServing(totals, servings)} label={t('perServing', { servings })} />
        )}
      </div>

      {plan && targets ? (
        <div className="space-y-5">
          <fieldset>
            <legend className="text-sm font-semibold">{t('mealLegend')}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {MEALS.map((option) => (
                <label
                  key={option}
                  className="flex min-h-11 cursor-pointer flex-col justify-center rounded-btn border border-line-strong bg-surface px-3 py-1.5 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary"
                >
                  <input
                    type="radio"
                    name={`${ids}-meal`}
                    value={option}
                    checked={meal === option}
                    onChange={() => setMeal(option)}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold">{tMeals(option)}</span>
                  <span className="text-xs text-fg-muted">
                    {t('mealShare', { share: split[option] })}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div aria-live="polite" className="space-y-3">
            <h3 className="text-lg font-extrabold">{t('yourPortion')}</h3>
            <p className="text-fg-muted">
              {t('portionSummary', {
                kcal: Math.round(plan.totals.kcal),
                percent: Math.round(plan.scale * 100),
              })}
            </p>
            <table className="w-full text-sm">
              <thead className="text-start text-xs text-fg-muted">
                <tr>
                  <th scope="col" className="pb-2 text-start font-semibold">
                    {t('ingredient')}
                  </th>
                  <th scope="col" className="pb-2 text-end font-semibold">
                    {t('amount')}
                  </th>
                  <th scope="col" className="pb-2 text-end font-semibold">
                    {t('energy')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {plan.lines.map((line, index) => (
                  <tr key={index} className="border-t border-line">
                    <td className="py-2 pe-2" dir="auto">
                      {label(line.name)}
                    </td>
                    <td className="py-2 text-end font-semibold whitespace-nowrap tabular-nums">
                      {t('grams', { value: line.grams })}
                      {line.small && (
                        <span className="ms-1 font-normal text-fg-muted">({t('aLittle')})</span>
                      )}
                    </td>
                    <td className="py-2 ps-2 text-end whitespace-nowrap text-fg-muted tabular-nums">
                      {t('kcal', { value: Math.round(line.macros.kcal) })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-extrabold">{t('dayTitle')}</h3>
            <p className="text-xs text-fg-muted">{t('mealShareMarker', { share: split[meal] })}</p>
            <ul className="space-y-3">
              {(
                [
                  [
                    'calories',
                    plan.totals.kcal,
                    targets.calorieTargetKcal,
                    plan.ofDaily.kcal,
                    'kcal',
                  ],
                  [
                    'protein',
                    plan.totals.proteinG,
                    targets.proteinG,
                    plan.ofDaily.proteinG,
                    'grams',
                  ],
                  ['carbs', plan.totals.carbsG, targets.carbsG, plan.ofDaily.carbsG, 'grams'],
                  ['fat', plan.totals.fatG, targets.fatG, plan.ofDaily.fatG, 'grams'],
                ] as const
              ).map(([name, value, target, share]) => (
                <li key={name}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                    <span className="font-semibold">{t(name)}</span>
                    <span className="text-fg-muted tabular-nums">
                      {t('ofTarget', { value: Math.round(value), target })} ·{' '}
                      {t('percentOfDay', { percent: Math.round(share * 100) })}
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="relative mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-2"
                  >
                    <div
                      className="h-full rounded-full bg-have motion-safe:transition-[width] motion-safe:duration-500"
                      style={{ width: `${Math.min(100, share * 100)}%` }}
                    />
                    <div
                      className="absolute inset-y-0 w-0.5 bg-fg/60"
                      style={{ insetInlineStart: `${split[meal]}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-btn bg-surface-2 p-4">
          <p>{t('noProfile')}</p>
          <Link href={profileHref} className={buttonClasses()}>
            {t('setUpProfile')}
          </Link>
        </div>
      )}

      <details className="group">
        <summary className="cursor-pointer text-sm font-semibold text-primary">
          {t('perIngredient')}
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <thead className="text-xs text-fg-muted">
              <tr>
                <th scope="col" className="pb-2 text-start font-semibold">
                  {t('ingredient')}
                </th>
                <th scope="col" className="pb-2 text-end font-semibold">
                  {t('amount')}
                </th>
                <th scope="col" className="pb-2 text-end font-semibold">
                  {t('calories')}
                </th>
                {MACROS.map((macro) => (
                  <th key={macro} scope="col" className="pb-2 text-end font-semibold">
                    {t(macro)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => {
                const values = macrosFor(line.grams, line.per100g)
                return (
                  <tr key={index} className="border-t border-line tabular-nums">
                    <td className="py-2 pe-2" dir="auto">
                      {label(line.name)}
                    </td>
                    <td className="py-2 text-end">
                      {t('grams', { value: Math.round(line.grams) })}
                    </td>
                    <td className="py-2 text-end">{Math.round(values.kcal)}</td>
                    {MACROS.map((macro) => (
                      <td key={macro} className="py-2 text-end">
                        {t('grams', { value: round(values[MACRO_KEY[macro]]) })}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </details>

      {uncounted.length > 0 && (
        <div className="text-sm text-fg-muted">
          <p className="font-semibold text-fg">{t('notCountedTitle')}</p>
          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {uncounted.map((line, index) => (
              <li key={index}>
                <span lang="en" dir="ltr">
                  {line.raw}
                </span>{' '}
                · {t(`reasons.${line.reason}`)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {frying && (
        <p
          role="note"
          className="flex items-start gap-2 rounded-btn bg-missing-soft px-4 py-3 text-sm"
        >
          <Flame aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-missing" />
          {t('fryingWarning')}
        </p>
      )}
      <p className="flex items-start gap-2 text-xs text-fg-muted">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        {t('disclaimer')} {t('source')}
      </p>
    </section>
  )
}
