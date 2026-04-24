import { and, eq, inArray, isNotNull, isNull } from '@workspace/db'
import type { Database } from '@workspace/db'
import { schema } from '@workspace/db'

export interface ArticleCard {
  id: string
  slug: string
  title: string
  subtitle: string | null
  readingMinutes: number
  publishedAt: string | null
  authorHandle: string | null
}

/** Batch-fetch article cards keyed by the crosspost post id. */
export async function loadArticleCards(
  db: Database,
  postIds: Array<string>,
): Promise<Map<string, ArticleCard>> {
  const map = new Map<string, ArticleCard>()
  if (postIds.length === 0) return map

  const rows = await db
    .select({
      crosspostPostId: schema.articles.crosspostPostId,
      id: schema.articles.id,
      slug: schema.articles.slug,
      title: schema.articles.title,
      subtitle: schema.articles.subtitle,
      readingMinutes: schema.articles.readingMinutes,
      publishedAt: schema.articles.publishedAt,
      status: schema.articles.status,
      authorHandle: schema.users.handle,
    })
    .from(schema.articles)
    .innerJoin(schema.users, eq(schema.users.id, schema.articles.authorId))
    .where(
      and(
        isNotNull(schema.articles.crosspostPostId),
        inArray(schema.articles.crosspostPostId, postIds),
        isNull(schema.articles.deletedAt),
        eq(schema.articles.status, 'published'),
      ),
    )

  for (const r of rows) {
    if (!r.crosspostPostId) continue
    map.set(r.crosspostPostId, {
      id: r.id,
      slug: r.slug,
      title: r.title,
      subtitle: r.subtitle,
      readingMinutes: r.readingMinutes,
      publishedAt: r.publishedAt?.toISOString() ?? null,
      authorHandle: r.authorHandle,
    })
  }
  return map
}
