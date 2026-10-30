import { describe, expect, it } from 'vitest'
import { readInbodySheet, rereadRegions, type OcrWord } from './inbody-sheet'

const PAGE = 2480

/** A word at (x, y) — top-left — `h` tall, about as wide as its text. */
function w(text: string, x: number, y: number, h = 30, width = text.length * h * 0.55): OcrWord {
  return { text, x0: x, y0: y, x1: x + width, y1: y + h, confidence: 90 }
}

/** Words of a line, left to right, starting at x with a gap between them. */
function line(texts: string[], x: number, y: number, h = 30): OcrWord[] {
  const words: OcrWord[] = []
  let at = x
  for (const text of texts) {
    const word = w(text, at, y, h)
    words.push(word)
    at = word.x1 + h * 0.5
  }
  return words
}

/** A bar chart row: label at the left, rising ticks over the bar, the figure under the ticks. */
function barRow(label: string[], ticks: number[], value: string, y: number): OcrWord[] {
  return [
    ...line(label, 60, y),
    ...ticks.map((tick, i) => w(String(tick), 420 + i * 95, y - 22, 19)),
    w(value, 700, y + 18, 36),
  ]
}

describe('readInbodySheet', () => {
  it('reads table rows and leaves the normal ranges in brackets alone', () => {
    const words = [
      w('InBody', 60, 40),
      ...line(['Total', 'Body', 'Water', '(L)', '26.5', '(26.4', '~', '32.2)'], 60, 600),
      ...line(['Protein', '(kg)', '7.2', '(', '7.0', '~', '8.6', ')'], 60, 680),
      ...line(['Minerals', '(kg)', '2.64', '(2.44', '~', '2.98)'], 60, 760),
      ...line(['Body', 'Fat', 'Mass', '(kg)', '22.8', '(10.3', '~', '16.5)'], 60, 840),
      ...line(['Weight', '(kg)', '59.1', '(43.9', '~', '59.5)'], 60, 920),
    ]
    const sheet = readInbodySheet(words, PAGE)
    expect(sheet.isInBody).toBe(true)
    expect(sheet.values).toMatchObject({
      tbwL: 26.5,
      proteinKg: 7.2,
      mineralsKg: 2.64,
      bfmKg: 22.8,
      weightKg: 59.1,
    })
  })

  it('reads a bar chart figure under its scale, never a tick', () => {
    const words = [
      ...barRow(['Weight', '(kg)'], [55, 70, 85, 100, 115, 130, 145], '59.1', 1200),
      ...barRow(['SMM'], [70, 80, 90, 100, 110, 120, 130], '19.6', 1300),
      ...barRow(['PBF'], [8, 13, 18, 23, 28, 33, 38], '38.6', 1400),
    ]
    expect(readInbodySheet(words, PAGE).values).toMatchObject({
      weightKg: 59.1,
      smmKg: 19.6,
      pbf: 38.6,
    })
  })

  it('reads figures printed under the column heads of the 570/770 table', () => {
    const words = [
      ...line(['Soft', 'Lean', 'Mass'], 860, 520),
      ...line(['Fat', 'Free', 'Mass'], 1090, 520),
      w('45.6', 900, 610, 35),
      w('(37.3', 870, 660, 29),
      w('~45.7)', 945, 660, 29),
      w('48.3', 1130, 640, 34),
    ]
    expect(readInbodySheet(words, PAGE).values).toMatchObject({ slmKg: 45.6, ffmKg: 48.3 })
  })

  it('tells labels apart that differ by a letter or two', () => {
    const words = [
      ...line(['Intracellular', 'Water', '22.0L'], 1580, 2450),
      ...line(['Extracellular', 'Water', '13.5L'], 1580, 2510),
      ...line(['Height'], 560, 300),
      w('163cm', 560, 345),
    ]
    expect(readInbodySheet(words, PAGE).values).toMatchObject({
      icwL: 22,
      ecwL: 13.5,
      heightCm: 163,
    })
  })

  it('reads the 570/770 segment rows: kg on the label line, % under it; fat rows in one line', () => {
    const ticks = [40, 60, 80, 100, 120, 140]
    const words = [
      ...line(['Segmental', 'Lean', 'Analysis'], 60, 1780),
      ...line(['Right', 'Arm', '(kg)'], 140, 1920),
      ...ticks.map((tick, i) => w(String(tick), 450 + i * 95, 1890, 19)),
      w('2.56', 860, 1915, 28),
      w('116.6', 840, 1955, 28),
      ...line(['Segmental', 'Fat', 'Analysis'], 1580, 2040),
      ...line(['Right', 'Arm'], 1586, 2110),
      w('(', 1800, 2108, 36, 12),
      w('1.1kg)', 1838, 2105, 38, 100),
      w('110.9%', 2079, 2112, 27, 100),
      ...line(['Left', 'Arm'], 1586, 2162),
      w('(', 1800, 2160, 36, 12),
      w('1.2kg)—=——', 1838, 2157, 38, 230),
      w('122.7%', 2089, 2165, 27, 100),
    ]
    expect(readInbodySheet(words, PAGE).values).toMatchObject({
      leanRightArmKg: 2.56,
      leanRightArmPct: 116.6,
      fatRightArmKg: 1.1,
      fatRightArmPct: 110.9,
      fatLeftArmKg: 1.2,
      fatLeftArmPct: 122.7,
    })
  })

  it("reads the 270's body diagrams by where each figure sits", () => {
    const pair = (kg: string, pct: string, x: number, y: number) => [
      w(kg, x, y, 41, 120),
      w(pct, x, y + 55, 34, 117),
    ]
    const words = [
      ...line(['Segmental', 'Lean', 'Analysis'], 54, 2095, 49),
      ...line(['Segmental', 'Fat', 'Analysis'], 807, 2095, 49),
      ...pair('1.71', '86.6', 128, 2245),
      ...pair('1.71', '86.8', 533, 2245),
      ...pair('16.7', '93.6', 338, 2380),
      ...pair('5.48', '87.9', 124, 2612),
      ...pair('5.40', '86.6', 529, 2612),
      ...pair('1.7', '193.3', 891, 2245),
      ...pair('1.7', '192.0', 1295, 2245),
      ...pair('11.5', '236.2', 1090, 2380),
      ...pair('3.5', '156.1', 887, 2612),
      ...pair('3.4', '155.4', 1291, 2612),
    ]
    expect(readInbodySheet(words, PAGE).values).toMatchObject({
      leanLeftArmKg: 1.71,
      leanRightArmPct: 86.8,
      leanTrunkKg: 16.7,
      leanLeftLegKg: 5.48,
      leanRightLegKg: 5.4,
      fatLeftArmPct: 193.3,
      fatTrunkKg: 11.5,
      fatTrunkPct: 236.2,
      fatRightLegKg: 3.4,
    })
  })

  it('ignores the history table of earlier tests', () => {
    const words = [
      ...line(['Weight', '(kg)', '59.1'], 60, 920),
      ...line(['Body', 'Composition', 'History'], 60, 3000),
      ...line(['Weight', '(kg)', '65.3', '63.9', '62.4'], 60, 3100),
    ]
    expect(readInbodySheet(words, PAGE).values.weightKg).toBe(59.1)
  })

  it('works out what InBody prints from the figures it has, and says so', () => {
    const words = [
      ...line(['Weight', '(kg)', '59.1'], 60, 920),
      ...line(['Body', 'Fat', 'Mass', '(kg)', '22.8'], 60, 840),
      ...line(['Fat', 'Free', 'Mass', '36.3', 'kg'], 1578, 1880),
    ]
    const sheet = readInbodySheet(words, PAGE)
    expect(sheet.values.pbf).toBe(38.6)
    expect(sheet.values.bmrKcal).toBe(1154)
    expect(sheet.calculated).toEqual(expect.arrayContaining(['pbf', 'bmrKcal']))
  })

  it('puts back a decimal point the OCR dropped when a formula confirms it', () => {
    const words = [
      ...line(['Total', 'Body', 'Water', '(L)', '35.5'], 60, 600),
      ...line(['Protein', '(kg)', '95'], 60, 680),
      ...line(['Minerals', '(kg)', '3.28'], 60, 760),
      ...line(['Fat', 'Free', 'Mass', '48.3', 'kg'], 1578, 1880),
    ]
    expect(readInbodySheet(words, PAGE).values.proteinKg).toBe(9.5)
  })

  it('restores the minus sign of a weight control from the target weight', () => {
    const words = [
      ...line(['Weight', '(kg)', '66.4'], 60, 920),
      ...line(['Target', 'Weight', '62.7', 'kg'], 1580, 1520),
      ...line(['Weight', 'Control', '3.7', 'kg'], 1580, 1575),
    ]
    expect(readInbodySheet(words, PAGE).values.weightControlKg).toBe(-3.7)
  })

  it('reads the InBody score even when its big digits come apart', () => {
    const words = [
      ...line(['InBody', 'Score'], 1580, 560, 34),
      w('8', 1780, 650, 72, 40),
      w('1', 1830, 650, 72, 30),
      w('/100', 1880, 680, 37, 80),
      w('Points', 1980, 690, 25),
    ]
    expect(readInbodySheet(words, PAGE).values.inbodyScore).toBe(81)
  })

  it("reads the header's date", () => {
    const words = [...line(['Test', 'Date', '/', 'Time'], 1100, 300), w('2018.04.03.', 1100, 340)]
    expect(readInbodySheet(words, PAGE).scannedOn).toBe('2018-04-03')
  })

  it('says when the words are not an InBody sheet', () => {
    const sheet = readInbodySheet(line(['Grocery', 'list', 'eggs', '12'], 60, 100), PAGE)
    expect(sheet.isInBody).toBe(false)
    expect(sheet.values).toEqual({})
  })
})

describe('rereadRegions', () => {
  it('points at the spot to the right of a label whose figure was not read', () => {
    const words = line(['Basal', 'Metabolic', 'Rate'], 1577, 1930)
    const regions = rereadRegions(words, PAGE, 3500, readInbodySheet(words, PAGE))
    expect(regions).toHaveLength(1)
    expect(regions[0]!.fields).toEqual(['bmrKcal'])
    expect(regions[0]!.region.x0).toBeGreaterThan(1577)
  })

  it('asks for nothing once every labelled figure is read', () => {
    const words = line(['Basal', 'Metabolic', 'Rate', '1154', 'kcal'], 1577, 1930)
    expect(rereadRegions(words, PAGE, 3500, readInbodySheet(words, PAGE))).toEqual([])
  })
})

describe('readInbodySheet plausibility', () => {
  it('puts back the "1" a bar swallowed from skeletal muscle mass', () => {
    const words = [
      ...barRow(['SMM'], [70, 80, 90, 100, 110, 120, 130], '9.6', 1300),
      ...line(['Fat', 'Free', 'Mass', '36.3', 'kg'], 1578, 1880),
    ]
    expect(readInbodySheet(words, PAGE).values.smmKg).toBe(19.6)
  })

  it('never takes a whole number for a segment figure (that is a scale tick)', () => {
    const words = [
      ...line(['Segmental', 'Lean', 'Analysis'], 60, 1780),
      ...line(['Right', 'Arm', '(kg)'], 140, 1920),
      w('40', 860, 1955, 28),
    ]
    expect(readInbodySheet(words, PAGE).values.leanRightArmPct).toBeUndefined()
  })
})
