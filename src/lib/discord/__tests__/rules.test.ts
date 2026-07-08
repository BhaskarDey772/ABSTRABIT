import { describe, it, expect } from 'vitest'
import { applyFlagKeywordsRule } from '../rules'

describe('applyFlagKeywordsRule', () => {
  it('flags high priority on a case-insensitive keyword match', () => {
    expect(applyFlagKeywordsRule('This is URGENT please help', ['urgent'])).toBe('high')
  })

  it('is normal priority when no keyword matches', () => {
    expect(applyFlagKeywordsRule('Just a regular note', ['urgent', 'outage'])).toBe('normal')
  })

  it('is normal priority when there are no configured keywords', () => {
    expect(applyFlagKeywordsRule('Anything at all', [])).toBe('normal')
  })

  it('ignores blank keywords instead of matching everything', () => {
    expect(applyFlagKeywordsRule('Anything at all', ['', '   '])).toBe('normal')
  })
})
