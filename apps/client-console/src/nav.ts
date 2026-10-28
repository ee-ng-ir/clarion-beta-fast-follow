import {
  Home,
  Building2,
  Users,
  Box,
  CreditCard,
  UserCog,
  Contact,
  FolderTree,
  MapPin,
  IdCard,
  KeyRound,
  ShieldCheck,
  Network,
  ReceiptText,
  type LucideIcon,
} from "lucide-react"
import type { Permissions } from "@ir/mock-data/access"

/**
 * The Iris admin portal (client console).
 *
 * The top of the sidebar mirrors the live portal (admin.<env>.ir.com/t_<tenant>):
 * Administration → Home, Account, User management, Resource centre,
 * Billing & Plans; Products → Clarion.
 *
 * Underneath sit the design proposals (RBAC, SSO, the reworked widget-user
 * list) so they stay reachable for review. They keep their old /admin/* paths,
 * so existing links still land.
 */
export type PageId =
  // As built (the live product)
  | "home" | "account" | "usermgmt" | "resources" | "billing" | "clarion"
  // Proposals
  | "users" | "widgetusers" | "groups" | "locations" | "roles" | "sso"
  | "rbacdoc" | "groupsdoc" | "billingdoc"

export interface NavItem {
  id: PageId
  label: string
  icon: LucideIcon
}

export const adminNavItems: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "account", label: "Account", icon: Building2 },
  { id: "usermgmt", label: "User management", icon: Users },
  { id: "resources", label: "Resource centre", icon: Box },
  { id: "billing", label: "Billing & plans", icon: CreditCard },
]

/** Products the tenant has. Each gets a space under Products. */
export const productNavItems: { id: PageId; label: string }[] = [
  { id: "clarion", label: "Clarion" },
]

export const proposalNavItems: NavItem[] = [
  { id: "users", label: "Users & access", icon: UserCog },
  { id: "groups", label: "Groups", icon: FolderTree },
  { id: "locations", label: "Locations", icon: MapPin },
  { id: "roles", label: "Roles", icon: IdCard },
  { id: "sso", label: "Single sign-on", icon: KeyRound },
  { id: "widgetusers", label: "Widget users", icon: Contact },
  { id: "rbacdoc", label: "Roles & permissions doc", icon: ShieldCheck },
  { id: "groupsdoc", label: "Groups & locations doc", icon: Network },
  { id: "billingdoc", label: "Subscription & billing doc", icon: ReceiptText },
]

/** Whether the signed-in person can open this page (RBAC). Docs are always open. */
export function pageAllowed(id: PageId, p: Permissions): boolean {
  switch (id) {
    case "home": return true
    case "account": case "billing": return p.seeTenant
    case "usermgmt": return p.seeAccess || p.manageWidgetUsers
    case "resources": return p.deployWidget
    case "clarion": return p.seeClarion
    case "users": case "groups": return p.seeAccess
    case "roles": return p.admin
    case "locations": return p.seeLocations
    case "sso": return p.seeSso
    case "widgetusers": return p.manageWidgetUsers
    default: return true
  }
}

export const isProposal = (id: PageId) => proposalNavItems.some((n) => n.id === id)
export const isProduct = (id: PageId) => productNavItems.some((n) => n.id === id)

export const pageLabel = (id: PageId) =>
  [...adminNavItems, ...productNavItems, ...proposalNavItems].find((n) => n.id === id)?.label ?? "Home"

// One-line context under a page title. Only where the live product has one,
// plus the proposals (which need to say what they are).
export const pageSubtitle: Partial<Record<PageId, string>> = {
  resources: "Everything you and your team need to deploy the Clarion widget across your fleet. For further support, contact your IR account manager.",
  clarion: "Insights Hub – access to the fleet dashboard, recommendations, tips and training content.",
  users: "Everyone who can sign in to Iris, and what they can access.",
  widgetusers: "Who can run the Clarion widget, whether it has connected, and who uses a licence.",
  groups: "Give access to groups of people instead of one person at a time.",
  locations: "Sites, offices or regions. Limit a role to a location, and only that location's data shows.",
  roles: "The roles IR provides, and what each one can do. Give them to groups.",
  sso: "Let people sign in with your company's identity provider.",
  rbacdoc: "How roles, scope and permissions work.",
  groupsdoc: "How groups and locations decide what each person sees.",
  billingdoc: "Plan entitlements, usage and payment model.",
}

// ---- URL routing (shareable per-page links) --------------------------------

export const pagePath: Record<PageId, string> = {
  home: "/",
  account: "/account",
  usermgmt: "/users",
  resources: "/resource-centre",
  billing: "/billing",
  clarion: "/product/clarion",
  users: "/admin/users",
  widgetusers: "/admin/widget-users",
  groups: "/admin/groups",
  locations: "/admin/locations",
  roles: "/admin/roles",
  sso: "/admin/sso",
  rbacdoc: "/admin/docs/roles",
  groupsdoc: "/admin/docs/groups",
  billingdoc: "/admin/docs/billing",
}

/** Pages that no longer exist, and where they went. */
const movedPaths: Record<string, PageId> = {
  "/admin": "home",
  "/admin/subscription": "billing",
  "/admin/widgets": "resources",
  "/admin/audit": "home",
}

export const pageFromPath = (path: string): PageId | null => {
  const clean = path.replace(/\/+$/, "") || "/"
  return (Object.keys(pagePath) as PageId[]).find((id) => pagePath[id] === clean) ?? movedPaths[clean] ?? null
}

// ---- User management tabs (?tab=clarion, as in the live portal) ------------

export type UserTab = "admins" | "clarion"
export const readUserTab = (search: string): UserTab =>
  new URLSearchParams(search).get("tab") === "clarion" ? "clarion" : "admins"

export const buildPath = (page: PageId, tab?: UserTab) =>
  page === "usermgmt" && tab === "clarion" ? `${pagePath[page]}?tab=clarion` : pagePath[page]
