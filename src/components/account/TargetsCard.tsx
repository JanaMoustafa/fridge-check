import { getTranslations } from 'next-intl/server'
import type { NutritionTargets } from '@/lib/nutrition/calculator'

/** The daily targets: calories first, then the three macros, with BMR and TDEE explained. */
export async function TargetsCard({ targets }: { targets: NutritionTargets }) {
  const t = await getTranslations('account')
  const macros = [
    ['protein', targets.proteinG],
    ['carbs', targets.carbsG],
    ['fat', targets.fatG],
  ] as const
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-fg-muted">{t('calories')}</p>
        <p className="text-3xl font-extrabold tabular-nums">
          {t('kcal', { value: targets.calorieTargetKcal })}
        </p>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {macros.map(([key, grams]) => (
          <div key={key} className="rounded-btn bg-surface-2 px-3 py-2">
            <dt className="text-xs font-semibold text-fg-muted">{t(key)}</dt>
            <dd className="text-lg font-extrabold tabular-nums">{t('grams', { value: grams })}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-fg-muted">
        {t('energyDetail', { bmr: targets.bmrKcal, tdee: targets.tdeeKcal })}
      </p>
    </div>
  )
}
