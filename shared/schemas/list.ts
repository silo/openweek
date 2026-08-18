import { z } from 'zod'
import { HIGHLIGHT_INKS } from '../constants/colors'

/**
 * A list as returned by the API.
 *
 * `color` reads as a plain string because rows written before the Paper/Ink rework hold a
 * literal hex; those still render (see `inkColor`). Anything written now is an ink name.
 */
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
  color: z.enum(HIGHLIGHT_INKS).optional(),
})
export type ListCreate = z.infer<typeof listCreateSchema>

export const listUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  color: z.enum(HIGHLIGHT_INKS).optional(),
  position: z.string().optional(),
})
export type ListUpdate = z.infer<typeof listUpdateSchema>
