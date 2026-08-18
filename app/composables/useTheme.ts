import type { Settings } from '~~/shared/schemas/settings'

type FontStyle = Settings['fontStyle']
type TextSize = Settings['textSize']

/**
 * The chosen face drives every bit of text except the wordmark, which keeps Bricolage
 * Grotesque as the identity mark (`--ow-font-brand`).
 */
export const FONT_STACKS: Record<FontStyle, string> = {
  'bricolage-grotesque': '"Bricolage Grotesque Variable", "Bricolage Grotesque", system-ui, sans-serif',
  'open-sans': '"Open Sans", Arial, sans-serif',
  'lato': 'Lato, Arial, sans-serif',
  'roboto': 'Roboto, Arial, sans-serif',
  'inter': 'Inter, Arial, sans-serif',
  'source-sans-3': '"Source Sans 3", Arial, sans-serif',
}

/** Root font-size multipliers for the Text size setting (base is 15px). */
export const TEXT_SCALES: Record<TextSize, string> = {
  small: '0.9333',
  default: '1',
  large: '1.1',
}

type ThemeSettings = Pick<Settings, 'theme' | 'accentColor' | 'fontStyle' | 'textSize'>

/** Does the given theme setting resolve to Ink right now? */
export function prefersInk(theme: Settings['theme']): boolean {
  if (theme === 'ink') return true
  if (theme === 'paper') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Apply the appearance settings to <html> (client only). */
export function applyTheme(s: ThemeSettings) {
  if (import.meta.server) return
  const root = document.documentElement
  root.dataset.theme = prefersInk(s.theme) ? 'openweek-dark' : 'openweek'
  // The accent is a named ink; main.css maps [data-accent] onto --ow-accent per theme.
  root.dataset.accent = s.accentColor
  const face = FONT_STACKS[s.fontStyle]
  root.style.setProperty('--ow-font-display', face)
  root.style.setProperty('--ow-font-body', face)
  root.style.setProperty('--ow-text-scale', TEXT_SCALES[s.textSize])
}
