import { URL_PATTERN, trimTrailingPunct } from '@workspace/url-unfurl-core/text'

export type XRef = { kind: 'status'; tweetId: string }

const HOSTS = new Set([
  'x.com',
  'www.x.com',
  'twitter.com',
  'www.twitter.com',
  'mobile.twitter.com',
  'mobile.x.com',
])

function isAllowedHost(host: string): boolean {
  return HOSTS.has(host.toLowerCase())
}

export function parseXUrl(raw: string): XRef | null {
  const trimmed = trimTrailingPunct(raw)
  let u: URL
  try {
    u = new URL(trimmed)
  } catch {
    return null
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
  if (!isAllowedHost(u.hostname)) return null

  const tweetId = extractStatusTweetId(u.pathname)
  if (!tweetId || !/^\d+$/.test(tweetId)) return null

  return { kind: 'status', tweetId }
}

function extractStatusTweetId(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean)
  for (let i = 0; i < parts.length; i++) {
    const id = parts[i + 1]
    if (parts[i] === 'status' && id !== undefined && /^\d+$/.test(id)) {
      return id
    }
  }
  return null
}

export function refKeyFor(ref: XRef): string {
  return `x_status:${ref.tweetId}`
}

export function canonicalizeXUrl(ref: XRef): string {
  return `https://x.com/i/status/${ref.tweetId}`
}
