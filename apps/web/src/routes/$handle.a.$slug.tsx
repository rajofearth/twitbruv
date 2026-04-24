import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { api, ApiError, type ArticleDto } from "../lib/api"
import { Editor } from "../components/editor/editor"
import { authClient } from "../lib/auth"
import { Button } from "@workspace/ui/components/button"

export const Route = createFileRoute("/$handle/a/$slug")({ component: ArticleView })

function ArticleView() {
  const { handle, slug } = Route.useParams()
  const { data: session } = authClient.useSession()
  const [article, setArticle] = useState<ArticleDto | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setArticle(null)
    setError(null)
    api
      .userArticleBySlug(handle, slug)
      .then(({ article }) => setArticle(article))
      .catch((e) => setError(e instanceof ApiError ? e.message : "not found"))
  }, [handle, slug])

  if (error) {
    return (
      <main className="px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">article not found</p>
      </main>
    )
  }
  if (!article) {
    return (
      <main className="px-4 py-16">
        <p className="text-sm text-muted-foreground">loading…</p>
      </main>
    )
  }

  const isOwner = Boolean(session?.user && session.user.id === article.author.id)

  return (
    <main className="">
      <header className="border-b border-border px-4 py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{article.title}</h1>
            {article.subtitle && (
              <p className="mt-2 text-base text-muted-foreground">{article.subtitle}</p>
            )}
          </div>
          {isOwner && (
            <Link to="/articles/$id/edit" params={{ id: article.id }}>
              <Button size="sm" variant="outline">
                edit
              </Button>
            </Link>
          )}
        </div>
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          {article.author.handle && (
            <Link
              to="/$handle"
              params={{ handle: article.author.handle }}
              className="font-medium text-foreground hover:underline"
            >
              {article.author.displayName || `@${article.author.handle}`}
            </Link>
          )}
          <span>·</span>
          {article.publishedAt && (
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleDateString()}
            </time>
          )}
          <span>·</span>
          <span>{article.readingMinutes} min read</span>
          {article.editedAt && article.publishedAt && article.editedAt > article.publishedAt && (
            <>
              <span>·</span>
              <span>updated</span>
            </>
          )}
        </div>
      </header>
      <Editor initialStateJson={article.bodyJson ?? null} readOnly />
    </main>
  )
}
