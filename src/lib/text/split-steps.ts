/**
 * TheMealDB strInstructions → ordered plain-text steps. The source is hand-typed and messy: "\r\n",
 * "STEP 1" / "1." / "1)" prefixes, "▢" bullets, numbering-only lines, hard-wrapped lines, section
 * headers and whole recipes typed as one paragraph. Only layout changes here: markers and blank
 * lines are removed and whitespace is collapsed, but the words themselves are never altered.
 */

/** Invisible characters (zero-width space, word joiner, soft hyphen, BOM). */
const INVISIBLE = /[\u200B\u2060\u00AD\uFEFF]/g

/** "STEP 1", "Step 2:", "step 3 -" at the start of a line. */
const STEP_PREFIX = /^step\s*\d+\s*(?:[:.)\-–—]\s*)?/i

/** "1.", "12)", "3:" at the start of a line, but not the "1." of "1.5 cups". */
const NUMBER_PREFIX = /^\d{1,2}\s*[.):](?!\d)\s*/

/** "▢", "•", "-", "*" and friends at the start of a line. */
const BULLET_PREFIX = /^[▢□■▪•●◦·*✓✔➤►\-–—]+\s*/

/** A bare step number followed by a capitalised word: "1 Preheat the oven". */
const BARE_NUMBER = /^(\d{1,2})\s+(?=\p{Lu})/u

/** Labels that only repeat the section title the UI already shows. */
const GENERIC_LABEL = /^(?:cooking\s+)?(?:instructions|directions|method)\s*:?$/i

/**
 * A line this long that stops mid-sentence (no closing punctuation) before a line starting in
 * lowercase was wrapped by the source, not split into steps. Every real hard wrap in TheMealDB is
 * ≥ 105 characters; the short unpunctuated steps it must not glue together are ≤ 98.
 */
const HARD_WRAP_MIN_LENGTH = 100

/** Abbreviations whose period does not end a sentence, even before a capital ("approx. Two"). */
const ABBREVIATIONS: ReadonlySet<string> = new Set([
  'e.g',
  'i.e',
  'approx',
  'ca',
  'vs',
  'no',
  'tbsp',
  'tbs',
  'tblsp',
  'tsp',
  'oz',
  'lb',
  'lbs',
  'pkg',
  'mr',
  'mrs',
  'dr',
  'st',
])

/**
 * Sentence ends: ".", "!" or "?" (with any closing quotes or brackets) and whitespace, then a
 * capital letter, optionally behind an opening quote. Decimals ("1.5") have no space; a following
 * "(" or digit ("180°C. (350°F)") is not a new sentence.
 */
const SENTENCE_END = /[.!?]+["'”’)\]]*\s+(?=["“‘']?\p{Lu})/gu

/** Each step of a one-paragraph recipe holds at most this many sentences. */
const MAX_SENTENCES_PER_STEP = 3

interface Line {
  text: string
  /** The source marked this line as a new step (a number, "STEP n" or a bullet). */
  marked: boolean
}

function isHeader(text: string): boolean {
  return text.endsWith(':')
}

/** Strips every leading marker; repeated because sources stack them ("1. ▢ Step 1: …"). */
function stripMarkers(text: string): { text: string; marked: boolean } {
  let rest = text
  let marked = false
  for (;;) {
    const next = rest.replace(STEP_PREFIX, '').replace(NUMBER_PREFIX, '').replace(BULLET_PREFIX, '')
    if (next === rest) return { text: rest, marked }
    rest = next
    marked = true
  }
}

/**
 * Bare numbers are stripped only when they count 1, 2, 3 … down the recipe, so ingredient lines
 * typed into the method ("1 Cup Raw Cashews", "1 tsp. Vinegar") keep their amounts.
 */
function hasBareNumbering(lines: readonly string[]): boolean {
  const numbers = lines.flatMap((line) => {
    const match = BARE_NUMBER.exec(line)
    return match ? [Number(match[1])] : []
  })
  return numbers.length >= 2 && numbers.every((n, index) => n === index + 1)
}

function toLines(instructions: string): Line[] {
  const raw = instructions
    .replace(INVISIBLE, '')
    .split(/\r\n|\r|\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
  const bareNumbering = hasBareNumbering(raw)
  const lines: Line[] = []
  // A marker alone on its line ("1", "▢", "step 2") marks the next line with text.
  let pendingMark = false
  for (const line of raw) {
    let { text, marked } = stripMarkers(line)
    if (bareNumbering && BARE_NUMBER.test(text)) {
      text = text.replace(BARE_NUMBER, '')
      marked = true
    }
    if (text === '' || /^\d{1,2}$/.test(text)) {
      pendingMark ||= marked || text !== ''
      continue
    }
    lines.push({ text, marked: marked || pendingMark })
    pendingMark = false
  }
  return lines
}

/** Glues a hard-wrapped line back onto the line it was broken from. */
function joinHardWraps(lines: readonly Line[]): Line[] {
  const joined: Line[] = []
  for (const line of lines) {
    const previous = joined.at(-1)
    if (
      previous !== undefined &&
      !line.marked &&
      previous.text.length >= HARD_WRAP_MIN_LENGTH &&
      /[\p{Ll},]$/u.test(previous.text) &&
      /^\p{Ll}/u.test(line.text)
    ) {
      previous.text = `${previous.text} ${line.text}`
    } else {
      joined.push({ ...line })
    }
  }
  return joined
}

/** Missing space after a sentence: "minutes.Then" → "minutes. Then"; "U.S.A" is left alone. */
function spaceSentences(text: string): string {
  return text.replace(/([\p{Ll})])([.!?])(\p{Lu})/gu, '$1$2 $3')
}

/**
 * Generic labels are dropped; any other header is kept as its own step only when real content
 * follows it, so a trailing "Pro Tips:" or two headers in a row never leave an empty section.
 */
function dropEmptyHeaders(steps: readonly string[]): string[] {
  const kept: string[] = []
  for (let index = steps.length - 1; index >= 0; index--) {
    const step = steps[index] as string
    if (GENERIC_LABEL.test(step)) continue
    const next = kept[0]
    if (isHeader(step) && (next === undefined || isHeader(next))) continue
    kept.unshift(step)
  }
  return kept
}

function isAbbreviation(sentence: string): boolean {
  const lastWord = /(\S+)[.!?]+["'”’)\]]*$/.exec(sentence.trimEnd())
  return lastWord !== null && ABBREVIATIONS.has(lastWord[1]!.toLowerCase())
}

/** Sentences in order; joining them with single spaces gives back the input exactly. */
export function splitSentences(text: string): string[] {
  const sentences: string[] = []
  let start = 0
  for (const match of text.matchAll(SENTENCE_END)) {
    const end = match.index + match[0].length
    const sentence = text.slice(start, end).trimEnd()
    if (isAbbreviation(sentence)) continue
    sentences.push(sentence)
    start = end
  }
  sentences.push(text.slice(start))
  return sentences
}

/**
 * A recipe typed as one paragraph → steps of 1–3 sentences, as even as possible, earlier steps
 * taking the extra sentence. Any text of two or more sentences becomes at least two steps.
 */
function chunkParagraph(text: string): string[] {
  const sentences = splitSentences(text)
  if (sentences.length < 2) return [text]
  const count = Math.max(2, Math.ceil(sentences.length / MAX_SENTENCES_PER_STEP))
  const base = Math.floor(sentences.length / count)
  const extra = sentences.length % count
  const steps: string[] = []
  let start = 0
  for (let index = 0; index < count; index++) {
    const size = base + (index < extra ? 1 : 0)
    steps.push(sentences.slice(start, start + size).join(' '))
    start += size
  }
  return steps
}

/** strInstructions → ordered, non-empty plain-text steps (empty when there is no text at all). */
export function splitSteps(instructions: string): string[] {
  const steps = dropEmptyHeaders(
    joinHardWraps(toLines(instructions)).map((line) => spaceSentences(line.text)),
  )
  const content = steps.filter((step) => !isHeader(step))
  if (content.length !== 1) return steps
  // One paragraph of method (perhaps under a header): split it at sentence boundaries.
  return steps.flatMap((step) => (isHeader(step) ? [step] : chunkParagraph(step)))
}
