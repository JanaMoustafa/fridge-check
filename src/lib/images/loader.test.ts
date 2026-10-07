import { describe, expect, it } from 'vitest'
import imageLoader from './loader'

const MEAL = 'https://www.themealdb.com/images/media/meals/4er7mj1598733193.jpg'
const SPOON = 'https://img.spoonacular.com/recipes/716429-556x370.jpg'

describe('imageLoader', () => {
  it.each([
    [96, `${MEAL}/small`],
    [150, `${MEAL}/small`],
    [256, `${MEAL}/medium`],
    [384, `${MEAL}/large`],
    [640, MEAL],
    [1080, MEAL],
  ])('TheMealDB at %ipx → %s', (width, expected) => {
    expect(imageLoader({ src: MEAL, width })).toBe(expected)
  })

  it.each([
    [64, 'https://img.spoonacular.com/recipes/716429-90x90.jpg'],
    [256, 'https://img.spoonacular.com/recipes/716429-312x231.jpg'],
    [480, 'https://img.spoonacular.com/recipes/716429-480x360.jpg'],
    [1200, 'https://img.spoonacular.com/recipes/716429-636x393.jpg'],
  ])('Spoonacular at %ipx → %s', (width, expected) => {
    expect(imageLoader({ src: SPOON, width })).toBe(expected)
  })

  it('leaves other sources untouched', () => {
    expect(imageLoader({ src: '/icon.svg', width: 64 })).toBe('/icon.svg')
  })
})
