import { z } from 'zod'
import { HIGHLIGHT_INKS } from '../constants/colors'

/** Body faces offered by the Typeface setting. Values match the @fontsource packages. */
export const FONT_STYLES = ['open-sans', 'lato', 'roboto', 'inter', 'source-sans-3'] as const

/** Themes. `system` follows prefers-color-scheme. */
export const THEMES = ['paper', 'ink', 'system'] as const

/** How a task's highlight colour is drawn — a left bar, or a tinted row. */
export const TAG_STYLES = ['edge', 'fill'] as const

export const TEXT_SIZES = ['small', 'default', 'large'] as const

// The API contract for user settings — hand-written Zod, imported by the client (types)
// and the server (runtime parse). Mirrors the user_settings table (see docs/data-model.md).
export const settingsSchema = z.object({
  weekStartsOn: z.union([z.literal(0), z.literal(1)]),
  theme: z.enum(THEMES),
  // Named rather than a hex literal, so it resolves per theme.
  accentColor: z.enum(HIGHLIGHT_INKS),
  fontStyle: z.enum(FONT_STYLES),
  tagStyle: z.enum(TAG_STYLES),
  textSize: z.enum(TEXT_SIZES),
  showWeekends: z.boolean(),
  collapseDone: z.boolean(),
  showCalendarEvents: z.boolean(),
  rolloverEnabled: z.boolean(),
  timezone: z.string().min(1),
})

export type Settings = z.infer<typeof settingsSchema>

export const settingsUpdateSchema = settingsSchema.partial()
export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>
