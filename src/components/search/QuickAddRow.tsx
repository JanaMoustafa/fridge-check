'use client'

import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAnnounce } from '@/components/providers/Announcer'
import { useIngredientLabel } from '@/components/providers/IngredientLabels'

/** Everyday ingredients, tappable without typing (canonical names). */
export const QUICK_ADD = [
  'egg',
  'tomato',
  'onion',
  'garlic',
  'potato',
  'rice',
  'chicken',
  'pasta',
  'cheese',
  'lemon',
  'lentil',
  'ground beef',
] as const

export function QuickAddRow({
  chosen,
  disabled,
  onAdd,
}: {
  chosen: ReadonlySet<string>
  disabled: boolean
  onAdd: (canonical: string) => void
}) {
  const t = useTranslations('find')
  const label = useIngredientLabel()
  const announce = useAnnounce()
  const available = QUICK_ADD.filter((name) => !chosen.has(name))
  if (available.length === 0) return null

  return (
    <section aria-labelledby="quick-add-heading" className="space-y-2">
      <h2 id="quick-add-heading" className="text-sm font-semibold">
        {t('quickAdd')}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {available.map((name) => (
          <li key={name}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onAdd(name)
                announce(t('added', { name: label(name) }))
              }}
              aria-label={t('quickAddItem', { name: label(name) })}
              className="inline-flex min-h-11 items-center gap-1 rounded-chip border border-dashed border-line-strong px-3 text-sm font-semibold text-fg-muted transition-colors duration-150 hover:border-primary hover:bg-primary-soft hover:text-primary disabled:opacity-50 motion-safe:active:scale-[0.97]"
            >
              <Plus aria-hidden="true" className="size-4" />
              <span dir="auto">{label(name)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
