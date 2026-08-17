import { describe, expect, it } from 'vitest'
import { ACCENTS, DEFAULT_ACCENT, HIGHLIGHT, SOURCE_COLORS } from './colors'

describe('color constants', () => {
  it('exposes the four highlighter colors', () => {
    expect(Object.keys(HIGHLIGHT)).toEqual(['butter', 'mint', 'sky', 'rose'])
    expect(HIGHLIGHT.sky).toBe('#CFDEEA')
  })

  it('defaults the accent to sky', () => {
    expect(DEFAULT_ACCENT).toBe('sky')
    expect(ACCENTS[DEFAULT_ACCENT]).toBe('#CBDDE9')
  })

  it('maps each calendar provider to a source color', () => {
    expect(SOURCE_COLORS.google).toBe('#86B08B')
    expect(SOURCE_COLORS.caldav).toBe('#9CBBD6')
    expect(SOURCE_COLORS.ical).toBe('#D3B488')
  })
})
