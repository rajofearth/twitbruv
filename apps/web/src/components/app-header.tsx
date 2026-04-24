import { SidebarTrigger } from "@workspace/ui/components/sidebar"

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-sm">
      <SidebarTrigger />
    </header>
  )
}
