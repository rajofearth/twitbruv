import { Link } from "@tanstack/react-router"
import { useState } from "react"
import {
  IconBookmark,
  IconBookmarkFilled,
  IconDots,
  IconHeart,
  IconHeartFilled,
  IconMessageCircle,
  IconPencil,
  IconRepeat,
  IconTrash,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { POST_MAX_LEN } from "@workspace/validators"
import { authClient } from "../lib/auth"
import { ApiError, api } from "../lib/api"
import { Avatar } from "./avatar"
import { ImageLightbox } from "./image-lightbox"
import type { Post } from "../lib/api"

function relativeTime(iso: string): string {
  const d = new Date(iso).getTime()
  const diff = Date.now() - d
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const dd = Math.floor(h / 24)
  if (dd < 7) return `${dd}d`
  return new Date(iso).toLocaleDateString()
}

function linkifyText(text: string) {
  const regex = /(#[a-z0-9_]+|@[a-z0-9_]+|https?:\/\/\S+)/gi
  const parts: Array<{
    type: "text" | "hashtag" | "mention" | "url"
    value: string
  }> = []
  let last = 0
  for (const match of text.matchAll(regex)) {
    const idx = match.index ?? 0
    if (idx > last) parts.push({ type: "text", value: text.slice(last, idx) })
    const value = match[0]
    if (value.startsWith("#")) parts.push({ type: "hashtag", value })
    else if (value.startsWith("@")) parts.push({ type: "mention", value })
    else parts.push({ type: "url", value })
    last = idx + value.length
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) })
  return parts
}

const EDIT_WINDOW_MS = 5 * 60 * 1000

function pickVariant(media: NonNullable<Post["media"]>[number]) {
  return (
    media.variants.find((v) => v.kind === "medium") ??
    media.variants.find((v) => v.kind === "large") ??
    media.variants.find((v) => v.kind === "thumb") ??
    media.variants[0]
  )
}

function pickLargest(media: NonNullable<Post["media"]>[number]) {
  return (
    media.variants.find((v) => v.kind === "large") ??
    media.variants.find((v) => v.kind === "medium") ??
    media.variants.find((v) => v.kind === "thumb") ??
    media.variants[0]
  )
}

function ArticleCardBlock({
  card,
}: {
  card: NonNullable<Post["articleCard"]>
}) {
  if (!card.authorHandle) {
    return (
      <div className="mt-2 rounded-md border border-border p-3 text-sm">
        <h3 className="font-semibold">{card.title}</h3>
        {card.subtitle && (
          <p className="mt-1 text-muted-foreground">{card.subtitle}</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          article · {card.readingMinutes} min read
        </p>
      </div>
    )
  }
  return (
    <Link
      to="/$handle/a/$slug"
      params={{ handle: card.authorHandle, slug: card.slug }}
      className="mt-2 block rounded-md border border-border p-3 text-sm transition hover:bg-muted/40"
    >
      <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Article
      </div>
      <h3 className="mt-1 text-base leading-snug font-semibold">
        {card.title}
      </h3>
      {card.subtitle && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {card.subtitle}
        </p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        {card.readingMinutes} min read
        {card.publishedAt
          ? ` · ${new Date(card.publishedAt).toLocaleDateString()}`
          : ""}
      </p>
    </Link>
  )
}

function MediaGrid({ media }: { media: NonNullable<Post["media"]> }) {
  const cols = media.length === 1 ? "grid-cols-1" : "grid-cols-2"
  // Single gallery shared by all tiles — each cell opens the lightbox at its own index, so
  // ArrowLeft / ArrowRight cycle through every ready image in the post.
  const gallery = media.flatMap((m) => {
    if (m.processingState !== "ready") return []
    const full = pickLargest(m)
    return full ? [{ id: m.id, src: full.url, alt: m.altText ?? "" }] : []
  })
  return (
    <div className={`mt-2 grid gap-1 overflow-hidden rounded-md ${cols}`}>
      {media.map((m) => {
        const thumb = pickVariant(m)
        const aspect =
          m.width && m.height ? `${m.width} / ${m.height}` : undefined
        const isReady = m.processingState === "ready" && thumb
        const galleryIndex = gallery.findIndex((g) => g.id === m.id)
        return (
          <ImageLightbox
            key={m.id}
            images={gallery.map(({ src, alt }) => ({ src, alt }))}
            initialIndex={galleryIndex >= 0 ? galleryIndex : 0}
            disabled={!isReady || gallery.length === 0}
            className="block h-full w-full"
          >
            <div
              className="h-full w-full overflow-hidden bg-muted"
              style={aspect ? { aspectRatio: aspect } : undefined}
            >
              {isReady ? (
                <img
                  src={thumb.url}
                  alt={m.altText ?? ""}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  {m.processingState === "failed"
                    ? "media failed"
                    : "processing…"}
                </div>
              )}
            </div>
          </ImageLightbox>
        )
      })}
    </div>
  )
}

export function PostCard({
  post,
  onChange,
  onRemove,
}: {
  post: Post
  onChange?: (post: Post) => void
  onRemove?: (id: string) => void
}) {
  const { data: session } = authClient.useSession()
  const isOwner = Boolean(session?.user && session.user.id === post.author.id)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(post.text)
  const [editError, setEditError] = useState<string | null>(null)
  const authorHandle = post.author.handle
  const showProfileLink = Boolean(authorHandle)
  const showPostLink = Boolean(authorHandle)
  const canEdit =
    isOwner && Date.now() - new Date(post.createdAt).getTime() < EDIT_WINDOW_MS

  async function onDelete() {
    if (busy) return
    if (!confirm("Delete this post?")) return
    setBusy(true)
    try {
      await api.deletePost(post.id)
      onRemove?.(post.id)
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "delete failed")
    } finally {
      setBusy(false)
    }
  }

  async function saveEdit() {
    if (busy) return
    if (editText.trim().length === 0 || editText.length > POST_MAX_LEN) {
      setEditError("invalid length")
      return
    }
    if (editText === post.text) {
      setEditing(false)
      return
    }
    setBusy(true)
    setEditError(null)
    try {
      const { post: updated } = await api.editPost(post.id, editText)
      onChange?.(updated)
      setEditing(false)
    } catch (e) {
      setEditError(e instanceof ApiError ? e.message : "edit failed")
    } finally {
      setBusy(false)
    }
  }

  async function optimistic(next: Partial<Post>, op: () => Promise<unknown>) {
    if (!onChange) {
      try {
        await op()
      } catch {
        /* nothing to roll back */
      }
      return
    }
    const prev = post
    onChange({ ...post, ...next } as Post)
    setBusy(true)
    try {
      await op()
    } catch {
      onChange(prev)
    } finally {
      setBusy(false)
    }
  }

  function toggleLike() {
    if (busy || !post.viewer) return
    const liked = !post.viewer.liked
    optimistic(
      {
        counts: { ...post.counts, likes: post.counts.likes + (liked ? 1 : -1) },
        viewer: { ...post.viewer, liked },
      },
      () => (liked ? api.like(post.id) : api.unlike(post.id))
    )
  }
  function toggleBookmark() {
    if (busy || !post.viewer) return
    const bookmarked = !post.viewer.bookmarked
    optimistic(
      {
        counts: {
          ...post.counts,
          bookmarks: post.counts.bookmarks + (bookmarked ? 1 : -1),
        },
        viewer: { ...post.viewer, bookmarked },
      },
      () => (bookmarked ? api.bookmark(post.id) : api.unbookmark(post.id))
    )
  }
  function toggleRepost() {
    if (busy || !post.viewer) return
    const reposted = !post.viewer.reposted
    optimistic(
      {
        counts: {
          ...post.counts,
          reposts: post.counts.reposts + (reposted ? 1 : -1),
        },
        viewer: { ...post.viewer, reposted },
      },
      () => (reposted ? api.repost(post.id) : api.unrepost(post.id))
    )
  }

  const parts = linkifyText(post.text)
  const initial = (post.author.displayName ?? authorHandle ?? "·")
    .slice(0, 1)
    .toUpperCase()

  return (
    <article className="flex gap-3 border-b border-border px-4 py-4 transition-colors hover:bg-muted/20">
      <div className="shrink-0">
        {authorHandle ? (
          <Link to="/$handle" params={{ handle: authorHandle }}>
            <Avatar
              initial={initial}
              src={post.author.avatarUrl}
              className="size-10 text-sm ring-1 ring-border"
            />
          </Link>
        ) : (
          <Avatar
            initial={initial}
            src={post.author.avatarUrl}
            className="size-10 text-sm ring-1 ring-border"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <header className="flex items-center gap-2 text-sm">
          {showProfileLink && authorHandle ? (
            <Link
              to="/$handle"
              params={{ handle: authorHandle }}
              className="font-semibold text-foreground hover:underline"
            >
              {post.author.displayName || `@${authorHandle}`}
            </Link>
          ) : (
            <span className="font-semibold text-foreground">
              {post.author.displayName ?? "unknown"}
            </span>
          )}
          {authorHandle && (
            <span className="text-muted-foreground">@{authorHandle}</span>
          )}
          <span className="text-muted-foreground">·</span>
          {showPostLink && authorHandle ? (
            <Link
              to="/$handle/p/$id"
              params={{ handle: authorHandle, id: post.id }}
              className="text-muted-foreground hover:underline"
              title={post.createdAt}
            >
              <time dateTime={post.createdAt}>
                {relativeTime(post.createdAt)}
              </time>
            </Link>
          ) : (
            <time className="text-muted-foreground" dateTime={post.createdAt}>
              {relativeTime(post.createdAt)}
            </time>
          )}
          {post.editedAt && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="ml-auto size-5"
                    render={<IconDots size={8} />}
                  />
                }
              />
              <DropdownMenuContent align="end" sideOffset={4} className="w-40">
                {canEdit && (
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(true)
                      setEditText(post.text)
                    }}
                  >
                    <IconPencil size={14} stroke={1.75} />
                    <span>Edit</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={onDelete}
                  disabled={busy}
                >
                  <IconTrash size={14} stroke={1.75} />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>
        {editing ? (
          <div className="mt-1">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              className="w-full resize-none bg-transparent text-sm focus:outline-none"
              maxLength={POST_MAX_LEN}
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              <span
                className={
                  editText.length > POST_MAX_LEN
                    ? "text-destructive"
                    : "text-muted-foreground"
                }
              >
                {POST_MAX_LEN - editText.length}
              </span>
              <div className="flex items-center gap-2">
                {editError && (
                  <span className="text-destructive">{editError}</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(false)
                    setEditText(post.text)
                    setEditError(null)
                  }}
                >
                  cancel
                </Button>
                <Button size="sm" onClick={saveEdit} disabled={busy}>
                  save
                </Button>
              </div>
            </div>
          </div>
        ) : post.articleCard ? null : (
          <p className="mt-1 text-[15px] leading-relaxed break-words whitespace-pre-wrap">
            {parts.map((p, i) => {
              if (p.type === "text") return <span key={i}>{p.value}</span>
              if (p.type === "hashtag")
                return (
                  <Link
                    key={i}
                    to="/hashtag/$tag"
                    params={{ tag: p.value.slice(1) }}
                    className="text-primary hover:underline"
                  >
                    {p.value}
                  </Link>
                )
              if (p.type === "mention") {
                return (
                  <Link
                    key={i}
                    to="/$handle"
                    params={{ handle: p.value.slice(1) }}
                    className="text-primary hover:underline"
                  >
                    {p.value}
                  </Link>
                )
              }
              return (
                <a
                  key={i}
                  href={p.value}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-primary hover:underline"
                >
                  {p.value}
                </a>
              )
            })}
          </p>
        )}
        {post.articleCard && <ArticleCardBlock card={post.articleCard} />}
        {post.media && post.media.length > 0 && (
          <MediaGrid media={post.media} />
        )}
        <footer className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          {showPostLink && authorHandle && (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy || !post.viewer}
              className="flex items-center gap-2 transition hover:text-foreground"
              aria-pressed={post.viewer?.reposted}
              render={
                <Link
                  to="/$handle/p/$id"
                  params={{ handle: authorHandle, id: post.id }}
                  className="flex items-center gap-2 hover:text-foreground"
                >
                  <IconMessageCircle className="size-4" />
                  <span className="text-xs">{post.counts.replies}</span>
                </Link>
              }
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleRepost}
            disabled={busy || !post.viewer}
            className={`flex cursor-pointer items-center gap-2 transition hover:text-foreground ${post.viewer?.reposted ? "text-emerald-600" : ""}`}
            aria-pressed={post.viewer?.reposted}
          >
            <IconRepeat className="size-4" />
            <span className="text-xs">{post.counts.reposts}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLike}
            disabled={busy || !post.viewer}
            className={`flex cursor-pointer items-center gap-2 transition hover:text-foreground ${post.viewer?.liked ? "text-rose-600" : ""}`}
            aria-pressed={post.viewer?.liked}
          >
            {post.viewer?.liked ? (
              <IconHeartFilled className="size-4" />
            ) : (
              <IconHeart className="size-4" />
            )}
            <span className="text-xs">{post.counts.likes}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleBookmark}
            disabled={busy || !post.viewer}
            className={`flex cursor-pointer items-center gap-2 transition hover:text-foreground ${post.viewer?.bookmarked ? "text-sky-600" : ""}`}
            aria-pressed={post.viewer?.bookmarked}
          >
            {post.viewer?.bookmarked ? (
              <IconBookmarkFilled className="size-4" />
            ) : (
              <IconBookmark className="size-4" />
            )}
            <span className="text-xs">{post.counts.bookmarks}</span>
          </Button>
        </footer>
      </div>
    </article>
  )
}
