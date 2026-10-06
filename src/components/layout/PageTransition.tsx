import { ViewTransition, type ReactNode } from 'react'

const NAV = {
  'nav-tab': 'nav-tab',
  'nav-forward': 'nav-forward',
  'nav-back': 'nav-back',
  default: 'none',
}

/**
 * Wraps a page's content (not the layout, which persists) so route changes animate by type:
 * tab → crossfade, forward/back → direction-aware slide, locale switch → crossfade.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={NAV}
      exit={NAV}
      update={{ locale: 'locale', default: 'none' }}
      default="none"
    >
      <div>{children}</div>
    </ViewTransition>
  )
}
