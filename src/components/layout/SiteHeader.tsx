import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { HeaderNav } from './HeaderNav'
import { LanguageToggle } from './LanguageToggle'
import { LogoMark } from './Logo'
import { SettingsDialog } from './SettingsDialog'

export async function SiteHeader() {
  const t = await getTranslations('common')
  return (
    <header
      className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur-md print:hidden"
      style={{ viewTransitionName: 'site-header' }}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          transitionTypes={['nav-tab']}
          className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-btn font-extrabold tracking-tight sm:pe-2"
        >
          <LogoMark className="size-8 shrink-0" />
          {/* Below 350px the mark alone carries the brand; the name stays available to screen readers. */}
          <span
            lang="en"
            translate="no"
            className="text-base whitespace-nowrap max-[349px]:sr-only sm:text-lg"
          >
            {t('appName')}
          </span>
        </Link>
        <div className="ms-4 me-auto hidden md:block">
          <HeaderNav />
        </div>
        <LanguageToggle className="ms-auto md:ms-0" />
        <SettingsDialog />
      </div>
    </header>
  )
}
