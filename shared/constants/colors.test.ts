import { describe, expect, it } from 'vitest'
import {
  HIGHLIGHT_INKS,
  INK_LABELS,
  INK_VALUES,
  PROVIDER_DEFAULT_INK,
  inkColor,
  inkForIndex,
} from './colors'

describe('colour constants', () => {
  it('exposes the five highlighter inks in palette order', () => {
    expect(HIGHLIGHT_INKS).toEqual(['persimmon', 'amber', 'jade', 'indigo', 'magenta'])
  })

  it('carries a value for every ink in both themes', () => {
    for (const theme of ['paper', 'ink'] as const) {
      for (const ink of HIGHLIGHT_INKS) {
        expect(INK_VALUES[theme][ink]).toMatch(/^oklch\(/)
      }
    }
  })

  it('gives each ink a different value per theme', () => {
    // Paper and Ink are one design in two palettes; no ink is shared between them.
    for (const ink of HIGHLIGHT_INKS) {
      expect(INK_VALUES.paper[ink]).not.toBe(INK_VALUES.ink[ink])
    }
  })

  it('labels every ink for the colour picker', () => {
    expect(Object.keys(INK_LABELS).sort()).toEqual([...HIGHLIGHT_INKS].sort())
  })

  it('resolves an ink name to its themed CSS variable', () => {
    expect(inkColor('jade')).toBe('var(--ow-hl-jade)')
  })

  it('passes through a literal colour written before the rework', () => {
    // calendar_source.color used to hold hex; those rows must still render.
    expect(inkColor('#CFDEEA')).toBe('#CFDEEA')
  })

  it('falls back when there is no colour', () => {
    expect(inkColor(null)).toBe('var(--ow-muted)')
    expect(inkColor('', 'var(--ow-ghost)')).toBe('var(--ow-ghost)')
  })

  it('cycles inks so consecutive calendars stay distinct', () => {
    expect(inkForIndex(0)).toBe('indigo')
    expect(inkForIndex(1)).toBe('magenta')
    expect(inkForIndex(5)).toBe('indigo')
  })

  it('maps each provider to a default ink', () => {
    expect(PROVIDER_DEFAULT_INK.google).toBe('indigo')
    expect(PROVIDER_DEFAULT_INK.caldav).toBe('jade')
    expect(PROVIDER_DEFAULT_INK.ical).toBe('amber')
  })
})
