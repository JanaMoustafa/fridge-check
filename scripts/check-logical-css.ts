/**
 * Fails when source code uses physical (left/right) direction utilities or CSS properties.
 * The layout must mirror in RTL, so only logical ones are allowed:
 * ms-/me-/ps-/pe-/inset-s-/inset-e-/text-start/text-end/rounded-s/rounded-e/border-s/border-e,
 * margin-inline-start, inset-inline-end, text-align: start, …
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const TAILWIND_PHYSICAL = [
  /(?<![\w-])-?m[lr]-[\w[]/, // ml-4, mr-auto, -ml-2
  /(?<![\w-])p[lr]-[\w[]/, // pl-4, pr-2
  /(?<![\w-/])-?(?:left|right)-(?:\d|\[|px|full|auto)/, // left-0, -right-2
  /(?<![\w-])text-(?:left|right)(?![\w-])/,
  /(?<![\w-])rounded-(?:[lr]|tl|tr|bl|br)(?:-[\w[]|(?![\w-]))/,
  /(?<![\w-])border-[lr](?:-[\w[]|(?![\w-]))/,
  /(?<![\w-])(?:float|clear)-(?:left|right)(?![\w-])/,
  /(?<![\w-])scroll-[mp][lr]-[\w[]/,
]

const CSS_PHYSICAL = [
  /(?:margin|padding|border|scroll-margin|scroll-padding)-(?:left|right)\s*:/,
  /(?<![\w-])(?:left|right)\s*:/,
  /text-align\s*:\s*(?:left|right)/,
  /float\s*:\s*(?:left|right)/,
]

export interface Violation {
  file: string
  line: number
  text: string
}

export function findViolations(file: string, source: string): Violation[] {
  const patterns = file.endsWith('.css') ? CSS_PHYSICAL : TAILWIND_PHYSICAL
  const violations: Violation[] = []
  source.split('\n').forEach((text, index) => {
    if (patterns.some((pattern) => pattern.test(text))) {
      violations.push({ file, line: index + 1, text: text.trim() })
    }
  })
  return violations
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return walk(path)
    return /\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : []
  })
}

export function run(root: string): Violation[] {
  return walk(join(root, 'src')).flatMap((file) =>
    findViolations(relative(root, file), readFileSync(file, 'utf8')),
  )
}

if (process.argv[1]?.endsWith('check-logical-css.ts')) {
  const violations = run(process.cwd())
  if (violations.length === 0) {
    console.log('✓ Only logical (RTL-safe) direction utilities found.')
  } else {
    console.error(
      'Physical direction utilities break RTL. Use logical ones (ms/me/ps/pe/inset-s/…):',
    )
    for (const v of violations) console.error(`  ${v.file}:${v.line}  ${v.text}`)
    process.exitCode = 1
  }
}
