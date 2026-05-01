import type { Database } from '@workspace/db'
import {
  applyUnfurlSuccess,
  classifyHttpError,
  persistFailureOnly,
  type FetchOutcome,
} from '@workspace/url-unfurl-core'
import type { XStatusCard } from './card.ts'
import type { XRef } from './urls.ts'

export type FetchOutcomeX = FetchOutcome<XStatusCard>

const DEFAULT_FXTWITTER_API = 'https://api.fxtwitter.com'
const TTL_SEC_OK = 60 * 30

type FxtwitterResponse = {
  code: number
  message?: string
  tweet?: {
    url: string
    id: string
    text: string
    author: {
      screen_name: string
      name: string
      avatar_url?: string | null
      verification?: { verified?: boolean } | null
    }
    replies?: number
    retweets?: number
    likes?: number
    bookmarks?: number
    quotes?: number
    views?: number | null
    created_at?: string | null
  } | null
}

function excerpt(body: string | null | undefined, max = 280): string | null {
  if (!body) return null
  const t = body.trim().replace(/\s+/g, ' ')
  if (!t.length) return null
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`
}

function resolveBaseUrl(baseUrl?: string | null): string {
  const raw = baseUrl?.trim()
  if (!raw) return DEFAULT_FXTWITTER_API
  try {
    const u = new URL(raw)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return DEFAULT_FXTWITTER_API
    return u.origin
  } catch {
    return DEFAULT_FXTWITTER_API
  }
}

export async function fetchXStatusCard(
  ref: XRef,
  opts?: { baseUrl?: string | null },
): Promise<FetchOutcomeX> {
  if (ref.kind !== 'status') {
    return { ok: false, reason: 'unknown', message: 'unsupported_x_ref' }
  }

  const base = resolveBaseUrl(opts?.baseUrl)
  const url = `${base.replace(/\/$/, '')}/status/${encodeURIComponent(ref.tweetId)}`

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)
    let res: Response
    try {
      res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'TwotterLinkPreview/1.0',
        },
      })
    } finally {
      clearTimeout(timer)
    }

    const rawJson: unknown = await res.json().catch(() => null)
    const j = rawJson as FxtwitterResponse | null
    if (!j || typeof j.code !== 'number') {
      return {
        ok: false,
        reason: !res.ok && res.status === 404 ? 'not_found' : 'unknown',
        message: 'invalid_fxtwitter_response',
      }
    }

    if (j.code !== 200 || !j.tweet) {
      return {
        ok: false,
        reason: j.code === 404 ? 'not_found' : 'unknown',
        message: j.message ?? 'tweet_not_found',
      }
    }

    const t = j.tweet
    const author = t.author
    const verified = Boolean(author.verification?.verified)

    const card: XStatusCard = {
      kind: 'x_status',
      url: t.url,
      id: t.id,
      text: t.text,
      authorScreenName: author.screen_name,
      authorName: author.name,
      authorAvatarUrl: author.avatar_url ?? null,
      authorVerified: verified,
      replies: t.replies ?? 0,
      retweets: t.retweets ?? 0,
      likes: t.likes ?? 0,
      bookmarks: t.bookmarks ?? 0,
      quotes: t.quotes ?? 0,
      views: typeof t.views === 'number' ? t.views : null,
      createdAt: t.created_at ?? null,
    }

    const title = `@${card.authorScreenName}`
    const description = excerpt(card.text, 280)

    return {
      ok: true,
      result: {
        card,
        title,
        description,
        imageUrl: card.authorAvatarUrl,
      },
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, reason: 'unknown', message: 'timeout' }
    }
    return { ok: false, ...classifyHttpError(err) }
  }
}

export async function persistXStatusCardOutcome(
  db: Database,
  rowId: string,
  outcome: FetchOutcomeX,
): Promise<void> {
  if (!outcome.ok) {
    await persistFailureOnly(db, rowId, outcome.reason, outcome.message)
    return
  }
  await applyUnfurlSuccess(db, rowId, TTL_SEC_OK, outcome.result, {
    siteName: 'X',
    providerName: 'X',
  })
}

export { persistFailureOnly } from '@workspace/url-unfurl-core'
