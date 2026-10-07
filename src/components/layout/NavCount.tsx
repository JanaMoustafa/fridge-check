'use client'

import { useTranslations } from 'next-intl'
import { useFavorites } from '@/hooks/useFavorites'
import { useShoppingList } from '@/hooks/useShoppingList'
import { cx } from '@/lib/cx'
import { combine } from '@/lib/storage/shopping-list'
import type { NavItem } from './nav-items'

/** Count badge for a nav tab (saved recipes, items still to buy). Shown after hydration only. */
export function NavCount({ tab, className }: { tab: NavItem['labelKey']; className?: string }) {
  const t = useTranslations('nav')
  const favorites = useFavorites()
  const shopping = useShoppingList()
  const count =
    tab === 'saved'
      ? favorites?.length
      : tab === 'shopping'
        ? shopping && combine(shopping).filter((item) => !item.checked).length
        : undefined
  if (!count) return null
  return (
    <>
      <span
        key={count}
        aria-hidden="true"
        className={cx(
          'count-badge grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[0.6875rem] leading-none font-bold text-on-accent tabular-nums',
          className,
        )}
      >
        {count > 99 ? '99+' : count}
      </span>
      <span className="sr-only">
        {' '}
        ({t(tab === 'saved' ? 'savedCount' : 'shoppingCount', { count })})
      </span>
    </>
  )
}
