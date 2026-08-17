import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import { db } from '../database/client'
import * as schema from '../database/schema'

const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: { enabled: true },
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
      }
    : {},
  plugins: [admin()],
  databaseHooks: {
    user: {
      create: {
        // The first user to register becomes the admin.
        before: async (newUser) => {
          const existingUsers = await db.$count(schema.user)
          return { data: { ...newUser, role: existingUsers === 0 ? 'admin' : 'user' } }
        },
        // Every user gets a settings row.
        after: async (newUser) => {
          await db.insert(schema.userSettings).values({ userId: newUser.id }).onConflictDoNothing()
        },
      },
    },
  },
})
