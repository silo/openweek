import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

/**
 * A single pg Pool shared by Drizzle and Better Auth's adapter.
 * The connection is lazy (pg connects on first query), so importing this module
 * is safe in tooling contexts (drizzle-kit / better-auth CLI) without a live DB.
 */
export const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export const db = drizzle(pool, { schema })

export type Db = typeof db
export { schema }
