import { Link, createFileRoute } from "@tanstack/react-router"
import { useCallback, useMemo } from "react"
import { api } from "../lib/api"
import { qk } from "../lib/query-keys"
import { usePageHeader } from "../components/app-page-header"
import { PageFrame } from "../components/page-frame"
import { UserList } from "../components/user-list"
import type { AppPageHeaderSpec } from "../components/app-page-header"

export const Route = createFileRoute("/$handle/followers")({
  component: Followers,
})

function Followers() {
  const { handle } = Route.useParams()
  const listKey = useMemo(() => qk.userFollowers(handle), [handle])
  const load = useCallback(
    (cursor?: string) => api.followers(handle, cursor),
    [handle]
  )

  const appHeader = useMemo<AppPageHeaderSpec>(
    () => ({
      plainTitle: true,
      title: (
        <div className="flex w-full min-w-0 items-center gap-2">
          <Link
            to="/$handle"
            params={{ handle }}
            className="text-muted-foreground shrink-0 text-xs hover:underline"
          >
            ← @{handle}
          </Link>
          <h1 className="text-foreground truncate text-base leading-tight font-semibold">
            Followers
          </h1>
        </div>
      ),
    }),
    [handle]
  )
  usePageHeader(appHeader)

  return (
    <PageFrame>
      <UserList
        queryKey={listKey}
        load={load}
        emptyTitle="No followers yet"
        emptyMessage={`When someone follows @${handle}, they'll show up here.`}
      />
    </PageFrame>
  )
}
