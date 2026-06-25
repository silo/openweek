import process from 'node:process'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { userAdditionalFields } from './server/utils/auth-fields'

/**
 * Schema-generation config for `pnpm auth:gen` (@better-auth/cli) ONLY.
 *
 * The runtime auth lives in server/utils/auth.ts (lazy, env-validated). This
 * file exists because the CLI must statically load an `auth` export, and it
 * must not require runtime secrets (so it runs anywhere). It mirrors the
 * runtime plugins + additionalFields; the pg pool is never actually connected
 * during `generate`.
 *
 * Workflow: edit auth config → `pnpm auth:gen` → reconcile server/db/schema/auth.ts
 * → `pnpm db:generate` → `pnpm db:migrate`.
 */
const db = drizzle(new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://localhost:5432/openweek',
}))

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  plugins: [admin()],
  user: { additionalFields: userAdditionalFields },
})
