import { z } from 'zod'
import { uuidSchema } from './common.ts'

export const POST_MAX_LEN = 500

export const postVisibilitySchema = z.enum(['public', 'followers', 'unlisted'])
export const replyRestrictionSchema = z.enum(['anyone', 'following', 'mentioned'])

export const createPostSchema = z.object({
  text: z.string().trim().max(POST_MAX_LEN),
  replyToId: uuidSchema.optional(),
  quoteOfId: uuidSchema.optional(),
  mediaIds: z.array(uuidSchema).max(4).optional(),
  visibility: postVisibilitySchema.default('public'),
  replyRestriction: replyRestrictionSchema.default('anyone'),
  sensitive: z.boolean().default(false),
  contentWarning: z.string().max(100).optional(),
  lang: z.string().max(10).optional(),
})

export const editPostSchema = z.object({
  text: z.string().trim().max(POST_MAX_LEN),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
export type EditPostInput = z.infer<typeof editPostSchema>
