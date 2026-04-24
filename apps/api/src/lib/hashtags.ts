import { sql } from '@workspace/db'
import { schema } from '@workspace/db'

const HASHTAG_RE = /#([a-z0-9_]+)/gi

export function extractHashtags(text: string): Array<string> {
  const tags = new Set<string>()
  for (const m of text.matchAll(HASHTAG_RE)) {
    tags.add(m[1]!.toLowerCase())
  }
  return Array.from(tags).slice(0, 10) // cap at 10 per post
}

// tx is a drizzle transaction; typed loosely because Drizzle's tx type is verbose.
export async function linkHashtags(tx: any, postId: string, text: string) {
  const tags = extractHashtags(text)
  if (tags.length === 0) return

  // upsert hashtag rows, return ids
  const rows = await tx
    .insert(schema.hashtags)
    .values(tags.map((tag) => ({ tag })))
    .onConflictDoUpdate({ target: schema.hashtags.tag, set: { tag: sql`excluded.tag` } })
    .returning({ id: schema.hashtags.id, tag: schema.hashtags.tag })

  if (rows.length === 0) return

  await tx
    .insert(schema.postHashtags)
    .values(rows.map((r: { id: number }) => ({ postId, hashtagId: r.id })))
    .onConflictDoNothing()
}
