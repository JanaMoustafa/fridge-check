import { isCanonicalName } from './canonical'
import { ARABIC_ALIASES } from './config/arabic-aliases'
import { ARABIC_DISPLAY_ALIASES } from './config/arabic-display-aliases'

/** Arabic, Arabic Supplement, Arabic Extended-A and both presentation-form blocks. U+FEFF (the
 *  byte-order mark) sits at the end of Presentation Forms-B but is not a letter, so it is left out. */
const ARABIC_CHAR = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFC]/u

export function hasArabic(text: string): boolean {
  return ARABIC_CHAR.test(text)
}

/** Letters NFKD leaves alone that people type interchangeably, plus Arabic punctuation. Persian
 *  yeh/keheh and alef wasla come from non-Arabic keyboard layouts and old copy-paste; veh, peh,
 *  tcheh and gaf are how Egyptian labels spell v/p/g loanwords (ڤانيليا). Escaped so look-alike
 *  letters stay unambiguous in review. */
const CHAR_FOLDS: ReadonlyMap<string, string> = new Map([
  ['\u0629', '\u0647'], // ة → ه
  ['\u0649', '\u064A'], // ى → ي
  ['\u0624', '\u0648'], // ؤ → و (NFKD already splits it; kept for robustness)
  ['\u0626', '\u064A'], // ئ → ي (likewise)
  ['\u06CC', '\u064A'], // Persian yeh ی → ي
  ['\u06A9', '\u0643'], // Persian keheh ک → ك
  ['\u0671', '\u0627'], // alef wasla ٱ → ا
  ['\u06A4', '\u0641'], // veh ڤ → ف
  ['\u067E', '\u0628'], // peh پ → ب
  ['\u0686', '\u062C'], // tcheh چ → ج
  ['\u06AF', '\u062C'], // gaf گ → ج (the alias table writes the hard g as ج: جودا)
  ['\u060C', ','], // Arabic comma
  ['\u061B', ';'], // Arabic semicolon
  ['\u061F', '?'], // Arabic question mark
  ['\u066B', '.'], // Arabic decimal separator
  ['\u066C', ','], // Arabic thousands separator
  ['\u066A', '%'], // Arabic percent sign
])
const CHAR_FOLD_PATTERN = new RegExp(`[${[...CHAR_FOLDS.keys()].join('')}]`, 'gu')

/**
 * Folds the spelling variation Arabic typists produce into one comparable form: NFKD then strip
 * combining marks (tashkeel, shadda, superscript alef, and the hamza that NFKD splits off أ إ آ),
 * ة→ه, ى→ي, ؤ→و, ئ→ي, ڤ→ف, پ→ب, چ/گ→ج, drop tatweel and invisible direction marks, Arabic-Indic
 * and Persian digits → ASCII, Arabic punctuation → ASCII, word-final اء → ا (MSA فاصولياء ≡
 * Egyptian فاصوليا), collapse whitespace, trim. Latin case is left as typed.
 */
export function foldArabic(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[\u0640\p{Cf}]/gu, '')
    .replace(CHAR_FOLD_PATTERN, (char) => CHAR_FOLDS.get(char) ?? char)
    .replace(/[\u0660-\u0669]/gu, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/gu, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/\u0627\u0621(?=\P{L}|$)/gu, '\u0627')
    .replace(/\s+/gu, ' ')
    .trim()
}

/** Splits folded text into words, keeping decimals, fractions and ranges ("1.5", "1/2", "2-3")
 *  intact and prying digits off glued units ("200جم" → "200 جم"). */
function tokenize(folded: string): string[] {
  return folded
    .replace(/\u2044/gu, '/')
    .replace(/[^\p{L}\p{N}\s./-]/gu, ' ')
    .replace(/(\d)(?=[^\d\s./-])/gu, '$1 ')
    .replace(/([^\d\s./-])(?=\d)/gu, '$1 ')
    .replace(/(?<!\d)[./-]|[./-](?!\d)/gu, ' ')
    .split(/\s+/u)
    .filter((word) => word !== '')
    .map(unifyColour)
}

/** Feminine colour → masculine, so one alias spelling covers جبنة بيضاء, جبنة بيضا (بيضاء
 *  already folds to بيضا) and جبن أبيض alike. */
const COLOUR_FORMS: ReadonlyMap<string, string> = new Map(
  Object.entries({ بيضاء: 'أبيض', حمراء: 'أحمر', خضراء: 'أخضر', صفراء: 'أصفر', سوداء: 'أسود' }).map(
    ([feminine, masculine]) => [foldArabic(feminine), foldArabic(masculine)],
  ),
)
const COLOURS: ReadonlySet<string> = new Set([...COLOUR_FORMS.keys(), ...COLOUR_FORMS.values()])

/** بيضا → ابيض, keeping an article (البيضا → الابيض). */
function unifyColour(word: string): string {
  const bare = stripArticle(word)
  const masculine = COLOUR_FORMS.get(bare)
  return masculine === undefined ? word : word.slice(0, word.length - bare.length) + masculine
}

/** Folded form of each word list, built from plain spellings so the tables stay readable. */
function foldedSet(words: readonly string[]): ReadonlySet<string> {
  return new Set(words.map((word) => foldArabic(word).toLowerCase()))
}

const NUMBER_WORDS = foldedSet([
  ...['واحد', 'واحدة', 'وحدة', 'اثنين', 'اثنان', 'اتنين', 'اتنان', 'اثنتين', 'اتنتين'],
  ...['ثلاث', 'ثلاثة', 'تلات', 'تلاتة', 'أربع', 'أربعة', 'خمس', 'خمسة', 'ست', 'ستة'],
  ...['سبع', 'سبعة', 'ثمان', 'ثماني', 'ثمانية', 'تمانية', 'تمنية', 'تسع', 'تسعة', 'عشر', 'عشرة'],
  // Egyptian مية is both "water" and "a hundred"; whole-phrase lookup runs first, so مية alone
  // is still water.
  ...['مية', 'مائة', 'مئة', 'ميتين', 'مئتين', 'ألف'],
  // Egyptian 11–19, tens and hundreds: خمسمية جرام is the everyday half kilo.
  ...['حداشر', 'اتناشر', 'تلتاشر', 'اربعتاشر', 'خمستاشر', 'ستاشر', 'سبعتاشر', 'تمنتاشر'],
  ...['تسعتاشر', 'عشرين', 'عشرون', 'ثلاثين', 'ثلاثون', 'تلاتين', 'أربعين', 'أربعون', 'خمسين'],
  ...['خمسون', 'ستين', 'ستون', 'سبعين', 'سبعون', 'ثمانين', 'ثمانون', 'تمانين', 'تسعين', 'تسعون'],
  ...['ثلاثمائة', 'تلتمية', 'أربعمائة', 'ربعمية', 'أربعمية', 'خمسمائة', 'خمسمية', 'ستمائة'],
  ...['ستمية', 'سبعمائة', 'سبعمية', 'ثمانمائة', 'تمنمية', 'تسعمائة', 'تسعمية'],
  ...['نص', 'نصف', 'ربع', 'تلت', 'ثلث', 'تلتين', 'ثلثين', 'تمن', 'ثمن'],
  ...['كام', 'شوية', 'شوي', 'قليل', 'قليلة', 'بعض', 'حوالي', 'تقريبا', 'نحو', 'من', 'و', 'إلا'],
  // Written recipes count with عدد ("عدد ٣ حبات") and leave amounts open with كمية.
  ...['عدد', 'كمية'],
])

const UNIT_WORDS = foldedSet([
  ...['كوب', 'أكواب', 'كوبين', 'كوباية', 'كوبايات', 'كباية', 'كبايات', 'فنجان', 'فناجين'],
  ...['ملعقة', 'ملاعق', 'معلقة', 'معالق', 'ملعقتين', 'معلقتين', 'م', 'ك', 'ص'],
  ...['جرام', 'جرامات', 'جراما', 'جرامين', 'جم', 'غرام', 'غرامات', 'غم', 'غ'],
  ...['كيلو', 'كيلوجرام', 'كيلوغرام', 'كجم', 'كغم', 'كغ', 'كيلوين'],
  ...['لتر', 'لترات', 'ليتر', 'ليترات', 'لترين', 'مل', 'ملي', 'مللي', 'ملليلتر', 'مليلتر'],
  ...['رشة', 'رشات', 'رشتين', 'حبة', 'حبات', 'حبتين', 'فص', 'فصوص', 'فصين'],
  ...['علبة', 'علب', 'علبتين', 'باكو', 'باكت', 'باكيت', 'كيس', 'أكياس', 'كيسين', 'برطمان'],
  ...['حزمة', 'حزم', 'ربطة', 'ربطات', 'ربطتين', 'ضمة', 'شريحة', 'شرائح', 'شريحتين'],
  ...['قطعة', 'قطع', 'قطعتين', 'رأس', 'رؤوس', 'عود', 'أعواد', 'عيدان', 'عودين', 'قرن', 'قرون'],
  ...['كف', 'حفنة', 'رغيف', 'أرغفة', 'رغيفين', 'مكعب', 'مكعبات', 'زجاجة', 'قزازة', 'رطل'],
  // How Egyptian shops sell: a carton, tray or dozen of eggs, a block of butter, a sack of rice.
  ...['كوبايتين', 'كبايتين', 'كرتونة', 'كرتونتين', 'طبق', 'طبقين', 'دستة', 'دستتين', 'قالب'],
  ...['قوالب', 'قالبين', 'حتة', 'حتت', 'حتتين', 'إزازة', 'إزازتين', 'شكارة', 'عبوة', 'عبوات'],
  ...['عبوتين', 'باكتة', 'قرطاس', 'سباطة', 'عنقود'],
  ...['أوقية', 'أونصة', 'g', 'gm', 'gr', 'gram', 'grams', 'kg', 'ml', 'l', 'lt', 'ltr', 'cup'],
  ...['cups', 'tbsp', 'tbs', 'tsp', 'pc', 'pcs', 'piece', 'pieces', 'x', 'lb', 'lbs', 'oz'],
])

/** Spoon sizes only count as part of the unit right after a spoon ("ملعقة شاي سكر"). */
const SPOON_WORDS = foldedSet(['ملعقة', 'ملاعق', 'معلقة', 'معالق', 'ملعقتين', 'معلقتين', 'م'])
const SPOON_SIZES = foldedSet([
  ...['كبيرة', 'صغيرة', 'كبير', 'صغير', 'كبار', 'صغار', 'شاي', 'طعام', 'أكل', 'حلو'],
  ...['ك', 'ص'],
])

/** Words that never change what you buy. Like colours, they only drop after the full phrase
 *  failed, so لحمة مفرومة and بصل أحمر still resolve to their own names. */
const DESCRIPTORS = foldedSet([
  ...['طازج', 'طازجة', 'طازة', 'فريش', 'مفروم', 'مفرومة', 'مقطع', 'مقطعة', 'متقطع', 'متقطعة'],
  ...['مقطوع', 'مبشور', 'مبشورة', 'مكعبات', 'كبير', 'كبيرة', 'كبار', 'صغير', 'صغيرة', 'صغار'],
  ...['متوسط', 'متوسطة', 'وسط', 'ناعم', 'ناعمة', 'خشن', 'خشنة', 'شرائح', 'حلقات', 'أصابع'],
  ...['مقشر', 'مقشرة', 'مقشور', 'مسلوق', 'مسلوقة', 'مشوي', 'مشوية', 'مقلي', 'مقلية', 'محمص'],
  ...['محمصة', 'مجمد', 'مجمدة', 'فريزر', 'مبرد', 'مبردة', 'مذاب', 'مذابة', 'سايح', 'سايحة'],
  ...['طري', 'طرية', 'ساخن', 'سخن', 'سخنة', 'دافئ', 'دافي', 'دافية', 'بارد', 'باردة', 'ساقع'],
  ...['ساقعة', 'مغسول', 'مغسولة', 'مصفى', 'مصفاة', 'منقوع', 'منقوعة', 'مهروس', 'مهروسة'],
  ...['مدقوق', 'مدقوقة', 'مطحون', 'مطحونة', 'مجفف', 'مجففة', 'ناشف', 'ناشفة', 'جاف', 'جافة'],
  ...['معلب', 'معلبة', 'بلدي', 'سادة', 'بكر', 'ممتاز', 'فاخر', 'عضوي', 'عضوية', 'طبيعي'],
  ...['طبيعية', 'مستورد', 'مستوردة', 'مصري', 'نيء', 'ني', 'مطبوخ', 'مطبوخة', 'سائل', 'سائلة'],
  ...['مملح', 'مملحة', 'مسحب', 'مسحبة', 'اختياري', 'الرغبة', 'الذوق', 'حسب', 'جديد'],
])

/** Heads a colour turns into another product: white sauce is béchamel, white meat is poultry,
 *  black lime is loomi, white chocolate is not chocolate, green curry is a paste, green لوبيا is
 *  the Levantine green bean. A colour right after them never drops, so a pair the alias table
 *  does not list stays unrecognised. Anywhere else a colour is a variety and drops (تفاح أحمر →
 *  apple, جبنة صفراء → cheese, صوص صويا أسود → soy sauce). */
const COLOUR_BOUND_HEADS = foldedSet([
  ...['صلصة', 'صوص', 'لحم', 'لحمة', 'ليمون', 'ليمونة', 'كاري', 'لوبيا'],
  ...['شوكولاتة', 'شيكولاتة', 'شوكولا', 'شيكولا'],
])

/** "٢ أو ٣", "حبة أو حبتين", "2 إلى 3": between two measures these join a range. */
const RANGE_JOINERS = foldedSet(['أو', 'إلى', 'الى'])

/** Words that open a trailing clause ("…أو سمنة", "…حسب الرغبة", "…منزوع الجلد", "…للقلي"):
 *  everything from them on is dropped once the full phrase failed. */
const CLAUSE_WORDS = foldedSet([
  ...['أو', 'حسب', 'مع', 'بدون', 'غير', 'قليل', 'قليلة', 'كامل', 'كاملة', 'خالي', 'خالية'],
  ...['منزوع', 'منزوعة', 'مقطع', 'مقطعة', 'إلى', 'الى', 'لحين'],
])

const NUMBER_TOKEN = /^\d+(?:[.,/]\d+)?(?:-\d+(?:[.,/]\d+)?)?$/u
const LATIN = /[a-z]/u

/** "ال" off the front of a word, keeping at least two letters (الليمون → ليمون, but not ال). */
function stripArticle(word: string): string {
  return word.length > 3 && word.startsWith('ال') ? word.slice(2) : word
}

/** Matches a word against a folded set, also without a leading و ("and") or ال. */
function inSet(set: ReadonlySet<string>, word: string): boolean {
  if (set.has(word)) return true
  const bare = stripArticle(word)
  if (set.has(bare)) return true
  if (word.length > 2 && word.startsWith('و')) {
    const rest = word.slice(1)
    return set.has(rest) || set.has(stripArticle(rest))
  }
  return false
}

const isQuantity = (word: string): boolean => NUMBER_TOKEN.test(word) || inSet(NUMBER_WORDS, word)
const isMeasure = (word: string): boolean => isQuantity(word) || UNIT_WORDS.has(word)
const isDescriptor = (word: string): boolean => inSet(DESCRIPTORS, word)
const opensClause = (word: string): boolean =>
  inSet(CLAUSE_WORDS, word) || (word.length > 3 && word.startsWith('لل')) || word.startsWith('بال')

/** Every position where a run of leading quantities/units ends: "١ ملعقة حبة البركة" gives
 *  [0, 1, 2, 3] so "حبة البركة" (nigella) is tried before "البركة". */
function leadingCuts(words: readonly string[]): number[] {
  const cuts = [0]
  let afterSpoon = false
  for (const [position, word] of words.entries()) {
    if (afterSpoon && SPOON_SIZES.has(word)) {
      // "ملعقة كبيرة" is one unit: move the cut past the size instead of adding another.
      cuts[cuts.length - 1] = position + 1
      afterSpoon = false
      continue
    }
    const joinsRange =
      RANGE_JOINERS.has(word) &&
      isMeasure(words[position - 1] ?? '') &&
      isMeasure(words[position + 1] ?? '')
    if (!isMeasure(word) && !joinsRange) break
    afterSpoon = SPOON_WORDS.has(word)
    cuts.push(position + 1)
  }
  return cuts
}

function trimTrailing(words: readonly string[]): readonly string[] {
  return words.slice(0, words.findLastIndex((word) => !isMeasure(word)) + 1)
}

/** The phrase, then the phrase minus each trailing droppable word in turn ("بصل أحمر مفروم" →
 *  "بصل أحمر" → "بصل"), stopping at the last word that is not droppable. */
function peelTrailing(
  words: readonly string[],
  droppable: (word: string) => boolean,
): Array<readonly string[]> {
  const stop = Math.max(words.findLastIndex((word) => !droppable(word)) + 1, 1)
  const prefixes: Array<readonly string[]> = []
  for (let end = words.length; end >= stop; end -= 1) prefixes.push(words.slice(0, end))
  return prefixes
}

function cutClause(words: readonly string[]): readonly string[] {
  const index = words.findIndex((word, position) => position > 0 && opensClause(word))
  return index === -1 ? words : words.slice(0, index)
}

/** Cheap singular/plural/dual forms of one folded word: بيضات → بيض، بيضتين → بيضه،
 *  طماطمايه (Egyptian singulative) → طماطم، بصله → بصل، فرخ → فرخه. */
function wordVariants(word: string): string[] {
  const variants: string[] = []
  if (word.length > 4 && word.endsWith('ايه')) variants.push(word.slice(0, -3))
  if (word.length > 4 && word.endsWith('تين')) variants.push(`${word.slice(0, -3)}ه`)
  if (word.length > 3 && word.endsWith('ات')) {
    variants.push(word.slice(0, -2), `${word.slice(0, -2)}ه`)
  }
  if (word.endsWith('ه')) variants.push(word.slice(0, -1))
  else variants.push(`${word}ه`)
  return variants.filter((variant) => variant.length > 1)
}

/** Folded, lower-cased, single-spaced form used for alias keys and for input alike. */
function aliasKey(phrase: string): string {
  return tokenize(foldArabic(phrase).toLowerCase()).join(' ')
}

function articleFreeKey(key: string): string {
  return key.split(' ').map(stripArticle).join(' ')
}

export interface ArabicAliasIndex {
  /** Folded phrase → canonical name. */
  exact: ReadonlyMap<string, string>
  /** The same phrases with "ال" removed from every word (البصل الأخضر ≡ بصل أخضر). */
  articleFree: ReadonlyMap<string, string>
}

function addUnique(map: Map<string, string>, key: string, canonical: string, phrase: string) {
  const existing = map.get(key)
  if (existing !== undefined && existing !== canonical) {
    throw new Error(
      `Arabic alias "${phrase}" folds to "${key}", already mapped to "${existing}" (not "${canonical}")`,
    )
  }
  map.set(key, canonical)
}

/**
 * Folds every phrase once. Throws on a canonical name the rest of the engine would reject, an
 * alias that folds to nothing, or two aliases that fold together but disagree — a silent
 * last-one-wins would make the mapping depend on table order.
 */
export function buildArabicAliasIndex(
  groups: Readonly<Record<string, readonly string[]>>,
): ArabicAliasIndex {
  const exact = new Map<string, string>()
  const articleFree = new Map<string, string>()
  for (const [canonical, phrases] of Object.entries(groups)) {
    if (!isCanonicalName(canonical)) {
      throw new Error(`Arabic alias target "${canonical}" is not a canonical name`)
    }
    for (const phrase of phrases) {
      const key = aliasKey(phrase)
      if (key === '' || !hasArabic(key)) {
        throw new Error(`Arabic alias "${phrase}" for "${canonical}" has no Arabic text`)
      }
      addUnique(exact, key, canonical, phrase)
      addUnique(articleFree, articleFreeKey(key), canonical, phrase)
    }
  }
  return { exact, articleFree }
}

/** Concatenates alias groups that may share canonical keys. */
function mergeAliasGroups(
  ...tables: ReadonlyArray<Readonly<Record<string, readonly string[]>>>
): Record<string, string[]> {
  const merged: Record<string, string[]> = {}
  for (const table of tables) {
    for (const [canonical, phrases] of Object.entries(table)) {
      merged[canonical] = [...(merged[canonical] ?? []), ...phrases]
    }
  }
  return merged
}

const INDEX = buildArabicAliasIndex(mergeAliasGroups(ARABIC_ALIASES, ARABIC_DISPLAY_ALIASES))
const ENTRIES: ReadonlyArray<readonly [string, string]> = Object.freeze(
  [...INDEX.exact].map(([phrase, canonical]) => Object.freeze([phrase, canonical] as const)),
)

/** Every (folded Arabic phrase, canonical) pair, so callers can cross-check targets against the
 *  English vocabulary and families. */
export function arabicAliasEntries(): ReadonlyArray<readonly [string, string]> {
  return ENTRIES
}

function lookup(words: readonly string[]): string | undefined {
  if (words.length === 0) return undefined
  const exact = INDEX.exact.get(words.join(' '))
  if (exact !== undefined) return exact
  const bare = words.map(stripArticle)
  const hit = INDEX.articleFree.get(bare.join(' '))
  if (hit !== undefined) return hit
  for (const [position, word] of bare.entries()) {
    for (const variant of wordVariants(word)) {
      const candidate = bare.with(position, variant).join(' ')
      const found = INDEX.articleFree.get(candidate)
      if (found !== undefined) return found
    }
  }
  return undefined
}

/**
 * Most specific reading first, so a descriptor that is part of a name (لحمة مفرومة) wins over the
 * generic rule that strips it (بصل مفروم → بصل):
 *   A. the phrase at each leading-quantity cut, as typed and with trailing quantities removed;
 *   B. then with a trailing clause cut and trailing descriptors peeled off one by one — first with
 *      inner quantity words kept (قرن فلفل، حبة البركة are names), then with them removed
 *      (لحمة ٢ كيلو مفرومة);
 *   C. then with every quantity, unit and descriptor removed wherever it sits.
 * B and C drop a colour like a descriptor, unless it directly follows a head it turns into another
 * product (COLOUR_BOUND_HEADS).
 */
function resolveWords(words: readonly string[]): string | undefined {
  if (words.length === 0) return undefined
  const cuts = leadingCuts(words)
  const [head = '', next = ''] = words.slice(cuts.at(-1)).filter((word) => !isMeasure(word))
  const colourBound = inSet(COLOUR_BOUND_HEADS, head) && inSet(COLOURS, next)
  const droppable = (word: string): boolean =>
    isDescriptor(word) || (!colourBound && inSet(COLOURS, word))

  const forms: Array<readonly string[]> = []
  for (const cut of cuts) {
    const rest = words.slice(cut)
    forms.push(rest)
    const trimmed = trimTrailing(rest)
    if (trimmed.length !== rest.length) forms.push(trimmed)
  }

  for (const form of forms) {
    const hit = lookup(form)
    if (hit !== undefined) return hit
  }

  const cores = forms.map((form) => trimTrailing(cutClause(form)))
  for (const core of [...cores, ...cores.map((words) => words.filter((w) => !isMeasure(w)))]) {
    for (const prefix of peelTrailing(core, droppable)) {
      const hit = lookup(prefix)
      if (hit !== undefined) return hit
    }
  }

  for (const form of forms) {
    const hit = lookup(form.filter((word) => !isMeasure(word) && !droppable(word)))
    if (hit !== undefined) return hit
  }
  return undefined
}

/** Parentheses and list punctuation usually start a note: "طماطم (مقشرة)", "زبدة، أو سمنة". */
const NOTE_BREAK = /[,;:()[\]{}|]/u

/**
 * Maps one Arabic ingredient as a user types it (MSA or Egyptian, with quantities, units,
 * articles, plurals and prep notes) to the canonical English name the English pipeline uses, or
 * null when it is not recognised. Input without Arabic letters is never recognised here — it
 * belongs to the English pipeline. Latin words mixed into Arabic are ignored as a last resort.
 */
export function normalizeArabicIngredient(raw: string): string | null {
  if (!hasArabic(raw)) return null
  const folded = foldArabic(raw).toLowerCase()
  const texts = [folded]
  const noteAt = folded.search(NOTE_BREAK)
  if (noteAt > 0 && hasArabic(folded.slice(0, noteAt))) texts.push(folded.slice(0, noteAt))

  for (const text of texts) {
    const words = tokenize(text)
    const hit =
      resolveWords(words) ??
      (words.some((word) => LATIN.test(word))
        ? resolveWords(words.filter((word) => !LATIN.test(word)))
        : undefined)
    if (hit !== undefined) return hit
  }
  return null
}
