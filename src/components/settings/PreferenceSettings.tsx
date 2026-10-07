'use client'

import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { RadioGroup, Switch } from 'radix-ui'
import { useId } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { UnitSystemSchema } from '@/lib/settings/settings'

const UNIT_SYSTEMS = UnitSystemSchema.options

/** Staples assumption and unit system (spec 7.6), stored on this device. */
export function PreferenceSettings() {
  const t = useTranslations('settings')
  const { settings, update } = useSettings()
  const staplesId = useId()
  const staplesHintId = useId()
  const unitsLabelId = useId()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <label htmlFor={staplesId} className="text-sm font-semibold">
            {t('staples')}
          </label>
          <p id={staplesHintId} className="text-sm text-fg-muted">
            {t('staplesHint')}
          </p>
        </div>
        <Switch.Root
          id={staplesId}
          checked={settings.assumeStaples}
          onCheckedChange={(assumeStaples) => update({ assumeStaples })}
          aria-describedby={staplesHintId}
          className="relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-line-strong bg-surface-2 transition-colors duration-150 before:absolute before:-inset-2 before:content-[''] data-[state=checked]:border-primary data-[state=checked]:bg-primary"
        >
          <Switch.Thumb className="block size-5 translate-x-1 rounded-full bg-surface shadow-sm transition-transform duration-200 ease-[var(--ease-spring-snappy)] data-[state=checked]:translate-x-6 rtl:-translate-x-1 rtl:data-[state=checked]:-translate-x-6" />
        </Switch.Root>
      </div>

      <div role="group" aria-labelledby={unitsLabelId} className="space-y-3">
        <p id={unitsLabelId} className="text-sm font-semibold">
          {t('units.label')}
        </p>
        <RadioGroup.Root
          value={settings.units}
          onValueChange={(value) => {
            const units = UnitSystemSchema.safeParse(value)
            if (units.success) update({ units: units.data })
          }}
          aria-labelledby={unitsLabelId}
          className="grid grid-cols-2 gap-2"
        >
          {UNIT_SYSTEMS.map((system) => (
            <RadioGroup.Item
              key={system}
              value={system}
              className="relative flex min-h-11 items-center justify-center rounded-btn border border-line-strong bg-surface px-3 py-2 text-sm font-semibold text-fg-muted transition-colors duration-150 hover:text-fg data-[state=checked]:border-primary data-[state=checked]:bg-primary-soft data-[state=checked]:text-primary"
            >
              {t(`units.${system}`)}
              <RadioGroup.Indicator className="absolute inset-e-1.5 top-1.5">
                <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
              </RadioGroup.Indicator>
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
      </div>
    </div>
  )
}
