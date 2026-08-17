import { z } from 'zod'

export const searchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string().nullable(),
  listId: z.string().nullable(),
  listName: z.string().nullable(),
  completedAt: z.string().nullable(),
})
export type SearchResult = z.infer<typeof searchResultSchema>
