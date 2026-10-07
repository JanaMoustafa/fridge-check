import type { Diet } from '@/types/recipe'
import {
  type CategoryKeywords,
  DIET_CATEGORIES,
  DIET_KEYWORDS,
  type DietCategory,
  MEAT_STAND_INS,
  type PhraseList,
} from './config/diet-keywords'

/**
 * Which ingredient categories rule each diet out. Vegan is a superset of vegetarian's blockers,
 * which is a superset of pescatarian's, so vegan ⇒ vegetarian ⇒ pescatarian (and vegan ⇒
 * dairy-free) hold by construction rather than by luck.
 */
export const DIET_RULES = {
  vegetarian: ['meat', 'fish'],
  vegan: ['meat', 'fish', 'dairy', 'egg', 'animal'],
  'gluten-free': ['gluten'],
  'dairy-free': ['dairy'],
  pescatarian: ['meat'],
} as const satisfies Record<Diet, readonly DietCategory[]>

/** Every diet, in DIET_RULES order (the same order as DIETS, without loading the Zod schemas). */
const DIET_ORDER = Object.keys(DIET_RULES) as Diet[]

/**
 * One recipe ingredient as providers give it: the original line (measure included, e.g. "2 Corn
 * Arepa Filled With Mozarella Cheese") and its canonical name ("corn arepa"). Normalizing drops
 * clauses and descriptors that can name an allergen, so the raw text is classified too.
 */
export interface IngredientLine {
  readonly raw: string
  readonly name: string
}

/** A bare ingredient name, or a full line when the original text is at hand (preferred). */
export type DietInput = string | IngredientLine

interface CompiledCategory {
  keywords: RegExp
  exceptions: RegExp
  neutralizers: RegExp
}

/** "anchovy" also matches "anchovies"; anything else also matches a trailing "s" or "es". */
function pluralTolerant(word: string): string {
  return /[^aeiou]y$/.test(word) ? `${word.slice(0, -1)}(?:y|ies)` : `${word}(?:e?s)?`
}

/** Only the last word is pluralised: "kidney beans", "egg plants", "chicken wings". */
function phrasePattern(phrase: string): string {
  const words = phrase.split(' ')
  return words.map((word, i) => (i === words.length - 1 ? pluralTolerant(word) : word)).join(' ')
}

function compile(phrases: PhraseList, flags = ''): RegExp {
  // Longest first so "cream of tartar" is consumed before "cream" could be.
  const alternatives = [...phrases].sort((a, b) => b.length - a.length).map(phrasePattern)
  return new RegExp(`\\b(?:${alternatives.join('|')})\\b`, flags)
}

function compileCategory(config: CategoryKeywords): CompiledCategory {
  return {
    keywords: compile(config.keywords),
    exceptions: compile(config.exceptions, 'g'),
    neutralizers: compile(config.neutralizers),
  }
}

const COMPILED: Record<DietCategory, CompiledCategory> = {
  meat: compileCategory(DIET_KEYWORDS.meat),
  fish: compileCategory(DIET_KEYWORDS.fish),
  dairy: compileCategory(DIET_KEYWORDS.dairy),
  egg: compileCategory(DIET_KEYWORDS.egg),
  animal: compileCategory(DIET_KEYWORDS.animal),
  gluten: compileCategory(DIET_KEYWORDS.gluten),
}

const STAND_IN_LABEL = compile(MEAT_STAND_INS.labels)
const STAND_IN_PRODUCT = compile(MEAT_STAND_INS.products)
const STAND_IN_CATEGORIES: ReadonlySet<DietCategory> = new Set(MEAT_STAND_INS.categories)

/**
 * Reduces a name to the keyword lists' match form. Canonical names are already close; this also
 * makes raw provider names ("Goat's Cheese", "Gruyère", "Gluten-Free Flour") classify correctly.
 */
export function toMatchText(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function hasKeyword(text: string, compiled: CompiledCategory): boolean {
  // Exceptions are blanked out rather than short-circuiting the check, so only the excepted phrase
  // is ignored: "kidney bean and chorizo" is still meat.
  return compiled.keywords.test(text.replace(compiled.exceptions, ' | '))
}

/** 'vegetarian sausage', 'meat-free mince', 'quorn': no meat or fish, maybe egg, cheese or wheat. */
function isMeatStandIn(text: string): boolean {
  if (STAND_IN_PRODUCT.test(text)) return true
  return (
    STAND_IN_LABEL.test(text) &&
    (hasKeyword(text, COMPILED.meat) || hasKeyword(text, COMPILED.fish))
  )
}

/** Categories one ingredient falls into, in DIET_CATEGORIES order ([] for plain plants). */
export function ingredientCategories(name: string): DietCategory[] {
  const text = toMatchText(name)
  if (text === '') return []
  const standIn = isMeatStandIn(text)
  return DIET_CATEGORIES.filter((category) => {
    const compiled = COMPILED[category]
    if (compiled.neutralizers.test(text)) return false
    return (standIn && STAND_IN_CATEGORIES.has(category)) || hasKeyword(text, compiled)
  })
}

/** The texts an input is classified on: a name alone, or a line's raw text and its name. */
function textsOf(input: DietInput): string[] {
  return typeof input === 'string' ? [input] : [input.raw, input.name]
}

/**
 * The ingredients (de-duplicated, in input order) that rule out each diet: names as given, or a
 * line's raw text, which shows why ("Corn Arepa Filled With Mozarella Cheese" for dairy-free).
 * Used by the human diet review to see why a recipe did not get a tag.
 */
export function dietBlockers(ingredients: readonly DietInput[]): Record<Diet, string[]> {
  const blockers: Record<Diet, string[]> = {
    vegetarian: [],
    vegan: [],
    'gluten-free': [],
    'dairy-free': [],
    pescatarian: [],
  }
  for (const input of ingredients) {
    const label = typeof input === 'string' ? input : input.raw
    // A line falls into whatever its raw text or its canonical name reveals.
    const categories = new Set(textsOf(input).flatMap(ingredientCategories))
    for (const diet of DIET_ORDER) {
      const blocked = DIET_RULES[diet].some((category) => categories.has(category))
      if (blocked && !blockers[diet].includes(label)) blockers[diet].push(label)
    }
  }
  return blockers
}

/**
 * Estimated diets for a recipe, in DIETS order. Pass ingredient lines ({ raw, name }) whenever the
 * original text is available: a line counts against a diet when either its raw text or its
 * canonical name does. Bare canonical names still work for callers that have nothing else.
 * Conservative by design (unknown processed products count against a diet) and never a medical
 * guarantee — the UI always shows the allergy disclaimer. A recipe with no usable ingredient text
 * gets no tags, since there is nothing to vouch for.
 */
export function classifyDiets(ingredients: readonly DietInput[]): Diet[] {
  const hasText = ingredients.some((input) =>
    textsOf(input).some((text) => toMatchText(text) !== ''),
  )
  if (!hasText) return []
  const blockers = dietBlockers(ingredients)
  return DIET_ORDER.filter((diet) => blockers[diet].length === 0)
}
