import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import { count } from 'drizzle-orm'
import { generateKeyBetween } from 'fractional-indexing-jittered'
import { useDb } from '../db'
import * as schema from '../db/schema'
import { userAdditionalFields } from './auth-fields'
import { firstUserRole } from './first-user'
import { getEnv } from './runtime-config'

function createAuth() {
  const env = getEnv()
  const db = useDb()

  const googleEnabled = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.BETTER_AUTH_URL],

    database: drizzleAdapter(db, { provider: 'pg', schema }),

    emailAndPassword: {
      enabled: true,
      // Email verification + password reset are a later phase (no SMTP on a fresh self-host).
      requireEmailVerification: false,
    },

    socialProviders: googleEnabled
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
          },
        }
      : undefined,

    // Per-user planner settings (shared with auth.config.ts to avoid drift).
    user: { additionalFields: userAdditionalFields },

    plugins: [admin()],

    databaseHooks: {
      user: {
        create: {
          // First registered user becomes admin; everyone after is a normal user.
          before: async (data) => {
            const [row] = await db.select({ n: count() }).from(schema.user)
            return { data: { ...data, role: firstUserRole(row?.n ?? 0) } }
          },
          // Give every new user a default board with a "Someday" list.
          after: async (newUser) => {
            const [board] = await db
              .insert(schema.boards)
              .values({
                userId: newUser.id,
                name: 'My Week',
                position: generateKeyBetween(null, null),
                isDefault: true,
              })
              .returning()

            await db.insert(schema.lists).values({
              boardId: board!.id,
              name: 'Someday',
              position: generateKeyBetween(null, null),
            })
          },
        },
      },
    },
  })
}

let instance: ReturnType<typeof createAuth> | null = null

/**
 * Better Auth owns login only (email/password + optional Google). The admin
 * plugin adds roles; the first user to register becomes the admin. Google
 * *calendar* connection is a separate flow (see docs/decisions.md D10/D4).
 *
 * Lazily constructed so env is validated first; cached as a singleton.
 */
export function serverAuth() {
  instance ??= createAuth()
  return instance
}
