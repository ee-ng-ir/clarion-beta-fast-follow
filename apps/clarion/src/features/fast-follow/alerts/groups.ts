// Alert groups: one group per alert TYPE across the fleet (not per location),
// built from the same endpoint dataset the rest of Clarion uses, so counts
// reconcile with Overview and Endpoints. Timings, recurrence and notification
// state are synthetic but seeded, so the demo is stable between reloads.

import { endpoints, type Endpoint } from "@/data/endpoints"
import { ALERT_TYPES, alertType, type AlertType } from "./catalogue"
import { getSettings, isTypeOn } from "../settings/store"

export type Severity = "critical" | "warning"

export interface LocationShare { id: string; name: string; count: number }

export interface AlertGroup {
  id: string
  type: AlertType
  /** name at the group's current (highest) severity */
  title: string
  severity: Severity
  counts: { critical: number; warning: number }
  endpoints: Endpoint[]
  /** IP-derived location (as on the map), largest first. Never the customer Site (X3). */
  locations: LocationShare[]
  firstSeenMinAgo: number
  lastSeenMinAgo: number
  /** times this alert type opened a group in the last 7 days, including this one */
  recurrenceThisWeek: number
  recoveredSoFar: number
  /** endpoints in the group with Windows energy saver on (context, never an alert) */
  energySaverOn: number
  /** proactive email sent, and when (null = no significance rule met) */
  notifiedMinAgo: number | null
  notifiedReason: string | null
  /** one rule-based sentence across the group's endpoints (E2) */
  evidence: string
  /** Top issues: fixed, rule-based score and the reason it ranks where it does */
  score: number
  reason: string
  closed?: { minutesAgo: number; lastedMin: number; peak: number }
}

// ---- classify each unhealthy endpoint into one alert type --------------------

export function classify(e: Endpoint): string {
  const issue = (e.primaryIssue ?? "").toLowerCase()
  const labels = e.events.map((ev) => ev.label.toLowerCase()).join(" | ")
  if (issue.endsWith("down")) return `platform:${e.primaryPlatform}`
  if (e.status === "critical" && /headset disconnected|audio device|usb audio/.test(labels)) return "audio-device"
  // The generated data only carries network causes, so a stable ~30% of warning
  // endpoints are given system alerts (CPU, storage, memory, battery) for the demo.
  if (e.status === "warning") {
    const h = hash(e.id) % 20
    if (h < 3) return "cpu"
    if (h < 5) return "storage"
    if (h < 6) return "memory"
  }
  if (issue.startsWith("wi-fi")) return "wifi"
  if (/latency|jitter|packet loss/.test(issue)) return "call-quality"
  return "call-quality"
}

function hash(s: string) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }
const seeded = (key: string, min: number, max: number) => min + (hash(key) % (max - min + 1))

// ---- significance rule for proactive notifications (A7 defaults, to confirm) --

/** The tenancy's saved notification rules (Settings › Notifications). */
export const notifyRules = () => getSettings().notify

function notification(sev: Severity, n: number, firstSeen: number): { at: number | null; why: string | null } {
  const r = notifyRules()
  if (sev !== "critical" || !r.enabled || r.recipients.length === 0) return { at: null, why: null }
  if (n >= r.minEndpoints) return { at: Math.max(1, firstSeen - 7), why: `${r.minEndpoints} or more endpoints affected` }
  if (firstSeen > r.minMinutes) return { at: firstSeen - r.minMinutes, why: `Critical for longer than ${r.minMinutes} minutes` }
  return { at: null, why: null }
}

// ---- Top issues score (A4: weights to confirm with Product) ------------------

const SCORE = { critical: 100, warning: 40, perEndpoint: 1.5, perRecurrence: 8 }

function rank(sev: Severity, n: number, recurrence: number) {
  return SCORE[sev] + Math.min(n, 200) * SCORE.perEndpoint + (recurrence - 1) * SCORE.perRecurrence
}

const pct = (a: number, b: number) => Math.round((a / b) * 100)

function evidenceFor(t: AlertType, eps: Endpoint[], locs: LocationShare[], energy: number): string {
  const top = locs[0]
  const concentrated = top && top.count / eps.length >= 0.6
  const where = concentrated ? `mostly at ${top.name} (${top.count} of ${eps.length})` : `spread across ${locs.length} locations`
  const wifi = eps.filter((e) => e.connection === "Wi-Fi").length
  switch (t.category) {
    case "network": {
      const avgLoss = (eps.reduce((s, e) => s + e.packetLoss, 0) / eps.length).toFixed(1)
      const avgLat = Math.round(eps.reduce((s, e) => s + e.latency, 0) / eps.length)
      return `Affected endpoints are ${where}. ${pct(wifi, eps.length)}% are on Wi-Fi. Packet loss averages ${avgLoss}% and latency ${avgLat} ms. Start with ${concentrated ? `the network at ${top.name}` : t.lookFirst}.`
    }
    case "platform":
      return `Endpoints ${where} can't reach the platform, while other platforms on the same endpoints respond normally. This points to the platform or the route to it, not the PCs. Check ${t.lookFirst}.`
    case "system":
      return energy > 0
        ? `Energy saver was on for ${energy} of ${eps.length} endpoints when this was raised, which throttles the CPU. Start with ${t.lookFirst}.`
        : `Affected endpoints are ${where}. No shared network cause; this is local to each PC. Start with ${t.lookFirst}.`
    case "devices":
      return `Affected endpoints are ${where}. Each lost its playback device mid-session. Start with ${t.lookFirst}.`
  }
}

function reasonFor(g: Pick<AlertGroup, "severity" | "endpoints" | "locations" | "recurrenceThisWeek" | "energySaverOn">) {
  const parts = [g.severity === "critical" ? "Critical" : "Warning", `${g.endpoints.length} endpoint${g.endpoints.length === 1 ? "" : "s"}`]
  const top = g.locations[0]
  if (top && top.count / g.endpoints.length >= 0.6) parts.push(top.name)
  else parts.push(`${g.locations.length} locations`)
  if (g.recurrenceThisWeek > 2) parts.push(`recurring ${g.recurrenceThisWeek} times this week`)
  if (g.energySaverOn > 0) parts.push(`energy saver on for ${g.energySaverOn}`)
  return parts.join(" · ")
}

// ---- build ------------------------------------------------------------------

let cache: AlertGroup[] | null = null
let cacheKey = -1

/** Active alert groups, highest Top-issues score first. Pass the feed version to rebuild on live changes. */
export function activeGroups(version = 0): AlertGroup[] {
  const key = version * 100000 + getSettings().version
  if (cache && cacheKey === key) return cache
  const byType = new Map<string, Endpoint[]>()
  for (const e of endpoints) {
    if (e.status !== "critical" && e.status !== "warning") continue
    const id = classify(e)
    if (!isTypeOn(id)) continue // turned off: no alert, no group, no email (the data still shows)
    if (!byType.has(id)) byType.set(id, [])
    byType.get(id)!.push(e)
  }
  const groups: AlertGroup[] = []
  for (const [typeId, eps] of byType) {
    const type = alertType(typeId)
    const counts = { critical: eps.filter((e) => e.status === "critical").length, warning: eps.filter((e) => e.status === "warning").length }
    const severity: Severity = counts.critical > 0 ? "critical" : "warning"
    const locMap = new Map<string, LocationShare>()
    for (const e of eps) {
      const l = locMap.get(e.locationId) ?? { id: e.locationId, name: e.locationName, count: 0 }
      l.count++; locMap.set(e.locationId, l)
    }
    const locations = [...locMap.values()].sort((a, b) => b.count - a.count)
    const firstSeen = seeded(typeId + "first", 8, 190)
    const recurrence = type.category === "system" ? seeded(typeId + "rec", 2, 6) : seeded(typeId + "rec", 1, 3)
    const energy = typeId === "cpu" ? Math.round(eps.length * 0.8) : 0
    const notify = notification(severity, eps.length, firstSeen)
    const g: AlertGroup = {
      id: `grp-${typeId}`, type, title: severity === "critical" ? type.critical : type.warning, severity, counts,
      endpoints: [...eps].sort((a, b) => (a.status === b.status ? 0 : a.status === "critical" ? -1 : 1)),
      locations, firstSeenMinAgo: firstSeen, lastSeenMinAgo: seeded(typeId + "last", 0, 6),
      recurrenceThisWeek: recurrence, recoveredSoFar: seeded(typeId + "rcv", 0, Math.max(1, Math.round(eps.length / 8))),
      energySaverOn: energy, notifiedMinAgo: notify.at, notifiedReason: notify.why,
      evidence: evidenceFor(type, eps, locations, energy),
      score: rank(severity, eps.length, recurrence), reason: "",
    }
    g.reason = reasonFor(g)
    groups.push(g)
  }
  cache = groups.sort((a, b) => b.score - a.score)
  cacheKey = key
  return cache
}

/** Recently closed groups (every endpoint recovered). Illustrative. */
export function closedGroups(): AlertGroup[] {
  const mk = (typeId: string, peak: number, minutesAgo: number, lastedMin: number, loc: string): AlertGroup => {
    const type = alertType(typeId)
    return {
      id: `grp-closed-${typeId}`, type, title: type.critical, severity: "critical", counts: { critical: 0, warning: 0 },
      endpoints: [], locations: [{ id: loc.toLowerCase(), name: loc, count: peak }], firstSeenMinAgo: minutesAgo + lastedMin,
      lastSeenMinAgo: minutesAgo, recurrenceThisWeek: 1, recoveredSoFar: peak, energySaverOn: 0, notifiedMinAgo: minutesAgo + lastedMin - 7,
      notifiedReason: `${notifyRules().minEndpoints} or more endpoints affected`, evidence: "", score: 0,
      reason: `Peaked at ${peak} endpoints · lasted ${lastedMin} min`, closed: { minutesAgo, lastedMin, peak },
    }
  }
  return [mk("platform:Zoom", 41, 95, 52, "London"), mk("wifi", 23, 300, 34, "Manila")]
}

export const groupById = (id: string, version = 0) =>
  activeGroups(version).find((g) => g.id === id) ?? closedGroups().find((g) => g.id === id)

export const ALL_TYPES = ALERT_TYPES
