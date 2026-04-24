import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router"

import appCss from "@workspace/ui/globals.css?url"
import { AppShell } from "../components/app-shell"
import { ThemeProvider, themeBootstrapScript } from "../lib/theme"
import { MeProvider } from "../lib/me"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "twotter" },
      {
        name: "description",
        content: "Open-source, free-for-everyone social platform.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    scripts: [{ children: themeBootstrapScript }],
  }),
  notFoundComponent: () => (
    <AppShell>
      <main className="mx-auto max-w-3xl p-4 pt-16">
        <h1 className="text-lg font-semibold">404</h1>
        <p className="text-sm text-muted-foreground">
          The requested page could not be found.
        </p>
      </main>
    </AppShell>
  ),
  shellComponent: RootDocument,
  component: () => (
    <ThemeProvider>
      <MeProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </MeProvider>
    </ThemeProvider>
  ),
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
