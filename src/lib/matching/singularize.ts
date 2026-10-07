/**
 * Words ending in "s" that are not plurals (or whose plural is the name we keep). Words ending in
 * -ss, -us or 's never lose their "s" anyway (glass, hummus, baker's), so they are not listed.
 * Without this list "molasses" would become "molasse" and "foie gras" "foie gra".
 */
const INVARIANT: ReadonlySet<string> = new Set([
  'molasses',
  'species',
  'series',
  'oats',
  'grits',
  'greens',
  'fries',
  'brussels',
  'krispies',
  'kabanos',
  'christmas',
  'hops',
  // French, Arabic and other loanwords
  'haggis',
  'pastis',
  'anis',
  'cassis',
  'chablis',
  'coulis',
  'gris',
  'brebis',
  'frais',
  'pois',
  'paris',
  'gras',
  'medames',
  'cos',
  'dibs',
  'patis',
  'manis',
  'propolis',
])

/** Plurals the suffix rules would get wrong. */
const IRREGULAR: Readonly<Record<string, string>> = {
  leaves: 'leaf',
  halves: 'half',
  loaves: 'loaf',
  knives: 'knife',
  calves: 'calf',
  potatoes: 'potato',
  tomatoes: 'tomato',
  mangoes: 'mango',
  avocadoes: 'avocado',
  chilies: 'chili',
  chillies: 'chilli',
  cookies: 'cookie',
  brownies: 'brownie',
  veggies: 'veggie',
  smoothies: 'smoothie',
  calories: 'calorie',
  hoagies: 'hoagie',
  goodies: 'goodie',
  quiches: 'quiche',
  brioches: 'brioche',
  ganaches: 'ganache',
  geese: 'goose',
  teeth: 'tooth',
  feet: 'foot',
  mice: 'mouse',
} as const

/** Singular form of one lowercase word; unknown or already-singular words come back unchanged. */
export function singularizeWord(word: string): string {
  if (word.length < 3 || INVARIANT.has(word)) return word
  if (Object.hasOwn(IRREGULAR, word)) return IRREGULAR[word] as string
  // -ss (glass), -us (hummus) and possessives are never plural endings. -is can be: kiwis, chilis.
  if (/(?:ss|us|'s)$/.test(word)) return word
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`
  if (/(?:ches|shes|sses|xes|zzes)$/.test(word)) return word.slice(0, -2)
  if (word.endsWith('s')) return word.slice(0, -1)
  return word
}

/** Singularizes only the head (last) noun: "cherry tomatoes" → "cherry tomato". */
export function singularizeLast(phrase: string): string {
  const words = phrase.split(' ')
  const last = words.length - 1
  words[last] = singularizeWord(words[last] as string)
  return words.join(' ')
}
