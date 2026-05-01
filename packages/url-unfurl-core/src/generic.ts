import { createHash } from 'node:crypto'
import dns from 'node:dns/promises'
import net from 'node:net'
import type { Database } from '@workspace/db'
import {
  applyUnfurlSuccess,
  classifyHttpError,
  persistFailureOnly,
  type FetchOutcome,
} from './persistence.ts'

export interface GenericUnfurlCard {
  kind: 'generic'
  url: string
  title: string
  description: string | null
  imageUrl: string | null
  siteName: string | null
  faviconUrl: string | null
}

const MAX_REDIRECTS = 5
const FETCH_TIMEOUT_MS = 12_000
const MAX_HTML_BYTES = 1_500_000

export function refKeyForGeneric(canonicalUrl: string): string {
  const hash = createHash('sha256').update(canonicalUrl).digest('hex')
  return `generic:${hash}`
}

export function canonicalGenericUrl(trimmed: string): string | null {
  try {
    const u = new URL(trimmed)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    if (!isHostnameAllowedInitial(u.hostname)) return null
    u.hash = ''
    return u.href
  } catch {
    return null
  }
}

export function isGenericCardKind(kind: string | null | undefined): kind is 'generic' {
  return kind === 'generic'
}

function isHostnameAllowedInitial(hostname: string): boolean {
  const h = hostname.toLowerCase()
  if (h === 'localhost' || h.endsWith('.localhost')) return false
  if (h.endsWith('.local')) return false
  if (net.isIPv4(h)) {
    const parts = h.split('.').map(Number)
    return !isIpv4PrivateOrSpecial(parts)
  }
  if (net.isIPv6(h)) return !isIpv6Blocked(h)
  return true
}

function isIpv4PrivateOrSpecial(parts: number[]): boolean {
  const [a, b] = parts
  if (a === 10) return true
  if (a === 172 && b !== undefined && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 100 && b !== undefined && b >= 64 && b <= 127) return true
  return false
}

function isIpv6Blocked(ip: string): boolean {
  const lower = ip.toLowerCase()
  if (lower === '::1') return true
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true
  if (lower.startsWith('fe80:')) return true
  if (lower.startsWith('::ffff:')) {
    const tail = lower.slice('::ffff:'.length)
    if (net.isIPv4(tail)) {
      return isIpv4PrivateOrSpecial(tail.split('.').map(Number))
    }
  }
  return false
}

async function assertSafeHostname(hostname: string): Promise<void> {
  const h = hostname.toLowerCase()
  if (h === 'localhost' || h.endsWith('.localhost')) throw blockedErr()
  if (h.endsWith('.local')) throw blockedErr()
  if (net.isIPv4(h)) {
    const parts = h.split('.').map(Number)
    if (isIpv4PrivateOrSpecial(parts)) throw blockedErr()
    return
  }
  if (net.isIPv6(h)) {
    if (isIpv6Blocked(h)) throw blockedErr()
    return
  }
  let addr: string
  try {
    addr = (await dns.lookup(h, { verbatim: true })).address
  } catch {
    throw fetchErr('dns_failed')
  }
  if (net.isIPv4(addr)) {
    if (isIpv4PrivateOrSpecial(addr.split('.').map(Number))) throw blockedErr()
    return
  }
  if (net.isIPv6(addr) && isIpv6Blocked(addr)) throw blockedErr()
}

function blockedErr(): Error {
  const e = new Error('blocked_target')
  ;(e as { status?: number }).status = 403
  return e
}

function fetchErr(msg: string): Error {
  return new Error(msg)
}

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number.parseInt(n, 10)))
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '').trim()
}

function resolveAgainstBase(base: URL, href: string | null | undefined): string | null {
  if (!href || !href.trim()) return null
  try {
    return new URL(href.trim(), base).href
  } catch {
    return null
  }
}

function extractTitleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (!m?.[1]) return null
  const t = stripTags(decodeBasicEntities(m[1])).trim()
  return t.length > 0 ? t.slice(0, 500) : null
}

function parseMetaMaps(html: string): {
  byProp: Map<string, string>
  byName: Map<string, string>
} {
  const byProp = new Map<string, string>()
  const byName = new Map<string, string>()
  const metaTag = /<meta\b([^>]*)>/gi
  let m: RegExpExecArray | null
  while ((m = metaTag.exec(html)) !== null) {
    const attrs = m[1] ?? ''
    const prop =
      attrs.match(/\bproperty\s*=\s*["']([^"']+)["']/i)?.[1] ??
      attrs.match(/\bproperty\s*=\s*([^\s>/]+)/i)?.[1]
    const name =
      attrs.match(/\bname\s*=\s*["']([^"']+)["']/i)?.[1] ??
      attrs.match(/\bname\s*=\s*([^\s>/]+)/i)?.[1]
    const content =
      attrs.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1] ??
      attrs.match(/\bcontent\s*=\s*([^\s>]+)/i)?.[1]
    if (content === undefined) continue
    const decoded = decodeBasicEntities(content).trim()
    if (prop) byProp.set(prop.toLowerCase(), decoded)
    else if (name) byName.set(name.toLowerCase(), decoded)
  }
  return { byProp, byName }
}

function extractLinkHref(html: string, relCandidates: Array<string>): string | null {
  const linkTag = /<link\b([^>]*)>/gi
  const relSet = new Set(relCandidates.map((r) => r.toLowerCase()))
  let m: RegExpExecArray | null
  while ((m = linkTag.exec(html)) !== null) {
    const attrs = m[1] ?? ''
    const relRaw =
      attrs.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1] ??
      attrs.match(/\brel\s*=\s*([^\s>/]+)/i)?.[1]
    if (!relRaw) continue
    const relList = relRaw.toLowerCase().split(/\s+/)
    if (!relList.some((r) => relSet.has(r))) continue
    const href =
      attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] ??
      attrs.match(/\bhref\s*=\s*([^\s>/]+)/i)?.[1]
    if (href) return href.trim()
  }
  return null
}

function excerpt(body: string | null | undefined, max = 400): string | null {
  if (!body) return null
  const t = body.trim().replace(/\s+/g, ' ')
  if (!t.length) return null
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`
}

async function readBodyLimited(
  body: ReadableStream<Uint8Array> | null,
  max: number,
): Promise<Uint8Array> {
  if (!body) return new Uint8Array()
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    total += value.length
    if (total > max) {
      await reader.cancel().catch(() => {})
      throw fetchErr('body_too_large')
    }
    chunks.push(value)
  }
  const out = new Uint8Array(total)
  let o = 0
  for (const c of chunks) {
    out.set(c, o)
    o += c.length
  }
  return out
}

async function fetchHtmlSsrfSafe(entryUrl: string): Promise<{ html: string; finalUrl: URL }> {
  let url = new URL(entryUrl)
  await assertSafeHostname(url.hostname)

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(url.href, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'TwotterLinkPreview/1.0 (+https://twotter)',
        },
      })
    } finally {
      clearTimeout(timer)
    }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc || redirect === MAX_REDIRECTS) throw fetchErr('redirect_failed')
      const next = new URL(loc, url)
      if (next.protocol !== 'http:' && next.protocol !== 'https:') throw blockedErr()
      await assertSafeHostname(next.hostname)
      url = next
      continue
    }

    if (!res.ok) {
      const err = new Error(`http_${res.status}`)
      ;(err as { status?: number }).status = res.status
      throw err
    }

    const ct = res.headers.get('content-type') ?? ''
    if (!/text\/html|application\/xhtml\+xml/i.test(ct)) {
      throw fetchErr('not_html')
    }

    const buf = await readBodyLimited(res.body, MAX_HTML_BYTES)
    const html = new TextDecoder('utf-8', { fatal: false }).decode(buf)
    return { html, finalUrl: url }
  }

  throw fetchErr('too_many_redirects')
}

function hostLabel(hostname: string): string {
  return hostname.replace(/^www\./i, '')
}

export async function fetchGenericCard(pageUrl: string): Promise<FetchOutcome<GenericUnfurlCard>> {
  const canonical = canonicalGenericUrl(pageUrl)
  if (!canonical) return { ok: false, reason: 'unknown', message: 'bad_url' }

  try {
    const { html, finalUrl } = await fetchHtmlSsrfSafe(canonical)
    const { byProp, byName } = parseMetaMaps(html)

    const ogTitle = byProp.get('og:title') ?? byProp.get('twitter:title')
    const twTitle = byName.get('twitter:title')
    const titleTag = extractTitleTag(html)
    const title =
      (ogTitle && ogTitle.length > 0 ? ogTitle : null) ??
      (twTitle && twTitle.length > 0 ? twTitle : null) ??
      titleTag ??
      hostLabel(finalUrl.hostname)

    const ogDesc =
      byProp.get('og:description') ??
      byProp.get('twitter:description') ??
      byName.get('description') ??
      byName.get('twitter:description')
    const description = excerpt(ogDesc ?? null, 400)

    const ogImage =
      byProp.get('og:image') ??
      byProp.get('twitter:image') ??
      byName.get('twitter:image')
    const imageAbs = ogImage ? resolveAgainstBase(finalUrl, ogImage.trim()) : null

    const ogSite = byProp.get('og:site_name')
    const siteName =
      ogSite && ogSite.length > 0 ? ogSite.slice(0, 200) : hostLabel(finalUrl.hostname)

    const iconHref =
      extractLinkHref(html, ['icon', 'shortcut icon', 'apple-touch-icon']) ??
      `/favicon.ico`
    const faviconUrl = resolveAgainstBase(finalUrl, iconHref)

    const card: GenericUnfurlCard = {
      kind: 'generic',
      url: finalUrl.href,
      title: title.slice(0, 500),
      description,
      imageUrl: imageAbs,
      siteName,
      faviconUrl,
    }

    return {
      ok: true,
      result: {
        card,
        title: card.title,
        description: card.description,
        imageUrl: card.imageUrl,
      },
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const status = (err as { status?: number }).status
    if (status === 403 && msg.includes('blocked')) {
      return { ok: false, reason: 'unauthorized', message: msg }
    }
    if (typeof status === 'number' && status === 404) {
      return { ok: false, reason: 'not_found', message: msg }
    }
    return { ok: false, ...classifyHttpError(err) }
  }
}

export async function persistGenericCardOutcome(
  db: Database,
  rowId: string,
  outcome: FetchOutcome<GenericUnfurlCard>,
): Promise<void> {
  if (!outcome.ok) {
    await persistFailureOnly(db, rowId, outcome.reason, outcome.message)
    return
  }
  const ttlSec = 60 * 60 * 24
  const displaySite =
    outcome.result.card.siteName ??
    hostLabel(new URL(outcome.result.card.url).hostname)
  await applyUnfurlSuccess(db, rowId, ttlSec, outcome.result, {
    siteName: displaySite,
    providerName: 'Web',
  })
}
