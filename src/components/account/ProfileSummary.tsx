import { getTranslations } from 'next-intl/server'
import type { ProfileValues } from '@/lib/nutrition/profile'

/**
 * The member's profile answers, as they gave them. Targets are not shown here: Your Nutritionist
 * is the one place that works them out and shows them.
 */
export async function ProfileSummary({ values }: { values: ProfileValues }) {
  const [t, tp] = await Promise.all([getTranslations('account'), getTranslations('profile')])
  const rows = [
    [tp('weight'), t('kg', { value: values.weightKg })],
    [tp('height'), t('cm', { value: values.heightCm })],
    [tp('birthYear'), String(values.birthYear)],
    [tp('sex'), tp(`sexes.${values.sex}`)],
    [tp('activity'), tp(`activityLevels.${values.activityLevel}.label`)],
    [tp('goal'), tp(`goals.${values.goal}.label`)],
  ] as const
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-semibold text-fg-muted">{label}</dt>
          <dd className="font-bold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
