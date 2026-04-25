import { Outlet, createFileRoute } from "@tanstack/react-router"
import { PageFrame } from "../components/page-frame"

// Parent layout for all /$handle/... routes. Static routes (/login, /settings, /hashtag/:tag)
// take precedence via TanStack Router's static-before-dynamic matcher; reserved handles
// are enforced on the API side at claim time so collisions can't happen going forward.
export const Route = createFileRoute("/$handle")({ component: HandleLayout })

function HandleLayout() {
  return (
    <PageFrame>
      <Outlet />
    </PageFrame>
  )
}
