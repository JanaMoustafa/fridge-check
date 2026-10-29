import { describe, expect, it } from 'vitest'
import { featureOf } from './feature-section'

describe('featureOf', () => {
  it('maps a page to its programme, recipe pages included', () => {
    expect(featureOf('/')).toBe('find')
    expect(featureOf('/recipe/local/53027')).toBe('find')
    expect(featureOf('/nutritionist')).toBe('nutritionist')
    expect(featureOf('/nutritionist/scan')).toBe('nutritionist')
    expect(featureOf('/burn/exercise/c-squat')).toBe('burn')
  })

  it('leaves the rest alone', () => {
    for (const path of [
      '/saved',
      '/shopping-list',
      '/account',
      '/welcome',
      '/burnt',
      '/nutritionists',
    ]) {
      expect(featureOf(path), path).toBeNull()
    }
  })
})
