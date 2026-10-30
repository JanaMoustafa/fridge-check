/**
 * Cleans a phone photo of an InBody sheet for OCR, in plain typed-array code that runs the same
 * in the browser (from a canvas) and in Node (the bench): find the sheet and flatten its
 * perspective, bring it to one size, turn it into crisp black on white with a threshold that
 * follows shadows and tinted table cells, and erase the bar charts and table rules that make the
 * OCR misread the numbers printed against them.
 */

export interface GrayImage {
  data: Uint8ClampedArray
  width: number
  height: number
}

/** A sheet's corners in the photo: top-left, top-right, bottom-right, bottom-left. */
export type Quad = [Point, Point, Point, Point]
export interface Point {
  x: number
  y: number
}

/** Sheet width after flattening: A4 at about 300 dpi, where printed text reads best. */
export const SHEET_WIDTH_PX = 2480

export function grayscale(rgba: Uint8ClampedArray, width: number, height: number): GrayImage {
  const data = new Uint8ClampedArray(width * height)
  for (let i = 0, j = 0; j < data.length; i += 4, j++) {
    data[j] = (rgba[i]! * 77 + rgba[i + 1]! * 150 + rgba[i + 2]! * 29) >> 8
  }
  return { data, width, height }
}

/** Average of each factor × factor block. */
export function shrink(image: GrayImage, factor: number): GrayImage {
  const width = Math.max(1, Math.floor(image.width / factor))
  const height = Math.max(1, Math.floor(image.height / factor))
  const data = new Uint8ClampedArray(width * height)
  const area = factor * factor
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0
      for (let dy = 0; dy < factor; dy++) {
        const row = (y * factor + dy) * image.width + x * factor
        for (let dx = 0; dx < factor; dx++) sum += image.data[row + dx]!
      }
      data[y * width + x] = sum / area
    }
  }
  return { data, width, height }
}

/** Otsu's threshold: the grey level that best separates dark from light. */
export function otsu(image: GrayImage): number {
  const histogram = new Float64Array(256)
  for (const value of image.data) histogram[value]!++
  const total = image.data.length
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * histogram[i]!
  let sumBack = 0
  let weightBack = 0
  let best = 0
  let threshold = 127
  for (let i = 0; i < 256; i++) {
    weightBack += histogram[i]!
    if (weightBack === 0) continue
    const weightFore = total - weightBack
    if (weightFore === 0) break
    sumBack += i * histogram[i]!
    const meanBack = sumBack / weightBack
    const meanFore = (sum - sumBack) / weightFore
    const between = weightBack * weightFore * (meanBack - meanFore) ** 2
    if (between > best) {
      best = between
      threshold = i
    }
  }
  return threshold
}

/**
 * The sheet in a photo: the largest light region, by its extreme corners. Null when the paper
 * fills the frame (nothing to straighten) or no clear sheet stands out from the background.
 */
export function findSheet(image: GrayImage): Quad | null {
  const factor = Math.max(1, Math.round(Math.max(image.width, image.height) / 600))
  const small = shrink(image, factor)
  const { width, height } = small
  const threshold = otsu(small)
  const light = new Uint8Array(width * height)
  for (let i = 0; i < light.length; i++) light[i] = small.data[i]! > threshold ? 1 : 0

  // Largest 4-connected light region.
  const label = new Int32Array(width * height)
  const stack = new Int32Array(width * height)
  let bestLabel = 0
  let bestSize = 0
  let next = 0
  for (let start = 0; start < light.length; start++) {
    if (!light[start] || label[start]) continue
    next++
    let size = 0
    let top = 0
    stack[top++] = start
    label[start] = next
    while (top > 0) {
      const at = stack[--top]!
      size++
      const x = at % width
      const neighbours = [x > 0 ? at - 1 : -1, x < width - 1 ? at + 1 : -1, at - width, at + width]
      for (const n of neighbours) {
        if (n >= 0 && n < light.length && light[n] && !label[n]) {
          label[n] = next
          stack[top++] = n
        }
      }
    }
    if (size > bestSize) {
      bestSize = size
      bestLabel = next
    }
  }
  if (bestSize < 0.2 * width * height) return null

  let tl = { x: 0, y: 0, s: Infinity }
  let br = { x: 0, y: 0, s: -Infinity }
  let tr = { x: 0, y: 0, s: -Infinity }
  let bl = { x: 0, y: 0, s: Infinity }
  let minX = width
  let maxX = 0
  let minY = height
  let maxY = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (label[y * width + x] !== bestLabel) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      if (x + y < tl.s) tl = { x, y, s: x + y }
      if (x + y > br.s) br = { x, y, s: x + y }
      if (x - y > tr.s) tr = { x, y, s: x - y }
      if (x - y < bl.s) bl = { x, y, s: x - y }
    }
  }
  // Paper to every edge: the photo is already the sheet.
  if (minX <= 1 && minY <= 1 && maxX >= width - 2 && maxY >= height - 2) return null
  const quad: Quad = [tl, tr, br, bl].map((p) => ({
    x: (p.x + 0.5) * factor,
    y: (p.y + 0.5) * factor,
  })) as Quad
  // A sheet is a convex four-sided shape of reasonable proportions.
  const top = distance(quad[0], quad[1])
  const bottom = distance(quad[3], quad[2])
  const left = distance(quad[0], quad[3])
  const right = distance(quad[1], quad[2])
  if (Math.min(top, bottom, left, right) < 0.25 * Math.max(top, bottom, left, right)) return null
  return quad
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Solves the 8 unknowns of the homography taking the output rectangle onto the quad. */
function homography(width: number, height: number, quad: Quad): Float64Array {
  const from = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ] as const
  const a: number[][] = []
  for (let i = 0; i < 4; i++) {
    const [u, v] = from[i]!
    const { x, y } = quad[i]!
    a.push([u, v, 1, 0, 0, 0, -u * x, -v * x, x])
    a.push([0, 0, 0, u, v, 1, -u * y, -v * y, y])
  }
  // Gaussian elimination with partial pivoting.
  for (let col = 0; col < 8; col++) {
    let pivot = col
    for (let row = col + 1; row < 8; row++) {
      if (Math.abs(a[row]![col]!) > Math.abs(a[pivot]![col]!)) pivot = row
    }
    ;[a[col], a[pivot]] = [a[pivot]!, a[col]!]
    for (let row = 0; row < 8; row++) {
      if (row === col) continue
      const f = a[row]![col]! / a[col]![col]!
      for (let k = col; k < 9; k++) a[row]![k]! -= f * a[col]![k]!
    }
  }
  const h = new Float64Array(9)
  for (let i = 0; i < 8; i++) h[i] = a[i]![8]! / a[i]![i]!
  h[8] = 1
  return h
}

/**
 * The sheet flattened to `outWidth` px wide, sampled bilinearly from the photo. Without a quad
 * the whole photo is scaled (up or down) to that width.
 */
export function flatten(image: GrayImage, quad: Quad | null, outWidth = SHEET_WIDTH_PX): GrayImage {
  const corners: Quad = quad ?? [
    { x: 0, y: 0 },
    { x: image.width, y: 0 },
    { x: image.width, y: image.height },
    { x: 0, y: image.height },
  ]
  const sheetWidth = Math.max(distance(corners[0], corners[1]), distance(corners[3], corners[2]))
  const sheetHeight = Math.max(distance(corners[0], corners[3]), distance(corners[1], corners[2]))
  const width = outWidth
  const height = Math.round((outWidth * sheetHeight) / sheetWidth)
  const h = homography(width, height, corners)
  const data = new Uint8ClampedArray(width * height)
  const src = image.data
  const w = image.width
  const maxX = image.width - 1
  const maxY = image.height - 1
  for (let v = 0; v < height; v++) {
    for (let u = 0; u < width; u++) {
      const d = h[6]! * u + h[7]! * v + 1
      let x = (h[0]! * u + h[1]! * v + h[2]!) / d
      let y = (h[3]! * u + h[4]! * v + h[5]!) / d
      x = x < 0 ? 0 : x > maxX ? maxX : x
      y = y < 0 ? 0 : y > maxY ? maxY : y
      const x0 = x | 0
      const y0 = y | 0
      const x1 = x0 < maxX ? x0 + 1 : x0
      const y1 = y0 < maxY ? y0 + 1 : y0
      const fx = x - x0
      const fy = y - y0
      const top = src[y0 * w + x0]! * (1 - fx) + src[y0 * w + x1]! * fx
      const bottom = src[y1 * w + x0]! * (1 - fx) + src[y1 * w + x1]! * fx
      data[v * width + u] = top * (1 - fy) + bottom * fy
    }
  }
  return { data, width, height }
}

/**
 * Sauvola's local threshold: a pixel is ink when darker than its neighbourhood's mean, lowered
 * where the neighbourhood is flat (paper, shadow, a tinted cell). Neighbourhood statistics come
 * from a 4× smaller copy, which keeps memory low on phones.
 */
export function binarize(image: GrayImage, k = 0.2, windowFraction = 1 / 32): GrayImage {
  const factor = 4
  const small = shrink(image, factor)
  const { width: sw, height: sh } = small
  const sum = new Float64Array((sw + 1) * (sh + 1))
  const squares = new Float64Array((sw + 1) * (sh + 1))
  for (let y = 0; y < sh; y++) {
    let rowSum = 0
    let rowSquares = 0
    for (let x = 0; x < sw; x++) {
      const value = small.data[y * sw + x]!
      rowSum += value
      rowSquares += value * value
      const at = (y + 1) * (sw + 1) + x + 1
      sum[at] = sum[at - sw - 1]! + rowSum
      squares[at] = squares[at - sw - 1]! + rowSquares
    }
  }
  const radius = Math.max(2, Math.round((image.width * windowFraction) / factor / 2))
  const threshold = new Float32Array(sw * sh)
  for (let y = 0; y < sh; y++) {
    const y0 = Math.max(0, y - radius)
    const y1 = Math.min(sh, y + radius + 1)
    for (let x = 0; x < sw; x++) {
      const x0 = Math.max(0, x - radius)
      const x1 = Math.min(sw, x + radius + 1)
      const n = (y1 - y0) * (x1 - x0)
      const a = y0 * (sw + 1) + x0
      const b = y0 * (sw + 1) + x1
      const c = y1 * (sw + 1) + x0
      const d = y1 * (sw + 1) + x1
      const mean = (sum[d]! - sum[b]! - sum[c]! + sum[a]!) / n
      const variance = (squares[d]! - squares[b]! - squares[c]! + squares[a]!) / n - mean * mean
      const deviation = Math.sqrt(Math.max(0, variance))
      threshold[y * sw + x] = mean * (1 + k * (deviation / 128 - 1))
    }
  }
  const data = new Uint8ClampedArray(image.width * image.height)
  for (let y = 0; y < image.height; y++) {
    const ty = Math.min(sh - 1, (y / factor) | 0)
    for (let x = 0; x < image.width; x++) {
      const tx = Math.min(sw - 1, (x / factor) | 0)
      data[y * image.width + x] =
        image.data[y * image.width + x]! < threshold[ty * sw + tx]! ? 0 : 255
    }
  }
  return { data, width: image.width, height: image.height }
}

/**
 * Erases (in place) horizontal ink runs longer than `minRun`: bar charts and table rules. Text
 * has no stroke that long, and a number printed at the end of a bar is no longer joined to it.
 */
export function eraseBars(binary: GrayImage, minRun = Math.round(binary.width * 0.03)): void {
  const { data, width, height } = binary
  for (let y = 0; y < height; y++) {
    const row = y * width
    let x = 0
    while (x < width) {
      if (data[row + x] !== 0) {
        x++
        continue
      }
      let end = x
      while (end < width && data[row + end] === 0) end++
      if (end - x >= minRun) data.fill(255, row + x, row + end)
      x = end
    }
  }
}

/**
 * Erases (in place) ink that cannot be text, judged per connected shape: anything longer than a
 * glyph can be (rules, frames, a chart's axes), solid blocks (what is left of a bar, a filled
 * box) and specks. Runs are labelled row by row (8-connected), so memory stays proportional to
 * the ink, not the page.
 */
export function eraseNonText(binary: GrayImage): void {
  const { data, width, height } = binary
  const maxGlyph = Math.round(width * 0.06)
  // Runs: [x0, x1) per row, stored flat.
  const runY: number[] = []
  const runX0: number[] = []
  const runX1: number[] = []
  const parent: number[] = []
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]!]!
      i = parent[i]!
    }
    return i
  }
  let previousStart = 0
  let previousEnd = 0
  for (let y = 0; y < height; y++) {
    const rowStart = runY.length
    const row = y * width
    let x = 0
    while (x < width) {
      if (data[row + x] !== 0) {
        x++
        continue
      }
      let end = x
      while (end < width && data[row + end] === 0) end++
      const id = runY.length
      runY.push(y)
      runX0.push(x)
      runX1.push(end)
      parent.push(id)
      // Join runs of the row above that touch this one, diagonals included.
      for (let p = previousStart; p < previousEnd; p++) {
        if (runX0[p]! <= end && runX1[p]! >= x) {
          const a = find(p)
          const b = find(id)
          if (a !== b) parent[a] = b
        }
      }
      x = end
    }
    previousStart = rowStart
    previousEnd = runY.length
  }
  const stats = new Map<number, { x0: number; x1: number; y0: number; y1: number; ink: number }>()
  for (let i = 0; i < runY.length; i++) {
    const root = find(i)
    const s = stats.get(root)
    const ink = runX1[i]! - runX0[i]!
    if (s) {
      if (runX0[i]! < s.x0) s.x0 = runX0[i]!
      if (runX1[i]! > s.x1) s.x1 = runX1[i]!
      if (runY[i]! < s.y0) s.y0 = runY[i]!
      if (runY[i]! > s.y1) s.y1 = runY[i]!
      s.ink += ink
    } else {
      stats.set(root, { x0: runX0[i]!, x1: runX1[i]!, y0: runY[i]!, y1: runY[i]!, ink })
    }
  }
  const erase = new Set<number>()
  for (const [root, s] of stats) {
    const w = s.x1 - s.x0
    const h = s.y1 - s.y0 + 1
    const fill = s.ink / (w * h)
    if (
      Math.max(w, h) > maxGlyph ||
      (fill >= 0.75 && w >= 10 && h >= 10 && w * h >= 150) ||
      s.ink < 6
    ) {
      erase.add(root)
    }
  }
  for (let i = 0; i < runY.length; i++) {
    if (erase.has(find(i)))
      data.fill(255, runY[i]! * width + runX0[i]!, runY[i]! * width + runX1[i]!)
  }
}

/** The whole clean-up: a photo's RGBA pixels in, a black-on-white sheet ready for OCR out. */
export function prepareSheet(rgba: Uint8ClampedArray, width: number, height: number): GrayImage {
  const gray = grayscale(rgba, width, height)
  const sheet = flatten(gray, findSheet(gray))
  const binary = binarize(sheet)
  eraseBars(binary)
  eraseNonText(binary)
  return binary
}
