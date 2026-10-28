// Generated endpoint dataset for the Endpoints page.
// A handful of endpoints are demo agents whose state comes live from the Clarion
// widget prototype (see data/agentFeed.ts). The rest stay as generated.
// All 1,208 endpoints, with per-location healthy/warning/critical counts
// matching the Overview exactly, seeded so it's stable across renders.

import { locations, type Status } from "./dashboard"

export type Connection = "Ethernet" | "Wi-Fi"
export type Site = "Office" | "Remote"
export type Platform = "Genesys Cloud" | "Microsoft Teams" | "Zoom" | "Webex" | "Nice CXone"
/** endpoint health, plus "offline" (not reporting) */
export type EndpointStatus = Status | "offline"

/** A discrete event observed on a user (shown in the Users table "Event" column). */
export interface EndpointEvent {
  severity: Exclude<Status, "healthy">
  label: string
  /** how long ago it fired — used to pick the most recent when several criticals exist */
  minutesAgo: number
}

export interface Endpoint {
  id: string
  /** primary user on the device (= users[0]) */
  user: string
  /** all users that share this device (1–N) */
  users: string[]
  machine: string
  locationId: string
  locationName: string
  site: Site
  status: EndpointStatus
  /** Clarion Network Score 0–100, or null when unreachable */
  score: number | null
  connection: Connection
  latency: number
  jitter: number
  packetLoss: number
  isp: string
  ip: string
  team: string
  primaryPlatform: Platform
  /** derived worst-condition (internal: rollups, drilldown, alerts); null when healthy */
  primaryIssue: string | null
  /** discrete events for this user (critical/warning) */
  events: EndpointEvent[]
  /** event shown in the Users table: highest priority (critical→warning), most recent among criticals; null = healthy */
  event: string | null
  /** number of events sharing the shown priority (≥1 when an event is shown) */
  eventCount: number
  /** minutesAgo of the shown event (for the "most recent" display) */
  eventAgo: number | null
  /** minutes since last telemetry; > 5 → drilldown tabs show a staleness banner */
  lastSeenMinAgo: number
}

// ---- generation inputs -----------------------------------------------------

const prefix: Record<string, string> = {
  london: "LDN", manilla: "MNL", cebu: "CEB", newyork: "NYC", austin: "AUS",
  denver: "DEN", bangalore: "BLR", hyderabad: "HYD", sydney: "SYD",
}
const isps: Record<string, string[]> = {
  london: ["BT", "Virgin Media"],
  manilla: ["PLDT", "Globe"],
  cebu: ["PLDT", "Converge"],
  newyork: ["Verizon", "Comcast"],
  austin: ["AT&T", "Spectrum"],
  denver: ["CenturyLink", "Comcast"],
  bangalore: ["ACT Fibernet", "Airtel"],
  hyderabad: ["ACT Fibernet", "Jio"],
  sydney: ["Telstra", "Optus"],
}
const teams = [
  "Customer Support · Tier 1", "Customer Support · Tier 2", "Customer Support · Tier 3",
  "Sales", "Technical Support", "Retentions", "Onboarding",
]
const platforms: Platform[] = ["Genesys Cloud", "Microsoft Teams", "Zoom", "Webex", "Nice CXone"]
// Device-level critical events that can occur alongside network/platform ones.
const deviceCriticalEvents = [
  "Audio device driver failed", "Headset disconnected mid-call", "Camera not detected", "USB audio device removed",
]
// Per-location dominant critical metric (0 = latency, 1 = jitter, 2 = packet loss),
// so criticals concentrate on one cause → that issue reads critical, others warning.
const critBias: Record<string, number> = {
  london: 0, manilla: 2, cebu: 1, newyork: 0, austin: 1, denver: 0, bangalore: 2, hyderabad: 0, sydney: 0,
}
const firstNames = [
  "Anna", "Luis", "Sarah", "James", "Priya", "Tom", "Rahul", "Maria", "David", "Mei",
  "Omar", "Grace", "Chen", "Sofia", "Liam", "Aisha", "Noah", "Elena", "Raj", "Hana",
  "Diego", "Yuki", "Ivan", "Nora", "Sam", "Lena", "Carlos", "Fatima", "Jack", "Zara",
]
const lastNames = [
  "Reyes", "Mendoza", "Kim", "Carter", "Menon", "Wilson", "Sharma", "Santos", "Lee", "Tan",
  "Khan", "Okafor", "Wang", "Garcia", "Murphy", "Patel", "Brown", "Rossi", "Singh", "Sato",
  "Lopez", "Nakamura", "Petrov", "Hughes", "Cohen", "Novak", "Cruz", "Ali", "Walsh", "Haddad",
]

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(1337)
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
const between = (min: number, max: number) => min + rand() * (max - min)
const round = (n: number, d = 0) => Math.round(n * 10 ** d) / 10 ** d

function deriveIssue(
  status: Status,
  conn: Connection,
  latency: number,
  jitter: number,
  loss: number,
  downPlatform: Platform | null
): string | null {
  if (status === "healthy") return null
  if (downPlatform) return `${downPlatform} down`
  // choose worst offender relative to its critical threshold
  const candidates = [
    { label: conn === "Wi-Fi" ? `Wi-Fi · jitter ${jitter}ms` : `Jitter ${jitter}ms`, sev: jitter / 50 },
    { label: `Latency ${latency}ms`, sev: latency / 150 },
    { label: `Packet loss ${loss}%`, sev: loss / 3 },
  ]
  candidates.sort((a, b) => b.sev - a.sev)
  return candidates[0].label
}

function makeEndpoint(locId: string, locName: string, status: EndpointStatus, n: number): Endpoint {
  const site: Site = rand() > 0.5 ? "Office" : "Remote"
  const connection: Connection = site === "Office" ? (rand() > 0.15 ? "Ethernet" : "Wi-Fi") : "Wi-Fi"
  let latency: number, jitter: number, loss: number, score: number | null
  let downPlatform: Platform | null = null

  if (status === "offline") {
    // not reporting — no live metrics
    latency = 0; jitter = 0; loss = 0; score = null
  } else if (status === "healthy") {
    latency = round(between(8, 70)); jitter = round(between(4, 20)); loss = round(between(0, 0.6), 1)
    score = round(between(80, 99)) // Clarion Network Score, 0–100
  } else if (status === "warning") {
    // one metric in the warn band
    const which = Math.floor(rand() * 3)
    latency = round(which === 0 ? between(80, 149) : between(20, 70))
    jitter = round(which === 1 ? between(30, 49) : between(6, 22))
    loss = round(which === 2 ? between(1, 2.9) : between(0, 0.7), 1)
    score = round(between(50, 70)) // warning band
  } else {
    // critical: ~20% are an unreachable/down platform (score —)
    if (rand() < 0.2) {
      downPlatform = pick(platforms)
      latency = round(between(40, 90)); jitter = round(between(8, 25)); loss = round(between(0, 0.5), 1)
      score = null
    } else {
      // concentrate criticals on the location's dominant metric most of the time
      const which = rand() < 0.7 ? (critBias[locId] ?? Math.floor(rand() * 3)) : Math.floor(rand() * 3)
      latency = round(which === 0 ? between(150, 280) : between(40, 120))
      jitter = round(which === 1 ? between(50, 90) : between(10, 35))
      loss = round(which === 2 ? between(3, 9) : between(0.2, 2), 1)
      score = round(between(18, 45)) // critical band
    }
  }

  // a device can be shared by several users (hot-desking)
  const nUsers = rand() < 0.7 ? 1 : rand() < 0.92 ? 2 : 3
  const users: string[] = []
  while (users.length < nUsers) {
    const name = `${pick(firstNames)} ${pick(lastNames)}`
    if (!users.includes(name)) users.push(name)
  }

  // ---- discrete events for the Devices-table "Event" column ----
  const events: EndpointEvent[] = []
  if (status === "warning") {
    const label = deriveIssue(status, connection, latency, jitter, loss, downPlatform) ?? "Degraded performance"
    events.push({ severity: "warning", label, minutesAgo: round(between(2, 90)) })
    // some warning endpoints carry a second, minor warning
    if (rand() < 0.35) events.push({ severity: "warning", label: pick(["Wi-Fi signal weak", "Elevated latency", "Minor packet loss"]), minutesAgo: round(between(5, 180)) })
  } else if (status === "critical") {
    const crit: string[] = []
    if (downPlatform) crit.push(`${downPlatform} unreachable`)
    if (loss >= 3) crit.push(`Packet loss ${loss}%`)
    if (latency >= 150) crit.push(`High latency ${latency}ms`)
    if (jitter >= 50) crit.push(connection === "Wi-Fi" ? `Wi-Fi · jitter ${jitter}ms` : `Jitter ${jitter}ms`)
    if (rand() < 0.35) crit.push(pick(deviceCriticalEvents))
    if (crit.length === 0) crit.push(deriveIssue(status, connection, latency, jitter, loss, downPlatform) ?? "Degraded performance")
    for (const label of [...new Set(crit)]) events.push({ severity: "critical", label, minutesAgo: round(between(1, 180)) })
    // secondary warning-level alerts often coexist with the criticals
    const warnPool = ["Wi-Fi signal weak", "Elevated latency", "Minor packet loss", "Headset battery low", "High memory usage"]
    const nWarn = rand() < 0.45 ? 0 : rand() < 0.8 ? 1 : 2
    for (let i = 0; i < nWarn && warnPool.length; i++) {
      const [label] = warnPool.splice(Math.floor(rand() * warnPool.length), 1)
      events.push({ severity: "warning", label, minutesAgo: round(between(5, 240)) })
    }
  }
  // shown event: criticals take priority; pick the most recent within the chosen priority
  let event: string | null = null, eventCount = 0, eventAgo: number | null = null
  if (status === "offline") {
    event = "Offline"
  } else {
    const crit = events.filter((ev) => ev.severity === "critical")
    const pool = crit.length ? crit : events
    if (pool.length) {
      const chosen = pool.reduce((a, b) => (b.minutesAgo < a.minutesAgo ? b : a))
      // shown label = most recent of the highest priority; count = ALL alerts on the endpoint
      event = chosen.label; eventCount = events.length; eventAgo = chosen.minutesAgo
    }
  }

  return {
    id: `${locId}-${n}`,
    user: users[0],
    users,
    machine: `DESKTOP-${prefix[locId]}-${String(n).padStart(4, "0")}`,
    locationId: locId,
    locationName: locName,
    site,
    status,
    score,
    connection,
    latency,
    jitter,
    packetLoss: loss,
    isp: pick(isps[locId]),
    ip: `10.${Math.floor(between(10, 90))}.${Math.floor(between(1, 250))}.${Math.floor(between(1, 250))}`,
    team: pick(teams),
    primaryPlatform: downPlatform ?? pick(platforms),
    primaryIssue: status === "offline" ? "Offline" : deriveIssue(status, connection, latency, jitter, loss, downPlatform),
    events,
    event,
    eventCount,
    eventAgo,
    lastSeenMinAgo: status === "offline" ? round(between(6, 240)) : round(between(0, 4)),
  }
}

function generate(): Endpoint[] {
  const out: Endpoint[] = []
  for (const loc of locations) {
    let n = 421
    const add = (status: EndpointStatus, count: number) => {
      for (let i = 0; i < count; i++) out.push(makeEndpoint(loc.id, loc.name, status, n++))
    }
    add("critical", loc.critical)
    add("offline", loc.offline)
    add("warning", loc.warning)
    add("healthy", loc.healthy)
  }
  return out
}

export const endpoints: Endpoint[] = generate()

const endpointIndex = new Map(endpoints.map((e) => [e.id, e]))
/** Look up a single device by id (for drawer deep-linking). */
export const endpointById = (id: string): Endpoint | undefined => endpointIndex.get(id)

// ---- selectors -------------------------------------------------------------

export type SortKey = "status" | "user" | "location" | "score" | "event"
export type SortDir = "asc" | "desc"

/** Lightweight fuzzy match: every token must appear as an in-order subsequence. */
function fuzzy(hay: string, needle: string): boolean {
  let hi = 0
  for (const ch of needle) {
    hi = hay.indexOf(ch, hi)
    if (hi === -1) return false
    hi++
  }
  return true
}

const severity: Record<EndpointStatus, number> = { critical: 0, warning: 1, healthy: 2, offline: 3 }

export interface EndpointQuery {
  search?: string
  locationIds?: string[] // empty/undefined = all locations
  statuses?: EndpointStatus[] // empty/undefined = all statuses
  sortKey?: SortKey
  sortDir?: SortDir
}

export function queryEndpoints(q: EndpointQuery): Endpoint[] {
  const search = (q.search ?? "").trim().toLowerCase()
  const tokens = search ? search.split(/\s+/) : []
  let rows = endpoints.filter((e) => {
    if (q.locationIds && q.locationIds.length && !q.locationIds.includes(e.locationId)) return false
    if (q.statuses && q.statuses.length && !q.statuses.includes(e.status)) return false
    if (tokens.length) {
      // fuzzy match across Device (users + machine) / Event
      const hay = `${e.users.join(" ")} ${e.machine} ${e.event ?? ""}`.toLowerCase()
      if (!tokens.every((t) => fuzzy(hay, t))) return false
    }
    return true
  })

  const key = q.sortKey ?? "status"
  const dir = q.sortDir ?? "asc"
  const mul = dir === "asc" ? 1 : -1
  rows = [...rows].sort((a, b) => {
    switch (key) {
      case "user": return mul * a.user.localeCompare(b.user)
      case "location": return mul * a.locationName.localeCompare(b.locationName)
      case "score": return mul * ((a.score ?? -1) - (b.score ?? -1))
      case "event": return mul * (a.event ?? "").localeCompare(b.event ?? "")
      case "status":
      default: {
        // worst-first: severity, then most recent alert, then lowest score
        const s = severity[a.status] - severity[b.status]
        if (s !== 0) return mul * s
        // most recent alert first (smaller minutesAgo = more recent; no alert sorts last)
        const at = a.eventAgo ?? Infinity
        const bt = b.eventAgo ?? Infinity
        if (at !== bt) return mul * (at - bt)
        return mul * ((a.score ?? 99) - (b.score ?? 99))
      }
    }
  })
  return rows
}

// ---- Active alerts (derived from unhealthy endpoints) ----------------------

export interface ActiveAlert {
  id: string
  endpoint: Endpoint
  severity: Exclude<Status, "healthy">
  reason: string
  minutesAgo: number
}

const sev: Record<EndpointStatus, number> = { critical: 0, warning: 1, healthy: 2, offline: 3 }

export function activeAlertsForLocation(locId: string): ActiveAlert[] {
  const loc = locations.find((l) => l.id === locId)
  if (!loc) return []
  const picked = endpoints
    .filter((e) => e.locationId === locId && (e.status === "critical" || e.status === "warning"))
    .sort((a, b) => sev[a.status] - sev[b.status] || (a.score ?? 9) - (b.score ?? 9))
    .slice(0, loc.activeAlerts)
  return picked.map((e, i) => ({
    id: `al-${e.id}`,
    endpoint: e,
    severity: e.status as Exclude<Status, "healthy">,
    reason: e.primaryIssue ?? "Degraded",
    minutesAgo: 3 + i * 9,
  }))
}

export function activeAlertsAll(): ActiveAlert[] {
  return locations
    .flatMap((l) => activeAlertsForLocation(l.id))
    .sort((a, b) => sev[a.severity] - sev[b.severity] || a.minutesAgo - b.minutesAgo)
}

// ---- Alert rollups (group affected endpoints by cause) ---------------------

export type RollupCause = "platform" | "loss" | "latency" | "jitter" | "other"

export interface Rollup {
  id: string
  locationId: string
  locationName: string
  severity: Exclude<Status, "healthy">
  title: string
  cause: RollupCause
  affected: number
  endpoints: Endpoint[]
  startedMinAgo: number
}

function categorize(e: Endpoint): { cause: RollupCause; key: string; title: string } {
  const reason = (e.primaryIssue ?? "").toLowerCase()
  if (reason.endsWith("down")) return { cause: "platform", key: `platform:${e.primaryPlatform}`, title: `${e.primaryPlatform} unreachable` }
  if (reason.startsWith("packet loss")) return { cause: "loss", key: "loss", title: "Elevated packet loss" }
  if (reason.includes("jitter")) return { cause: "jitter", key: "jitter", title: "Network jitter" }
  if (reason.startsWith("latency")) return { cause: "latency", key: "latency", title: "High latency" }
  if (/headset|microphone|camera|cpu|memory|disk/.test(reason)) return { cause: "other", key: "device", title: "Agent device issues" }
  return { cause: "other", key: "other", title: "Degraded performance" }
}

// Real issues for a location, derived from its unhealthy devices (uncapped).
// Devices are grouped by cause AND severity, so each issue's `affected` count is
// the number of devices of that severity — meaning critical-issue counts and
// device totals reconcile exactly with the map tooltip's healthy/warning/critical
// breakdown. The Overview card, Issues page, KPI and right-panel all read this.
// The dataset is generated once and never mutates, so rollups are stable — cache
// per location to avoid re-scanning all ~1,208 endpoints on every render.
const rollupCache = new Map<string, Rollup[]>()

export function rollupsForLocation(locId: string): Rollup[] {
  const cached = rollupCache.get(locId)
  if (cached) return cached
  const loc = locations.find((l) => l.id === locId)
  if (!loc) return []
  const unhealthy = endpoints.filter(
    (e) => e.locationId === locId && (e.status === "critical" || e.status === "warning")
  )

  const groups = new Map<string, { title: string; cause: RollupCause; severity: Exclude<Status, "healthy">; eps: Endpoint[] }>()
  for (const e of unhealthy) {
    const { cause, key, title } = categorize(e)
    const severity = e.status as Exclude<Status, "healthy">
    const gkey = `${severity}:${key}`
    if (!groups.has(gkey)) groups.set(gkey, { title, cause, severity, eps: [] })
    groups.get(gkey)!.eps.push(e)
  }

  const result = [...groups.entries()]
    .map(([gkey, g], i) => ({
      id: `ru-${locId}-${gkey}`,
      locationId: locId,
      locationName: loc.name,
      severity: g.severity,
      title: g.title,
      cause: g.cause,
      affected: g.eps.length,
      endpoints: g.eps,
      startedMinAgo: 6 + i * 11,
    }))
    .sort((a, b) => sev[a.severity] - sev[b.severity] || b.affected - a.affected)
  rollupCache.set(locId, result)
  return result
}

let rollupsAllCache: Rollup[] | null = null

/** Live agent telemetry (from the widget) changed an endpoint — rebuild the issue rollups. */
export function invalidateEndpointCaches() {
  rollupCache.clear()
  rollupsAllCache = null
}
export function rollupsAll(): Rollup[] {
  if (!rollupsAllCache) {
    rollupsAllCache = locations
      .flatMap((l) => rollupsForLocation(l.id))
      .sort((a, b) => sev[a.severity] - sev[b.severity] || b.affected - a.affected)
  }
  return rollupsAllCache
}

// The Overview "needs attention" card = the critical slice of the same model.
export function criticalIssuesForLocation(locId: string): Rollup[] {
  return rollupsForLocation(locId).filter((r) => r.severity === "critical")
}

// ---- derived display status (so a location's dot always matches its issues) --

export function locationIssueCount(locId: string): number {
  return rollupsForLocation(locId).length
}

// Pin / dot colour reflects the worst-case real endpoint status at the location
// (matches the pin tooltip's H/W/C breakdown and AC2): any critical endpoint →
// critical, otherwise any warning → warning, else healthy. The data is kept
// consistent so a coloured location always also has ≥1 open issue.
export function locationSeverity(locId: string): Status {
  const loc = locations.find((l) => l.id === locId)
  if (!loc) return "healthy"
  if (loc.critical > 0) return "critical"
  if (loc.warning > 0) return "warning"
  return "healthy"
}

export function countryIssueCount(countryId: string): number {
  return locations.filter((l) => l.countryId === countryId).reduce((s, l) => s + locationIssueCount(l.id), 0)
}

export function countrySeverity(countryId: string): Status {
  const cities = locations.filter((l) => l.countryId === countryId)
  if (cities.some((l) => locationSeverity(l.id) === "critical")) return "critical"
  if (cities.some((l) => locationSeverity(l.id) === "warning")) return "warning"
  return "healthy"
}
