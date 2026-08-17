import { db } from '../database/client'
import * as schema from '../database/schema'

// Public: lets the client know whether this is a fresh install (no users → first
// registration becomes the admin). Returns only a boolean, never user data.
export default defineEventHandler(async () => {
  const userCount = await db.$count(schema.user)
  return { hasUsers: userCount > 0 }
})
