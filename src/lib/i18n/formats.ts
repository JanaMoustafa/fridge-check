import type { Formats } from 'next-intl'

/**
 * Western digits in both locales (owner decision). Browsers disagree on the default numbering system
 * for `ar`, so every number in a message uses `{value, number, latn}` instead of a bare `#`.
 */
export const formats = {
  number: {
    latn: { numberingSystem: 'latn' },
  },
} satisfies Formats

export const TIME_ZONE = 'UTC'
