import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { signUpSchema } from "@workspace/validators"
import { authClient } from "../lib/auth"
import { api } from "../lib/api"

export const Route = createFileRoute("/signup")({ component: SignUp })

function SignUp() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [handle, setHandle] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = signUpSchema.safeParse({
      email,
      password,
      handle,
      displayName,
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input")
      return
    }
    setLoading(true)
    try {
      const { error: err } = await authClient.signUp.email({
        email,
        password,
        name: displayName || handle,
        callbackURL: `${window.location.origin}/?verified=1`,
      })
      if (err) throw new Error(err.message ?? "Sign up failed")
      await api.claimHandle(handle).catch(() => {})
      router.navigate({ to: "/", search: { settings_tab: "profile" } })
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Sign up failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-lg items-center px-4 py-10">
      <Card className="w-full">
        <Card.Header className="flex flex-col gap-2 px-5 pt-5 pb-4">
          <h1 className="text-xl font-semibold tracking-tight text-primary">
            Create an account
          </h1>
          <p className="text-sm leading-6 text-tertiary">
            Free, no ads. Verify your email before you post.
          </p>
        </Card.Header>
        <Card.Content className="flex flex-col gap-5 px-5 pb-5">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="handle">Handle</Label>
                <Input
                  id="handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="yourhandle"
                  autoComplete="username"
                  className="h-10"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className="h-10"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="h-10"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={10}
                autoComplete="new-password"
                className="h-10"
                required
              />
              <p className="text-muted-foreground text-sm">
                At least 10 characters.
              </p>
            </div>
            <Button
              type="submit"
              className="mt-1 h-10 w-full"
              variant="primary"
              disabled={loading}
              size="md"
            >
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
          <p className="text-muted-foreground text-center text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </Card.Content>
      </Card>
    </div>
  )
}
