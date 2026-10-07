'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ViewTransition } from 'react'
import { cx } from '@/lib/cx'
import { NAV_ITEMS, isActive } from './nav-items'
import { NavCount } from './NavCount'

/** Route links (not an ARIA tablist): each tab is a page. Shown from md up; BottomTabBar covers mobile. */
export function HeaderNav() {
  const t = useTranslations('nav')
  const pathname = usePathname()

  return (
    <nav aria-label={t('label')}>
      <ul className="flex items-center gap-1">
        {NAV_ITEMS.map(({ href, labelKey }) => {
          const active = isActive(href, pathname)
          return (
            <li key={href}>
              <Link
                href={href}
                transitionTypes={['nav-tab']}
                aria-current={active ? 'page' : undefined}
                // Each link is captured above the moving pill during the tab-indicator morph.
                style={{ viewTransitionName: `nav-link-${labelKey}` }}
                className={cx(
                  'nav-link relative flex min-h-11 items-center rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-150',
                  active ? 'text-primary' : 'text-fg-muted hover:text-fg',
                )}
              >
                {active && (
                  <ViewTransition name="tab-indicator" share="tab-indicator">
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 -z-10 rounded-full bg-primary-soft"
                    />
                  </ViewTransition>
                )}
                {t(labelKey)}
                <NavCount tab={labelKey} className="ms-1.5" />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
