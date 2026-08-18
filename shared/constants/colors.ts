/**
 * Colour constants for the Paper / Ink design.
 *
 * The canonical values live as CSS variables in `app/assets/css/main.css` — components
 * should reference those, not the raw values here. This module exists for the things CSS
 * cannot do: the ink *names* (which are a database enum and a Zod contract), colour
 * assignment for new calendars, and raw values for tests and seed data.
 *
 * Note that every ink has a different value in each theme, so a raw value is only ever
 * meaningful together with a theme. Anything persisted stores the *name*.
 */

/** The five highlighter inks, in palette order. Mirrors the `highlight_color` enum. */
export const HIGHLIGHT_INKS = ['persimmon', 'amber', 'jade', 'indigo', 'magenta'] as const

export type HighlightInk = (typeof HIGHLIGHT_INKS)[number]

export type ThemeName = 'paper' | 'ink'

/**
 * Raw ink values per theme, verbatim from the design canvases (`Component.hl`).
 * For tests and any context that cannot resolve a CSS variable.
 */
export const INK_VALUES: Record<ThemeName, Record<HighlightInk, string>> = {
  paper: {
    persimmon: 'oklch(0.58 0.17 32)',
    amber: 'oklch(0.7 0.14 72)',
    jade: 'oklch(0.55 0.12 165)',
    indigo: 'oklch(0.5 0.13 265)',
    magenta: 'oklch(0.53 0.15 350)',
  },
  ink: {
    persimmon: 'oklch(0.7 0.15 32)',
    amber: 'oklch(0.79 0.13 78)',
    jade: 'oklch(0.7 0.12 165)',
    indigo: 'oklch(0.68 0.13 265)',
    magenta: 'oklch(0.7 0.14 350)',
  },
} as const

/** Display names for the colour picker, matching the design's `hlNames`. */
export const INK_LABELS: Record<HighlightInk, string> = {
  persimmon: 'Persimmon',
  amber: 'Amber',
  jade: 'Jade',
  indigo: 'Indigo',
  magenta: 'Magenta',
}

function isHighlightInk(value: string): value is HighlightInk {
  return (HIGHLIGHT_INKS as readonly string[]).includes(value)
}

/**
 * Resolve a stored colour to something renderable.
 *
 * Calendars and lists persist an ink *name* so they follow the active theme. Rows written
 * before the Paper/Ink rework hold a literal colour instead — pass those straight through
 * rather than dropping them.
 */
export function inkColor(value: string | null | undefined, fallback = 'var(--ow-muted)'): string {
  if (!value) return fallback
  return isHighlightInk(value) ? `var(--ow-hl-${value})` : value
}

/** CSS variable for an ink's "fill" row tint. */
export function inkTint(ink: HighlightInk): string {
  return `var(--ow-hl-${ink}-tint)`
}

/** CSS variable for an ink's "fill" row ring. */
export function inkEdge(ink: HighlightInk): string {
  return `var(--ow-hl-${ink}-edge)`
}

/**
 * Order in which new calendars and lists take an ink, so several added in a row stay
 * visually distinct. Cycle by index.
 */
export const INK_ROTATION = ['indigo', 'magenta', 'jade', 'amber', 'persimmon'] as const

export function inkForIndex(index: number): HighlightInk {
  return INK_ROTATION[index % INK_ROTATION.length]!
}

/** The ink a provider's first connection takes, matching the design's sample week. */
export const PROVIDER_DEFAULT_INK: Record<'google' | 'caldav' | 'ical', HighlightInk> = {
  google: 'indigo',
  caldav: 'jade',
  ical: 'amber',
}

export type CalendarProvider = keyof typeof PROVIDER_DEFAULT_INK
