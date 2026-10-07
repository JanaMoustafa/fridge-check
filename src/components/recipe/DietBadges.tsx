import { Leaf } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Diet } from '@/types/recipe'

/** Diet tags as text pills (never colour alone); "estimated" is spelled out when tags are guessed. */
export function DietBadges({ diets, estimated }: { diets: readonly Diet[]; estimated: boolean }) {
  const t = useTranslations('diet')
  if (diets.length === 0) return null
  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {diets.map((diet) => (
        <li
          key={diet}
          className="inline-flex items-center gap-1 rounded-full bg-have-soft px-2.5 py-1 text-xs font-semibold text-have"
        >
          <Leaf aria-hidden="true" className="size-3" />
          {t(diet)}
        </li>
      ))}
      {estimated && (
        <li className="text-xs text-fg-muted" title={t('estimatedHint')}>
          ({t('estimated')})
        </li>
      )}
    </ul>
  )
}
