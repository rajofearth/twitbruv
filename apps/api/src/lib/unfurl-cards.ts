import { and, asc, eq, inArray } from '@workspace/db'
import type { Database } from '@workspace/db'
import { schema } from '@workspace/db'
import type { GithubCard } from '@workspace/github-unfurl'
import { isGithubCardKind } from '@workspace/github-unfurl'
import type { YouTubeCard } from '@workspace/youtube-unfurl'
import { isYouTubeCardKind } from '@workspace/youtube-unfurl'
import type { GenericUnfurlCard as GenericPayload } from '@workspace/url-unfurl-core'
import { isGenericCardKind } from '@workspace/url-unfurl-core'
import type { XStatusCard as XCardPayload } from '@workspace/x-unfurl/card'
import { isXCardKind } from '@workspace/x-unfurl/card'
import type { ArticleCard } from './article-cards.ts'

export type UnfurlArticleCard = ArticleCard & { provider: 'article'; kind: 'article' }
export type UnfurlGithubCard = GithubCard & { provider: 'github' }
export type UnfurlYoutubeCard = YouTubeCard & { provider: 'youtube' }
export type UnfurlGenericCard = GenericPayload & { provider: 'generic' }
export type UnfurlXCard = XCardPayload & { provider: 'x' }

export type UnfurlCard =
  | UnfurlArticleCard
  | UnfurlGithubCard
  | UnfurlYoutubeCard
  | UnfurlGenericCard
  | UnfurlXCard

export async function loadUnfurlCards(
  db: Database,
  postIds: Array<string>,
  articles: Map<string, ArticleCard>,
): Promise<Map<string, Array<UnfurlCard>>> {
  const map = new Map<string, Array<UnfurlCard>>()
  if (postIds.length === 0) return map

  const articlePostIds = new Set(postIds.filter((id) => articles.has(id)))

  for (const id of postIds) {
    const a = articles.get(id)
    map.set(
      id,
      a
        ? [
            {
              provider: 'article',
              kind: 'article',
              ...a,
            },
          ]
        : [],
    )
  }

  const rows = await db
    .select({
      postId: schema.postUrlUnfurls.postId,
      position: schema.postUrlUnfurls.position,
      kind: schema.urlUnfurls.kind,
      card: schema.urlUnfurls.card,
    })
    .from(schema.postUrlUnfurls)
    .innerJoin(schema.urlUnfurls, eq(schema.urlUnfurls.id, schema.postUrlUnfurls.unfurlId))
    .where(
      and(inArray(schema.postUrlUnfurls.postId, postIds), eq(schema.urlUnfurls.state, 'ready')),
    )
    .orderBy(asc(schema.postUrlUnfurls.postId), asc(schema.postUrlUnfurls.position))

  const urlCardSeenForPost = new Set<string>()
  for (const r of rows) {
    if (articlePostIds.has(r.postId)) continue
    if (urlCardSeenForPost.has(r.postId)) continue
    if (!r.kind || !r.card) continue
    let card:
      | UnfurlGithubCard
      | UnfurlYoutubeCard
      | UnfurlGenericCard
      | UnfurlXCard
      | undefined
    if (isGithubCardKind(r.kind)) card = { ...(r.card as GithubCard), provider: 'github' }
    else if (isYouTubeCardKind(r.kind))
      card = { ...(r.card as YouTubeCard), provider: 'youtube' }
    else if (isGenericCardKind(r.kind))
      card = { ...(r.card as GenericPayload), provider: 'generic' }
    else if (isXCardKind(r.kind)) card = { ...(r.card as XCardPayload), provider: 'x' }
    else continue
    const list = map.get(r.postId) ?? []
    list.push(card)
    map.set(r.postId, list)
    urlCardSeenForPost.add(r.postId)
  }

  return map
}
