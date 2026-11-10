import { useEffect, useState } from "react"
import {
  Sidebar, SidebarBrand, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuLabel, SidebarProvider,
  Tooltip, TooltipContent, TooltipTrigger,
} from "@ir/ui"
import { navItems, newNavIds, type PageId } from "@/nav"
import { canOpen, useViewer } from "@/lib/viewer"
import { NewTag } from "../ExploringTag"

/**
 * The desktop navigation on Picasso's Sidebar: 256 expanded, and a 48 rail when
 * collapsed (the Clarion "C" in place of the wordmark, icon-only 32 squares,
 * labels, group label and "New" tags hidden). The toggle stays in the top bar.
 * Phones keep the existing full-screen nav (MobileNav) for now.
 */
export function ClarionSidebar({ collapsed, active, onNavigate, lastRefreshAt }: {
  collapsed: boolean
  active: PageId
  onNavigate: (id: PageId) => void
  /** epoch ms of the last stream refresh; ticks locally so the app doesn't re-render each second */
  lastRefreshAt: number
}) {
  const viewer = useViewer()
  const [secondsAgo, setSecondsAgo] = useState(0)
  useEffect(() => {
    const tick = () => setSecondsAgo(Math.max(0, Math.round((Date.now() - lastRefreshAt) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [lastRefreshAt])
  const streaming = secondsAgo === 0 ? "Streaming just now" : `Streaming ${secondsAgo}s ago`

  return (
    <SidebarProvider collapsed={collapsed} className="contents">
      <Sidebar className="h-full">
        <SidebarHeader variant="brand">
          <SidebarBrand image="/sidebar-header.jpg" subtitle="powered by Iris" mark="C">Clarion</SidebarBrand>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarMenu>
              {navItems.filter((n) => canOpen(n.id, viewer)).map(({ id, label, icon: Icon }) => {
                const button = (
                  <SidebarMenuButton active={id === active} onClick={() => onNavigate(id)} aria-label={collapsed ? label : undefined}>
                    <Icon aria-hidden />
                    <SidebarMenuLabel>{label}</SidebarMenuLabel>
                    {newNavIds.includes(id) && <SidebarMenuBadge><NewTag /></SidebarMenuBadge>}
                  </SidebarMenuButton>
                )
                return (
                  <SidebarMenuItem key={id}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="right">{label}{newNavIds.includes(id) ? " · New" : ""}</TooltipContent>
                      </Tooltip>
                    ) : button}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className={collapsed ? "items-center" : "px-4"}>
          <div className="flex items-center gap-2 p-2" role="status" aria-label={streaming} title={collapsed ? streaming : undefined}>
            <span className="size-3 shrink-0 rounded-full border border-line-neutral-subtle bg-status-healthy" aria-hidden />
            {!collapsed && <span className="truncate text-label-sm text-content-neutral-muted">{streaming}</span>}
          </div>
          {!collapsed && (
            <div className="flex items-start p-2">
              {/* IR logo, bottom-left (min 'i' height ≈20px per brand book) */}
              <img src="/ir-logo.png" alt="Integrated Research" className="h-9 w-auto dark:hidden" />
              <img src="/ir-logo-white.png" alt="Integrated Research" className="hidden h-9 w-auto dark:block" />
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}
