import { describe, expect, it, vi } from 'vitest'
import type { OcrWord } from './inbody-sheet'
import { patch, readSheetPhoto, type OcrEngine } from './ocr-run'

const word = (text: string, x0: number, y0: number, x1: number, h = 30): OcrWord => ({
  text,
  x0,
  y0,
  x1,
  y1: y0 + h,
  confidence: 90,
})

/** A plain light photo: the whole frame is the sheet. */
function photo(width = 400, height = 560) {
  return { rgba: new Uint8ClampedArray(width * height * 4).fill(235), width, height }
}

describe('readSheetPhoto', () => {
  it('reads the page twice, then looks closer, digits only, where a label has no figure', async () => {
    const page = [
      word('InBody', 60, 40, 200),
      word('Weight', 60, 900, 180),
      word('59.1', 300, 900, 380),
      word('Basal', 1577, 1930, 1660),
      word('Metabolic', 1670, 1930, 1820),
      word('Rate', 1830, 1930, 1900),
    ]
    const read = vi.fn<OcrEngine['read']>(async (_image, mode, digitsOnly) => {
      // The closer look reads an enlarged (2×) patch: its words are twice the page's size.
      if (digitsOnly) return [word('1154', 120, 30, 260, 60)]
      return mode === 'sparse' ? page : []
    })
    const steps: string[] = []
    const { rgba, width, height } = photo()
    const sheet = await readSheetPhoto(rgba, width, height, { read }, (step) => {
      steps.push(step)
    })
    expect(steps).toEqual(['straightening', 'reading', 'checking'])
    expect(read.mock.calls.map(([, mode, digits]) => `${mode}${digits ? ':digits' : ''}`)).toEqual([
      'sparse',
      'auto',
      'sparse:digits',
    ])
    expect(sheet.values.weightKg).toBe(59.1)
    expect(sheet.values.bmrKcal).toBe(1154)
    expect(sheet.page.width).toBe(2480)
  })

  it('makes no closer look when everything labelled was read', async () => {
    const read = vi.fn<OcrEngine['read']>(async (_image, mode) =>
      mode === 'sparse' ? [word('Weight', 60, 900, 180), word('59.1', 300, 900, 380)] : [],
    )
    const { rgba, width, height } = photo()
    await readSheetPhoto(rgba, width, height, { read })
    expect(read).toHaveBeenCalledTimes(2)
  })
})

describe('patch', () => {
  it('enlarges a region and makes it black on white', () => {
    const page = { data: new Uint8ClampedArray(1000 * 100).fill(220), width: 1000, height: 100 }
    for (let y = 40; y < 50; y++) page.data.fill(30, y * 1000 + 40, y * 1000 + 46)
    const image = patch(page, { x0: 30, y0: 30, x1: 60, y1: 60 })
    expect(image.width).toBe(60)
    expect(image.height).toBe(60)
    expect(new Set(image.data)).toEqual(new Set([0, 255]))
    expect(image.data[30 * 60 + 25]).toBe(0)
  })
})
