import { z } from 'zod'

export const idSchema = z.string().uuid()
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export function toCamelCase<T extends Record<string, unknown>>(record: T) {
  return record
}
