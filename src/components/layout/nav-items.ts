import { ChefHat, Flame, House, Salad, Search, type LucideIcon } from 'lucide-react'

export interface NavItem {
  href: '/' | '/find' | '/nutritionist' | '/burn' | '/chef'
  labelKey: 'home' | 'find' | 'nutritionist' | 'burn' | 'chef'
  icon: LucideIcon
}

/** Five tabs fit a phone: Saved and the shopping list are on the home screen and in Find. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', labelKey: 'home', icon: House },
  { href: '/find', labelKey: 'find', icon: Search },
  { href: '/nutritionist', labelKey: 'nutritionist', icon: Salad },
  { href: '/burn', labelKey: 'burn', icon: Flame },
  { href: '/chef', labelKey: 'chef', icon: ChefHat },
]

/** Pages that belong to Find recipes: its results, recipes, and the lists made from them. */
const FIND_PAGES = ['/recipe/', '/saved', '/shopping-list']

/** A tab is active on its own route and its inner pages; Home only on the home screen. */
export function isActive(href: NavItem['href'], pathname: string): boolean {
  if (href === '/') return pathname === '/'
  if (href === '/find') {
    return pathname === '/find' || FIND_PAGES.some((page) => pathname.startsWith(page))
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
