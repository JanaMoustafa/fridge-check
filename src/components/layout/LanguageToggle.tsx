'use client'

import { useTranslations } from 'next-intl'
import { ToggleGroup } from 'radix-ui'
import { useLocaleSwitcher } from '@/hooks/useLocaleSwitcher'
import { cx } from '@/lib/cx'
import { isLocale, LOCALES } from '@/lib/i18n/locale'

const SHORT_LABEL = { en: 'EN', ar: 'AR' } as const

/** Prominent EN | AR segmented toggle. Each option is named in its own language. */
export function LanguageToggle({ className }: { className?: string }) {
  const t = useTranslations('language')
  const { locale, switchLocale, isPending, cookieBlocked } = useLocaleSwitcher()

  return (
    <div className={cx('relative shrink-0', className)}>
      <ToggleGroup.Root
        type="single"
        value={locale}
        // Radix emits '' when the selected item is pressed again: treat that as re-asserting it
        // (it also repairs a tab whose layout is stale).
        onValueChange={(value) => switchLocale(isLocale(value) ? value : locale)}
        aria-label={t('label')}
        aria-busy={isPending || undefined}
        className="flex items-center rounded-full border border-line-strong bg-surface p-0.5"
      >
        {LOCALES.map((option) => (
          <ToggleGroup.Item
            key={option}
            value={option}
            lang={option}
            className="relative grid min-h-11 min-w-12 place-items-center rounded-full px-3 text-sm font-bold text-fg-muted transition-colors duration-150 hover:text-fg data-[state=on]:bg-primary data-[state=on]:text-on-primary"
          >
            {/* Visible short code first, full name for screen readers (label-in-name). */}
            <span lang="en">{SHORT_LABEL[option]}</span>{' '}
            <span className="sr-only">{t(option)}</span>
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
      <p
        role="status"
        className={cx(
          cookieBlocked
            ? 'absolute inset-e-0 top-full z-10 mt-2 w-64 rounded-btn bg-fg p-3 text-sm text-bg shadow-lg'
            : 'sr-only',
        )}
      >
        {cookieBlocked ? t('cookiesBlocked') : ''}
      </p>
    </div>
  )
}
