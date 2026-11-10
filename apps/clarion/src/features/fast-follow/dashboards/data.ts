// Dashboards data: 90 days of synthetic alert history and a device inventory,
// both built from the same endpoints the rest of the demo uses. Seeded, so the
// numbers are stable between reloads and match the endpoint drawer.
// Demo only — the real history starts on release day (R5).

import { endpoints, type Endpoint } from "@/data/endpoints"
import { locations } from "@/data/dashboard"
import { ALERT_TYPES, alertType, categoryLabel, type AlertCategory } from "../alerts/catalogue"
import { headsetFor } from "../headsets/headsets"
import { getSettings } from "../settings/store"

/** 14 full weeks, so a 90-day trend is 13 whole weeks */
export const HISTORY_DAYS = 98
const DAY = 86400000

function hash(s: string) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }
function rng(seed: string) { let a = hash(seed) || 1; return () => { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return ((a >>> 0) % 100000) / 100000 } }

// ---- locations ---------------------------------------------------------------

export const LOCATIONS = locations.map((l) => ({ id: l.id, name: l.name }))
export const locationName = (id: string) => LOCATIONS.find((l) => l.id === id)?.name ?? id

export function endpointsIn(locIds: string[]): Endpoint[] {
  return locIds.length ? endpoints.filter((e) => locIds.includes(e.locationId)) : endpoints
}

// ---- inventory ---------------------------------------------------------------

export type InvCategory = "headset" | "microphone" | "camera" | "windows" | "widget"
export const INV_LABEL: Record<InvCategory, string> = {
  headset: "Headsets", microphone: "Microphones", camera: "Cameras", windows: "Windows versions", widget: "Clarion widget versions",
}
/** How a picked device or version reads as a filter: "Headset: Jabra Evolve2 75", "Windows 10 22H2", "Widget v2.4.0". */
export function invValueLabel(cat: InvCategory, value: string) {
  if (cat === "windows") return value
  if (cat === "widget") return `Widget v${value}`
  return `${{ headset: "Headset", microphone: "Microphone", camera: "Camera" }[cat]}: ${value}`
}

function weighted<T>(r: number, mix: [T, number][]): T {
  let n = r * mix.reduce((s, [, w]) => s + w, 0)
  for (const [v, w] of mix) { if (n < w) return v; n -= w }
  return mix[mix.length - 1][0]
}

export const CAMERAS = ["Logitech C920 HD Pro", "Logitech Brio 4K", "Poly Studio P5", "Dell UltraSharp WB7022", "Integrated webcam"]
// Manila and Cebu run older builds: the story the Windows 10 tile tells.
const windowsMix = (loc: string): [string, number][] =>
  loc === "manilla" || loc === "cebu"
    ? [["Windows 11 24H2", 30], ["Windows 11 23H2", 34], ["Windows 10 22H2", 36]]
    : [["Windows 11 24H2", 58], ["Windows 11 23H2", 34], ["Windows 10 22H2", 8]]
const WIDGET_MIX: [string, number][] = [["2.4.1", 71], ["2.4.0", 21], ["2.3.2", 8]]
export const LATEST_WIDGET = "2.4.1"

export interface Inventory {
  headset: string
  microphone: string
  camera: string
  windows: string
  widget: string
}

const invCache = new Map<string, Omit<Inventory, "headset" | "microphone">>()
/** The devices and versions an endpoint reports. The headset comes from the approved-headsets model. */
export function inventoryFor(e: Endpoint): Inventory {
  let base = invCache.get(e.id)
  if (!base) {
    const r = rng(e.id + "inventory")
    base = {
      camera: weighted(r(), CAMERAS.map((c, i) => [c, [30, 18, 12, 8, 32][i]] as [string, number])),
      windows: weighted(r(), windowsMix(e.locationId)),
      widget: weighted(r(), WIDGET_MIX),
    }
    invCache.set(e.id, base)
  }
  const h = headsetFor(e)
  return {
    ...base,
    headset: h ? h.model : "No headset",
    microphone: h ? `${h.model} (headset mic)` : base.camera === "Integrated webcam" ? "Laptop microphone" : "Webcam microphone",
  }
}

export interface InvRow { key: string; count: number }
export function inventoryCounts(eps: Endpoint[], cat: InvCategory): InvRow[] {
  const m = new Map<string, number>()
  for (const e of eps) { const k = inventoryFor(e)[cat]; m.set(k, (m.get(k) ?? 0) + 1) }
  return [...m].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
}

// ---- alert history -----------------------------------------------------------

/** One raise of one alert on one endpoint, `day` days ago (0 = today). */
export interface Raise { day: number; typeId: string; ep: number; critical: boolean }

// raises per endpoint per day, before location and trend effects
const BASE_RATE: Record<string, number> = {
  "call-quality": 0.010, wifi: 0.009, cpu: 0.007, memory: 0.004, storage: 0.0015, battery: 0.002, "audio-device": 0.005,
}
const PLATFORM_RATE = 0.0006

/** The stories the trends tell: what got worse, what got fixed, what spiked. */
function effect(typeId: string, loc: string, day: number): number {
  const ago = day / HISTORY_DAYS // 1 = 90 days ago, 0 = today
  let f = 1
  if (typeId === "wifi" && loc === "manilla") f *= 0.6 + 2.2 * (1 - ago)          // Manila Wi-Fi: steadily worse
  if (typeId === "wifi" && loc === "cebu") f *= 1.3                                  // Cebu: high but flat
  if (typeId === "call-quality" && loc === "cebu") f *= day > 34 ? 2.4 : 0.7         // Cebu ISP change 5 weeks ago fixed it
  if (typeId === "cpu" && loc === "hyderabad") f *= 2.2                               // under-specced PCs
  if (typeId === "cpu" && (loc === "manilla" || loc === "cebu")) f *= 1.4
  if (typeId === "memory" && loc === "newyork") f *= day < 21 ? 2.6 : 1               // new CRM build 3 weeks ago
  if (typeId === "platform:Genesys Cloud" && (day === 18 || day === 19)) f *= 60      // Genesys outage
  if (typeId === "platform:Zoom" && day === 52) f *= 45                               // Zoom outage
  if (typeId === "platform:Microsoft Teams" && day === 9) f *= 30
  const dow = new Date(Date.now() - day * DAY).getDay()
  if (dow === 0 || dow === 6) f *= 0.25                                               // contact centres are quieter at weekends
  return f
}

let history: Raise[] | null = null
/** All raises over the last 90 days, oldest first. Computed once. */
export function alertHistory(): Raise[] {
  if (history) return history
  const out: Raise[] = []
  const byLoc = new Map<string, number[]>()
  endpoints.forEach((e, i) => { const a = byLoc.get(e.locationId) ?? []; a.push(i); byLoc.set(e.locationId, a) })
  for (const t of ALERT_TYPES) {
    const rate = BASE_RATE[t.id] ?? PLATFORM_RATE
    for (const [loc, idx] of byLoc) {
      const r = rng(`${t.id}|${loc}`)
      // repeat offenders: a fifth of the endpoints take most of the raises
      const hot = idx.filter(() => r() < 0.2)
      const pool = t.id === "wifi" ? idx.filter((i) => endpoints[i].connection === "Wi-Fi") : idx
      if (!pool.length) continue
      for (let day = HISTORY_DAYS - 1; day >= 0; day--) {
        const mean = pool.length * rate * effect(t.id, loc, day)
        // Poisson-ish: mean plus noise, never negative
        const n = Math.max(0, Math.round(mean + (r() - 0.5) * 2 * Math.sqrt(mean + 0.3)))
        for (let k = 0; k < n; k++) {
          const from = hot.length && r() < 0.6 ? hot : pool
          out.push({ day, typeId: t.id, ep: from[Math.floor(r() * from.length)], critical: r() < 0.3 })
        }
      }
    }
  }
  history = out.sort((a, b) => b.day - a.day)
  return history
}

export interface HistoryFilter {
  days: number
  locations: string[]
  types: string[]
  severity: ("critical" | "warning")[]
  categories: AlertCategory[]
}

export function filtered(f: Partial<HistoryFilter>): Raise[] {
  const days = f.days ?? HISTORY_DAYS
  // D10: an alert that's off isn't evaluated, so nothing is recorded from the moment it was turned off
  const { offSince } = getSettings()
  const offFromDay = Object.fromEntries(Object.entries(offSince).map(([id, d]) => [id, Math.floor((Date.now() - d.getTime()) / DAY)]))
  return alertHistory().filter((x) => {
    if (x.day >= days) return false
    if (x.typeId in offFromDay && x.day <= offFromDay[x.typeId]) return false
    const e = endpoints[x.ep]
    if (f.locations?.length && !f.locations.includes(e.locationId)) return false
    if (f.types?.length && !f.types.includes(x.typeId)) return false
    if (f.severity?.length === 1 && (f.severity[0] === "critical") !== x.critical) return false
    if (f.categories?.length && !f.categories.includes(alertType(x.typeId).category)) return false
    return true
  })
}

export interface AlertRank {
  typeId: string
  name: string
  category: string
  times: number
  endpoints: number
  critical: number
}

/**
 * Most common alerts. "Times raised" counts every raise on every endpoint;
 * "Endpoints affected" counts each endpoint once however often it was raised (R2).
 * A type is named by its Warning wording, its Critical share shown alongside.
 */
export function commonAlerts(rs: Raise[]): AlertRank[] {
  const m = new Map<string, { times: number; eps: Set<number>; critical: number }>()
  for (const x of rs) {
    const a = m.get(x.typeId) ?? { times: 0, eps: new Set(), critical: 0 }
    a.times++; a.eps.add(x.ep); if (x.critical) a.critical++
    m.set(x.typeId, a)
  }
  return [...m].map(([typeId, a]) => {
    const t = alertType(typeId)
    return { typeId, name: t.warning, category: categoryLabel[t.category], times: a.times, endpoints: a.eps.size, critical: a.critical }
  })
}

export interface Offender { e: Endpoint; times: number; lastDay: number }
export function affectedEndpoints(rs: Raise[], typeId: string): Offender[] {
  const m = new Map<number, Offender>()
  for (const x of rs) {
    if (x.typeId !== typeId) continue
    const o = m.get(x.ep) ?? { e: endpoints[x.ep], times: 0, lastDay: x.day }
    o.times++; o.lastDay = Math.min(o.lastDay, x.day)
    m.set(x.ep, o)
  }
  return [...m.values()].sort((a, b) => b.times - a.times || a.lastDay - b.lastDay)
}

// ---- weeks -------------------------------------------------------------------

export const dayDate = (day: number) => new Date(Date.now() - day * DAY)
export const fmtDay = (d: Date) => d.toLocaleDateString("en-AU", { day: "numeric", month: "short" })
export const fmtRange = (days: number) => `${fmtDay(dayDate(days - 1))} – ${fmtDay(dayDate(0))} ${dayDate(0).getFullYear()}`

/** Whole 7-day weeks covering the last `days`, oldest first. The last week ends today. */
export function weeks(days: number): { label: string; start: number; end: number }[] {
  const n = Math.ceil(days / 7)
  return Array.from({ length: n }, (_, i) => {
    const end = (n - 1 - i) * 7
    return { label: fmtDay(dayDate(end + 6)), start: end + 6, end }
  })
}
/** The dates the weeks cover, e.g. "6 Oct – 9 Nov 2026". */
export const fmtWeeks = (days: number) => fmtRange(Math.ceil(days / 7) * 7)

export function weekly(rs: Raise[], days: number, measure: "times" | "endpoints"): number[] {
  return weeks(days).map((w) => {
    const inWeek = rs.filter((x) => x.day <= w.start && x.day >= w.end)
    return measure === "times" ? inWeek.length : new Set(inWeek.map((x) => x.ep)).size
  })
}

export const dayAgo = (day: number) => (day === 0 ? "Today" : day === 1 ? "Yesterday" : `${day} days ago`)
