'use client'

import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { RadioGroup } from 'radix-ui'
import { useId } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { isTheme, type Theme } from '@/lib/theme/theme'

const OPTIONS: ReadonlyArray<{ value: Theme; icon: typeof Sun }> = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
]

export function ThemeSelector() {
  const t = useTranslations('settings.theme')
  const { theme, setTheme } = useTheme()
  const labelId = useId()

  return (
    <div role="group" aria-labelledby={labelId} className="space-y-3">
      <p id={labelId} className="text-sm font-semibold">
        {t('label')}
      </p>
      <RadioGroup.Root
        value={theme}
        onValueChange={(value) => isTheme(value) && setTheme(value)}
        aria-labelledby={labelId}
        className="grid grid-cols-3 gap-2"
      >
        {OPTIONS.map(({ value, icon: Icon }) => (
          <RadioGroup.Item
            key={value}
            value={value}
            className="group relative flex min-h-11 flex-col items-center justify-center gap-1.5 rounded-btn border border-line-strong bg-surface px-2 py-3 text-sm font-semibold text-fg-muted transition-colors duration-150 hover:text-fg data-[state=checked]:border-primary data-[state=checked]:bg-primary-soft data-[state=checked]:text-primary"
          >
            <Icon aria-hidden="true" className="size-5" />
            <span>{t(value)}</span>
            <RadioGroup.Indicator className="absolute inset-e-1.5 top-1.5">
              <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
            </RadioGroup.Indicator>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  )
}
