import { getTranslations } from 'next-intl/server'

export async function SiteFooter() {
  const t = await getTranslations('footer')
  return (
    <footer className="border-t border-line pb-24 md:pb-0 print:hidden">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 text-sm text-fg-muted sm:px-6 lg:px-8">
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
      </div>
    </footer>
  )
}
