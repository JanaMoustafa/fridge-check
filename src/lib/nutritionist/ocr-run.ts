import {
  readInbodySheet,
  rereadRegions,
  type OcrWord,
  type Region,
  type SheetField,
  type SheetReading,
} from './inbody-sheet'
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

/**
 * The InBody photo reader, start to finish, around any OCR engine (Tesseract.js in the browser,
 * the same in Node for the bench): straighten and clean the photo, read the sheet twice (once
 * for scattered words, once for its layout), parse, then look again — enlarged, digits only — at
 * each spot where a label was found but its figure was not.
 */

export interface OcrEngine {
  /** Words in `image` with their boxes. `sparse` finds scattered words; `auto` follows layout. */
  read(image: GrayImage, mode: 'sparse' | 'auto', digitsOnly?: boolean): Promise<OcrWord[]>
}

export type ReadStep = 'straightening' | 'reading' | 'checking'

/** A patch of the page, enlarged `scale` times and made black on white for a second look. */
export function patch(page: GrayImage, region: Region, scale = 2): GrayImage {
  const width = (region.x1 - region.x0) * scale
  const height = (region.y1 - region.y0) * scale
  const data = new Uint8ClampedArray(width * height)
  for (let y = 0; y < height; y++) {
    const sy = Math.min(page.height - 1, region.y0 + y / scale)
    const y0 = Math.floor(sy)
    const y1 = Math.min(page.height - 1, y0 + 1)
    const fy = sy - y0
    for (let x = 0; x < width; x++) {
      const sx = Math.min(page.width - 1, region.x0 + x / scale)
      const x0 = Math.floor(sx)
      const x1 = Math.min(page.width - 1, x0 + 1)
      const fx = sx - x0
      const top =
        page.data[y0 * page.width + x0]! * (1 - fx) + page.data[y0 * page.width + x1]! * fx
      const bottom =
        page.data[y1 * page.width + x0]! * (1 - fx) + page.data[y1 * page.width + x1]! * fx
      data[y * width + x] = top * (1 - fy) + bottom * fy
    }
  }
  const image = { data, width, height }
  const threshold = otsu(image)
  for (let i = 0; i < data.length; i++) data[i] = data[i]! < threshold ? 0 : 255
  // A bar is as long here as on the page, enlarged.
  eraseBars(image, Math.round(page.width * 0.03 * scale))
  return image
}

export interface PhotoReading extends SheetReading {
  /** The straightened sheet, for showing what was read. */
  page: GrayImage
}

export async function readSheetPhoto(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  engine: OcrEngine,
  onStep: (step: ReadStep) => void | Promise<void> = () => {},
): Promise<PhotoReading> {
  await onStep('straightening')
  const gray = grayscale(rgba, width, height)
  const page = flatten(gray, findSheet(gray))
  const binary = binarize(page)
  const clean: GrayImage = { ...binary, data: binary.data.slice() }
  eraseBars(clean)
  eraseNonText(clean)

  await onStep('reading')
  const words = [...(await engine.read(clean, 'sparse')), ...(await engine.read(binary, 'auto'))]
  let reading = readInbodySheet(words, page.width)

  await onStep('checking')
  // Each closer look is parsed on its own (the label's words plus the patch's), so a misread
  // tick in one patch cannot disturb other figures; what it finds goes back as a hint.
  const hints: Partial<Record<SheetField, number>> = {}
  for (const { region, around, fields } of rereadRegions(words, page.width, page.height, reading)) {
    const inside = (w: OcrWord, r: Region) => {
      const cx = (w.x0 + w.x1) / 2
      const cy = (w.y0 + w.y1) / 2
      return cx >= r.x0 && cx <= r.x1 && cy >= r.y0 && cy <= r.y1
    }
    const local = words.filter((w) => around.some((r) => inside(w, r)) || inside(w, region))
    for (const word of await engine.read(patch(page, region), 'sparse', true)) {
      local.push({
        ...word,
        x0: region.x0 + word.x0 / 2,
        x1: region.x0 + word.x1 / 2,
        y0: region.y0 + word.y0 / 2,
        y1: region.y0 + word.y1 / 2,
      })
    }
    const closer = readInbodySheet(local, page.width)
    for (const field of fields) {
      const value = closer.values[field]
      if (value !== undefined && !closer.calculated.includes(field)) hints[field] ??= value
    }
  }
  if (Object.keys(hints).length > 0) reading = readInbodySheet(words, page.width, hints)
  return { ...reading, page }
}
