import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useMemo } from "react"
import { HashtagIcon } from "@heroicons/react/24/solid"
import { api } from "../lib/api"
import { qk } from "../lib/query-keys"
import { usePageHeader } from "../components/app-page-header"
import { Feed } from "../components/feed"
import { PageEmpty } from "../components/page-surface"
import { PageFrame } from "../components/page-frame"
import { APP_NAME } from "../lib/env"
import { buildSeoMeta, canonicalLink } from "../lib/seo"
import type { AppPageHeaderSpec } from "../components/app-page-header"

export const Route = createFileRoute("/hashtag/$tag")({
  component: HashtagPage,
  head: ({ params }) => {
    const tag = params.tag.replace(/^#/, "")
    const path = `/hashtag/${tag}`
    return {
      meta: buildSeoMeta({
        title: `#${tag}`,
        description: `Public posts tagged #${tag} on ${APP_NAME}.`,
        path,
      }),
      links: [canonicalLink(path)],
    }
  },
})

function HashtagPage() {
  const { tag } = Route.useParams()
  const feedKey = useMemo(() => qk.hashtag(tag), [tag])
  const load = useCallback((cursor?: string) => api.hashtag(tag, cursor), [tag])

  const appHeader = useMemo<AppPageHeaderSpec>(
    () => ({
      plainTitle: true,
      title: (
        <div className="flex w-full min-w-0 flex-col">
          <h1 className="text-foreground truncate text-base leading-tight font-semibold">
            #{tag}
          </h1>
          <p className="text-muted-foreground text-xs">
            public posts with this hashtag
          </p>
        </div>
      ),
    }),
    [tag]
  )
  usePageHeader(appHeader)

  return (
    <PageFrame>
      <Feed
        queryKey={feedKey}
        load={load}
        emptyState={
          <PageEmpty
            icon={<HashtagIcon />}
            title={`Nothing tagged #${tag}`}
            description="Be the first to post with this hashtag and start the conversation."
          />
        }
      />
    </PageFrame>
  )
}
