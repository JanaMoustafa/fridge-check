import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { formatLongDate } from '@/lib/i18n/format-date'
import { LEGAL_UPDATED, parseInline, type LegalPage } from '@/lib/legal/document'
import { legalDocument } from '@/lib/legal/documents'
import { inlineLinkClass as linkClass } from './legal-links'

/** Text with its [text](href) links: site pages through <Link>, the email address left-to-right. */
function Inline({ text }: { text: string }) {
  return parseInline(text).map((part, index) => {
    if (typeof part === 'string') return part
    if (part.href.startsWith('/')) {
      return (
        <Link key={index} href={part.href} className={linkClass}>
          {part.text}
        </Link>
      )
    }
    return (
      <a key={index} href={part.href} dir="ltr" className={`${linkClass} wrap-break-word`}>
        {part.text}
      </a>
    )
  })
}

/** A legal page (privacy, terms or refunds) in the reader's language, with a section index. */
export async function LegalArticle({ page }: { page: LegalPage }) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('legal')])
  const doc = legalDocument(page, locale)
  return (
    <article className="mx-auto max-w-3xl space-y-8 py-4 leading-relaxed">
      <header className="space-y-3">
        <h1 className="text-3xl font-extrabold">{doc.title}</h1>
        <p className="text-sm text-fg-muted">
          {t('updated', { date: formatLongDate(LEGAL_UPDATED, locale) })}
        </p>
        <p className="text-lg">
          <Inline text={doc.intro} />
        </p>
      </header>

      <nav
        aria-labelledby="legal-contents"
        className="rounded-card bg-surface p-5 shadow-[inset_0_1px_0_var(--color-highlight),0_0_0_1px_var(--color-line)] print:hidden"
      >
        <h2 id="legal-contents" className="text-sm font-semibold text-fg-muted">
          {t('onThisPage')}
        </h2>
        <ol className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {doc.sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                {section.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {doc.sections.map((section) => (
        <section key={section.id} aria-labelledby={section.id} className="space-y-3">
          <h2 id={section.id} className="scroll-mt-24 text-xl font-extrabold">
            {section.heading}
          </h2>
          {section.blocks.map((block, index) =>
            typeof block === 'string' ? (
              <p key={index}>
                <Inline text={block} />
              </p>
            ) : (
              <ul key={index} className="list-disc space-y-2 ps-6 marker:text-fg-muted">
                {block.list.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            ),
          )}
        </section>
      ))}
    </article>
  )
}
