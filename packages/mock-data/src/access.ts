// Iris platform access (Client Admin) — RBAC, Groups and Locations. Dummy data + a
// small store for the prototype.
//
// Follows "Iris Platform: Role-Based Access Control (RBAC), Groups and Locations"
// (Ben Webb, draft, Oct 2026):
// - IR owns a fixed catalogue of roles. Tenant roles cover the whole tenant; product
//   roles cover one Iris product and can be limited to one or more locations.
// - Groups are flat (no nesting) so they line up with IdP groups later (SSO / SCIM).
// - Locations are flat, named by the customer, and shared by every Iris product.
//   In Clarion a widget user (and so their endpoints) belongs to at most one location.
// - Users get roles through groups. A role given straight to a user is an exception.
// - Access is everything all your roles allow. No deny rules.
//
// The Clarion "CC Manager" from the PO page isn't a role here: it's a group (for
// example "Sydney CC managers") holding Clarion Viewer, limited to Sydney.
// See RBAC-PROPOSAL.md.

import { clearLocation, setLocation, setLocationResolver, store as widgetStore, type WidgetUser } from "./widgetUsers"
import { systemsIn, vantage } from "./vantage"

// ------------------------------------------------------------------ catalogue --

export type RoleId = "tenant_admin" | "user_admin" | "auditor" | "product_admin" | "editor" | "viewer"
export type ProductId = "clarion" | "vantage"
/** Where a role applies: the whole tenant, or one product. Drives the tabs on Users, Groups and Roles. */
export type Scope = "tenant" | ProductId

/** Vantage is the second product (placeholder data in ./vantage), there to show how the console scales. */
export const products: { id: ProductId; name: string; placeholder?: boolean }[] = [{ id: "clarion", name: "Clarion" }, { id: "vantage", name: "Vantage" }]
export const scopes: { id: Scope; name: string }[] = [{ id: "tenant", name: "Tenant" }, ...products.map((p) => ({ id: p.id as Scope, name: p.name }))]
export const productName = (id?: ProductId) => products.find((p) => p.id === id)?.name ?? ""

export interface RoleDef {
  id: RoleId
  name: string
  level: "tenant" | "product"
  summary: string
  /** What it means in Clarion. Each product team agrees its own mapping. */
  clarion: string
  /** What it means in Vantage. Assumed: no Vantage spec yet. */
  vantage: string
  /** Proposed, still to agree with the Clarion team. */
  open?: string
}

export const roles: RoleDef[] = [
  { id: "tenant_admin", name: "Tenant Admin", level: "tenant",
    summary: "Full access, including sign-in settings (SSO, SCIM, break-glass), users, groups, locations, roles and every product.",
    clarion: "Everything in Clarion, every location.",
    vantage: "Everything in Vantage, every location." },
  { id: "user_admin", name: "User Admin", level: "tenant",
    summary: "Manages users and groups, and gives roles up to their own level. No sign-in settings or locations.",
    clarion: "No Clarion data unless also given a Clarion role.",
    vantage: "No Vantage data unless also given a Vantage role." },
  { id: "auditor", name: "Auditor", level: "tenant",
    summary: "Read-only view of settings, users, groups, locations, role assignments and the audit log.",
    clarion: "No Clarion data unless also given a Clarion role.",
    vantage: "No Vantage data unless also given a Vantage role." },
  { id: "product_admin", name: "Product Admin", level: "product",
    summary: "Configures the product and manages its settings. Limited to locations, it applies to resources in those locations only.",
    clarion: "Overview, Endpoints, Thresholds and widget users. Manages widget users in their locations.",
    vantage: "Everything an Editor can, plus adding systems, setting their location and alert rules." },
  { id: "editor", name: "Editor", level: "product",
    summary: "Creates and edits content in the product, or in the given locations.",
    clarion: "Same as Viewer today.",
    vantage: "Everything a Viewer can, plus acknowledging alerts and adding notes to systems.",
    open: "Clarion has little to edit yet. Candidates: acknowledging alerts, notes on endpoints." },
  { id: "viewer", name: "Viewer", level: "product",
    summary: "Read-only access in the product, or in the given locations.",
    clarion: "Overview and Endpoints, read-only. No Thresholds, no Administration. This is the PO's \"CC Manager\".",
    vantage: "Systems and their health, read-only." },
]
export const roleDef = (id: RoleId) => roles.find((r) => r.id === id)!
const productRank: Record<RoleId, number> = { tenant_admin: 4, product_admin: 3, editor: 2, viewer: 1, user_admin: 0, auditor: 0 }

// ---------------------------------------------------------------------- model --

export interface Assignment {
  id: string
  role: RoleId
  /** Set for product roles. */
  product?: ProductId
  /** Location ids. Empty = every location (product-wide). Tenant roles are always empty. */
  locations: string[]
}

export interface Group {
  id: string
  name: string
  description: string
  /** Local = managed in Iris. Linked = managed by the IdP (arrives with SSO / SCIM), read-only here. */
  source: "local" | "linked"
  idpGroup?: string
  /** Built-in (like Retool's Admin group): can't be deleted, renamed or lose Tenant Admin. */
  locked?: boolean
  members: string[]
  assignments: Assignment[]
}

export interface Location { id: string; name: string; description: string }

export type PersonStatus = "active" | "invited" | "deactivated"

export interface Person {
  id: string
  name: string
  email: string
  status: PersonStatus
  lastActive: string | null
  invitedAgo?: string
  /** Break-glass accounts are always Tenant Admin (RBAC can't change it). */
  breakGlass?: boolean
  /** Roles given straight to the person — exceptions, flagged in the UI. */
  direct: Assignment[]
}

export const statusLabel: Record<PersonStatus, string> = { active: "Active", invited: "Invited", deactivated: "Deactivated" }

// ----------------------------------------------------------------------- seed --

const L = { syd: "loc-syd", mel: "loc-mel", akl: "loc-akl", mnl: "loc-mnl", ldn: "loc-ldn", chi: "loc-chi", sydc: "loc-sydc", meldc: "loc-meldc", aws: "loc-aws" }

const seedLocations: Location[] = [
  { id: L.syd, name: "Sydney", description: "Chatswood and Parramatta sites" },
  { id: L.mel, name: "Melbourne", description: "" },
  { id: L.akl, name: "Auckland", description: "" },
  { id: L.mnl, name: "Manila", description: "Ortigas outsourcer" },
  { id: L.ldn, name: "London", description: "" },
  { id: L.chi, name: "Chicago", description: "" },
  // Only Vantage uses these: where the voice network runs, not where people sit.
  { id: L.sydc, name: "Sydney DC (Equinix SY3)", description: "Primary voice core" },
  { id: L.meldc, name: "Melbourne DC (Equinix ME2)", description: "Secondary voice core" },
  { id: L.aws, name: "AWS ap-southeast-2", description: "Cloud contact centre and recording" },
]

let n = 0
const a = (role: RoleId, locations: string[] = [], product?: ProductId): Assignment =>
  ({ id: `as-${++n}`, role, product: roleDef(role).level === "product" ? (product ?? "clarion") : undefined, locations })

const seedPeople: Person[] = [
  { id: "p1", name: "Ava Thornton", email: "ava.thornton@acme.com", status: "active", lastActive: "2m ago", breakGlass: true, direct: [a("tenant_admin")] },
  { id: "p2", name: "Marcus Reyes", email: "marcus.reyes@acme.com", status: "active", lastActive: "1h ago", direct: [] },
  { id: "p12", name: "Kofi Mensah", email: "kofi.mensah@acme.com", status: "active", lastActive: "today", direct: [] },
  { id: "p9", name: "Hannah Schmidt", email: "hannah.schmidt@acme.com", status: "active", lastActive: "2d ago", direct: [] },
  { id: "p8", name: "Grace Mwangi", email: "grace.mwangi@acme.com", status: "active", lastActive: "40m ago", direct: [] },
  { id: "p5", name: "Daniel Okafor", email: "daniel.okafor@acme.com", status: "active", lastActive: "3h ago", direct: [] },
  { id: "p3", name: "Priya Nair", email: "priya.nair@acme.com", status: "active", lastActive: "12m ago", direct: [] },
  { id: "p4", name: "Noah Patel", email: "noah.patel@acme.com", status: "active", lastActive: "5m ago", direct: [] },
  { id: "p6", name: "Sofia Bianchi", email: "sofia.bianchi@acme.com", status: "active", lastActive: "yesterday", direct: [] },
  { id: "p7", name: "Liam Chen", email: "liam.chen@acme.com", status: "invited", lastActive: null, invitedAgo: "2d ago", direct: [] },
  { id: "p10", name: "Elena Rossi", email: "elena.rossi@acme.com", status: "active", lastActive: "4d ago", direct: [a("viewer", [L.ldn])] },
  { id: "p13", name: "Sam Okoro", email: "sam.okoro@acme.com", status: "invited", lastActive: null, invitedAgo: "1h ago", direct: [] },
  { id: "p14", name: "Mei Lin", email: "mei.lin@acme.com", status: "active", lastActive: "20m ago", direct: [] },
  { id: "p15", name: "Ravi Menon", email: "ravi.menon@acme.com", status: "active", lastActive: "5m ago", direct: [] },
  { id: "p16", name: "Leah Walsh", email: "leah.walsh@acme.com", status: "active", lastActive: "1h ago", direct: [] },
  { id: "p17", name: "Tom Becker", email: "tom.becker@acme.com", status: "active", lastActive: "yesterday", direct: [] },
  { id: "p11", name: "Tomás Herrera", email: "tomas.herrera@acme.com", status: "deactivated", lastActive: "3w ago", direct: [] },
]

const seedGroups: Group[] = [
  { id: "g-it", name: "IT administrators", description: "Runs the Iris tenant", source: "local", locked: true, members: ["p2"], assignments: [a("tenant_admin")] },
  { id: "g-desk", name: "Service desk", description: "Onboards and offboards people", source: "local", members: ["p12"], assignments: [a("user_admin")] },
  { id: "g-sec", name: "Security and compliance", description: "Quarterly access reviews", source: "local", members: ["p9"], assignments: [a("auditor")] },
  { id: "g-clarion-admin", name: "Clarion administrators", description: "Sets thresholds and manages widget users", source: "local", members: ["p2"], assignments: [a("product_admin")] },
  { id: "g-clarion-admin-syd", name: "Sydney Clarion administrators", description: "Adds and removes Sydney's widget users", source: "local", members: ["p14"], assignments: [a("product_admin", [L.syd])] },
  { id: "g-lead", name: "Contact centre leadership", description: "Sees every site, in every product", source: "local", members: ["p8"], assignments: [a("viewer"), a("viewer", [], "vantage")] },
  { id: "g-vantage", name: "Vantage analysts", description: "Read-only in Vantage", source: "local", members: ["p13", "p9"], assignments: [a("viewer", [], "vantage")] },
  { id: "g-apac", name: "APAC operations leads", description: "Their sites, in both products", source: "local", members: ["p5"], assignments: [a("viewer", [L.syd, L.mel, L.akl]), a("viewer", [L.syd, L.mel, L.akl], "vantage")] },
  // Vantage. Two of these come from the IdP, to show SSO / SCIM linking.
  { id: "g-vantage-admin", name: "Vantage administrators", description: "Adds systems and sets alert rules", source: "local", members: ["p17"], assignments: [a("product_admin", [], "vantage")] },
  { id: "g-noc", name: "NOC engineers", description: "Acknowledge and work Vantage alerts, every site", source: "linked", idpGroup: "NOC-Engineers", members: ["p15"], assignments: [a("editor", [], "vantage")] },
  { id: "g-apac-net", name: "APAC network team", description: "The data centres and cloud region", source: "linked", idpGroup: "Network-APAC", members: ["p16"], assignments: [a("viewer", [L.sydc, L.meldc, L.aws], "vantage")] },
  { id: "g-syd", name: "Sydney CC managers", description: "", source: "local", members: ["p3", "p4"], assignments: [a("viewer", [L.syd])] },
  { id: "g-mnl", name: "Manila CC managers", description: "Outsourcer team leads", source: "local", members: ["p6", "p7"], assignments: [a("viewer", [L.mnl])] },
  { id: "g-ldn", name: "London CC managers", description: "", source: "local", members: ["p11"], assignments: [a("viewer", [L.ldn])] },
]

// ---------------------------------------------------------------------- store --

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x))
let state = { people: clone(seedPeople), groups: clone(seedGroups), locations: clone(seedLocations), version: 0 }
const listeners = new Set<() => void>()
const bump = () => { state = { ...state, version: state.version + 1 }; listeners.forEach((l) => l()) }
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`

/** Who is signed in. Marcus (Tenant Admin through "IT administrators") by default;
 *  the prototype's "View as" switch changes it with access.setMe(). */
let meId = "p2"
export const me = () => meId

export const access = {
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
  version: () => state.version,
  people: () => state.people,
  groups: () => state.groups,
  locations: () => state.locations,
  person: (id: string) => state.people.find((p) => p.id === id),
  group: (id: string) => state.groups.find((g) => g.id === id),
  location: (id: string) => state.locations.find((l) => l.id === id),
  setMe(id: string) { if (state.people.some((p) => p.id === id)) { meId = id; bump() } },
  reset() { state = { people: clone(seedPeople), groups: clone(seedGroups), locations: clone(seedLocations), version: state.version + 1 }; listeners.forEach((l) => l()) },

  // people
  invite(p: { email: string; name: string; groups: string[] }) {
    const id = uid("p")
    state.people = [{ id, name: p.name, email: p.email, status: "invited", lastActive: null, invitedAgo: "just now", direct: [] }, ...state.people]
    state.groups = state.groups.map((g) => (p.groups.includes(g.id) && g.source === "local" ? { ...g, members: [...g.members, id] } : g))
    bump()
    return id
  },
  setStatus(id: string, status: PersonStatus) { state.people = state.people.map((p) => (p.id === id ? { ...p, status } : p)); bump() },
  addDirect(personId: string, x: Omit<Assignment, "id">) {
    state.people = state.people.map((p) => (p.id === personId ? { ...p, direct: [...p.direct, { ...x, id: uid("as") }] } : p)); bump()
  },
  removeDirect(personId: string, assignmentId: string) {
    state.people = state.people.map((p) => (p.id === personId ? { ...p, direct: p.direct.filter((x) => x.id !== assignmentId) } : p)); bump()
  },

  // groups
  createGroup(g: { name: string; description: string }) {
    const id = uid("g")
    state.groups = [...state.groups, { id, name: g.name.trim(), description: g.description.trim(), source: "local", members: [], assignments: [] }]
    bump()
    return id
  },
  updateGroup(id: string, patch: Partial<Pick<Group, "name" | "description">>) { state.groups = state.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)); bump() },
  deleteGroup(id: string) { state.groups = state.groups.filter((g) => g.id !== id || g.locked); bump() },
  addMembers(groupId: string, ids: string[]) {
    state.groups = state.groups.map((g) => (g.id === groupId ? { ...g, members: [...new Set([...g.members, ...ids])] } : g)); bump()
  },
  removeMember(groupId: string, personId: string) {
    state.groups = state.groups.map((g) => (g.id === groupId ? { ...g, members: g.members.filter((m) => m !== personId) } : g)); bump()
  },
  addGroupRole(groupId: string, x: Omit<Assignment, "id">) {
    state.groups = state.groups.map((g) => (g.id === groupId ? { ...g, assignments: [...g.assignments, { ...x, id: uid("as") }] } : g)); bump()
  },
  removeGroupRole(groupId: string, assignmentId: string) {
    state.groups = state.groups.map((g) => (g.id === groupId ? { ...g, assignments: g.assignments.filter((x) => x.id !== assignmentId) } : g)); bump()
  },

  // locations
  createLocation(l: { name: string; description: string }) {
    const id = uid("loc")
    state.locations = [...state.locations, { id, name: l.name.trim(), description: l.description.trim() }]
    bump()
    return id
  },
  updateLocation(id: string, patch: Partial<Pick<Location, "name" | "description">>) { state.locations = state.locations.map((l) => (l.id === id ? { ...l, ...patch } : l)); bump() },
  /** Its widget users become unassigned; role assignments limited to it lose it, and go if it was their only location. */
  deleteLocation(id: string) {
    const strip = (xs: Assignment[]) => xs.flatMap((x) => {
      if (!x.locations.includes(id)) return [x]
      const rest = x.locations.filter((l) => l !== id)
      return rest.length ? [{ ...x, locations: rest }] : []
    })
    state.locations = state.locations.filter((l) => l.id !== id)
    state.groups = state.groups.map((g) => ({ ...g, assignments: strip(g.assignments) }))
    state.people = state.people.map((p) => ({ ...p, direct: strip(p.direct) }))
    bump()
    clearLocation(id)
    vantage.clearLocation(id)
  },
}

// ---------------------------------------------------------------- derivations --

export const groupsOf = (personId: string) => state.groups.filter((g) => g.members.includes(personId))
export const locationName = (id: string | null | undefined) => (id ? state.locations.find((l) => l.id === id)?.name ?? "Unknown location" : "")

/** One line of a person's access, and where it comes from. */
export interface Grant { assignment: Assignment; via: { kind: "group"; group: Group } | { kind: "direct" } }

export function grantsOf(personId: string): Grant[] {
  const p = access.person(personId)
  if (!p) return []
  return [
    ...groupsOf(personId).flatMap((g) => g.assignments.map((x) => ({ assignment: x, via: { kind: "group" as const, group: g } }))),
    ...p.direct.map((x) => ({ assignment: x, via: { kind: "direct" as const } })),
  ]
}

export const isTenantAdmin = (personId: string) => grantsOf(personId).some((g) => g.assignment.role === "tenant_admin")

export interface ProductAccess {
  /** Highest product role held. Tenant Admin counts as Product Admin everywhere. */
  role: RoleId | null
  /** null = every location (including widget users with no location). */
  locations: string[] | null
}

/** What someone can do in a product, combining every role they hold. */
export function productAccess(personId: string, product: ProductId): ProductAccess {
  const gs = grantsOf(personId).map((g) => g.assignment)
  if (gs.some((x) => x.role === "tenant_admin")) return { role: "tenant_admin", locations: null }
  const prod = gs.filter((x) => x.product === product)
  if (!prod.length) return { role: null, locations: [] }
  const role = prod.reduce<RoleId>((best, x) => (productRank[x.role] > productRank[best] ? x.role : best), prod[0].role)
  const everywhere = prod.some((x) => x.locations.length === 0)
  return { role, locations: everywhere ? null : [...new Set(prod.flatMap((x) => x.locations))] }
}

export const clarionAccess = (personId: string) => productAccess(personId, "clarion")

/** Tenant roles someone holds (directly or through groups). */
export const tenantRolesOf = (personId: string) =>
  [...new Set(grantsOf(personId).map((g) => g.assignment.role).filter((r) => roleDef(r).level === "tenant"))]

/** Which tabs a group belongs in. A group with no roles yet shows everywhere. */
export function groupScopes(g: Group): Scope[] {
  if (!g.assignments.length) return scopes.map((x) => x.id)
  const out = new Set<Scope>()
  for (const x of g.assignments) out.add(roleDef(x.role).level === "tenant" ? "tenant" : (x.product as Scope))
  return [...out]
}

/** How many Clarion widget users someone can see. */
export function clarionReach(personId: string) {
  const acc = clarionAccess(personId)
  const all = widgetStore.all()
  if (!acc.role) return 0
  if (acc.locations === null) return all.length
  const set = new Set(acc.locations)
  return all.filter((u) => u.locationId && set.has(u.locationId)).length
}

/** Records each product keeps in a location: what blocks deleting it. */
export const recordsIn = (locationId: string): Record<ProductId, number> => ({ clarion: widgetUsersIn(locationId), vantage: systemsIn(locationId) })
export const recordNoun: Record<ProductId, [string, string]> = { clarion: ["widget user", "widget users"], vantage: ["system", "systems"] }

export const widgetUsersIn = (locationId: string) => widgetStore.all().filter((u) => u.locationId === locationId).length
export const unassignedWidgetUsers = () => widgetStore.all().filter((u) => !u.locationId).length

/** Groups and people with a role limited to this location. */
export function whoSees(locationId: string) {
  const groups = state.groups.filter((g) => g.assignments.some((x) => x.locations.includes(locationId)))
  const people = state.people.filter((p) => p.direct.some((x) => x.locations.includes(locationId)))
  return { groups, people }
}

/** "Clarion Viewer · Sydney, Melbourne" / "Tenant Admin" */
export function assignmentLabel(x: Assignment, opts: { withProduct?: boolean } = {}) {
  const r = roleDef(x.role).name
  if (roleDef(x.role).level === "tenant") return r
  const where = x.locations.length ? x.locations.map(locationName).join(", ") : "All locations"
  return `${opts.withProduct === false ? "" : productName(x.product) + " "}${r} · ${where}`
}

/** Members who are Tenant Admin. Safeguard: never fewer than one. */
export const tenantAdmins = () => state.people.filter((p) => p.status !== "deactivated" && isTenantAdmin(p.id))

/** Would removing this group role (or member) leave the tenant with no Tenant Admin? */
export function wouldOrphanTenant(change: { groupId?: string; assignmentId?: string; personId?: string; deleteGroup?: boolean }) {
  const before = tenantAdmins().map((p) => p.id)
  const remaining = before.filter((pid) => {
    const p = access.person(pid)!
    if (p.direct.some((x) => x.role === "tenant_admin" && x.id !== change.assignmentId)) return true
    return groupsOf(pid).some((g) => {
      if (change.groupId === g.id && change.deleteGroup) return false
      if (change.groupId === g.id && change.personId === pid) return false
      return g.assignments.some((x) => x.role === "tenant_admin" && x.id !== change.assignmentId)
    })
  })
  return remaining.length === 0
}

export const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

// ------------------------------------------------------------- give access --
// "What should they do?" + "Where?" → a role, then the group that already holds
// exactly that role (or a new one). People always land in a group, never a direct role.

export type Job = "view" | "work" | "manage" | "users" | "review" | "admin"
export interface JobDef { id: Job; label: string; hint: string; role: RoleId; scoped: boolean; product?: ProductId }

/** The choices in Give access, per tab: a product's own jobs, or the tenant's. */
export function jobsFor(scope: Scope): JobDef[] {
  if (scope === "tenant") return [
    { id: "users", label: "Manage users and groups", hint: "No product data", role: "user_admin", scoped: false },
    { id: "review", label: "Review access", hint: "Read-only settings and audit log", role: "auditor", scoped: false },
    { id: "admin", label: "Run the whole tenant", hint: "Tenant Admin: everything, every product", role: "tenant_admin", scoped: false },
  ]
  const name = productName(scope)
  return scope === "clarion"
    ? [{ id: "view", label: "See the Clarion dashboard", hint: "Overview and Endpoints, read-only", role: "viewer", scoped: true, product: scope },
       { id: "manage", label: "Manage Clarion", hint: "Also Thresholds and widget users", role: "product_admin", scoped: true, product: scope }]
    : [{ id: "view", label: `See ${name}`, hint: "Systems and their health, read-only", role: "viewer", scoped: true, product: scope },
       { id: "work", label: "Work Vantage alerts", hint: "Also acknowledge alerts and add notes", role: "editor", scoped: true, product: scope },
       { id: "manage", label: `Manage ${name}`, hint: "Also add systems and set alert rules", role: "product_admin", scoped: true, product: scope }]
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))

/** A local group whose only role is exactly this one. */
export function matchingGroup(x: Omit<Assignment, "id">) {
  return state.groups.find((g) => g.source === "local" && g.assignments.length === 1 &&
    g.assignments[0].role === x.role && g.assignments[0].product === x.product && sameSet(g.assignments[0].locations, x.locations))
}

export function suggestGroupName(job: Job, locations: string[], product: ProductId = "clarion") {
  const where = locations.map(locationName).join(", ")
  const name = productName(product)
  switch (job) {
    case "view": return product === "clarion" ? (locations.length ? `${where} CC managers` : "Clarion viewers (all locations)") : (locations.length ? `${name} viewers – ${where}` : `${name} viewers`)
    case "work": return locations.length ? `${name} engineers – ${where}` : `${name} engineers`
    case "manage": return locations.length ? `${name} administrators – ${where}` : `${name} administrators`
    case "users": return "User administrators"
    case "review": return "Auditors"
    case "admin": return "IT administrators"
  }
}

/** Plain-language result of holding one role. */
export function describeRole(role: RoleId, locations: string[], product: ProductId = "clarion") {
  if (product === "vantage" && (role === "viewer" || role === "editor" || role === "product_admin")) {
    const where = locations.length ? locations.map(locationName).join(", ") : "all locations"
    const n = vantage.visible(locations.length ? locations : null).length
    const systems = `Vantage systems for ${where} (${n.toLocaleString()} systems)`
    return role === "product_admin"
      ? { sees: `${systems}, and can add systems and set alert rules`, not: "users, groups or sign-in settings" }
      : role === "editor"
        ? { sees: `${systems}, and can acknowledge alerts`, not: "alert rules or Administration" }
        : { sees: `${systems}, read-only`, not: "alerts actions, alert rules or Administration" }
  }
  const reach = role === "user_admin" || role === "auditor" ? 0
    : locations.length ? widgetStore.all().filter((u) => u.locationId && locations.includes(u.locationId)).length : widgetStore.all().length
  const where = locations.length ? locations.map(locationName).join(", ") : "all locations"
  switch (role) {
    case "viewer": case "editor":
      return { sees: `Overview and Endpoints for ${where} (${reach.toLocaleString()} widget users)`, not: "Thresholds or Administration" }
    case "product_admin":
      return { sees: `Overview, Endpoints, Thresholds and widget users for ${where} (${reach.toLocaleString()} widget users)`, not: "users, groups or sign-in settings" }
    case "user_admin":
      return { sees: "users and groups, and can give roles up to their own", not: "product data, locations or sign-in settings" }
    case "auditor":
      return { sees: "settings, users, groups, roles and the audit log, read-only", not: "product data" }
    case "tenant_admin":
      return { sees: "everything in every product, including sign-in settings", not: "" }
  }
}

// ------------------------------------------------------- suggested groups --
// Most contact centres want the same few groups. Suggest them from the tenant's own
// locations; nothing is created until the admin confirms.

export interface Suggestion { key: string; name: string; description: string; assignment: Omit<Assignment, "id"> }

export function suggestedGroups(): Suggestion[] {
  const out: Suggestion[] = [
    ...state.locations.map((l) => ({
      key: `site-${l.id}`, name: `${l.name} CC managers`, description: `Contact centre managers at ${l.name}`,
      assignment: { role: "viewer" as RoleId, product: "clarion" as ProductId, locations: [l.id] },
    })),
    { key: "leadership", name: "Contact centre leadership", description: "Sees every site", assignment: { role: "viewer", product: "clarion", locations: [] } },
    { key: "clarion-admins", name: "Clarion administrators", description: "Sets thresholds and manages widget users", assignment: { role: "product_admin", product: "clarion", locations: [] } },
  ]
  const names = new Set(state.groups.map((g) => g.name.trim().toLowerCase()))
  return out.filter((s) => !matchingGroup(s.assignment) && !names.has(s.name.toLowerCase()))
}

export function createSuggested(list: { name: string; description: string; assignment: Omit<Assignment, "id"> }[]) {
  for (const s of list) {
    const id = access.createGroup({ name: s.name, description: s.description })
    access.addGroupRole(id, s.assignment)
  }
}

// ------------------------------------------------- locations ↔ widget users --

const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim()
const ALIASES: Record<string, string> = { syd: "sydney", mel: "melbourne", melb: "melbourne", akl: "auckland", mnl: "manila", ldn: "london", chi: "chicago", nyc: "new york", bne: "brisbane" }

/** Read a free-text site as one of the tenant's locations, if it clearly is one. */
export function matchLocation(site: string, among: Location[] = state.locations): string | null {
  const s = norm(site)
  if (!s) return null
  const target = ALIASES[s] ?? s
  for (const l of among) {
    const n = norm(l.name)
    if (target === n || target.startsWith(n + " ") || (target.length >= 3 && n.startsWith(target))) return l.id
  }
  return null
}

// CSV import/export reads and writes locations by name.
setLocationResolver({
  byName: (name) => state.locations.find((l) => norm(l.name) === norm(name))?.id ?? matchLocation(name),
  name: (id) => (id ? state.locations.find((l) => l.id === id)?.name ?? "" : ""),
})

export interface MatchPlan {
  matched: { locationId: string; users: WidgetUser[]; sites: string[] }[]
  unmatched: { site: string; users: WidgetUser[] }[]
  /** No location and no site typed either: set by hand. */
  blank: number
}

/** Widget users with no location, read from their typed site. */
export function planMatch(): MatchPlan {
  const pending = widgetStore.all().filter((u) => !u.locationId)
  const matched = new Map<string, { users: WidgetUser[]; sites: Set<string> }>()
  const unmatched = new Map<string, WidgetUser[]>()
  let blank = 0
  for (const u of pending) {
    if (!u.site.trim()) { blank++; continue }
    const id = matchLocation(u.site)
    if (id) { const m = matched.get(id) ?? { users: [], sites: new Set() }; m.users.push(u); m.sites.add(u.site.trim()); matched.set(id, m) }
    else { const k = u.site.trim(); unmatched.set(k, [...(unmatched.get(k) ?? []), u]) }
  }
  return {
    matched: [...matched].map(([locationId, m]) => ({ locationId, users: m.users, sites: [...m.sites] })).sort((a, b) => b.users.length - a.users.length),
    unmatched: [...unmatched].map(([site, users]) => ({ site, users })).sort((a, b) => b.users.length - a.users.length),
    blank,
  }
}

export function applyMatch(plan: MatchPlan, locationIds: string[]) {
  let n = 0
  for (const m of plan.matched) if (locationIds.includes(m.locationId)) n += (setLocation(m.users.map((u) => u.userId), m.locationId) as { changed: number }).changed
  return n
}

/** Unassigned widget users whose site reads as this (new) location name. */
export const usersForNewLocation = (name: string) =>
  widgetStore.all().filter((u) => !u.locationId && u.site.trim() && matchLocation(u.site, [{ id: "new", name, description: "" }]) === "new")

/** Everyone who can see a widget user (and so their endpoints) in Clarion, and why. */
export function whoCanSee(locationId: string | null) {
  return state.people.filter((p) => p.status !== "deactivated").flatMap((p) => {
    const acc = clarionAccess(p.id)
    if (!acc.role) return []
    if (acc.locations !== null && (!locationId || !acc.locations.includes(locationId))) return []
    const via = grantsOf(p.id).filter((g) => g.assignment.role === "tenant_admin" || (g.assignment.product === "clarion" &&
      (g.assignment.locations.length === 0 || (locationId !== null && g.assignment.locations.includes(locationId)))))
    return [{ person: p, role: acc.role, everywhere: acc.locations === null, via }]
  })
}

export function updateGroupRole(groupId: string, assignmentId: string, locations: string[]) {
  const g = access.group(groupId)
  if (!g) return
  access.removeGroupRole(groupId, assignmentId)
  const x = g.assignments.find((a) => a.id === assignmentId)!
  access.addGroupRole(groupId, { role: x.role, product: x.product, locations })
}

/** Groups that tie someone to one site (a product role limited to one location). */
export const siteGroupsOf = (personId: string) =>
  groupsOf(personId).filter((g) => g.source === "local" && g.assignments.length === 1 && g.assignments[0].product && g.assignments[0].locations.length === 1)

/** The group someone moving from `fromGroup` to `toLocation` should land in: an existing match, or a new name. */
export function moveTarget(fromGroupId: string, toLocation: string) {
  const g = access.group(fromGroupId)!
  const x = g.assignments[0]
  const draft = { role: x.role, product: x.product, locations: [toLocation] }
  const match = matchingGroup(draft)
  const oldName = locationName(x.locations[0]), newName = locationName(toLocation)
  const name = g.name.includes(oldName) ? g.name.replace(oldName, newName) : suggestGroupName(x.role === "product_admin" ? "manage" : "view", [toLocation], x.product ?? "clarion")
  return { draft, match, name }
}

// ------------------------------------------------------------- permissions --
// What the signed-in person can see and do in the client console, from the roles
// they hold. One place, so every screen agrees. Rules not yet agreed with Ben are
// marked "Assumed".

export interface Permissions {
  tenantAdmin: boolean
  userAdmin: boolean
  auditor: boolean
  clarion: ProductAccess
  /** Users, groups and roles. */
  seeAccess: boolean
  manageAccess: boolean
  /** Assumed (open question 4): a User Admin gives any role except Tenant Admin, and
   *  can't change groups that give Tenant Admin. */
  grantTenantAdmin: boolean
  seeLocations: boolean
  manageLocations: boolean
  seeSso: boolean
  manageSso: boolean
  /** Account and Billing & plans. */
  seeTenant: boolean
  /** Widget users: add, remove, set location. Limited to `widgetScope`. */
  manageWidgetUsers: boolean
  /** null = every location, including widget users with no location. */
  widgetScope: string[] | null
  /** Resource centre: the installer and install command. */
  deployWidget: boolean
  /** Assumed: the enrolment token is a tenant-wide secret, so Tenant Admin only. */
  rotateEnrolmentToken: boolean
  /** Can open Clarion (any Clarion role). */
  seeClarion: boolean
  /** Sees any part of Administration. */
  admin: boolean
  /** Per product: role held, where, and what it allows. Scales to any product. */
  products: Record<ProductId, ProductPerm>
}

export interface ProductPerm {
  role: RoleId | null
  /** null = every location, including records with no location. */
  scope: string[] | null
  see: boolean
  /** Editor and up: act on records (Vantage: acknowledge alerts). */
  act: boolean
  /** Product Admin and up: add records, set their location, settings. */
  manage: boolean
}

function productPerm(personId: string, product: ProductId): ProductPerm {
  const acc = productAccess(personId, product)
  const r = acc.role
  return {
    role: r, scope: r ? acc.locations : [],
    see: !!r,
    act: r === "tenant_admin" || r === "product_admin" || r === "editor",
    manage: r === "tenant_admin" || r === "product_admin",
  }
}

export function permissionsOf(personId: string): Permissions {
  const tenant = tenantRolesOf(personId)
  const tenantAdmin = tenant.includes("tenant_admin")
  const userAdmin = tenant.includes("user_admin")
  const auditor = tenant.includes("auditor")
  const clarion = clarionAccess(personId)
  const clarionAdmin = clarion.role === "tenant_admin" || clarion.role === "product_admin"
  const seeAccess = tenantAdmin || userAdmin || auditor
  const prods = Object.fromEntries(products.map((p) => [p.id, productPerm(personId, p.id)])) as Record<ProductId, ProductPerm>
  const anyProductAdmin = products.some((p) => prods[p.id].manage)
  return {
    products: prods,
    tenantAdmin, userAdmin, auditor, clarion,
    seeAccess,
    manageAccess: tenantAdmin || userAdmin,
    grantTenantAdmin: tenantAdmin,
    seeLocations: seeAccess || anyProductAdmin,
    manageLocations: tenantAdmin,
    seeSso: tenantAdmin || auditor,
    manageSso: tenantAdmin,
    seeTenant: tenantAdmin || auditor,
    manageWidgetUsers: clarionAdmin,
    widgetScope: clarionAdmin ? clarion.locations : [],
    deployWidget: clarionAdmin,
    rotateEnrolmentToken: tenantAdmin,
    seeClarion: !!clarion.role,
    admin: seeAccess || anyProductAdmin,
  }
}

/** Can this person change this group's roles and name? */
export function canChangeGroup(perm: Permissions, g: Group) {
  if (!perm.manageAccess) return false
  return perm.grantTenantAdmin || !g.assignments.some((x) => x.role === "tenant_admin")
}

/** …and its members? Not for a group linked to the IdP: its members come from there. */
export const canChangeMembers = (perm: Permissions, g: Group) => g.source === "local" && canChangeGroup(perm, g)

/** People to switch between in the prototype, one per kind of access. */
export const viewAsPeople = ["p2", "p12", "p9", "p14", "p8", "p5", "p3", "p6", "p17", "p15", "p16"]

/** One line of what someone holds: "Tenant Admin", "Clarion Viewer · Sydney". */
export function accessLine(personId: string) {
  const tenant = tenantRolesOf(personId).map((r) => roleDef(r).name)
  if (tenant.includes("Tenant Admin")) return "Tenant Admin"
  const prods = products.map((p) => {
    const c = productAccess(personId, p.id)
    return c.role && c.role !== "tenant_admin"
      ? `${p.name} ${roleDef(c.role).name} · ${c.locations === null ? "All locations" : c.locations.map(locationName).join(", ")}`
      : null
  })
  return [...tenant, ...prods].filter(Boolean).join(" + ") || "No access"
}
