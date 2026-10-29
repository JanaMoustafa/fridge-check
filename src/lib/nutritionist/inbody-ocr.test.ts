import { describe, expect, it } from 'vitest'
import { parseInbodyText } from './inbody-ocr'

/** What Tesseract read off a photo of an InBody 270 sheet (two columns merged into lines). */
const SHEET = `InBody 270 Body Composition Analysis
ID Height Age Gender Test Date / Time
3401 165 cm 30 Female 27.10.2026 09:41
Body Composition Analysis
Total Body Water 33.2 L (30.5 ~ 37.3)
Protein 8.9 kg (8.2 ~ 10.0)
Minerals 3.11. kg (2.82 ~ 3.44)
Body Fat Mass 22.6 kg (11.4 ~ 18.2)
Weight 68.0 kg (49.5 ~ 67.0)
Muscle-Fat Analysis
Weight 68.0 kg Under Normal Over
SMM (Skeletal Muscle Mass) 24.1 kg
Body Fat Mass 22.6 kg
Obesity Analysis
BMI (Body Mass Index) 25.0 kg/m2 (18.5 ~ 25.0)
PBF (Percent Body Fat) 33.2 % (18.0 ~ 28.0)
Segmental Lean Analysis Research Parameters
Right Arm 2.05 kg 98.4 % Intracellular Water 20.6 L
Left Arm 2.01 kg 96.6 % Extracellular Water 12.6 L
Trunk 19.8 kg 103.1 % Basal Metabolic Rate 1360 kcal
Right Leg 6.92 kg 97.2% Waist-Hip Ratio 0.88
Left Leg 6.85 kg 96.2 % Visceral Fat Level 8
Obesity Degree 114 %
Weight Control Bone Mineral Content 2.58 kg
Target Weight 59.0 kg Body Cell Mass 29.5 kg
Weight Control 9.0 kg SMI 6.4 kg/m2
Fat Control 9.9 kg Fat Free Mass 45.4 kg
Muscle Control +0.9 kg
InBody Score
71/100 points`

describe('parseInbodyText', () => {
  it('reads every number off a full sheet, core and extras, plus the test date', () => {
    const read = parseInbodyText(SHEET)
    expect(read.isInBody).toBe(true)
    expect(read.values).toEqual({
      scannedOn: '2026-10-27',
      weightKg: '68',
      smmKg: '24.1',
      bfmKg: '22.6',
      pbf: '33.2',
      bmrKcal: '1360',
      vfl: '8',
      tbwL: '33.2',
    })
    expect(read.extra).toEqual({
      heightCm: 165,
      age: 30,
      bmi: 25,
      proteinKg: 8.9,
      mineralsKg: 3.11,
      icwL: 20.6,
      ecwL: 12.6,
      ffmKg: 45.4,
      bcmKg: 29.5,
      bmcKg: 2.58,
      whr: 0.88,
      obesityDegree: 114,
      smi: 6.4,
      inbodyScore: 71,
      targetWeightKg: 59,
      weightControlKg: -9,
      fatControlKg: -9.9,
      muscleControlKg: 0.9,
      leanRightArmKg: 2.05,
      leanLeftArmKg: 2.01,
      leanTrunkKg: 19.8,
      leanRightLegKg: 6.92,
      leanLeftLegKg: 6.85,
    })
    expect(read.found).toBe(7 + 23)
  })

  it('copes with OCR slips, other date prints and abbreviations', () => {
    const read = parseInbodyText(`Test Date 2026/09/15
Weight 7O,2 kg
SMM 23,8 kg
BFM 24.4 kg
PBF 34.8 %
BMR 134O kcal
VFL 9
TBW 33.4 L`)
    expect(read.values).toEqual({
      scannedOn: '2026-09-15',
      weightKg: '70.2',
      smmKg: '23.8',
      bfmKg: '24.4',
      pbf: '34.8',
      bmrKcal: '1340',
      vfl: '9',
      tbwL: '33.4',
    })
  })

  it('leaves out what it cannot read, and says when the text is not a sheet', () => {
    const read = parseInbodyText('Weight 680 kg\nPBF 120 %\nSMM kg')
    expect(read.values.weightKg).toBe('')
    expect(read.values.pbf).toBe('')
    expect(read.found).toBe(0)
    expect(read.isInBody).toBe(false)
    expect(parseInbodyText('A photo of a cat').isInBody).toBe(false)
  })
})
