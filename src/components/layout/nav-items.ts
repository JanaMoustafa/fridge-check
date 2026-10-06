import { Heart, ReceiptText, Search, type LucideIcon } from 'lucide-react'

export interface NavItem {
  href: '/' | '/saved' | '/shopping-list'
  labelKey: 'find' | 'saved' | 'shopping'
  icon: LucideIcon
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', labelKey: 'find', icon: Search },
  { href: '/saved', labelKey: 'saved', icon: Heart },
  { href: '/shopping-list', labelKey: 'shopping', icon: ReceiptText },
]

/** A tab is active on its own route and on recipe pages reached from Find. */
export function isActive(href: NavItem['href'], pathname: string): boolean {
  if (href === '/') return pathname === '/' || pathname.startsWith('/recipe/')
  return pathname === href || pathname.startsWith(`${href}/`)
}
