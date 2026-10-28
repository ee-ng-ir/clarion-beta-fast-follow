import { useEffect, useState } from "react"
import {
  Building2, Cloud, ExternalLink, Flag, Layers, LogOut, Mail, Moon, ScrollText, Sun,
} from "lucide-react"
import {
  AppShell, AppShellContent, AppShellHeader, AppShellMain,
  Avatar, AvatarFallback, Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  Separator, Sidebar, SidebarBrand, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuLabel, SidebarProvider, SidebarTrigger,
  TooltipProvider,
} from "@ir/ui"
import consoleArt from "../../../packages/picasso/ui/brand-assets/Console.svg"
import { matchRoute, useLocation, type Route } from "@/lib/router"
import { CLARION_URL, CLIENT_CONSOLE_URL } from "@/lib/apps"
import { initials } from "@/lib/format"
import { OPERATOR, getTenant, useOps } from "@/data/store"
import { Link } from "@/components/ui"
import { Toaster } from "@/components/Toaster"
import { toast } from "@/lib/toast"
import { TenantsPage } from "@/pages/TenantsPage"
import { NewTenantPage } from "@/pages/NewTenantPage"
import { TenantPage } from "@/pages/TenantPage"
import { ProductPlansPage } from "@/pages/ProductPlansPage"
import { ServicesPage } from "@/pages/ServicesPage"
import { EmailActivityPage } from "@/pages/EmailActivityPage"
import { TofuModulesPage } from "@/pages/TofuModulesPage"
import { GlobalFlagsPage } from "@/pages/GlobalFlagsPage"
import { NotFoundPage } from "@/pages/NotFoundPage"

/**
 * IR Ops console — IR's internal provisioning portal (DevSecOps and IR
 * Support). Rebuilt from the live console at console.dev-abhra.ir.com in
 * Picasso: the same information architecture and features, on Picasso's app
 * shell, sidebar, tables and form controls.
 */
const nav = [
  {
    label: "Management",
    items: [
      { to: "/tenants", label: "Tenants", icon: Building2, match: ["tenants", "tenant", "tenant-new"] },
      { to: "/product-plans", label: "Product plans", icon: ScrollText, match: ["product-plans"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/services", label: "Services", icon: Cloud, match: ["services"] },
      { to: "/email-activity", label: "Email activity", icon: Mail, match: ["email-activity"] },
      { to: "/tofu-modules", label: "Tofu modules", icon: Layers, match: ["tofu-modules"] },
      { to: "/feature-flags", label: "Global feature flags", icon: Flag, match: ["feature-flags"] },
    ],
  },
]

function crumbs(route: Route): { label: string; to?: string }[] {
  switch (route.page) {
    case "tenants": return [{ label: "Management" }, { label: "Tenants" }]
    case "tenant-new": return [{ label: "Management" }, { label: "Tenants", to: "/tenants" }, { label: "New tenant" }]
    case "tenant": return [{ label: "Management" }, { label: "Tenants", to: "/tenants" }, { label: getTenant(route.id)?.name ?? "Unknown tenant" }]
    case "product-plans": return [{ label: "Management" }, { label: "Product plans" }]
    case "services": return [{ label: "Operations" }, { label: "Services" }]
    case "email-activity": return [{ label: "Operations" }, { label: "Email activity" }]
    case "tofu-modules": return [{ label: "Operations" }, { label: "Tofu modules" }]
    case "feature-flags": return [{ label: "Operations" }, { label: "Global feature flags" }]
    default: return [{ label: "Not found" }]
  }
}

const TITLES: Partial<Record<Route["page"], string>> = {
  tenants: "Tenants", "tenant-new": "New tenant", "product-plans": "Product plans", services: "Services",
  "email-activity": "Email activity", "tofu-modules": "Tofu modules", "feature-flags": "Global feature flags",
}

export function OpsApp() {
  const { path, query } = useLocation()
  const route = matchRoute(path)
  const tenantName = useOps((s) => (route.page === "tenant" ? s.tenants.find((t) => t.id === route.id)?.name : undefined))
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"))

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  useEffect(() => {
    const t = route.page === "tenant" ? tenantName : TITLES[route.page]
    document.title = t ? `${t} · IR Ops console` : "IR Ops console"
  }, [route.page, tenantName])

  // Lists and the services map run fluid; detail and settings pages cap at
  // Picasso's standard width; the one form caps at reading width.
  const width = route.page === "tenant-new" ? "reading" : route.page === "tenant" ? "standard" : "fluid"

  return (
    <TooltipProvider delayDuration={300}>
      <SidebarProvider className="h-svh">
        <AppShell>
          <Sidebar mobile="drawer" mobileLabel="Ops console navigation">
            <SidebarHeader variant="brand">
              <SidebarBrand image={consoleArt} subtitle="Provisioning portal" mark="C">Console</SidebarBrand>
            </SidebarHeader>
            <SidebarContent>
              {nav.map((group) => (
                <SidebarGroup key={group.label}>
                  <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const active = item.match.includes(route.page)
                      return (
                        <SidebarMenuItem key={item.to}>
                          <SidebarMenuButton asChild active={active}>
                            <Link to={item.to}>
                              <item.icon aria-hidden />
                              <SidebarMenuLabel>{item.label}</SidebarMenuLabel>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroup>
              ))}
            </SidebarContent>
            <SidebarFooter>
              <div className="flex items-center gap-2 px-2 pb-2">
                <img src="/ir-logo.png" alt="Integrated Research" className="h-7 w-auto dark:hidden" />
                <img src="/ir-logo-white.png" alt="Integrated Research" className="hidden h-7 w-auto dark:block" />
              </div>
            </SidebarFooter>
          </Sidebar>

          <AppShellMain>
            <AppShellHeader className="justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger />
                <Separator orientation="vertical" className="h-4" />
                <Breadcrumb className="min-w-0 whitespace-nowrap">
                  <BreadcrumbList>
                    {crumbs(route).map((c, i, all) => (
                      <BreadcrumbItem key={i} className={i < all.length - 1 ? "max-sm:hidden" : undefined}>
                        {i === all.length - 1 ? (
                          <BreadcrumbPage className="max-w-56 truncate">{c.label}</BreadcrumbPage>
                        ) : c.to ? (
                          <BreadcrumbLink asChild><Link to={c.to}>{c.label}</Link></BreadcrumbLink>
                        ) : (
                          <span className="text-body-sm text-content-neutral-muted">{c.label}</span>
                        )}
                      </BreadcrumbItem>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" aria-label={`Account: ${OPERATOR.name}`} className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-line-focused">
                      <Avatar size="sm"><AvatarFallback>{initials(OPERATOR.name)}</AvatarFallback></Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel>
                      <div className="text-label-md text-content-neutral-emphasis">{OPERATOR.name}</div>
                      <div className="text-body-xs text-content-neutral-muted">{OPERATOR.email} · IR DevSecOps</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setDark((d) => !d)}>
                      {dark ? <Sun aria-hidden /> : <Moon aria-hidden />} {dark ? "Light theme" : "Dark theme"}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild><a href={CLIENT_CONSOLE_URL}><ExternalLink aria-hidden /> Client console</a></DropdownMenuItem>
                    <DropdownMenuItem asChild><a href={CLARION_URL}><ExternalLink aria-hidden /> Clarion</a></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => toast({ title: "Signed out", description: "Prototype only — you're still here.", variant: "info" })}>
                      <LogOut aria-hidden /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </AppShellHeader>

            <AppShellContent width={width}>
              {route.page === "tenants" && <TenantsPage />}
              {route.page === "tenant-new" && <NewTenantPage />}
              {route.page === "tenant" && <TenantPage id={route.id} tab={query.get("tab")} />}
              {route.page === "product-plans" && <ProductPlansPage />}
              {route.page === "services" && <ServicesPage />}
              {route.page === "email-activity" && <EmailActivityPage />}
              {route.page === "tofu-modules" && <TofuModulesPage />}
              {route.page === "feature-flags" && <GlobalFlagsPage />}
              {route.page === "not-found" && <NotFoundPage />}
            </AppShellContent>
          </AppShellMain>
        </AppShell>
        <Toaster />
      </SidebarProvider>
    </TooltipProvider>
  )
}
