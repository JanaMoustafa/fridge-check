import { describe, expect, it } from 'vitest'
import { sessionStore } from '@/lib/storage/safe-storage'
import { cameFromResults, rememberReturn, takeReturnScroll } from './return-to'

describe('return-to', () => {
  it('recognises the page opened from the results list', () => {
    rememberReturn('/?i=egg', '/recipe/local/1?i=egg', 640)
    expect(cameFromResults('/recipe/local/1?i=egg')).toBe(true)
    expect(cameFromResults('/recipe/local/2?i=egg')).toBe(false)
  })

  it('restores the list scroll position once', () => {
    rememberReturn('/?i=egg', '/recipe/local/1?i=egg', 640.4)
    expect(takeReturnScroll('/?i=rice')).toBeNull()
    expect(takeReturnScroll('/?i=egg')).toBe(640)
    expect(takeReturnScroll('/?i=egg')).toBeNull()
  })

  it('defaults to the top and never stores a negative position', () => {
    rememberReturn('/?i=a', '/recipe/local/1')
    expect(takeReturnScroll('/?i=a')).toBe(0)
    rememberReturn('/?i=a', '/recipe/local/1', -20)
    expect(takeReturnScroll('/?i=a')).toBe(0)
  })

  it('ignores missing or corrupt records', () => {
    sessionStore.remove('fc:return-to')
    expect(cameFromResults('/recipe/local/1')).toBe(false)
    sessionStore.set('fc:return-to', '{oops')
    expect(cameFromResults('/recipe/local/1')).toBe(false)
    sessionStore.set('fc:return-to', '{"from":"/","to":1}')
    expect(takeReturnScroll('/')).toBeNull()
  })
})
