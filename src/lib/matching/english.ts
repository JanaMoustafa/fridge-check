import {
  CLAUSE_STARTERS,
  DESCRIPTOR_PHRASES,
  DESCRIPTOR_WORDS,
  LEADING_PHRASES,
  PROTECTED_PHRASES,
  PURPOSE_FOLLOWERS,
  PURPOSE_WORDS,
  TO_CLAUSE_VERBS,
} from './config/descriptors'
import {
  AMOUNT_LINKS,
  NOUN_UNITS,
  QUANTITY_JOINERS,
  QUANTITY_WORDS,
  UNIT_MODIFIERS,
  UNIT_WORDS,
} from './config/units'
import { ancestorsOf } from './families'
import { singularizeLast } from './singularize'
import { isStaple } from './staples'
import { CANONICAL_NAMES, SPELLINGS, SYNONYMS, lookupSynonym } from './synonyms'

const VULGAR_FRACTIONS: Readonly<Record<string, string>> = {
  '½': '1/2',
  '⅓': '1/3',
  '⅔': '2/3',
  '¼': '1/4',
  '¾': '3/4',
  '⅕': '1/5',
  '⅖': '2/5',
  '⅗': '3/5',
  '⅘': '4/5',
  '⅙': '1/6',
  '⅚': '5/6',
  '⅐': '1/7',
  '⅛': '1/8',
  '⅜': '3/8',
  '⅝': '5/8',
  '⅞': '7/8',
  '⅑': '1/9',
  '⅒': '1/10',
} as const

/** Letters NFD cannot decompose into a base letter plus a mark. */
const LIGATURES: Readonly<Record<string, string>> = {
  ß: 'ss',
  æ: 'ae',
  œ: 'oe',
  ø: 'o',
  ł: 'l',
  đ: 'd',
  ı: 'i',
  þ: 'th',
} as const

/**
 * Numbers (decimals, fractions, ordinals like "3rd"), words (inner hyphens and apostrophes kept)
 * and the joiners "-", "/" and "+". Digits glued to letters split apart, so "100g" is "100" "g".
 */
const TOKEN_RE =
  /\d+(?:st|nd|rd|th)(?![a-z])|\d+(?:[.,]\d+)?(?:\/\d+)?|[a-z][a-z0-9]*(?:['-][a-z0-9]+)*|[-/+]/g

/**
 * Trailing head nouns that only name a portion or cut ("salmon fillet", "thyme sprig",
 * "pineapple chunk"): dropped when what is left is already a canonical name.
 */
const PORTION_HEADS: ReadonlySet<string> = new Set([
  'fillet',
  'loin',
  'leaf',
  'sprig',
  'stalk',
  'stick',
  'floret',
  'pod',
  'bulb',
  'clove',
  'head',
  'piece',
  'chunk',
  'cube',
  'slice',
  'wedge',
  'strip',
  'rasher',
  'sheet',
  'spear',
  'half',
  'kernel',
  'segment',
  'ball',
  'thread',
  'strand',
  'zest',
  'rind',
  'peel',
  'meat',
])

const MAX_CANONICAL_LENGTH = 60

/** Words that open a purpose at the start of a line: "to serve", "for frying", "as required". */
const LEADING_PURPOSE: ReadonlySet<string> = new Set(['to', 'for', 'as'])

/**
 * Phrases a descriptor word may not be stripped from: every canonical name (so canonical names are
 * fixed points) plus the explicitly protected phrases the synonym table maps elsewhere.
 */
const PROTECTED: ReadonlySet<string> = new Set([...CANONICAL_NAMES, ...PROTECTED_PHRASES])

function isNumber(token: string): boolean {
  return /^\d/.test(token)
}

/** Synonym key or canonical name, in the form given or with its last word singular. */
function isKnownPhrase(words: readonly string[]): boolean {
  const phrase = words.join(' ')
  const singular = singularizeLast(phrase)
  return (
    CANONICAL_NAMES.has(phrase) ||
    CANONICAL_NAMES.has(singular) ||
    Object.hasOwn(SYNONYMS, phrase) ||
    Object.hasOwn(SYNONYMS, singular)
  )
}

function phraseAt(tokens: readonly string[], index: number, phrase: readonly string[]): boolean {
  return phrase.every((word, offset) => tokens[index + offset] === word)
}

/** Step 1: one script, one case, no accents; fractions, dashes and quotes in plain ASCII. */
function foldText(raw: string): string {
  return raw
    .replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒]/gu, (fraction) => ` ${VULGAR_FRACTIONS[fraction]} `)
    .normalize('NFKC')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[ßæœøłđıþ]/g, (letter) => LIGATURES[letter] as string)
    .replace(/⁄/g, '/')
    .replace(/[‐-―−]/g, '-')
    .replace(/[‘’‚‛′`´]/g, "'")
    .replace(/&/g, ' and ')
}

/**
 * Step 2: drop "(400g)" style asides and everything after the first comma that follows the name.
 * A comma inside the leading amounts and descriptors is not that comma: "4 skinless, boneless
 * chicken breasts" reads on to the name.
 */
function stripAsides(text: string): string {
  let out = text
  let previous
  do {
    previous = out
    out = out.replace(/\([^()]*\)|\[[^[\]]*\]|\{[^{}]*\}/g, ' ')
  } while (out !== previous)
  out = out.replace(/[([{].*$/, ' ')
  // A semicolon always ends the name. A comma between digits is a thousands or decimal separator.
  const [first = '', ...rest] = (out.split(';')[0] as string).split(/(?<!\d),|,(?!\d)/)
  let kept = first
  for (const segment of rest) {
    if (hasName(kept)) break
    kept = `${kept} ${segment}`
  }
  return kept
}

function tokenize(text: string): string[] {
  return (text.match(TOKEN_RE) ?? []).map((token) =>
    Object.hasOwn(SPELLINGS, token) ? (SPELLINGS[token] as string) : token,
  )
}

function isUnitModifier(token: string): boolean {
  return UNIT_MODIFIERS.has(token) || DESCRIPTOR_WORDS.has(token)
}

/** False when the text is only amounts, units and descriptors ("4 skinless", "1 large"). */
function hasName(text: string): boolean {
  return tokenize(text).some(
    (token) =>
      !isNumber(token) &&
      !QUANTITY_WORDS.has(token) &&
      !QUANTITY_JOINERS.has(token) &&
      !AMOUNT_LINKS.has(token) &&
      !isUnitModifier(token) &&
      // "3 cloves" and "bay leaves" name an ingredient on their own.
      !(UNIT_WORDS.has(token) && !NOUN_UNITS.has(token)),
  )
}

/** True when a unit follows position `index` after any run of modifiers ("2 large chopped cloves"). */
function unitFollows(tokens: readonly string[], index: number): boolean {
  let next = index + 1
  while (next < tokens.length && isUnitModifier(tokens[next] as string)) next++
  return next < tokens.length - 1 && UNIT_WORDS.has(tokens[next] as string)
}

/**
 * Step 3a: "2 x 400g tins of", "a pinch of", "juice of 1", "to serve" → gone. Stops at the first
 * known name, so "Five Spice Powder" and "Cloves" keep their leading word.
 */
function stripLeadingAmounts(tokens: readonly string[]): string[] {
  let index = 0
  let afterAmount = false
  let afterPurpose = false
  while (index < tokens.length) {
    const rest = tokens.slice(index)
    if (isKnownPhrase(rest)) break
    const token = tokens[index] as string
    const hasNext = index + 1 < tokens.length
    const lead = LEADING_PHRASES.find((phrase) => phraseAt(tokens, index, phrase))
    if (lead !== undefined && index + lead.length < tokens.length) {
      index += lead.length
      afterAmount = false
      continue
    }
    if (isNumber(token)) {
      index++
      afterAmount = true
      continue
    }
    if (hasNext && PURPOSE_WORDS.has(token)) {
      index++
      afterPurpose = true
      continue
    }
    const next = tokens[index + 1] as string
    if (index + 2 < tokens.length && LEADING_PURPOSE.has(token) && PURPOSE_FOLLOWERS.has(next)) {
      index += 2
      afterPurpose = true
      continue
    }
    if (hasNext && token === 'with' && afterPurpose) {
      index++
      continue
    }
    if (hasNext && QUANTITY_JOINERS.has(token) && (afterAmount || !/^[a-z]/.test(token))) {
      index++
      continue
    }
    if (
      afterAmount &&
      AMOUNT_LINKS.has(token) &&
      (isNumber(next) || QUANTITY_WORDS.has(next) || UNIT_WORDS.has(next))
    ) {
      index++
      continue
    }
    if (hasNext && QUANTITY_WORDS.has(token)) {
      index++
      afterAmount = true
      continue
    }
    if (isUnitModifier(token) && unitFollows(tokens, index)) {
      index++
      continue
    }
    if (UNIT_WORDS.has(token) && (hasNext || !NOUN_UNITS.has(token))) {
      index++
      afterAmount = true
      continue
    }
    if (hasNext && token === 'of' && index > 0) {
      index++
      continue
    }
    break
  }
  return tokens.slice(index)
}

/** Step 3b: "flour 200 g", "eggs x 2" → the name only. */
function stripTrailingAmounts(tokens: readonly string[]): string[] {
  let end = tokens.length
  while (end > 0) {
    const token = tokens[end - 1] as string
    if (isNumber(token) || token === 'x' || token === '-' || token === '/' || token === '+') {
      end--
    } else if (UNIT_WORDS.has(token) && end >= 2 && isNumber(tokens[end - 2] as string)) {
      end -= 2
    } else {
      break
    }
  }
  return tokens.slice(0, end)
}

/**
 * Drops trailing clauses: "oil for frying", "tuna in brine", "lemon wedges to serve". A starter
 * inside a descriptor phrase ("bone in") is not a clause; step 6 strips the phrase.
 */
function cutClauses(tokens: readonly string[]): string[] {
  for (let index = 1; index < tokens.length; index++) {
    const token = tokens[index] as string
    const inDescriptor = DESCRIPTOR_PHRASES.some((phrase) => phraseAt(tokens, index - 1, phrase))
    if (CLAUSE_STARTERS.has(token) && !inDescriptor) return tokens.slice(0, index)
    if (token === 'to' && TO_CLAUSE_VERBS.has(tokens[index + 1] as string)) {
      return tokens.slice(0, index)
    }
  }
  return [...tokens]
}

/**
 * Keeps the first of two alternatives, borrowing the shared head noun when the first is a bare
 * modifier: "chicken or vegetable stock" → chicken stock, "butter or margarine" → butter.
 */
function pickFirstAlternative(tokens: readonly string[]): string[] {
  const or = tokens.indexOf('or')
  if (or <= 0) return [...tokens]
  const left = tokens.slice(0, or)
  const right = tokens.slice(or + 1)
  if (left.length === 1 && right.length >= 2) {
    const shared = [...left, ...right.slice(1)]
    if (!isKnownPhrase(left) || isKnownPhrase(shared)) return shared
  }
  return left
}

/** A descriptor stays when it is part of a canonical name or protected phrase around it. */
function isProtected(tokens: readonly string[], start: number, length: number): boolean {
  const end = start + length
  for (let from = Math.max(0, end - 5); from <= start; from++) {
    for (let to = end; to <= Math.min(tokens.length, from + 5); to++) {
      if (to - from < 2) continue
      const window = tokens.slice(from, to).join(' ')
      if (PROTECTED.has(window) || PROTECTED.has(singularizeLast(window))) return true
    }
  }
  return false
}

/** Step 6: multi-word descriptors first, then single words, never from inside a protected name. */
function stripDescriptors(tokens: readonly string[]): string[] {
  let out = [...tokens]
  for (const phrase of DESCRIPTOR_PHRASES) {
    for (let index = 0; index <= out.length - phrase.length; index++) {
      if (phraseAt(out, index, phrase) && !isProtected(out, index, phrase.length)) {
        out = [...out.slice(0, index), ...out.slice(index + phrase.length)]
        index--
      }
    }
  }
  const dropped = out.map(
    (token, index) => DESCRIPTOR_WORDS.has(token) && !isProtected(out, index, 1),
  )
  // "peeled and chopped garlic": an "and" between two dropped descriptors goes with them.
  return out.filter(
    (token, index) =>
      !dropped[index] && !(token === 'and' && dropped[index - 1] && dropped[index + 1]),
  )
}

/** "salt and black pepper" → salt: a line of two staples is one assumed staple. */
function pickStaplePair(words: readonly string[]): string | undefined {
  const and = words.indexOf('and')
  if (and <= 0) return undefined
  const left = normalizeEnglishIngredient(words.slice(0, and).join(' '))
  const right = normalizeEnglishIngredient(words.slice(and + 1).join(' '))
  return isStaple(left) && isStaple(right) ? left : undefined
}

/**
 * Step 8a: "ground sumac" → sumac. Ground forms that are a different product are names of their
 * own ("ground beef", "ground ginger") or synonyms ("ground rice"), so they never get here.
 */
function dropGroundPrefix(phrase: string): string {
  if (CANONICAL_NAMES.has(phrase) || !phrase.startsWith('ground ')) return phrase
  const rest = phrase.slice('ground '.length)
  return lookupSynonym(rest) ?? (CANONICAL_NAMES.has(rest) ? rest : phrase)
}

/**
 * Step 8b: "cheddar cheese" → cheddar, "salmon fillet" → salmon, "rocket leaf" → arugula. A portion
 * never turns an alias into a staple: "pepper strip" is not black pepper.
 */
function dropRedundantHead(phrase: string): string {
  if (CANONICAL_NAMES.has(phrase)) return phrase
  const space = phrase.lastIndexOf(' ')
  if (space === -1) return phrase
  const rest = phrase.slice(0, space)
  const head = phrase.slice(space + 1)
  const base = CANONICAL_NAMES.has(rest) ? rest : lookupSynonym(rest)
  if (base === undefined || (base !== rest && isStaple(base))) return phrase
  if (PORTION_HEADS.has(head) || ancestorsOf(base).includes(head)) return base
  return phrase
}

function clampLength(phrase: string): string {
  if (phrase.length <= MAX_CANONICAL_LENGTH) return phrase
  const cut = phrase.slice(0, MAX_CANONICAL_LENGTH + 1)
  const space = cut.lastIndexOf(' ')
  return space > 0 ? cut.slice(0, space) : cut.slice(0, MAX_CANONICAL_LENGTH)
}

/**
 * Raw English ingredient text → canonical name ("2 large ripe tomatoes, diced" → "tomato"), or ''
 * when the text is only quantities, units and descriptors. The order is fixed (PLAN.md row 12):
 * synonyms run before descriptor stripping so "minced beef" and "red pepper flakes" survive.
 */
export function normalizeEnglishIngredient(raw: string): string {
  // Steps 1–2: fold the text, drop asides and post-comma descriptors, split into tokens.
  const tokens = tokenize(stripAsides(foldText(raw)))
  // Step 3: quantities and units at either end, then trailing clauses and alternatives.
  const trimmed = stripTrailingAmounts(stripLeadingAmounts(tokens))
  // Step 4: joiners left in the middle ("chinese 5-spice") are punctuation, not words.
  const words = pickFirstAlternative(cutClauses(trimmed)).filter((token) => /^[a-z0-9]/.test(token))
  if (words.length === 0) return ''

  // Step 5: whole-phrase synonyms before descriptors are stripped.
  const phrase = words.join(' ')
  const early = lookupSynonym(phrase) ?? lookupSynonym(singularizeLast(phrase))
  if (early !== undefined) return early

  // Step 6: descriptors.
  const described = stripDescriptors(words)
  if (described.length === 0) return ''
  const bare = described.join(' ')

  // Steps 7–8: singularize the head noun, second synonym pass (the plural first: "peppers" are
  // bell peppers, "pepper" is black pepper), staple pairs, then the "ground" prefix and heads.
  const singular = singularizeLast(bare)
  const late = lookupSynonym(bare) ?? lookupSynonym(singular) ?? pickStaplePair(described)
  if (late !== undefined) return late
  return clampLength(dropRedundantHead(dropGroundPrefix(singular)))
}
