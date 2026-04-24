import { z } from 'zod'

export const uuidSchema = z.string().uuid()
export const isoDateSchema = z.string().datetime({ offset: true })

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(40),
})

export type Pagination = z.infer<typeof paginationSchema>
