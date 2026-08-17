/**
 * Canonical color tokens from the approved v2 (paper) design.
 * Components should reference the CSS variables in app/assets/css (see docs/design.md);
 * these constants exist for logic that needs the raw values (defaults, seed data, tests).
 */

/** Highlighter tag palette (the color a task can be tagged with). */
export const HIGHLIGHT = {
  butter: '#EAD9A0',
  mint: '#D2E2CD',
  sky: '#CFDEEA',
  rose: '#E9D2D8',
} as const

/** User-selectable accent colors; `sky` is the default. */
export const ACCENTS = {
  sky: '#CBDDE9',
  butter: '#EAD9A0',
  mint: '#CFE0CB',
  rose: '#E7CDD4',
} as const

/** Calendar source dot colors by provider. */
export const SOURCE_COLORS = {
  google: '#86B08B',
  caldav: '#9CBBD6',
  ical: '#D3B488',
} as const

export type HighlightColor = keyof typeof HIGHLIGHT
export type AccentColor = keyof typeof ACCENTS
export type CalendarProvider = keyof typeof SOURCE_COLORS

export const DEFAULT_ACCENT: AccentColor = 'sky'
