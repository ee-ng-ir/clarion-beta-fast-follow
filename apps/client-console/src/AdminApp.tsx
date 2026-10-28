import { useEffect } from "react"
import { PanelLeft, ChevronRight, Sun, Moon, RadioTower, CreditCard, ScrollText } from "lucide-react"
import { pageLabel, pageSubtitle, type PageId, type Experience } from "@/nav"
import { AdminSidebar } from "@/components/dashboard/AdminSidebar"
import { ExperienceMenu } from "@/components/dashboard/ExperienceMenu"
import { UsersRolesPage } from "@/pages/UsersRolesPage"
import { WidgetUsersPage } from "@/pages/WidgetUsersPage"
import { GroupsPage } from "@/pages/GroupsPage"
import { LocationsPage } from "@/pages/LocationsPage"
import { RolesPage } from "@/pages/RolesPage"
import { SsoPage } from "@/pages/SsoPage"
import { PlaceholderPage } from "@/pages/PlaceholderPage"
import { RbacDocPage, GroupsDocPage, BillingDocPage } from "@/pages/AdminDocs"
import { AppShellContent, PageHeader } from "@ir/ui"
import { AdminToaster } from "@/components/admin/AdminToaster"

/** The mock tenant (matches @ir/mock-data and the Clarion app). */
const TENANT_NAME = "Acme Contact Centre"

/**
 * The Administration experience shell. Lives in the same repo as the Fleet app
 * and shares the design system, but has its own sidebar + chrome. Reached via
 * the top-right account menu; admin routes are under /admin/*.
 */
export function AdminApp({
  page,
  onNavigate,
  dark,
  onToggleTheme,
  sidebarOpen,
  onToggleSidebar,
  onSwitchExperience,
}: {
  page: PageId
  onNavigate: (id: PageId) => void
  dark: boolean
  onToggleTheme: () => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onSwitchExperience: (e: Experience) => void
}) {
  // Picasso's tokens and type scale apply while the Administration experience
  // is mounted. Set on <html> so Radix portals (menus, dialogs, toasts) get it too.
  useEffect(() => {
    document.documentElement.setAttribute("data-picasso", "")
    return () => document.documentElement.removeAttribute("data-picasso")
  }, [])

  return (
    <div className="flex h-screen w-full items-start overflow-hidden" style={{ background: "var(--bg-app)" }}>
      {sidebarOpen && <AdminSidebar active={page} onNavigate={onNavigate} />}

      <div
        className="flex h-full min-w-px flex-1 flex-col overflow-hidden"
        style={{ borderLeft: "1px solid var(--border-neutral-muted)", borderRight: "1px solid var(--border-neutral-muted)" }}
      >
        {/* top chrome */}
        <header className="flex h-16 items-center justify-between px-4" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Toggle sidebar"
              onClick={onToggleSidebar}
              className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
              style={{ color: "var(--fg-neutral-muted)" }}
            >
              <PanelLeft className="size-4" />
            </button>
            <span className="mx-1 h-4 w-px" style={{ background: "var(--border-neutral-muted)" }} />
            <nav className="flex items-center gap-2.5 text-sm">
              <span style={{ color: "var(--fg-neutral-muted)" }}>{TENANT_NAME}</span>
              <ChevronRight className="size-4" style={{ color: "var(--fg-neutral-subtle)" }} />
              <span style={{ color: "var(--fg-neutral-muted)" }}>Administration</span>
              <ChevronRight className="size-4" style={{ color: "var(--fg-neutral-subtle)" }} />
              <span style={{ color: "var(--fg-neutral-emphasis)" }}>{pageLabel(page)}</span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Toggle theme"
              onClick={onToggleTheme}
              className="flex size-8 shrink-0 items-center justify-center rounded-full transition-colors"
              style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle)")}
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <ExperienceMenu experience="admin" onSwitch={onSwitchExperience} />
          </div>
        </header>

        {/* Content — Picasso's AppShellContent: p-gutter padding and the
            "standard" width (max 1280, left-aligned to the rail) that Picasso
            sets for settings and mixed pages. The title sits in the same
            column so its start lines up with the cards below. */}
        <AppShellContent width="standard">
          <div className="flex flex-col gap-gutter">
          <PageHeader title={pageLabel(page)} description={pageSubtitle[page]} />
          {page === "users" && <UsersRolesPage />}
          {page === "widgetusers" && <WidgetUsersPage />}
          {page === "groups" && <GroupsPage />}
          {page === "locations" && <LocationsPage onOpenWidgetUsers={() => onNavigate("widgetusers")} />}
          {page === "roles" && <RolesPage />}
          {page === "widgets" && (
            <PlaceholderPage title="Device management" icon={RadioTower} description="Register agents and generate auth tokens, assign unassigned Widgets to Groups, revoke compromised tokens, and review status and last-seen. A Widget becomes a Device once it's set up and reporting telemetry." />
          )}
          {page === "sso" && <SsoPage />}
          {page === "subscription" && (
            <PlaceholderPage title="Subscription & billing" icon={CreditCard} description="See what's included in your tier and track seat usage. Plan changes, add-ons, invoices and payment arrive for 1.0." />
          )}
          {page === "audit" && (
            <PlaceholderPage title="Audit log" icon={ScrollText} description="Search and filter a record of who changed what, and when — across Members, Groups, Widgets and settings." />
          )}
          {/* Administration docs (RBAC, Groups, billing) */}
          {page === "rbacdoc" && <RbacDocPage />}
          {page === "groupsdoc" && <GroupsDocPage />}
          {page === "billingdoc" && <BillingDocPage />}
          </div>
        </AppShellContent>
      </div>

      <AdminToaster />
    </div>
  )
}
