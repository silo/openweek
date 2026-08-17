import { z } from 'zod'

/**
 * Environment schema. Validated at boot so the app fails fast with a readable
 * message when self-host configuration is missing or malformed.
 * See docs/self-hosting.md for the full table.
 */
const ConfigSchema = z.object({
  DATABASE_URL: z.string().min(1, 'required (postgres connection string)'),
  BETTER_AUTH_SECRET: z.string().min(1, 'required'),
  BETTER_AUTH_URL: z.string().min(1, 'required (public URL)'),
  OPENWEEK_ENCRYPTION_KEY: z
    .string()
    .refine(isBase64Bytes(32), 'must be base64 of exactly 32 bytes (openssl rand -base64 32)'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  OPENWEEK_SYNC_INTERVAL: z.string().default('15m'),
  OPENWEEK_EVENT_WINDOW: z.string().default('-1w..+6w'),
})

export type OpenweekConfig = z.infer<typeof ConfigSchema>

function isBase64Bytes(n: number) {
  return (value: string) => {
    try {
      return Buffer.from(value, 'base64').length === n
    }
    catch {
      return false
    }
  }
}

/** Parse (and validate) config from an env object. Throws with a readable message. */
export function parseConfig(env: Record<string, string | undefined> = process.env): OpenweekConfig {
  const parsed = ConfigSchema.safeParse(env)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map(i => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n')
    throw new Error(`Invalid Openweek configuration:\n${issues}`)
  }
  return parsed.data
}

let cached: OpenweekConfig | null = null

/** Cached accessor for use at runtime (after boot validation). */
export function useOpenweekConfig(): OpenweekConfig {
  return (cached ??= parseConfig())
}
