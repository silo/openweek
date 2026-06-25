import process from 'node:process'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit loads .env automatically. Migrations are committed under ./drizzle
// and applied with `pnpm db:migrate` (never `push` in production).
export default defineConfig({
  schema: './server/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://openweek:openweek@localhost:5432/openweek',
  },
})
