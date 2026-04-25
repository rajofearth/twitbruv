import { Link } from "@tanstack/react-router"
import { APP_NAME } from "../lib/env"

export function RightRail() {
  return (
    <aside className="hidden w-[320px] shrink-0 xl:block">
      <div className="sticky top-14 space-y-4 px-4 py-4">
        <section className="rounded-xl border border-border bg-card/40 p-4">
          <h2 className="text-sm font-semibold">Trending</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Trending hashtags arrive at M5. For now, try{" "}
            <Link to="/hashtag/$tag" params={{ tag: "twotter" }} className="text-primary hover:underline">
              #twotter
            </Link>
            .
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card/40 p-4">
          <h2 className="text-sm font-semibold">Open for everyone</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {APP_NAME} is free, open-source, and has no AI ranking. See{" "}
            <Link to="/search" className="text-primary hover:underline">
              search
            </Link>{" "}
            to find people.
          </p>
        </section>
      </div>
    </aside>
  )
}
