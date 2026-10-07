'use client'

import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Switch, ToggleGroup } from 'radix-ui'
import { useId } from 'react'
import { DIETS, SORT_KEYS, type Diet, type SortKey } from '@/types/recipe'

interface FiltersProps {
  diets: readonly Diet[]
  sort: SortKey
  assumeStaples: boolean
  /** "Quickest" only makes sense when results carry cook times. */
  showQuickest: boolean
  onDietsChange: (diets: Diet[]) => void
  onSortChange: (sort: SortKey) => void
  onStaplesChange: (value: boolean) => void
}

const pill =
  'inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold text-fg-muted transition-colors duration-150 hover:text-fg data-[state=on]:border-primary data-[state=on]:bg-primary-soft data-[state=on]:text-primary'

export function Filters(props: FiltersProps) {
  const t = useTranslations('find')
  const td = useTranslations('diet')
  const ts = useTranslations('sort')
  const dietLabelId = useId()
  const sortLabelId = useId()
  const staplesId = useId()
  const staplesHintId = useId()
  const sorts = SORT_KEYS.filter((key) => key !== 'quickest' || props.showQuickest)

  return (
    <section aria-labelledby={`${dietLabelId}-title`} className="space-y-5">
      <h2 id={`${dietLabelId}-title`} className="sr-only">
        {t('filtersTitle')}
      </h2>

      <div className="space-y-2">
        <p id={dietLabelId} className="text-sm font-semibold">
          {t('dietLabel')}
        </p>
        <ToggleGroup.Root
          type="multiple"
          value={[...props.diets]}
          onValueChange={(values) =>
            props.onDietsChange(DIETS.filter((diet) => values.includes(diet)))
          }
          aria-labelledby={dietLabelId}
          className="flex flex-wrap gap-2"
        >
          {DIETS.map((diet) => (
            <ToggleGroup.Item key={diet} value={diet} className={`group ${pill}`}>
              <Check aria-hidden="true" className="hidden size-4 group-data-[state=on]:block" />
              {td(diet)}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </div>

      <div className="space-y-2">
        <p id={sortLabelId} className="text-sm font-semibold">
          {t('sortLabel')}
        </p>
        <ToggleGroup.Root
          type="single"
          value={props.sort}
          onValueChange={(value) => {
            const next = sorts.find((key) => key === value)
            if (next) props.onSortChange(next)
          }}
          aria-labelledby={sortLabelId}
          className="flex flex-wrap gap-2"
        >
          {sorts.map((key) => (
            <ToggleGroup.Item key={key} value={key} className={pill}>
              {ts(key)}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <label htmlFor={staplesId} className="text-sm font-semibold">
            {t('staplesLabel')}
          </label>
          <p id={staplesHintId} className="text-sm text-fg-muted">
            {t('staplesHint')}
          </p>
        </div>
        <Switch.Root
          id={staplesId}
          checked={props.assumeStaples}
          onCheckedChange={props.onStaplesChange}
          aria-describedby={staplesHintId}
          className="relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-line-strong bg-surface-2 transition-colors duration-150 before:absolute before:-inset-2 before:content-[''] data-[state=checked]:border-primary data-[state=checked]:bg-primary"
        >
          <Switch.Thumb className="block size-5 translate-x-1 rounded-full bg-surface shadow-sm transition-transform duration-200 ease-[var(--ease-spring-snappy)] data-[state=checked]:translate-x-6 rtl:-translate-x-1 rtl:data-[state=checked]:-translate-x-6" />
        </Switch.Root>
      </div>
    </section>
  )
}
