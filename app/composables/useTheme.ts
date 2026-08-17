import type { Settings } from '~~/shared/schemas/settings'

type FontStyle = Settings['fontStyle']

export const FONT_STACKS: Record<FontStyle, { display: string, body: string }> = {
  'plex-mono': { display: "'IBM Plex Mono', ui-monospace, monospace", body: "'IBM Plex Sans', system-ui, sans-serif" },
  'editorial': { display: "'Newsreader', Georgia, serif", body: "'IBM Plex Sans', system-ui, sans-serif" },
  'grotesk': { display: "'Space Grotesk', system-ui, sans-serif", body: "'Space Grotesk', system-ui, sans-serif" },
  'typewriter': { display: "'Spline Sans Mono', ui-monospace, monospace", body: "'IBM Plex Sans', system-ui, sans-serif" },
}

/** Apply theme-affecting settings to <html> (client only). */
export function applyTheme(s: Pick<Settings, 'theme' | 'accentColor' | 'fontStyle'>) {
  if (import.meta.server) return
  const root = document.documentElement
  const dark = s.theme === 'dark'
    || (s.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.dataset.theme = dark ? 'openweek-dark' : 'openweek'
  root.style.setProperty('--ow-accent', s.accentColor)
  const font = FONT_STACKS[s.fontStyle]
  root.style.setProperty('--ow-display', font.display)
  root.style.setProperty('--ow-body', font.body)
}
