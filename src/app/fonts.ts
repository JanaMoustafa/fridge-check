import { Bricolage_Grotesque, Fustat } from 'next/font/google'

/** Latin: variable weight axis only (≈41 KB), preloaded. */
export const latinFont = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-latin',
})

/** Arabic: Egyptian-designed Fustat, weights map 1:1 to Bricolage. Not preloaded so English pages skip it. */
export const arabicFont = Fustat({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-arabic',
  preload: false,
})
