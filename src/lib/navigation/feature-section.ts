/**
 * The three programmes with an animated intro, and which pages belong to each: the intro plays
 * on entering a programme, not while moving between its own pages.
 */
export const FEATURES = ['find', 'nutritionist', 'burn', 'chef'] as const
export type Feature = (typeof FEATURES)[number]

export function featureOf(pathname: string): Feature | null {
  if (pathname === '/' || pathname.startsWith('/recipe/')) return 'find'
  if (pathname === '/nutritionist' || pathname.startsWith('/nutritionist/')) return 'nutritionist'
  if (pathname === '/burn' || pathname.startsWith('/burn/')) return 'burn'
  if (pathname === '/chef' || pathname.startsWith('/chef/')) return 'chef'
  return null
}
