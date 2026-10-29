import type { ReactNode } from 'react'
import { BottomTabBar } from './BottomTabBar'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { SkipLink } from './SkipLink'
import { StorageNotice } from './StorageNotice'

/** The app around every page: header, main landmark, footer and the phone tab bar. */
export function AppChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <StorageNotice />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-[1440px] flex-1 px-4 pt-6 pb-12 outline-none sm:px-6 md:pt-10 md:pb-16 lg:px-8"
      >
        {children}
      </main>
      <SiteFooter />
      <BottomTabBar />
    </>
  )
}
