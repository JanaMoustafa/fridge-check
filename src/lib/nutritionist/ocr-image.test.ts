import { describe, expect, it } from 'vitest'
import {
  binarize,
  eraseBars,
  eraseNonText,
  findSheet,
  flatten,
  grayscale,
  otsu,
  type GrayImage,
} from './ocr-image'

function blank(width: number, height: number, value: number): GrayImage {
  return { data: new Uint8ClampedArray(width * height).fill(value), width, height }
}

function fill(image: GrayImage, x0: number, y0: number, x1: number, y1: number, value: number) {
  for (let y = y0; y < y1; y++) image.data.fill(value, y * image.width + x0, y * image.width + x1)
}

const at = (image: GrayImage, x: number, y: number) => image.data[y * image.width + x]

describe('ocr-image', () => {
  it('turns RGBA into luminance', () => {
    const rgba = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255, 255, 0, 0, 255])
    expect([...grayscale(rgba, 3, 1).data]).toEqual([255, 0, 76])
  })

  it("finds Otsu's threshold between two tones", () => {
    const image = blank(10, 10, 40)
    fill(image, 0, 0, 10, 5, 220)
    const threshold = otsu(image)
    expect(threshold).toBeGreaterThanOrEqual(40)
    expect(threshold).toBeLessThan(220)
  })

  it('finds a light sheet on a dark table by its corners', () => {
    const photo = blank(800, 1000, 60)
    fill(photo, 100, 150, 700, 900, 230)
    const quad = findSheet(photo)
    expect(quad).not.toBeNull()
    const [tl, tr, br, bl] = quad!
    expect(tl.x).toBeCloseTo(100, -1)
    expect(tl.y).toBeCloseTo(150, -1)
    expect(tr.x).toBeCloseTo(700, -1)
    expect(br.y).toBeCloseTo(900, -1)
    expect(bl.x).toBeCloseTo(100, -1)
  })

  it('leaves a photo that is all sheet as it is', () => {
    expect(findSheet(blank(600, 800, 230))).toBeNull()
  })

  it('flattens the sheet to the standard width, keeping its proportions', () => {
    const photo = blank(800, 1000, 60)
    fill(photo, 100, 150, 700, 900, 230)
    const page = flatten(photo, findSheet(photo), 1200)
    expect(page.width).toBe(1200)
    expect(page.height).toBeCloseTo(1500, -1)
    expect(at(page, 600, 750)).toBeGreaterThan(200)
  })

  it('keeps text dark and a shadowed page light', () => {
    const page = blank(400, 400, 0)
    // Paper that darkens to the right (a shadow), with a dark stroke on each half.
    for (let x = 0; x < 400; x++) fill(page, x, 0, x + 1, 400, 235 - x * 0.25)
    fill(page, 50, 200, 90, 204, 20)
    fill(page, 300, 200, 340, 204, 30)
    const binary = binarize(page)
    expect(at(binary, 70, 202)).toBe(0)
    expect(at(binary, 320, 202)).toBe(0)
    expect(at(binary, 70, 100)).toBe(255)
    expect(at(binary, 360, 100)).toBe(255)
  })

  it('erases bars and rules but not a figure printed next to them', () => {
    const image = blank(1000, 100, 255)
    fill(image, 10, 40, 600, 60, 0) // a bar
    fill(image, 620, 35, 628, 65, 0) // a "1" right after it
    eraseBars(image)
    expect(at(image, 300, 50)).toBe(255)
    expect(at(image, 624, 50)).toBe(0)
  })

  it('erases shapes that cannot be text and keeps glyph-sized ones', () => {
    const image = blank(1000, 400, 255)
    fill(image, 10, 10, 990, 13, 0) // a long rule
    fill(image, 100, 100, 130, 130, 0) // a solid block (what is left of a bar)
    fill(image, 300, 100, 306, 140, 0) // a stroke of a letter
    fill(image, 320, 100, 340, 104, 0)
    fill(image, 500, 300, 502, 302, 0) // a speck
    eraseNonText(image)
    expect(at(image, 500, 11)).toBe(255)
    expect(at(image, 115, 115)).toBe(255)
    expect(at(image, 303, 120)).toBe(0)
    expect(at(image, 501, 301)).toBe(255)
  })
})
