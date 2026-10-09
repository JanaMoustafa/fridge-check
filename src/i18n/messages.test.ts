import { describe, expect, it } from 'vitest'
import { createTranslator } from 'next-intl'
import ar from '../../messages/ar.json'
import en from '../../messages/en.json'
import { formats } from '@/lib/i18n/formats'

type Tree = { [key: string]: string | Tree }

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') acc[path] = value
    else Object.assign(acc, flatten(value, path))
    return acc
  }, {})
}

/** Argument and tag names used by an ICU message, e.g. {count}, <link>. */
function placeholders(message: string): string[] {
  // An argument reference is `{name}` or `{name, type…}`; plural branch text like `{No recipes}`
  // is not an argument.
  const args = [...message.matchAll(/\{\s*([A-Za-z_]\w*)\s*[,}]/g)].map((m) => `{${m[1]}}`)
  const tags = [...message.matchAll(/<([A-Za-z_]\w*)>/g)].map((m) => `<${m[1]}>`)
  return [...new Set([...args, ...tags])].sort()
}

const flatEn = flatten(en as Tree)
const flatAr = flatten(ar as Tree)

describe('translation catalogs', () => {
  it('have exactly the same keys in English and Arabic', () => {
    expect(Object.keys(flatAr).sort()).toEqual(Object.keys(flatEn).sort())
  })

  it.each(Object.keys(flatEn))('%s uses the same placeholders in both languages', (key) => {
    expect(placeholders(flatAr[key] ?? '')).toEqual(placeholders(flatEn[key] ?? ''))
  })

  it('never leave an Arabic message empty or untranslated', () => {
    // Brand names stay as they are in every language.
    const allowedIdentical = new Set([
      'common.appName',
      'language.en',
      'language.ar',
      'nutrition.pro',
      'pro.metaTitle',
      'pro.title',
      'billing.planPro',
    ])
    for (const [key, value] of Object.entries(flatAr)) {
      expect(value.trim(), key).not.toBe('')
      if (!allowedIdentical.has(key)) expect(value, key).not.toBe(flatEn[key])
    }
  })

  it('never use a bare # in Arabic (digits must be forced to latn)', () => {
    for (const [key, value] of Object.entries(flatAr)) {
      expect(value.includes('#'), key).toBe(false)
    }
  })

  it.each([
    ['en', en],
    ['ar', ar],
  ] as const)('every %s message compiles', (locale, messages) => {
    const t = createTranslator({
      locale,
      messages,
      formats,
      onError: (error) => {
        throw error
      },
    })
    // Sample values for every argument used in the catalogs (numbers for plurals and numbers).
    const values = {
      count: 3,
      used: 2,
      missing: 1,
      max: 20,
      minutes: 30,
      name: 'tomato',
      input: 'tomatos',
      amount: '240 ml',
      site: 'example.com',
      title: 'Koshari',
      query: 'soup',
      added: 2,
      updated: 1,
      recipes: 'Koshari',
      source: 'Spoonacular',
      time: '3:00 AM',
      email: 'cook@example.com',
      bmr: 1400,
      tdee: 2170,
      value: 120,
      total: 100,
      servings: 4,
      share: 35,
      kcal: 700,
      percent: 42,
      target: 2000,
      price: 200,
      date: '8 November 2026',
      days: 3,
      url: 'https://fridge-check.example/recipe/local/1',
      link: (chunks: string) => chunks,
      terms: (chunks: string) => chunks,
      privacy: (chunks: string) => chunks,
      refunds: (chunks: string) => chunks,
    }
    for (const key of Object.keys(flatEn)) {
      // @ts-expect-error -- keys come from a runtime walk of the catalog
      expect(() => t.rich(key, values), key).not.toThrow()
    }
  })
})
