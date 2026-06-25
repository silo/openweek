// Production migrate-on-start: applies committed SQL migrations using only
// runtime deps (pg + drizzle-orm) — no drizzle-kit needed in the image.
// Dev convenience is `pnpm db:migrate` (drizzle-kit migrate).
import process from 'node:process'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is required to run migrations.')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: url })
try {
  await migrate(drizzle(pool), { migrationsFolder: './drizzle' })
  console.log('Migrations applied.')
}
catch (err) {
  console.error('Migration failed:', err)
  process.exit(1)
}
finally {
  await pool.end()
}
