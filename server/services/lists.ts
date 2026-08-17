import { eq } from 'drizzle-orm'
import { db } from '../database/client'
import { list } from '../database/schema'
import { keyBetween } from './ordering'

/** Ensure the user has at least the default "Someday" list. Cheap no-op once it exists. */
export async function ensureDefaultList(userId: string): Promise<void> {
  const count = await db.$count(list, eq(list.userId, userId))
  if (count > 0) return
  await db.insert(list).values({
    userId,
    name: 'Someday',
    color: '#C6C1B5',
    isDefault: true,
    position: keyBetween(null, null),
  })
}
