import { asc, eq, inArray } from '@workspace/db'
import type { Database } from '@workspace/db'
import { schema } from '@workspace/db'

/** Batch-load attached media for a set of posts, in position order. */
export async function loadPostMedia(
  db: Database,
  postIds: Array<string>,
): Promise<Map<string, Array<typeof schema.media.$inferSelect>>> {
  const map = new Map<string, Array<typeof schema.media.$inferSelect>>()
  if (postIds.length === 0) return map

  const rows = await db
    .select({
      postId: schema.postMedia.postId,
      position: schema.postMedia.position,
      media: schema.media,
    })
    .from(schema.postMedia)
    .innerJoin(schema.media, eq(schema.media.id, schema.postMedia.mediaId))
    .where(inArray(schema.postMedia.postId, postIds))
    .orderBy(asc(schema.postMedia.postId), asc(schema.postMedia.position))

  for (const r of rows) {
    const arr = map.get(r.postId) ?? []
    arr.push(r.media)
    map.set(r.postId, arr)
  }
  return map
}
