import { z } from 'zod'

// Request DTOs for the lists API (Someday / custom columns). Plain Zod only.

const uuid = z.uuid()

export const createListInput = z.object({
  id: uuid.optional(),
  boardId: uuid,
  name: z.string().trim().min(1, 'Name is required').max(200),
  color: z.string().max(32).nullish(),
  position: z.string().min(1).optional(),
})
export type CreateListInput = z.infer<typeof createListInput>

export const updateListInput = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    color: z.string().max(32).nullable().optional(),
    position: z.string().min(1).optional(),
  })
  .refine(d => Object.keys(d).length > 0, { message: 'Empty update' })
export type UpdateListInput = z.infer<typeof updateListInput>
