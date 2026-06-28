import { desc, eq } from 'drizzle-orm'
import { generateKeyBetween } from 'fractional-indexing-jittered'
import { uuidv7 } from 'uuidv7'
import { createListInput } from '#shared/schemas/list'
import { lists } from '~~/server/db/schema'
import { loadOwnedBoard } from '~~/server/utils/ownership'

// Create a Someday/custom list in a board the user owns.
export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, createListInput.parse)
  const { db, board } = await loadOwnedBoard(event, input.boardId)

  let position = input.position
  if (!position) {
    const [last] = await db
      .select({ position: lists.position })
      .from(lists)
      .where(eq(lists.boardId, board.id))
      .orderBy(desc(lists.position), desc(lists.id))
      .limit(1)
    position = generateKeyBetween(last?.position ?? null, null)
  }

  const [row] = await db
    .insert(lists)
    .values({ id: input.id ?? uuidv7(), boardId: board.id, name: input.name, color: input.color ?? null, position })
    .returning()
  return row
})
