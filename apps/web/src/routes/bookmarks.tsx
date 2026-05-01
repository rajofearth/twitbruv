import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useCallback, useEffect, useMemo } from "react"
import { BookmarkIcon } from "@heroicons/react/24/solid"
import { api } from "../lib/api"
import { qk } from "../lib/query-keys"
import { authClient } from "../lib/auth"
import { usePageHeader } from "../components/app-page-header"
import { Feed } from "../components/feed"
import { PageEmpty } from "../components/page-surface"
import { PageFrame } from "../components/page-frame"

export const Route = createFileRoute("/bookmarks")({ component: Bookmarks })

function Bookmarks() {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  useEffect(() => {
    if (!isPending && !session) router.navigate({ to: "/login" })
  }, [isPending, session, router])

  const load = useCallback((cursor?: string) => api.bookmarks(cursor), [])

  const appHeader = useMemo(
    () => ({
      title: "Bookmarks" as const,
    }),
    []
  )
  usePageHeader(appHeader)

  return (
    <PageFrame>
      <Feed
        queryKey={qk.bookmarks()}
        load={load}
        emptyState={
          <PageEmpty
            icon={<BookmarkIcon />}
            title="No bookmarks yet"
            description="Tap the bookmark icon on any post to save it for later. They'll all live here, only visible to you."
          />
        }
      />
    </PageFrame>
  )
}
