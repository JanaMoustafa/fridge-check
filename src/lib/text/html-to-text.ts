/**
 * Spoonacular's `instructions` field is HTML ("<ol><li>Boil the pasta.</li>…"). This turns it
 * into plain text, one block per line, for splitSteps. The result is only ever rendered as React
 * text (escaped), never as HTML, so this is about readable text rather than sanitizing.
 */

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  deg: '°',
  frac12: '½',
  frac14: '¼',
  frac34: '¾',
  times: '×',
  eacute: 'é',
}

/** Tags that end a line: "<li>Boil</li><li>Drain</li>" is two steps, not "BoilDrain". */
const BLOCK_TAG = /<\/?(?:p|div|li|ol|ul|h[1-6]|tr|section|article|br)\b[^>]*>/gi

function decodeEntity(entity: string, body: string): string {
  if (body.startsWith('#')) {
    const code =
      body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : Number(body.slice(1))
    return Number.isInteger(code) && code > 0 && code <= 0x10ffff
      ? String.fromCodePoint(code)
      : entity
  }
  return NAMED_ENTITIES[body.toLowerCase()] ?? entity
}

export function htmlToText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(BLOCK_TAG, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, decodeEntity)
    .split('\n')
    .map((line) => line.replace(/[\s ]+/g, ' ').trim())
    .filter((line) => line !== '')
    .join('\n')
}
