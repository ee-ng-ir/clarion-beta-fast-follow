import { useEffect } from "react"
import { ExternalLink, Moon, Power } from "lucide-react"
import {
  AppShell, AppShellContent, AppShellHeader, AppShellMain,
  Avatar, AvatarFallback,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage,
  Button,
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
  PageHeader, SidebarProvider, SidebarTrigger, Separator, Switch,
} from "@ir/ui"
import { tenant } from "@ir/mock-data/tenant"
import { access, initials, ME } from "@ir/mock-data/access"
import { isProduct, isProposal, pageLabel, pageSubtitle, type PageId, type UserTab } from "@/nav"
import { CLARION_URL } from "@/lib/apps"
import { toast } from "@/components/ui/toast"
import { AdminSidebar } from "@/components/dashboard/AdminSidebar"
import { AdminToaster } from "@/components/admin/AdminToaster"
import { HomePage } from "@/pages/HomePage"
import { AccountPage } from "@/pages/AccountPage"
import { UserManagementPage } from "@/pages/UserManagementPage"
import { ResourceCentrePage } from "@/pages/ResourceCentrePage"
import { BillingPage } from "@/pages/BillingPage"
import { ClarionSpacePage } from "@/pages/ClarionSpacePage"
import { UsersRolesPage } from "@/pages/UsersRolesPage"
import { WidgetUsersPage } from "@/pages/WidgetUsersPage"
import { GroupsPage } from "@/pages/GroupsPage"
import { LocationsPage } from "@/pages/LocationsPage"
import { RolesPage } from "@/pages/RolesPage"
import { SsoPage } from "@/pages/SsoPage"
import { RbacDocPage, GroupsDocPage, BillingDocPage } from "@/pages/AdminDocs"

/**
 * The Iris admin portal shell, built from Picasso: Sidebar, AppShell,
 * Breadcrumb, PageHeader. Layout and content follow the live portal.
 */
export function AdminApp({
  page,
  userTab,
  onNavigate,
  dark,
  onToggleTheme,
}: {
  page: PageId
  userTab: UserTab
  onNavigate: (id: PageId, tab?: UserTab) => void
  dark: boolean
  onToggleTheme: () => void
}) {
  // Picasso's tokens and type scale. Set on <html> so Radix portals
  // (menus, dialogs, toasts) get them too.
  useEffect(() => {
    document.documentElement.setAttribute("data-picasso", "")
    return () => document.documentElement.removeAttribute("data-picasso")
  }, [])

  useEffect(() => { document.title = `Iris Admin – ${pageLabel(page)}` }, [page])

  const middle = isProduct(page) ? "Products" : isProposal(page) ? "Proposals" : null

  return (
    <SidebarProvider className="h-screen">
      <AppShell>
        <AdminSidebar active={page} onNavigate={(id) => onNavigate(id)} />

        <AppShellMain>
          <AppShellHeader className="justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/" onClick={(e) => { e.preventDefault(); onNavigate("home") }}>{tenant.name}</BreadcrumbLink>
                  </BreadcrumbItem>
                  {middle && <BreadcrumbItem><BreadcrumbPage className="text-content-neutral-subtle">{middle}</BreadcrumbPage></BreadcrumbItem>}
                  <BreadcrumbItem><BreadcrumbPage>{pageLabel(page)}</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            {/* The bar holds trigger, breadcrumb and account only (Picasso app shell). */}
            <AccountMenu dark={dark} onToggleTheme={onToggleTheme} />
          </AppShellHeader>

          <AppShellContent width="standard">
            <div className="flex flex-col gap-gutter">
              <PageHeader title={pageLabel(page)} description={pageSubtitle[page]} />

              {/* As built — the live portal */}
              {page === "home" && <HomePage onNavigate={onNavigate} />}
              {page === "account" && <AccountPage />}
              {page === "usermgmt" && <UserManagementPage tab={userTab} onTabChange={(t) => onNavigate("usermgmt", t)} />}
              {page === "resources" && <ResourceCentrePage />}
              {page === "billing" && <BillingPage />}
              {page === "clarion" && <ClarionSpacePage onNavigate={onNavigate} />}

              {/* Proposals */}
              {page === "users" && <UsersRolesPage />}
              {page === "widgetusers" && <WidgetUsersPage />}
              {page === "groups" && <GroupsPage />}
              {page === "locations" && <LocationsPage onOpenWidgetUsers={() => onNavigate("widgetusers")} />}
              {page === "roles" && <RolesPage />}
              {page === "sso" && <SsoPage />}
              {page === "rbacdoc" && <RbacDocPage />}
              {page === "groupsdoc" && <GroupsDocPage />}
              {page === "billingdoc" && <BillingDocPage />}
            </div>
          </AppShellContent>
        </AppShellMain>
      </AppShell>

      <AdminToaster />
    </SidebarProvider>
  )
}

/** Top-right account menu: the product, then account settings and Sign out. */
function AccountMenu({ dark, onToggleTheme }: { dark: boolean; onToggleTheme: () => void }) {
  const me = access.people().find((p) => p.id === ME)
  const name = me?.name ?? "Account"
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 ps-1">
          <Avatar size="xs"><AvatarFallback>{initials(name)}</AvatarFallback></Avatar>
          <span className="text-label-md">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Clarion</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => window.open(CLARION_URL, "_blank", "noopener")}>
            <ExternalLink /> Fleet dashboard
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onToggleTheme() }}>
            <Moon /> <span className="flex-1">Dark theme</span>
            <Switch size="sm" checked={dark} tabIndex={-1} aria-hidden />
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toast({ title: "Signed out (prototype)", variant: "info" })}>
            <Power /> Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
