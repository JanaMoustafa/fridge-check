/**
 * The legal pages (privacy, terms, refunds) as plain data, one document per language. Kept out of
 * messages/*.json on purpose: those are sent to the browser on every page, these only on their own.
 * Text may contain links written as [text](href); nothing else is interpreted.
 */

export const LEGAL_PAGES = ['privacy', 'terms', 'refunds'] as const
export type LegalPage = (typeof LEGAL_PAGES)[number]

export const LEGAL_PATHS: Record<LegalPage, `/${string}`> = {
  privacy: '/privacy',
  terms: '/terms',
  refunds: '/refunds',
}

/** Who runs the site, as named in the legal pages (owner decision: the brand, no personal name). */
export const LEGAL_OPERATOR = 'Fridge Check'
/** Public contact for privacy questions and refund requests (owner decision). */
export const LEGAL_EMAIL = 'jana.sabry.abdelwahhab@gmail.com'
/** When the documents last changed; update it with every change to their meaning. */
export const LEGAL_UPDATED = new Date('2026-10-09T12:00:00Z')
/** Full refund on request within this many days of a payment (owner decision). */
export const REFUND_WINDOW_DAYS = 14

/** A paragraph, or a bulleted list. */
export type LegalBlock = string | { list: string[] }

export interface LegalSection {
  /** Anchor id, the same in every language. */
  id: string
  heading: string
  blocks: LegalBlock[]
}

export interface LegalDocument {
  title: string
  /** One sentence for search results and link previews. */
  description: string
  intro: string
  sections: LegalSection[]
}

export type InlinePart = string | { text: string; href: string }

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g

/** Splits text into plain strings and [text](href) links. */
export function parseInline(text: string): InlinePart[] {
  const parts: InlinePart[] = []
  let last = 0
  for (const match of text.matchAll(LINK)) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    parts.push({ text: match[1]!, href: match[2]! })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

/** The contact address as an inline link, for use inside document text. */
export const EMAIL_LINK = `[${LEGAL_EMAIL}](mailto:${LEGAL_EMAIL})`
