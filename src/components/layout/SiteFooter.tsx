import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { LEGAL_PAGES, LEGAL_PATHS } from '@/lib/legal/document'

export async function SiteFooter() {
  const [t, tLegal] = await Promise.all([getTranslations('footer'), getTranslations('legal')])
  return (
    <footer className="border-t border-line pb-24 md:pb-0 print:hidden">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-sm text-fg-muted sm:px-6 lg:px-8">
        <p>
          {t.rich('data', {
            link: (chunks) => (
              <a
                href="https://www.themealdb.com"
                target="_blank"
                rel="noopener noreferrer"
                lang="en"
                className="font-semibold text-primary underline decoration-2 underline-offset-4"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
        <nav aria-label={tLegal('nav')}>
          <ul className="flex flex-wrap gap-x-5">
            {LEGAL_PAGES.map((page) => (
              <li key={page}>
                <Link
                  href={LEGAL_PATHS[page]}
                  className="inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:text-fg hover:underline"
                >
                  {tLegal(page)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
