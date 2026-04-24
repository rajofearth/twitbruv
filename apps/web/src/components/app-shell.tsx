import { Link } from "@tanstack/react-router"
import {
  IconBookmark,
  IconHome,
  IconLogin,
  IconPencil,
  IconSearch,
  IconSettings,
  IconUser,
  IconUserPlus,
} from "@tabler/icons-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@workspace/ui/components/sidebar"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { authClient } from "../lib/auth"
import { useMe } from "../lib/me"
import { AppHeader } from "./app-header"
import { UserNav } from "./user-nav"
import { ComposeFab } from "./compose-fab"
import type { ReactNode } from "react"

export function AppShell({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession()
  const { me } = useMe()

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                t
              </div>
              <span className="text-base font-semibold group-data-[collapsible=icon]:hidden">
                twotter
              </span>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      size="default"
                      tooltip="home"
                      render={
                        <Link to="/">
                          <IconHome />
                          <span>Home</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      size="default"
                      tooltip="search"
                      render={
                        <Link to="/search">
                          <IconSearch />
                          <span>Search</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                  {session && (
                    <>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          size="default"
                          tooltip="bookmarks"
                          render={
                            <Link to="/bookmarks">
                              <IconBookmark />
                              <span>Bookmarks</span>
                            </Link>
                          }
                        />
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          size="default"
                          tooltip="write article"
                          render={
                            <Link to="/articles/new">
                              <IconPencil />
                              <span>Write Article</span>
                            </Link>
                          }
                        />
                      </SidebarMenuItem>
                      {me?.handle && (
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            size="default"
                            tooltip="profile"
                            render={
                              <Link
                                to="/$handle"
                                params={{ handle: me.handle }}
                              >
                                <IconUser />
                                <span>Profile</span>
                              </Link>
                            }
                          />
                        </SidebarMenuItem>
                      )}
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          size="default"
                          tooltip="settings"
                          render={
                            <Link to="/settings">
                              <IconSettings />
                              <span>Settings</span>
                            </Link>
                          }
                        />
                      </SidebarMenuItem>
                    </>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            {!isPending && session && me && (
              <SidebarMenu>
                <SidebarMenuItem>
                  <UserNav user={me} />
                </SidebarMenuItem>
              </SidebarMenu>
            )}
            {!isPending && !session && (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="default"
                    tooltip="sign in"
                    render={<Link to="/login" />}
                  >
                    <IconLogin />
                    <span>Sign in</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="default"
                    tooltip="sign up"
                    render={<Link to="/signup" />}
                  >
                    <IconUserPlus />
                    <span>Sign up</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <AppHeader />
          <div className="flex flex-1 justify-center">
            <main className="w-full flex-1 border-border md:max-w-[640px] md:border-x">
              {children}
            </main>
            {/* <RightRail /> */}
          </div>
          {session && <ComposeFab />}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
