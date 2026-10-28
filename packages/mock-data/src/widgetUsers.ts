// Clarion widget users — dummy data + a simulated fleet-config API.
//
// Mirrors iros/abhra (services/fleet-config + services/ui …/users/(clarion)) so the
// prototype behaves like the product: login IDs are lower-cased and immutable, the
// user ID is a hash of tenant + login ID, the list comes back 15 at a time in hashed
// (effectively random) order, only *active* users use a licence, and the "current"
// CSV import follows IROS-509 exactly. The "proposed" import planner is new.
// See BULK-USER-MANAGEMENT.md.

export type RegisterStatus = "" | "registered" | "pending_invite"
export type Connection = "never" | "connected" | "invite_failed"

export interface WidgetUser {
  userId: string
  loginId: string
  name: string
  email: string
  site: string
  active: boolean
  registerStatus: RegisterStatus
  createdAt: number
  updatedAt: number
  /** From the analytics database, not fleet-config. Null = never reported. */
  lastSeen: number | null
  /** Proposed (RBAC): the Iris location this user's endpoints belong to. Replaces the
   *  free-text site for access. Null = no location: only product-wide roles see them. */
  locationId: string | null
}

export type DataSize = "demo" | "2k" | "20k"

export const sizeMeta: Record<DataSize, { label: string; count: number; limit: number }> = {
  demo: { label: "42", count: 42, limit: 500 },
  "2k": { label: "2,000", count: 2000, limit: 2200 },
  "20k": { label: "20,000", count: 20000, limit: 20500 },
}

export const PAGE_SIZE = 15
const DAY = 24 * 60 * 60 * 1000
const TENANT = "t_5jjgAFEkycj"
const NOW = Date.now()

// ---------------------------------------------------------------- helpers --

/** FNV-1a — stands in for fleet-config's SHA-256 user ID. Same shape of behaviour:
 *  deterministic from tenant + lower-cased login ID, and it sets the list order. */
function hashId(loginId: string) {
  let h = 0x811c9dc5
  const s = `${TENANT}\u0000${loginId.toLowerCase()}`
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, "0") + "-" + ((h * 2654435761) >>> 0).toString(16).padStart(8, "0")
}

function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

export const connectionOf = (u: Pick<WidgetUser, "registerStatus">): Connection =>
  u.registerStatus === "registered" ? "connected" : u.registerStatus === "pending_invite" ? "invite_failed" : "never"

export const connectionLabel: Record<Connection, string> = {
  never: "Never connected",
  connected: "Connected",
  invite_failed: "Invite not sent",
}

/** "a" or "a\b" or "a@b" → the bit people mean when they say the username. */
export const loginLocalPart = (loginId: string) => {
  const l = loginId.toLowerCase()
  const afterSlash = l.includes("\\") ? l.split("\\").pop()! : l
  return afterSlash.split("@")[0]
}

export function relTime(ts: number | null) {
  if (ts == null) return "—"
  const d = Math.round((NOW - ts) / DAY)
  if (d <= 0) return "Today"
  if (d === 1) return "Yesterday"
  if (d < 30) return `${d} days ago`
  if (d < 365) return `${Math.round(d / 30)} mo ago`
  return `${Math.round(d / 365)} yr ago`
}

export const shortDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })

// -------------------------------------------------------------- the data --

// The 42 users on the dev tenant (admin.dev-abhra.ir.com, Clarion tab), as seen on
// 19 Oct 2026. Connection / last-seen are made up to cover the cases.
const DEMO: [name: string, loginId: string, email: string, site: string][] = [
  ["Nadia Tcp", "demo\\nadia.tcp", "nadia.tcp@demo.clarion.example", ""],
  ["Demogated Gated", "demogated", "demogated@example.com", ""],
  ["Diego Cxone", "demo\\diego.cxone", "diego.cxone@demo.clarion.example", ""],
  ["Demogated2 Gated", "demogated2", "demogated2@example.com", ""],
  ["Priya Quality", "demo\\priya.quality", "priya.quality@demo.clarion.example", ""],
  ["Zoe Ram", "demo\\zoe.ram", "zoe.ram@demo.clarion.example", ""],
  ["Varun Khunger", "ir\\varunk", "varun.khunger@ir.com", "sydney"],
  ["Thom Nez", "demo\\thom.nez", "thom.nez@demo.clarion.example", "Iceland"],
  ["Omar Net", "demo\\omar.net", "omar.net@demo.clarion.example", ""],
  ["Lucas Speaker", "demo\\lucas.spk", "lucas.speaker@demo.clarion.example", ""],
  ["Marta Zoomqi", "demo\\marta.zoomqi", "marta.zoomqi@demo.clarion.example", ""],
  ["Biff Tannen", "demo\\biff.tannen", "biff.tannen@demo.clarion.example", "Chicago"],
  ["Olivia Thresh", "demo\\olivia.thresh", "olivia.thresh@demo.clarion.example", ""],
  ["Tariq Offline", "demo\\tariq.off", "tariq.offline@demo.clarion.example", ""],
  ["Anna Ok", "demo\\anna.ok", "anna.ok@demo.clarion.example", ""],
  ["Noah Webex", "demo\\noah.webex", "noah.webex@demo.clarion.example", ""],
  ["Ravi Cpu", "demo\\ravi.cpu", "ravi.cpu@demo.clarion.example", ""],
  ["Sofia Zoom", "demo\\sofia.zoom", "sofia.zoom@demo.clarion.example", ""],
  ["Cara Sitewide", "demo\\site.c", "site.c@demo.clarion.example", ""],
  ["Kenji Disk", "demo\\kenji.disk", "kenji.disk@demo.clarion.example", ""],
  ["Hiro Lan", "demo\\hiro.lan", "hiro.lan@demo.clarion.example", ""],
  ["Charles Henry", "chenry", "chenry@demo.clarion.example", ""],
  ["Liam Teams", "demo\\liam.teams", "liam.teams@demo.clarion.example", ""],
  ["Nina Borderline", "demo\\nina.borderline", "nina.borderline@demo.clarion.example", ""],
  ["Zoe Ram Crit", "demo\\zoe.ram.crit", "zoe.ram.crit@demo.clarion.example", ""],
  ["Emma Mixed", "demo\\emma.mixed", "emma.mixed@demo.clarion.example", ""],
  ["Sam Ok", "demo\\sam.ok", "sam.ok@demo.clarion.example", ""],
  ["Mei Wifi", "demo\\mei.wifi", "mei.wifi@demo.clarion.example", ""],
  ["Serge Iv", "demo\\aituser-01", "sergei.ivanoff@ir.com", ""],
  ["James Platform", "demo\\james.platform", "james.platform@demo.clarion.example", ""],
  ["Kenji Disk Warn", "demo\\kenji.disk.warn", "kenji.disk.warn@demo.clarion.example", ""],
  ["AGENT01 TEST", "demo\\agent01", "agent01@demo.clarion.example", "Sydney"],
  ["Yuki Mic", "demo\\yuki.mic", "yuki.mic@demo.clarion.example", ""],
  ["Yngwie Malmsteen", "demo\\yngwiem", "yngwie@demo.clarion.example", "Sweden"],
  ["Maya Nogeo", "demo\\maya.nogeo", "maya.nogeo@demo.clarion.example", ""],
  ["Test User", "testuser", "test.user@demo.clarion.example", "Sydney"],
  ["Aisha Genesys", "demo\\aisha.genesys", "aisha.genesys@demo.clarion.example", ""],
  ["Ava Sitewide", "demo\\site.a", "site.a@demo.clarion.example", ""],
  ["Ravi Cpu Warn", "demo\\ravi.cpu.warn", "ravi.cpu.warn@demo.clarion.example", ""],
  ["Ben Sitewide", "demo\\site.b", "site.b@demo.clarion.example", ""],
  ["Theo Borderline", "demo\\theo.borderline", "theo.borderline@demo.clarion.example", ""],
  ["Iris Signal", "demo\\iris.signal", "iris.signal@demo.clarion.example", ""],
]

const FIRST = ["Aaron","Abigail","Adam","Aisha","Alex","Alice","Amir","Ana","Andre","Anika","Ben","Bianca","Caleb","Carmen","Chen","Chloe","Daniel","Dara","David","Diego","Elena","Eli","Emma","Ethan","Fatima","Felix","Grace","Hana","Hassan","Hugo","Ines","Isaac","Jade","James","Jia","Jonah","Kai","Kara","Kenji","Laila","Leo","Lina","Lucas","Maya","Mei","Mia","Mohammed","Nadia","Noah","Nora","Omar","Priya","Rafael","Ravi","Rosa","Sam","Sara","Sofia","Tariq","Theo","Uma","Wei","Yara","Yusuf","Zoe"]
const LAST = ["Abbott","Ahmed","Alvarez","Bauer","Bianchi","Brown","Chan","Chen","Costa","Dang","Diaz","Dubois","Evans","Fischer","Garcia","Gupta","Haddad","Hughes","Ito","Jensen","Kaur","Khan","Kim","Kowalski","Lee","Lopez","Mendes","Meyer","Murphy","Nair","Nguyen","Novak","Okafor","Oliveira","Park","Patel","Reyes","Rossi","Santos","Sato","Schmidt","Silva","Singh","Smith","Tanaka","Torres","Wang","Weber","Wilson","Wong","Yamamoto","Zhang"]
// Free text today, so the same place shows up several ways.
const SITES: [string, number][] = [
  ["", 30], ["Sydney", 9], ["sydney", 3], ["SYD", 2], ["Sydney CBD", 2], ["Melbourne", 7], ["melbourne", 2],
  ["Manila", 9], ["Manila - Ortigas", 3], ["Chicago", 6], ["Chicago IL", 2], ["London", 6], ["LDN", 2],
  ["Auckland", 4], ["Iceland", 1], ["Sweden", 1], ["Remote", 4],
]

function pickWeighted<T>(r: () => number, items: [T, number][]) {
  const total = items.reduce((s, [, w]) => s + w, 0)
  let x = r() * total
  for (const [v, w] of items) { if ((x -= w) <= 0) return v }
  return items[items.length - 1][0]
}

function makeUser(r: () => number, name: string, loginId: string, email: string, site: string): WidgetUser {
  const lid = loginId.toLowerCase()
  const createdAt = NOW - Math.floor(r() * 540) * DAY - Math.floor(r() * DAY)
  const roll = r()
  // ~13% never connected, ~4% connected but the invite email failed, rest connected.
  const registerStatus: RegisterStatus = roll < 0.13 ? "" : roll < 0.17 ? "pending_invite" : "registered"
  let lastSeen: number | null = null
  if (registerStatus !== "") {
    const leaver = r() < 0.12
    lastSeen = leaver ? NOW - (60 + Math.floor(r() * 220)) * DAY : NOW - Math.floor(r() * 9) * DAY - Math.floor(r() * DAY)
    if (lastSeen < createdAt) lastSeen = createdAt + DAY
  }
  return {
    userId: hashId(lid), loginId: lid, name, email, site,
    active: r() > 0.04, registerStatus, createdAt, updatedAt: createdAt, lastSeen, locationId: null,
  }
}

// Location ids match the seed in data/access.ts.
const LOCS: [string | null, number][] = [["loc-syd", 10], ["loc-mel", 5], ["loc-mnl", 8], ["loc-ldn", 4], ["loc-chi", 3], ["loc-akl", 2], [null, 6]]
/** Users with no typed site were placed by an admin already. Users with a typed site
 *  start without a location, so "Match from site" has something to do. */
function placeAll(users: WidgetUser[], r: () => number) {
  for (const u of users) u.locationId = u.site.trim() ? null : pickWeighted(r, LOCS)
  return users
}

function generate(size: DataSize): WidgetUser[] {
  const r = rng(size === "demo" ? 7 : size === "2k" ? 2000 : 20000)
  if (size === "demo") {
    const users = DEMO.map(([n, l, e, s]) => makeUser(r, n, l, e, s))
    const set = (login: string, patch: Partial<WidgetUser>) => {
      const u = users.find((x) => x.loginId === login)
      if (u) Object.assign(u, patch)
    }
    // Scenarios the demo names already hint at.
    set("demogated", { registerStatus: "", lastSeen: null })
    set("demogated2", { registerStatus: "", lastSeen: null })
    set("testuser", { registerStatus: "", lastSeen: null })
    set("demo\\agent01", { registerStatus: "", lastSeen: null })
    set("demo\\aituser-01", { registerStatus: "pending_invite", lastSeen: NOW - 3 * DAY })
    set("demo\\tariq.off", { registerStatus: "registered", lastSeen: NOW - 132 * DAY })
    set("demo\\zoe.ram.crit", { registerStatus: "registered", lastSeen: NOW - 96 * DAY })
    set("demo\\maya.nogeo", { active: false })
    users.forEach((u) => { if (!["demo\\maya.nogeo"].includes(u.loginId)) u.active = true })
    return placeAll(users, r)
  }

  const n = sizeMeta[size].count
  const users: WidgetUser[] = []
  const seen = new Set<string>()
  const usedLogins = new Set<string>()
  while (users.length < n) {
    const f = FIRST[Math.floor(r() * FIRST.length)]
    const l = LAST[Math.floor(r() * LAST.length)]
    const base = `${f}.${l}`.toLowerCase()
    let local = base
    let k = 1
    while (seen.has(local)) local = `${base}${++k}`
    seen.add(local)
    // Login ID formats vary by how each customer's widgets were deployed.
    const fmt = r()
    let loginId =
      fmt < 0.6 ? `corp\\${local}` :
      fmt < 0.78 ? local :
      fmt < 0.9 ? `${local}@acme.example` :
      `ad\\${f[0].toLowerCase()}${l.toLowerCase()}`
    // Login IDs are unique per tenant (they derive the user ID), so never repeat one.
    for (let j = 2; usedLogins.has(loginId); j++) loginId = `ad\\${f[0].toLowerCase()}${l.toLowerCase()}${j}`
    usedLogins.add(loginId)
    const email = r() < 0.07 ? "" : `${local}@acme.example`
    users.push(makeUser(r, `${f} ${l}`, loginId, email, pickWeighted(r, SITES)))
  }
  // The same person added twice in different formats — the cleaning problem.
  for (let i = 0; i < Math.round(n * 0.004); i++) {
    const src = users[Math.floor(r() * users.length)]
    const alt = src.loginId.includes("\\") ? loginLocalPart(src.loginId) : `corp\\${loginLocalPart(src.loginId)}`
    if (!usedLogins.has(alt)) {
      usedLogins.add(alt)
      // Replace a random user so the total stays exactly n.
      users[Math.floor(r() * users.length)] = makeUser(r, src.name, alt, src.email, src.site)
    }
  }
  return placeAll(users, r)
}

// ------------------------------------------------------------------ store --

let state = { size: "demo" as DataSize, users: generate("demo"), version: 0 }
const listeners = new Set<() => void>()
const bump = () => { state = { ...state, version: state.version + 1 }; listeners.forEach((l) => l()) }

export const store = {
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
  version: () => state.version,
  size: () => state.size,
  all: () => state.users,
  setSize(size: DataSize) { state = { size, users: generate(size), version: state.version + 1 }; listeners.forEach((l) => l()) },
  reset() { store.setSize(state.size) },
}

export function stats() {
  const users = state.users
  const active = users.filter((u) => u.active).length
  return { total: users.length, active, inactive: users.length - active, limit: sizeMeta[state.size].limit }
}

// ------------------------------------------------------------- the query --

export type SortKey = "hash" | "name" | "added"

export interface Query {
  q: string
  connection: Connection[]
  status: ("active" | "deactivated")[]
  /** Location ids; "none" = no location. */
  location: string[]
  sort: SortKey
  /** RBAC: the locations the signed-in person may see. Unset or null = every location,
   *  including users with no location. Applied before any filter, like the server would. */
  scope?: string[] | null
}

export const emptyQuery: Query = { q: "", connection: [], status: [], location: [], sort: "hash" }

/** Search is a case-insensitive "contains" over name, login ID, email and site — as
 *  fleet-config's matchesSearch. Filters and sorts beyond that are proposed. */
export function runQuery(query: Query): WidgetUser[] {
  const q = query.q.trim().toLowerCase()
  const out = state.users.filter((u) => {
    if (q && ![u.name, u.loginId, u.email, u.site].some((v) => v.toLowerCase().includes(q))) return false
    if (query.connection.length && !query.connection.includes(connectionOf(u))) return false
    if (query.status.length && !query.status.includes(u.active ? "active" : "deactivated")) return false
    if (query.location.length && !query.location.includes(u.locationId ?? "none")) return false
    if (query.scope && !(u.locationId && query.scope.includes(u.locationId))) return false
    return true
  })
  const by: Record<SortKey, (a: WidgetUser, b: WidgetUser) => number> = {
    hash: (a, b) => a.userId.localeCompare(b.userId),
    name: (a, b) => a.name.localeCompare(b.name),
    added: (a, b) => b.createdAt - a.createdAt,
  }
  return out.sort(by[query.sort])
}

/** One "request": up to PAGE_SIZE users after `offset`, with a little latency. */
export async function fetchPage(query: Query, offset: number) {
  await new Promise((r) => setTimeout(r, 220 + Math.random() * 180))
  const rows = runQuery(query)
  return { users: rows.slice(offset, offset + PAGE_SIZE), total: rows.length, hasMore: offset + PAGE_SIZE < rows.length }
}

// --------------------------------------------------------------- mutations --

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }

export function createUser(input: { loginId: string; name: string; email: string; site: string; locationId?: string | null }): Result {
  const loginId = input.loginId.trim().toLowerCase()
  if (!loginId) return { ok: false, error: "Login ID is required." }
  if (state.users.some((u) => u.loginId === loginId)) return { ok: false, error: "A user with that login ID already exists." }
  const s = stats()
  if (s.active + 1 > s.limit) return { ok: false, error: "Number of users reached. Please contact your IR account manager to add more users to your account." }
  const now = Date.now()
  state.users = [...state.users, {
    userId: hashId(loginId), loginId, name: input.name.trim(), email: input.email.trim(), site: input.site.trim(),
    active: true, registerStatus: "", createdAt: now, updatedAt: now, lastSeen: null, locationId: input.locationId ?? null,
  }]
  bump()
  return { ok: true }
}

export function updateUser(userId: string, patch: Partial<Pick<WidgetUser, "name" | "email" | "site">>): Result {
  const u = state.users.find((x) => x.userId === userId)
  if (!u) return { ok: false, error: "That user could not be found." }
  state.users = state.users.map((x) => (x.userId === userId ? { ...x, ...patch, updatedAt: Date.now() } : x))
  bump()
  return { ok: true }
}

export function removeUsers(ids: string[]) {
  const set = new Set(ids)
  const before = state.users.length
  state.users = state.users.filter((u) => !set.has(u.userId))
  bump()
  return before - state.users.length
}

/** Deactivating is never capped; reactivating needs a free licence for each user. */
export function setActive(ids: string[], active: boolean): Result<{ changed: number }> {
  const set = new Set(ids)
  const moving = state.users.filter((u) => set.has(u.userId) && u.active !== active)
  if (active) {
    const s = stats()
    if (s.active + moving.length > s.limit)
      return { ok: false, error: `Reactivating ${moving.length.toLocaleString()} users needs ${(s.active + moving.length - s.limit).toLocaleString()} more licences than you have.` }
  }
  const moveSet = new Set(moving.map((u) => u.userId))
  state.users = state.users.map((u) => (moveSet.has(u.userId) ? { ...u, active, updatedAt: Date.now() } : u))
  bump()
  return { ok: true, changed: moving.length }
}

/** Proposed (RBAC): put users in a location, or take them out of one (null). */
export function setLocation(ids: string[], locationId: string | null): Result<{ changed: number }> {
  const set = new Set(ids)
  let changed = 0
  state.users = state.users.map((u) => {
    if (!set.has(u.userId) || u.locationId === locationId) return u
    changed++
    return { ...u, locationId, updatedAt: Date.now() }
  })
  bump()
  return { ok: true, changed }
}

/** Locations are deleted in Iris; their users lose the location. */
export function clearLocation(locationId: string) {
  state.users = state.users.map((u) => (u.locationId === locationId ? { ...u, locationId: null } : u))
  bump()
}

// --------------------------------------------------------------------- CSV --

/** Locations live in data/access.ts (which imports this file), so it hands us a
 *  resolver instead of us importing it. */
let locs: { byName: (name: string) => string | null; name: (id: string | null) => string } = { byName: () => null, name: () => "" }
export function setLocationResolver(r: typeof locs) { locs = r }

const TEMPLATE_COLS = ["loginId", "name", "email", "site", "location"] as const

const esc = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)

/** Same columns as the import template, so an export can be edited and imported back. */
export function toCsv(users: WidgetUser[]) {
  return [TEMPLATE_COLS.join(","), ...users.map((u) => [u.loginId, u.name, u.email, u.site, locs.name(u.locationId)].map(esc).join(","))].join("\n")
}

export const TEMPLATE_CSV = "loginId,name,email,site,location\ndomainname\\emma.johnson,Emma Johnson,emma.johnson@example.com,Sydney,Sydney\n"

/** Same quote-aware parser as csv-bulk-upload-modal.tsx. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1]
    if (c === '"') { if (inQuotes && n === '"') { field += '"'; i++ } else inQuotes = !inQuotes; continue }
    if (c === "," && !inQuotes) { row.push(field); field = ""; continue }
    if ((c === "\n" || c === "\r") && !inQuotes) {
      if (c === "\r" && n === "\n") i++
      row.push(field); rows.push(row); row = []; field = ""; continue
    }
    field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""))
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ------------------------------------------------ the CURRENT import (as built) --

/** csv-bulk-upload-modal.tsx validateImportFile — IROS-509: any bad row fails the file. */
export function validateCurrent(text: string): { ok: true; rows: number } | { ok: false; errors: string[]; invalidRowCount: number } {
  const rows = parseCsv(text)
  const header = rows[0]?.map((c) => c.trim()) ?? []
  const idx = new Map(header.map((c, i) => [c, i]))
  const missing = (["loginId", "name", "email"] as const).filter((c) => !idx.has(c))
  if (missing.length) return { ok: false, invalidRowCount: 0, errors: [`CSV must include columns: ${missing.join(", ")}.`] }
  const data = rows.slice(1)
  if (!data.length) return { ok: false, invalidRowCount: 0, errors: ["CSV must include at least one user row."] }
  const errors: string[] = []
  data.forEach((row, i) => {
    const v = (c: string) => (row[idx.get(c)!] ?? "").trim()
    const miss = (["loginId", "name", "email"] as const).filter((c) => !v(c))
    if (miss.length) { errors.push(`Row ${i + 2}: ${miss.join(", ")} required.`); return }
    if (!emailOk(v("email"))) errors.push(`Row ${i + 2}: email format is invalid.`)
  })
  return errors.length ? { ok: false, errors, invalidRowCount: errors.length } : { ok: true, rows: data.length }
}

/** admin_users.go ImportUsers — duplicates in the file and users already on the list
 *  are silently skipped; licence check is all-or-nothing on the number of new users. */
export function importCurrent(text: string): Result<{ imported: number }> {
  const rows = parseCsv(text)
  const idx = new Map(rows[0].map((c, i) => [c.trim(), i]))
  const seenInFile = new Set<string>()
  const existing = new Set(state.users.map((u) => u.loginId))
  const toCreate: WidgetUser[] = []
  const now = Date.now()
  for (const row of rows.slice(1)) {
    const loginId = (row[idx.get("loginId")!] ?? "").trim().toLowerCase()
    if (!loginId || seenInFile.has(loginId)) continue
    seenInFile.add(loginId)
    if (existing.has(loginId)) continue
    const get = (c: string) => (idx.has(c) ? (row[idx.get(c)!] ?? "") : "")
    toCreate.push({ userId: hashId(loginId), loginId, name: get("name"), email: get("email"), site: get("site"),
      active: true, registerStatus: "", createdAt: now, updatedAt: now, lastSeen: null, locationId: null })
  }
  const s = stats()
  if (s.active + toCreate.length > s.limit)
    return { ok: false, error: "Number of users reached. Please contact your IR account manager to add more users to your account." }
  state.users = [...state.users, ...toCreate]
  bump()
  return { ok: true, imported: toCreate.length }
}

// ------------------------------------------------- the PROPOSED import --
// One job: add new login IDs and update people already on the list. It never
// takes anyone off (that's done in the table), so skipping a bad row is safe.

export type PlanKind = "new" | "update" | "unchanged" | "invalid" | "duplicate"

export interface PlanRow {
  row: number
  loginId: string
  name?: string
  kind: PlanKind
  changes?: { field: "name" | "email" | "site" | "location"; from: string; to: string }[]
  reason?: string
  /** Imported, but something was left as it was (an unknown location name). */
  note?: string
  /** A new login ID whose username matches someone already on the list. */
  lookalike?: string
}

export interface Plan {
  rows: PlanRow[]
  counts: Record<PlanKind, number>
  lookalikes: number
  /** Problems that stop the whole file. */
  blocking: string[]
}

export function planImport(text: string): Plan {
  const rows = parseCsv(text)
  const header = rows[0]?.map((c) => c.trim()) ?? []
  const idx = new Map(header.map((c, i) => [c, i]))
  const blocking: string[] = []
  const counts: Record<PlanKind, number> = { new: 0, update: 0, unchanged: 0, invalid: 0, duplicate: 0 }
  const out: PlanRow[] = []
  const byLogin = new Map(state.users.map((u) => [u.loginId, u]))
  const byLocal = new Map<string, string>()
  state.users.forEach((u) => byLocal.set(loginLocalPart(u.loginId), u.loginId))
  const seen = new Map<string, number>()

  if (!idx.has("loginId")) blocking.push("The file needs a loginId column. Download the template to check the format.")
  const data = rows.slice(1)
  if (!data.length) blocking.push("The file has no users in it.")

  for (let i = 0; i < data.length && !blocking.length; i++) {
    const row = data[i]
    const rowNum = i + 2
    const cell = (c: string) => (idx.has(c) ? (row[idx.get(c)!] ?? "").trim() : undefined)
    const loginId = (cell("loginId") ?? "").toLowerCase()
    const name = cell("name"), email = cell("email"), site = cell("site"), location = cell("location")
    const locId = location ? locs.byName(location) : null
    const locNote = location && !locId ? `location “${location}” doesn't exist, left as it was` : undefined
    const add = (r: PlanRow) => { out.push(r); counts[r.kind]++ }

    if (!loginId) { add({ row: rowNum, loginId: "", name, kind: "invalid", reason: "no login ID" }); continue }
    if (seen.has(loginId)) { add({ row: rowNum, loginId, name, kind: "duplicate", reason: `same login ID as row ${seen.get(loginId)}` }); continue }
    seen.set(loginId, rowNum)
    if (email && !emailOk(email)) { add({ row: rowNum, loginId, name, kind: "invalid", reason: "email isn't valid" }); continue }

    const existing = byLogin.get(loginId)
    if (!existing) {
      const other = byLocal.get(loginLocalPart(loginId))
      add({ row: rowNum, loginId, name, kind: "new", lookalike: other && other !== loginId ? other : undefined, note: locNote })
      continue
    }
    // A blank cell keeps the current value.
    const changes: NonNullable<PlanRow["changes"]> = []
    if (name && name !== existing.name) changes.push({ field: "name", from: existing.name, to: name })
    if (email && email !== existing.email) changes.push({ field: "email", from: existing.email, to: email })
    if (site && site !== existing.site) changes.push({ field: "site", from: existing.site, to: site })
    if (locId && locId !== existing.locationId) changes.push({ field: "location", from: locs.name(existing.locationId), to: locs.name(locId) })
    add({ row: rowNum, loginId, name: existing.name, kind: changes.length ? "update" : "unchanged", changes, note: locNote })
  }

  const s = stats()
  const available = Math.max(s.limit - s.active, 0)
  if (counts.new > available)
    blocking.push(`This adds ${counts.new.toLocaleString()} people but you have ${available.toLocaleString()} licences left.`)

  return { rows: out, counts, lookalikes: out.filter((r) => r.lookalike).length, blocking }
}

export function applyPlan(plan: Plan, text: string) {
  const rows = parseCsv(text)
  const idx = new Map(rows[0].map((c, i) => [c.trim(), i]))
  const byRow = new Map(rows.slice(1).map((r, i) => [i + 2, r]))
  const now = Date.now()
  const summary = { added: 0, updated: 0, skipped: 0 }
  const updates = new Map<string, PlanRow>()
  const adds: WidgetUser[] = []
  for (const r of plan.rows) {
    if (r.kind === "update") { updates.set(r.loginId, r); summary.updated++ }
    else if (r.kind === "new") {
      const row = byRow.get(r.row)!
      const get = (c: string) => (idx.has(c) ? (row[idx.get(c)!] ?? "").trim() : "")
      adds.push({ userId: hashId(r.loginId), loginId: r.loginId, name: get("name"), email: get("email"), site: get("site"),
        active: true, registerStatus: "", createdAt: now, updatedAt: now, lastSeen: null, locationId: get("location") ? locs.byName(get("location")) : null })
      summary.added++
    } else if (r.kind === "invalid" || r.kind === "duplicate") summary.skipped++
  }
  state.users = [
    ...state.users.map((u) => {
      const up = updates.get(u.loginId)
      if (!up) return u
      const next = { ...u, updatedAt: now }
      up.changes?.forEach((c) => { if (c.field === "location") next.locationId = locs.byName(c.to); else next[c.field] = c.to })
      return next
    }),
    ...adds,
  ]
  bump()
  return summary
}

// ------------------------------------------------------- sample test file --

function pick<T>(xs: T[], n: number, seed: number) {
  const r = rng(seed)
  const copy = [...xs]
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]] }
  return copy.slice(0, n)
}

export const samples = {
  /** New starters, a few fixes, a lookalike, two bad rows and a duplicate. */
  addUpdate() {
    const users = state.users
    const edits = pick(users, Math.min(8, users.length), 11)
    const lines = ["loginId,name,email,site,location"]
    for (let i = 1; i <= 20; i++) lines.push(`corp\\new.starter${i},New Starter ${i},new.starter${i}@acme.example,Sydney,${i === 7 ? "Brisbane" : "Sydney"}`)
    edits.forEach((u, i) => lines.push([u.loginId, u.name, i % 2 ? `${loginLocalPart(u.loginId)}@acme.example` : u.email, i % 2 ? u.site : "Melbourne", i % 2 ? "" : "Melbourne"].map(esc).join(",")))
    const look = users.find((u) => u.loginId.includes("\\"))
    if (look) lines.push([loginLocalPart(look.loginId), look.name, look.email, look.site].map(esc).join(","))
    lines.push(",No Login,no.login@acme.example,Sydney")
    lines.push("corp\\bad.email,Bad Email,not-an-email,Sydney")
    lines.push("corp\\new.starter3,New Starter 3 again,new.starter3@acme.example,Sydney")
    return lines.join("\n")
  },
}
