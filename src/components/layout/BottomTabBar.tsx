'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ViewTransition } from 'react'
import { cx } from '@/lib/cx'
import { NAV_ITEMS, isActive } from './nav-items'

/** Mobile primary navigation (< md): thumb-reachable, icon + label, safe-area aware. */
export function BottomTabBar() {
  const t = useTranslations('nav')
  const pathname = usePathname()

  return (
    <nav
      aria-label={t('label')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden print:hidden"
      style={{ viewTransitionName: 'bottom-tabs' }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const active = isActive(href, pathname)
          return (
            <li key={href}>
              <Link
                href={href}
                transitionTypes={['nav-tab']}
                aria-current={active ? 'page' : undefined}
                style={{ viewTransitionName: `tab-link-${labelKey}` }}
                className={cx(
                  'nav-link relative flex min-h-16 flex-col items-center justify-center gap-1 px-2 text-xs font-semibold transition-colors duration-150',
                  active ? 'text-primary' : 'text-fg-muted',
                )}
              >
                <span className="relative grid h-8 w-14 place-items-center">
                  {active && (
                    <ViewTransition name="tab-indicator-mobile" share="tab-indicator">
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full bg-primary-soft"
                      />
                    </ViewTransition>
                  )}
                  <Icon
                    aria-hidden="true"
                    className="relative size-5"
                    strokeWidth={active ? 2.4 : 2}
                  />
                </span>
                {t(labelKey)}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
