import { and, eq, inArray, isNotNull, isNull } from '@workspace/db'
import type { Database } from '@workspace/db'
import { schema } from '@workspace/db'
import type { ViewerFlags } from './post-dto.ts'

/** Batch-fetch viewer engagement flags for a set of post ids. */
export async function loadViewerFlags(
  db: Database,
  viewerId: string | undefined,
  postIds: Array<string>,
): Promise<Map<string, ViewerFlags>> {
  const map = new Map<string, ViewerFlags>()
  if (!viewerId || postIds.length === 0) return map

  const [likes, bookmarks, reposts] = await Promise.all([
    db
      .select({ postId: schema.likes.postId })
      .from(schema.likes)
      .where(and(eq(schema.likes.userId, viewerId), inArray(schema.likes.postId, postIds))),
    db
      .select({ postId: schema.bookmarks.postId })
      .from(schema.bookmarks)
      .where(and(eq(schema.bookmarks.userId, viewerId), inArray(schema.bookmarks.postId, postIds))),
    db
      .select({ repostOfId: schema.posts.repostOfId })
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.authorId, viewerId),
          isNotNull(schema.posts.repostOfId),
          inArray(schema.posts.repostOfId, postIds),
          isNull(schema.posts.deletedAt),
        ),
      ),
  ])

  const likedSet = new Set(likes.map((r) => r.postId))
  const bookmarkedSet = new Set(bookmarks.map((r) => r.postId))
  const repostedSet = new Set(reposts.map((r) => r.repostOfId!).filter(Boolean))

  for (const id of postIds) {
    map.set(id, {
      liked: likedSet.has(id),
      bookmarked: bookmarkedSet.has(id),
      reposted: repostedSet.has(id),
    })
  }
  return map
}
