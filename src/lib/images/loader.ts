/**
 * next/image loader that uses the providers' own resized images instead of the Vercel image
 * optimizer (Hobby plans allow 5,000 transformations a month, then fail with 402).
 * - TheMealDB: <image>/small (150px), /medium (350px), /large (500px), original (700px).
 * - Spoonacular: <id>-<W>x<H>.<ext> in fixed sizes.
 */
const MEALDB_VARIANTS = [
  { width: 150, suffix: '/small' },
  { width: 350, suffix: '/medium' },
  { width: 500, suffix: '/large' },
] as const

const SPOONACULAR_SIZES = ['90x90', '240x150', '312x231', '480x360', '556x370', '636x393'] as const

export function mealDbImage(src: string, width: number): string {
  const variant = MEALDB_VARIANTS.find((candidate) => candidate.width >= width)
  return variant ? `${src}${variant.suffix}` : src
}

export function spoonacularImage(src: string, width: number): string {
  const size =
    SPOONACULAR_SIZES.find((candidate) => Number(candidate.split('x')[0]) >= width) ??
    SPOONACULAR_SIZES[SPOONACULAR_SIZES.length - 1]
  return src.replace(/-\d+x\d+(\.\w+)$/, `-${size}$1`)
}

export default function imageLoader({ src, width }: { src: string; width: number }): string {
  if (src.startsWith('https://www.themealdb.com/images/media/meals/'))
    return mealDbImage(src, width)
  if (src.startsWith('https://img.spoonacular.com/recipes/')) return spoonacularImage(src, width)
  return src
}
