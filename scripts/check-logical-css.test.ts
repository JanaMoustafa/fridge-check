import { describe, expect, it } from 'vitest'
import { findViolations, run } from './check-logical-css'

describe('findViolations (Tailwind)', () => {
  it.each([
    'className="ml-4"',
    'className="mr-auto"',
    'className="-ml-2"',
    'className="pl-3"',
    'className="pr-[10px]"',
    'className="left-0"',
    'className="-right-2"',
    'className="text-left"',
    'className="text-right"',
    'className="rounded-l-lg"',
    'className="rounded-tr"',
    'className="border-r"',
    'className="border-l-2"',
    'className="float-right"',
    'className="scroll-pl-4"',
  ])('flags %s', (line) => {
    expect(findViolations('a.tsx', line)).toHaveLength(1)
  })

  it.each([
    'className="ms-4 me-auto ps-3 pe-2"',
    'className="inset-s-0 inset-e-2 start-0"',
    'className="text-start text-end"',
    'className="rounded-s-lg rounded-e border-s border-e-2"',
    'className="html-left mt-2 mb-4 px-4 py-2"',
    'className="inset-x-0 translate-x-1/2"',
    "const items = ['leftover', 'alright']",
  ])('accepts %s', (line) => {
    expect(findViolations('a.tsx', line)).toEqual([])
  })
})

describe('findViolations (CSS)', () => {
  it.each([
    'margin-left: 4px;',
    'padding-right: 0;',
    'left: 0;',
    'text-align: right;',
    'float: left;',
  ])('flags %s', (line) => {
    expect(findViolations('a.css', line)).toHaveLength(1)
  })

  it.each([
    'margin-inline-start: 4px;',
    'inset-inline-end: 0;',
    '--origin-start: left;',
    'text-align: start;',
  ])('accepts %s', (line) => {
    expect(findViolations('a.css', line)).toEqual([])
  })

  it('reports file and line numbers', () => {
    expect(findViolations('x.css', 'a {}\nleft: 0;')).toEqual([
      { file: 'x.css', line: 2, text: 'left: 0;' },
    ])
  })
})

describe('repository source', () => {
  it('uses only logical direction utilities', () => {
    expect(run(process.cwd())).toEqual([])
  })
})
