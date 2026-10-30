import { describe, expect, it } from 'vitest'
import { NAV_ITEMS, isActive } from './nav-items'

describe('nav items', () => {
  it('has five tabs, Home first', () => {
    expect(NAV_ITEMS.map((item) => item.href)).toEqual([
      '/',
      '/find',
      '/nutritionist',
      '/burn',
      '/chef',
    ])
  })

  it('lights Home only on the home screen', () => {
    expect(isActive('/', '/')).toBe(true)
    expect(isActive('/', '/find')).toBe(false)
    expect(isActive('/', '/chef')).toBe(false)
  })

  it('keeps Find lit on recipes and the lists made from them', () => {
    for (const path of ['/find', '/recipe/local/53027', '/saved', '/shopping-list']) {
      expect(isActive('/find', path), path).toBe(true)
    }
    expect(isActive('/find', '/chef')).toBe(false)
  })

  it('lights a programme on its inner pages', () => {
    expect(isActive('/burn', '/burn/exercise/c-squat')).toBe(true)
    expect(isActive('/burn', '/burnt')).toBe(false)
  })
})
