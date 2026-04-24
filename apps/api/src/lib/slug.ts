import { and, eq } from '@workspace/db'
import type { Database } from '@workspace/db'
import { schema } from '@workspace/db'

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
  return (base || 'untitled').slice(0, 120)
}

/** Ensures the slug is unique for that author by appending -2, -3, ... on collision. */
export async function uniqueSlugForAuthor(
  db: Database,
  authorId: string,
  baseSlug: string,
  excludeArticleId?: string,
): Promise<string> {
  let slug = baseSlug
  let suffix = 2
  for (;;) {
    const [existing] = await db
      .select({ id: schema.articles.id })
      .from(schema.articles)
      .where(and(eq(schema.articles.authorId, authorId), eq(schema.articles.slug, slug)))
      .limit(1)
    if (!existing || existing.id === excludeArticleId) return slug
    slug = `${baseSlug.slice(0, 117)}-${suffix}`
    suffix++
    if (suffix > 200) throw new Error('slug_exhausted')
  }
}
