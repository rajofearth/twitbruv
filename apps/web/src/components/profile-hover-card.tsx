import { Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Avatar } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { PreviewCard } from "@workspace/ui/components/preview-card"
import { api, type PublicProfile } from "../lib/api"
import { qk } from "../lib/query-keys"
import { useMe } from "../lib/me"
import { VerifiedBadge } from "./verified-badge"
import type { ReactNode } from "react"

interface ProfileHoverCardProps {
  handle: string
  children: ReactNode
}

export function ProfileHoverCard({ handle, children }: ProfileHoverCardProps) {
  const doc = typeof document !== "undefined" ? document : undefined

  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger render={<div className="inline" />}>
        {children}
      </PreviewCard.Trigger>
      <PreviewCard.Content
        side="bottom"
        align="start"
        sideOffset={8}
        collisionBoundary={doc?.documentElement}
        positionMethod="fixed"
      >
        <ProfileCardInner handle={handle} />
      </PreviewCard.Content>
    </PreviewCard.Root>
  )
}

function ProfileCardInner({ handle }: { handle: string }) {
  const { me } = useMe()
  const { data: profile, error, isPending } = useQuery({
    queryKey: qk.user(handle),
    queryFn: async (): Promise<PublicProfile> => (await api.user(handle)).user,
    staleTime: 60_000,
  })

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="border-t-primary size-5 animate-spin rounded-full border-2 border-neutral" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="p-4 text-sm text-secondary">Could not load this profile.</div>
    )
  }

  const isSelf = me?.id === profile.id
  const initial = (profile.displayName ?? profile.handle ?? "?")
    .slice(0, 1)
    .toUpperCase()
  const viewer = profile.viewer
  const hasFollowState = typeof viewer?.following === "boolean"
  const isFollowing = viewer?.following === true

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        <Link to="/$handle" params={{ handle }}>
          <Avatar
            initial={initial}
            src={profile.avatarUrl}
            size="xl"
            className="ring-1 ring-neutral"
          />
        </Link>
        {!isSelf && hasFollowState && (
          <Button
            size="sm"
            variant={isFollowing ? "outline" : "primary"}
            onClick={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              if (isFollowing) await api.unfollow(handle)
              else await api.follow(handle)
            }}
          >
            {isFollowing ? "Following" : "Follow"}
          </Button>
        )}
      </div>
      <div className="min-w-0">
        <Link
          to="/$handle"
          params={{ handle }}
          className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {profile.displayName || `@${handle}`}
          {profile.isVerified && (
            <VerifiedBadge size={14} role={profile.role} />
          )}
        </Link>
        <span className="text-xs text-tertiary">@{handle}</span>
      </div>
      {profile.bio && (
        <p className="line-clamp-3 text-sm leading-relaxed text-primary">
          {profile.bio}
        </p>
      )}
      <div className="flex gap-3 text-xs">
        <Link
          to="/$handle/following"
          params={{ handle }}
          className="hover:underline"
        >
          <span className="font-semibold text-primary">
            {formatCount(profile.counts.following)}
          </span>{" "}
          <span className="text-tertiary">Following</span>
        </Link>
        <Link
          to="/$handle/followers"
          params={{ handle }}
          className="hover:underline"
        >
          <span className="font-semibold text-primary">
            {formatCount(profile.counts.followers)}
          </span>{" "}
          <span className="text-tertiary">Followers</span>
        </Link>
      </div>
    </div>
  )
}

function formatCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000)
    return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}K`
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
}
