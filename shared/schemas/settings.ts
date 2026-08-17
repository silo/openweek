import { z } from 'zod'

// The API contract for user settings — hand-written Zod, imported by the client (types)
// and the server (runtime parse). Mirrors the user_settings table (see docs/data-model.md).
export const settingsSchema = z.object({
  weekStartsOn: z.union([z.literal(0), z.literal(1)]),
  theme: z.enum(['light', 'dark', 'system']),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'must be a hex color'),
  fontStyle: z.enum(['plex-mono', 'editorial', 'grotesk', 'typewriter']),
  tagStyle: z.enum(['underline', 'swipe']),
  showCalendarEvents: z.boolean(),
  rolloverEnabled: z.boolean(),
  timezone: z.string().min(1),
})

export type Settings = z.infer<typeof settingsSchema>

export const settingsUpdateSchema = settingsSchema.partial()
export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>
