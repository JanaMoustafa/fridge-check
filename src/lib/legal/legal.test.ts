import { describe, expect, it } from 'vitest'
import {
  LEGAL_EMAIL,
  LEGAL_PAGES,
  LEGAL_PATHS,
  parseInline,
  type LegalBlock,
  type LegalDocument,
} from './document'
import { LEGAL_DOCUMENTS, legalDocument } from './documents'

describe('parseInline', () => {
  it('splits text into plain parts and [text](href) links', () => {
    expect(parseInline('Read the [terms](/terms) and [email us](mailto:a@b.c).')).toEqual([
      'Read the ',
      { text: 'terms', href: '/terms' },
      ' and ',
      { text: 'email us', href: 'mailto:a@b.c' },
      '.',
    ])
  })

  it('leaves text without links alone', () => {
    expect(parseInline('No links [here] (really).')).toEqual(['No links [here] (really).'])
    expect(parseInline('')).toEqual([])
  })
})

/** Every piece of text in a document, with the links it contains. */
function texts(doc: LegalDocument): string[] {
  const fromBlock = (block: LegalBlock) => (typeof block === 'string' ? [block] : block.list)
  return [
    doc.title,
    doc.description,
    doc.intro,
    ...doc.sections.flatMap((s) => [s.heading, ...s.blocks.flatMap(fromBlock)]),
  ]
}
const hrefs = (text: string) =>
  parseInline(text).flatMap((part) => (typeof part === 'string' ? [] : [part.href]))

/** The shape of a document: section ids and, per block, a paragraph or a list's length. */
const shape = (doc: LegalDocument) =>
  doc.sections.map((s) => ({
    id: s.id,
    blocks: s.blocks.map((b) => (typeof b === 'string' ? 'p' : b.list.length)),
  }))

const ALLOWED_HREFS = new Set([...Object.values(LEGAL_PATHS), '/account', `mailto:${LEGAL_EMAIL}`])

describe.each(LEGAL_PAGES)('the %s page', (page) => {
  const { en, ar } = LEGAL_DOCUMENTS[page]

  it('has the same sections, paragraphs, lists and links in English and Arabic', () => {
    expect(shape(ar)).toEqual(shape(en))
    expect(texts(ar).map(hrefs)).toEqual(texts(en).map(hrefs))
  })

  it('links only to pages that exist and to the contact address', () => {
    for (const href of texts(en).flatMap(hrefs)) expect(ALLOWED_HREFS).toContain(href)
  })

  it.each([
    ['en', en],
    ['ar', ar],
  ] as const)('has no empty text, stray link syntax or duplicate anchors (%s)', (_l, doc) => {
    for (const text of texts(doc)) {
      expect(text.trim(), text).not.toBe('')
      const plain = parseInline(text)
        .filter((part) => typeof part === 'string')
        .join('')
      expect(plain, text).not.toMatch(/\]\(|\$\{|undefined/)
    }
    const ids = doc.sections.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('writes numbers with Western digits in Arabic (owner decision)', () => {
    for (const text of texts(ar)) expect(text, text).not.toMatch(/[٠-٩]/)
  })
})

describe('legalDocument', () => {
  it('returns the reader’s language, and English for anything else', () => {
    expect(legalDocument('terms', 'ar')).toBe(LEGAL_DOCUMENTS.terms.ar)
    expect(legalDocument('terms', 'fr')).toBe(LEGAL_DOCUMENTS.terms.en)
  })
})
