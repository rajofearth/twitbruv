import { API_URL } from "./env"

export interface UploadedMedia {
  id: string
  kind: "image" | "video" | "gif"
  processingState: "pending" | "processing" | "ready" | "failed" | "flagged"
  width: number | null
  height: number | null
  blurhash: string | null
  altText: string | null
  variants: Array<{ kind: string; url: string; width: number; height: number }>
}

/** Pick the best variant URL for a given display context. Fallbacks walk smaller to larger. */
export function pickVariantUrl(
  media: UploadedMedia,
  prefer: "thumb" | "medium" | "large" = "medium",
): string | null {
  const order =
    prefer === "thumb"
      ? ["thumb", "medium", "large"]
      : prefer === "large"
      ? ["large", "medium", "thumb"]
      : ["medium", "large", "thumb"]
  for (const kind of order) {
    const v = media.variants.find((x) => x.kind === kind)
    if (v) return v.url
  }
  return media.variants[0]?.url ?? null
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "unknown" }))
    throw new Error(body.message ?? body.error ?? res.statusText)
  }
  return (await res.json()) as T
}

export async function uploadImage(file: File): Promise<UploadedMedia> {
  const intent = await json<{
    mediaId: string
    uploadUrl: string
    uploadHeaders: Record<string, string>
  }>("/api/media/intent", {
    method: "POST",
    body: JSON.stringify({ mime: file.type, size: file.size }),
  })

  const putRes = await fetch(intent.uploadUrl, {
    method: "PUT",
    headers: intent.uploadHeaders,
    body: file,
  })
  if (!putRes.ok) throw new Error(`upload failed: ${putRes.status}`)

  await json(`/api/media/${intent.mediaId}/finalize`, { method: "POST" })

  // Poll until ready (or fail). Large banners + sharp variants can take a while on cold workers.
  const deadline = Date.now() + 60_000
  let lastState: UploadedMedia["processingState"] = "pending"
  while (Date.now() < deadline) {
    const { media } = await json<{ media: UploadedMedia }>(`/api/media/${intent.mediaId}`)
    lastState = media.processingState
    if (media.processingState === "ready") return media
    if (media.processingState === "failed" || media.processingState === "flagged") {
      throw new Error(`media ${media.processingState}`)
    }
    await new Promise((r) => setTimeout(r, 800))
  }
  throw new Error(
    `media processing timed out (last state: ${lastState}) — is the worker running?`,
  )
}
