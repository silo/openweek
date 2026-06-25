import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { getEnv } from '../utils/runtime-config'
import * as schema from './schema'

// One pg Pool, shared by Drizzle and (in Phase 2) Better Auth's adapter.
let pool: pg.Pool | null = null
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDb() {
  if (!dbInstance) {
    pool = new pg.Pool({ connectionString: getEnv().DATABASE_URL })
    dbInstance = drizzle(pool, { schema })
  }
  return dbInstance
}

export { schema }
