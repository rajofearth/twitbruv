import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { updateProfileSchema } from "@workspace/validators"
import { ApiError, api } from "../lib/api"
import { authClient } from "../lib/auth"
import { useMe } from "../lib/me"
import { ClaimHandle } from "../components/claim-handle"
import { AvatarUpload } from "../components/avatar-upload"
import { BannerUpload } from "../components/banner-upload"

export const Route = createFileRoute("/settings")({ component: Settings })

function Settings() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const { me, setMe } = useMe()
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [location, setLocation] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    if (isPending) return
    if (!session) router.navigate({ to: "/login" })
  }, [isPending, session, router])

  useEffect(() => {
    if (!me) return
    setDisplayName(me.displayName ?? "")
    setBio(me.bio ?? "")
    setLocation(me.location ?? "")
    setWebsiteUrl(me.websiteUrl ?? "")
  }, [me])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)
    const parsed = updateProfileSchema.safeParse({
      displayName,
      bio,
      location,
      websiteUrl,
    })
    if (!parsed.success) {
      setStatus(parsed.error.issues[0]?.message ?? "invalid")
      return
    }
    try {
      const { user } = await api.updateMe(parsed.data)
      setMe(user)
      setStatus("saved")
    } catch (e) {
      setStatus(e instanceof ApiError ? e.message : "save failed")
    }
  }

  async function updateMedia(patch: {
    avatarUrl?: string | null
    bannerUrl?: string | null
  }) {
    try {
      // api.updateMe accepts empty string to clear; null gets normalized to empty.
      const { user } = await api.updateMe({
        ...(patch.avatarUrl !== undefined
          ? { avatarUrl: patch.avatarUrl ?? "" }
          : {}),
        ...(patch.bannerUrl !== undefined
          ? { bannerUrl: patch.bannerUrl ?? "" }
          : {}),
      })
      setMe(user)
    } catch (e) {
      setStatus(e instanceof ApiError ? e.message : "update failed")
    }
  }

  if (isPending || !me) {
    return (
      <main className="mx-auto max-w-xl px-4 py-8">
        <p className="text-sm text-muted-foreground">loading…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto space-y-8 px-4 py-8">
      <header>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {me.handle ? `@${me.handle}` : "no handle yet"} ·{" "}
          {me.emailVerified ? "email verified" : "email unverified"}
        </p>
      </header>

      {!me.handle && (
        <ClaimHandle onClaimed={(h) => setMe({ ...me, handle: h })} />
      )}

      <section className="space-y-6">
        <h2 className="text-sm font-semibold">Profile media</h2>
        <BannerUpload
          currentUrl={me.bannerUrl}
          onChange={(url) => updateMedia({ bannerUrl: url })}
        />
        <AvatarUpload
          currentUrl={me.avatarUrl}
          displayName={me.displayName ?? me.handle}
          onChange={(url) => updateMedia({ avatarUrl: url })}
        />
      </section>

      <form onSubmit={onSave} className="space-y-3">
        <h2 className="text-sm font-semibold">Profile details</h2>
        <div className="space-y-1">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="bio">Bio</Label>
          <Input
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="websiteUrl">Website</Label>
          <Input
            id="websiteUrl"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://"
          />
        </div>
        {status && <p className="text-xs text-muted-foreground">{status}</p>}
        <Button type="submit">Save</Button>
      </form>
    </main>
  )
}
