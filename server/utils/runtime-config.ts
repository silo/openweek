import { Buffer } from 'node:buffer'
import process from 'node:process'
import { z } from 'zod'

/**
 * Boot-time environment validation. A misconfigured instance must fail fast with
 * a clear message instead of crashing at runtime. Called from a Nitro startup
 * plugin (server/plugins/00.env.ts) so the contract is enforced on every boot.
 *
 * Keep this list in sync with .env.example and docs/self-hosting.md.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (postgres://…)'),

  BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required (openssl rand -base64 32)'),
  BETTER_AUTH_URL: z.string().url('BETTER_AUTH_URL must be a full URL, e.g. https://openweek.example.com'),

  // Must decode to exactly 32 bytes (AES-256). Distinct from BETTER_AUTH_SECRET.
  OPENWEEK_ENCRYPTION_KEY: z.string().refine(
    (v) => {
      try {
        return Buffer.from(v, 'base64').length === 32
      }
      catch {
        return false
      }
    },
    'OPENWEEK_ENCRYPTION_KEY must be base64 of exactly 32 bytes (openssl rand -base64 32)',
  ),

  // Optional — app runs fine without Google (email/password + CalDAV/iCal still work).
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  OPENWEEK_SYNC_INTERVAL: z.string().default('10m'),
})

export type Env = z.infer<typeof envSchema>

let cached: Env | null = null

export function getEnv(): Env {
  if (cached)
    return cached

  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map(i => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n')
    throw new Error(`Invalid environment configuration:\n${issues}\n\nSee .env.example and docs/self-hosting.md.`)
  }

  cached = parsed.data
  return cached
}
