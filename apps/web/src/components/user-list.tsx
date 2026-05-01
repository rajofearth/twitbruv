import { Link } from "@tanstack/react-router"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useWindowVirtualizer } from "@tanstack/react-virtual"
import { UsersIcon } from "@heroicons/react/24/solid"
import { useInfiniteScrollSentinel } from "../lib/use-infinite-scroll-sentinel"
import { PageEmpty } from "./page-surface"
import { VerifiedBadge } from "./verified-badge"
import type { InfiniteData } from "@tanstack/react-query"
import type { PublicUser, UserListPage } from "../lib/api"

const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect

const ESTIMATED_ROW_HEIGHT = 76
const ESTIMATED_BIO_BUMP = 32

function estimateRowHeight(user: PublicUser | undefined): number {
  if (!user) return ESTIMATED_ROW_HEIGHT
  return user.bio
    ? ESTIMATED_ROW_HEIGHT + ESTIMATED_BIO_BUMP
    : ESTIMATED_ROW_HEIGHT
}

export function UserList({
  queryKey,
  load,
  emptyMessage = "No users yet.",
  emptyTitle = "No one here yet",
  emptyIcon,
  emptyActions,
}: {
  queryKey: ReadonlyArray<unknown>
  load: (cursor?: string) => Promise<UserListPage>
  emptyMessage?: string
  emptyTitle?: string
  emptyIcon?: React.ReactNode
  emptyActions?: React.ReactNode
}) {
  const {
    data,
    error,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<
    UserListPage,
    Error,
    InfiniteData<UserListPage, string | undefined>,
    ReadonlyArray<unknown>,
    string | undefined
  >({
    queryKey,
    queryFn: ({ pageParam }) => load(pageParam),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

  const users = useMemo(() => data?.pages.flatMap((p) => p.users) ?? [], [data])

  const visibleUsers = useMemo(
    () => users.filter((u): u is PublicUser & { handle: string } => !!u.handle),
    [users]
  )

  const wrapperRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  useIsoLayoutEffect(() => {
    const node = wrapperRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    setScrollMargin(rect.top + window.scrollY)
  }, [visibleUsers.length === 0])

  const virtualizer = useWindowVirtualizer({
    count: visibleUsers.length,
    estimateSize: (i) => estimateRowHeight(visibleUsers[i]),
    overscan: 6,
    scrollMargin,
    getItemKey: (i) => visibleUsers[i].id,
  })

  useInfiniteScrollSentinel(
    sentinelRef,
    !!hasNextPage,
    isFetchingNextPage,
    () => fetchNextPage()
  )

  if (isPending)
    return (
      <div className="text-muted-foreground px-4 py-6 text-sm">loading…</div>
    )
  if (error)
    return (
      <div className="text-destructive px-4 py-6 text-sm">{error.message}</div>
    )
  if (visibleUsers.length === 0)
    return (
      <PageEmpty
        title={emptyTitle}
        description={emptyMessage}
        icon={emptyIcon ?? <UsersIcon />}
        actions={emptyActions}
      />
    )

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  return (
    <div>
      <div
        ref={wrapperRef}
        style={{
          height: totalSize,
          position: "relative",
          width: "100%",
        }}
      >
        {virtualItems.map((vi) => {
          const u = visibleUsers[vi.index]
          return (
            <div
              key={vi.key}
              ref={virtualizer.measureElement}
              data-index={vi.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${vi.start - scrollMargin}px)`,
              }}
            >
              <Link
                to="/$handle"
                params={{ handle: u.handle }}
                className="border-border hover:bg-muted/40 block border-b px-4 py-3"
              >
                <div className="flex items-center gap-1 text-sm font-medium">
                  <span className="truncate">
                    {u.displayName || `@${u.handle}`}
                  </span>
                  {u.isVerified && <VerifiedBadge size={14} role={u.role} />}
                </div>
                <div className="text-muted-foreground text-xs">@{u.handle}</div>
                {u.bio && (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                    {u.bio}
                  </p>
                )}
              </Link>
            </div>
          )
        })}
      </div>
      <div ref={sentinelRef} aria-hidden className="h-px" />
      {hasNextPage && (
        <div className="text-muted-foreground flex justify-center py-4 text-xs">
          {isFetchingNextPage ? "loading…" : ""}
        </div>
      )}
    </div>
  )
}
