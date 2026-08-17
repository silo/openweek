import { z } from 'zod'

/** A list as returned by the API. */
export const listSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  isDefault: z.boolean(),
  position: z.string(),
})
export type List = z.infer<typeof listSchema>

export const listCreateSchema = z.object({
  name: z.string().min(1).max(200),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})
export type ListCreate = z.infer<typeof listCreateSchema>

export const listUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  position: z.string().optional(),
})
export type ListUpdate = z.infer<typeof listUpdateSchema>
