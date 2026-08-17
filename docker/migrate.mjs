import process from 'node:process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'

// Applies the committed SQL migrations on container start. Uses drizzle-orm's migrator
// (no drizzle-kit / schema TS needed at runtime). Idempotent — already-applied migrations are skipped.
const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations')
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
await migrate(drizzle(pool), { migrationsFolder })
await pool.end()
console.log('✓ migrations applied')
