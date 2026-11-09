import {
  LayoutDashboard,
  BellRing,
  BarChart3,
  Settings,
  Monitor,
  BookOpen,
  Workflow,
  Laptop,
  Component,
  ListChecks,
  Users,
  FolderTree,
  RadioTower,
  CreditCard,
  ScrollText,
  ShieldCheck,
  Network,
  ReceiptText,
  KeyRound,
  Contact,
  MapPin,
  IdCard,
  type LucideIcon,
} from "lucide-react"

export type PageId =
  | "overview" | "endpoints" | "alerts" | "thresholds" | "dashboards" | "settings"
  | "users" | "widgetusers" | "groups" | "locations" | "roles" | "widgets" | "sso" | "subscription" | "audit"
  | "rbacdoc" | "groupsdoc" | "billingdoc"
  | "glossary" | "issuesdoc" | "devicesdoc" | "scopedoc" | "components"

export interface NavItem {
  id: PageId
  label: string
  icon: LucideIcon
}

// Fast Follow: Alerts comes back into the nav, Dashboards is new, and Settings
// replaces Thresholds as the home for everything an IT Admin configures.
export const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "alerts", label: "Alerts", icon: BellRing },
  { id: "endpoints", label: "Endpoints", icon: Monitor },
  { id: "dashboards", label: "Dashboards", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
]
/** Nav items introduced by Fast Follow (shown with a "New" tag). */
export const newNavIds: PageId[] = ["alerts", "dashboards", "settings"]

// De-scoped from the sidebar for MVP (kept as a Day-2 route reachable via the
// Overview card / command palette). Labels that aren't rendered in any nav list
// but are still needed by pageLabel() / breadcrumbs live here.
const offNavLabels: Partial<Record<PageId, string>> = {
  thresholds: "Thresholds",
}

// Administration — shown only to Admins (role-gated within the one Fleet view).
// "Members" is the scaffolded screen; the rest are placeholders mapping to the
// Admin epics (see ADMIN-TICKETS.md).
// RBAC proposal (Iris platform, Client Admin): access is Users + Groups + Locations,
// with IR's fixed Roles. Clarion-specific admin sits in its own section.
export const adminNavSections: { label: string; items: NavItem[] }[] = [
  { label: "Access", items: [
    { id: "users", label: "Users", icon: Users },
    { id: "groups", label: "Groups", icon: FolderTree },
    { id: "locations", label: "Locations", icon: MapPin },
    { id: "roles", label: "Roles", icon: IdCard },
    { id: "sso", label: "Single sign-on", icon: KeyRound },
  ] },
  { label: "Clarion", items: [
    { id: "widgetusers", label: "Widget users", icon: Contact },
    { id: "widgets", label: "Device management", icon: RadioTower },
  ] },
  { label: "Tenant", items: [
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "audit", label: "Audit log", icon: ScrollText },
  ] },
]
export const adminNavItems: NavItem[] = adminNavSections.flatMap((s) => s.items)

// Internal Administration docs (shown in the Admin sidebar's "Product
// development" group). Scoped to admin concepts — RBAC, Groups, billing.
export const adminDocNavItems: NavItem[] = [
  { id: "rbacdoc", label: "Roles & permissions", icon: ShieldCheck },
  { id: "groupsdoc", label: "Groups & locations", icon: Network },
  { id: "billingdoc", label: "Subscription & billing", icon: ReceiptText },
]

// Internal — not shipped in the built product.
export const devNavItems: NavItem[] = [
  { id: "scopedoc", label: "Scope", icon: ListChecks },
  { id: "components", label: "Components", icon: Component },
  { id: "glossary", label: "Glossary", icon: BookOpen },
  { id: "devicesdoc", label: "Endpoints model", icon: Laptop },
  { id: "issuesdoc", label: "Alerts model", icon: Workflow },
]

export const pageLabel = (id: PageId) =>
  [...navItems, ...adminNavItems, ...adminDocNavItems, ...devNavItems].find((n) => n.id === id)?.label
    ?? offNavLabels[id]
    ?? "Overview"

// Optional one-line context under a page title (shown in the top chrome).
// Add entries only where a subtitle is genuinely useful — keep pages lean otherwise.
export const pageSubtitle: Partial<Record<PageId, string>> = {
  thresholds: "Set when an endpoint is flagged warning or critical.",
  alerts: "Problems across your fleet, grouped by type.",
  dashboards: "Fleet-wide summaries over recent history.",
  settings: "Alerts, notifications and devices for your whole tenancy.",
  users: "Everyone who can sign in to Iris, and what they can access.",
  widgetusers: "Who can run the Clarion widget, whether it has connected, and who uses a licence.",
  groups: "Give access to groups of people instead of one person at a time.",
  locations: "Sites, offices or regions. Limit a role to a location, and only that location's data shows.",
  roles: "The roles IR provides, and what each one can do. Give them to groups.",
  widgets: "Register, assign and revoke endpoint Widgets. A Widget becomes an Endpoint once it's set up and reporting.",
  sso: "Let people sign in with your company's identity provider.",
  subscription: "Review your plan, usage and billing.",
  audit: "Track who changed what, and when.",
  rbacdoc: "How roles, scope and permissions work.",
  groupsdoc: "How groups and locations decide what each person sees.",
  billingdoc: "Plan entitlements, usage and payment model.",
}

// ---- URL routing (shareable per-page links) --------------------------------

export const pagePath: Record<PageId, string> = {
  overview: "/",
  endpoints: "/endpoints",
  alerts: "/issues",
  thresholds: "/thresholds",
  dashboards: "/dashboards",
  settings: "/settings",
  users: "/admin/users",
  widgetusers: "/admin/widget-users",
  groups: "/admin/groups",
  locations: "/admin/locations",
  roles: "/admin/roles",
  widgets: "/admin/widgets",
  sso: "/admin/sso",
  subscription: "/admin/subscription",
  audit: "/admin/audit",
  rbacdoc: "/admin/docs/roles",
  groupsdoc: "/admin/docs/groups",
  billingdoc: "/admin/docs/billing",
  glossary: "/glossary",
  devicesdoc: "/devices-model",
  issuesdoc: "/issues-model",
  scopedoc: "/scope",
  components: "/components",
}

export const pageFromPath = (path: string): PageId => {
  const clean = path.replace(/\/+$/, "") || "/"
  if (clean === "/thresholds") return "settings"
  return (Object.keys(pagePath) as PageId[]).find((id) => pagePath[id] === clean) ?? "overview"
}

// ---- Drawer deep-linking (query param on the current page) ------------------
// A drilldown is a modal layered over a page, so it lives as a query param on
// that page rather than its own route:  /devices?device=ep_1842 · /issues?issue=al_07
export interface DrawerParams { device?: string; issue?: string }

export const readDrawerParams = (search: string): DrawerParams => {
  const p = new URLSearchParams(search)
  return { device: p.get("device") ?? undefined, issue: p.get("issue") ?? undefined }
}

export const buildPath = (page: PageId, drawer: DrawerParams = {}): string => {
  const p = new URLSearchParams()
  if (drawer.device) p.set("device", drawer.device)
  if (drawer.issue) p.set("issue", drawer.issue)
  const qs = p.toString()
  return qs ? `${pagePath[page]}?${qs}` : pagePath[page]
}

// ---- Experiences (two surfaces in one repo) --------------------------------
// "fleet" = the supervisor dashboard · "admin" = the Administration surface.
// The Administration experience has its own shell (sidebar + chrome); it's
// reached from the top-right account menu. The top-left sidebar switches org.

export type Experience = "fleet" | "admin"

export const adminPageIds: PageId[] = ["users", "widgetusers", "groups", "locations", "roles", "widgets", "sso", "subscription", "audit", "rbacdoc", "groupsdoc", "billingdoc"]

export const experienceOf = (id: PageId): Experience =>
  (adminPageIds as string[]).includes(id) ? "admin" : "fleet"

export const defaultPageFor: Record<Experience, PageId> = { fleet: "overview", admin: "users" }

export const experienceLabel: Record<Experience, string> = {
  fleet: "Fleet dashboard",
  admin: "Administration",
}
