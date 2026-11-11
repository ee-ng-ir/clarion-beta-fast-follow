// Which dashboard is open, the filters on each, and the saved dashboards.
// Saved dashboards keep a dashboard, its filters and its date range (PO prototype).

import { useSyncExternalStore } from "react"
import type { DayRange } from "./data"

export type DashId = "inventory" | "alerts" | "trends"
export type View = "home" | DashId
export type Measure = "times" | "endpoints"
export const MEASURE_LABEL: Record<Measure, string> = { times: "Times raised", endpoints: "Endpoints affected" }
export const COUNTING_NOTE = "Times raised counts every time an alert was raised on an endpoint. Endpoints affected counts each endpoint once, however often it was raised."

export interface InventoryState {
  locations: string[]
  /** customer-assigned sites (G3); optional so saved dashboards from before keep working */
  sites?: string[]
  tab: "summary" | "endpoints"
  /** "category|value" keys picked on the summary or in the filter: OR within a category, AND across */
  filters: string[]
  q: string
}
export interface AlertsState {
  days: number
  /** a custom From–To period; when set it wins over `days`, and a saved dashboard keeps its dates */
  range?: DayRange
  locations: string[]
  sites?: string[]
  severity: string[]
  categories: string[]
  rank: Measure
  selected: string | null
}
export interface TrendsState {
  days: number
  /** a custom From–To period; when set it wins over `days`, and a saved dashboard keeps its dates */
  range?: DayRange
  types: string[]
  locations: string[]
  sites?: string[]
  measure: Measure
}
export type DashState = { inventory: InventoryState; alerts: AlertsState; trends: TrendsState }

export interface SavedDashboard {
  id: string
  name: string
  view: DashId
  state: InventoryState | AlertsState | TrendsState
  savedAt: number
  by: string
}

export const DASH_TITLE: Record<DashId, string> = {
  inventory: "Device inventory",
  alerts: "Most common alerts",
  trends: "Alert trends",
}
export const DASH_BLURB: Record<DashId, string> = {
  inventory: "Which devices and versions are in use, and which headsets are approved.",
  alerts: "The alerts raised most often over a period, by times raised or endpoints affected.",
  trends: "Whether an alert is growing, recurring or fixed. Compare locations week by week.",
}

/** Each dashboard's address under /dashboards, so Back, Forward and links land on it. */
export const DASH_SLUG: Record<DashId, string> = {
  inventory: "device-inventory",
  alerts: "most-common-alerts",
  trends: "alert-trends",
}
/** The slug for a view, or none for the Dashboards landing page. */
export const dashSlug = (view: View) => (view === "home" ? undefined : DASH_SLUG[view])
/** Which view a path shows: null when it isn't under Dashboards; an unknown slug falls back to the landing page. */
export function viewFromPath(path: string): View | null {
  const m = path.replace(/\/+$/, "").match(/^\/dashboards(?:\/([^/]+))?$/)
  if (!m) return null
  return (Object.keys(DASH_SLUG) as DashId[]).find((id) => DASH_SLUG[id] === m[1]) ?? "home"
}

const DEFAULTS: DashState = {
  inventory: { locations: [], sites: [], tab: "summary", filters: [], q: "" },
  alerts: { days: 30, locations: [], sites: [], severity: [], categories: [], rank: "times", selected: null },
  trends: { days: 90, types: [], locations: [], sites: [], measure: "times" },
}

const H = 3600000
const SEED: SavedDashboard[] = [
  { id: "seed-1", name: "Manila Wi-Fi vs Cebu", view: "trends", by: "Alex Kim", savedAt: Date.now() - 26 * H,
    state: { days: 90, types: ["wifi"], locations: ["manilla", "cebu"], measure: "times" } },
  { id: "seed-2", name: "Windows 10 in the Philippines", view: "inventory", by: "Alex Kim", savedAt: Date.now() - 5 * 24 * H,
    state: { locations: ["manilla", "cebu"], tab: "endpoints", filters: ["windows|Windows 10 22H2"], q: "" } },
  { id: "seed-3", name: "Top alerts this month", view: "alerts", by: "Alex Kim", savedAt: Date.now() - 12 * 24 * H,
    state: { ...DEFAULTS.alerts } },
  // samples of what Iris builds from its four suggestions, with the same filters it sets
  { id: "sample-wifi", name: "Weak Wi-Fi by site", view: "trends", by: "Alex Kim", savedAt: Date.now() - 2 * H,
    state: { days: 30, types: ["wifi"], locations: ["manilla", "cebu", "london"], measure: "times" } },
  { id: "sample-headsets", name: "Headsets that aren't approved", view: "inventory", by: "Alex Kim", savedAt: Date.now() - 3 * H,
    state: { locations: [], tab: "endpoints", filters: ["compliance|not-approved"], q: "" } },
  { id: "sample-call-quality", name: "Call quality this week", view: "alerts", by: "Alex Kim", savedAt: Date.now() - 4 * H,
    state: { ...DEFAULTS.alerts, days: 7, selected: "call-quality" } },
  { id: "sample-recurring", name: "Alerts that keep coming back", view: "alerts", by: "Alex Kim", savedAt: Date.now() - 6 * H,
    state: { ...DEFAULTS.alerts, days: 30, selected: "wifi" } },
]

const SAVED_KEY = "ff:saved-dashboards:v2"
const VIEW_KEY = "ff:dashboard-view:v2"
const read = <T,>(store: Storage | undefined, key: string, fallback: T): T => {
  try { const v = store?.getItem(key); return v ? (JSON.parse(v) as T) : fallback } catch { return fallback }
}
const write = (store: Storage | undefined, key: string, v: unknown) => { try { store?.setItem(key, JSON.stringify(v)) } catch { /* in-memory only */ } }
const ss = typeof window === "undefined" ? undefined : window.sessionStorage
const ls = typeof window === "undefined" ? undefined : window.localStorage

interface Store extends DashState { view: View; saved: SavedDashboard[] }
const persisted = read<Partial<Store>>(ss, VIEW_KEY, {})
// the address wins over the remembered view, so a link or a reload opens the dashboard it names
const urlView = typeof window === "undefined" ? null : viewFromPath(window.location.pathname)
// seeds added after someone has saved dashboards are added once, beside theirs; deleting one keeps it deleted
const SEEDED_KEY = "ff:saved-dashboards:seeded"
function loadSaved(): SavedDashboard[] {
  const saved = read<SavedDashboard[]>(ls, SAVED_KEY, SEED)
  // before this key existed, the first three seeds had already been offered
  const seeded = read<string[]>(ls, SEEDED_KEY, ["seed-1", "seed-2", "seed-3"])
  const fresh = SEED.filter((s) => !seeded.includes(s.id) && !saved.some((x) => x.id === s.id))
  write(ls, SEEDED_KEY, SEED.map((s) => s.id))
  if (!fresh.length) return saved
  const next = [...fresh, ...saved]
  write(ls, SAVED_KEY, next)
  return next
}
let state: Store = { ...DEFAULTS, ...persisted, view: urlView ?? persisted.view ?? "home", saved: loadSaved() }
const subs = new Set<() => void>()
function set(next: Partial<Store>) {
  state = { ...state, ...next }
  write(ss, VIEW_KEY, { view: state.view, inventory: state.inventory, alerts: state.alerts, trends: state.trends })
  if ("saved" in next) write(ls, SAVED_KEY, state.saved)
  subs.forEach((f) => f())
}

export const useDashboards = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f) } }, () => state)
export const showDashboard = (view: View) => set({ view })
export const patchInventory = (p: Partial<InventoryState>) => set({ inventory: { ...state.inventory, ...p } })
export const patchAlerts = (p: Partial<AlertsState>) => set({ alerts: { ...state.alerts, ...p } })
export const patchTrends = (p: Partial<TrendsState>) => set({ trends: { ...state.trends, ...p } })
export const resetFilters = (id: DashId) => set({ [id]: DEFAULTS[id] } as Partial<Store>)

export function openSaved(s: SavedDashboard) {
  set({ view: s.view, [s.view]: { ...DEFAULTS[s.view], ...s.state } } as Partial<Store>)
}
export function saveDashboard(view: DashId, name: string) {
  const s: SavedDashboard = { id: `s-${Date.now()}`, name, view, state: state[view], savedAt: Date.now(), by: "You" }
  set({ saved: [s, ...state.saved] })
  return s
}
export const deleteSaved = (id: string) => set({ saved: state.saved.filter((s) => s.id !== id) })

// ---- Iris-built dashboards -----------------------------------------------------------

export type AnyDashState = InventoryState | AlertsState | TrendsState

/** Open a dashboard with a given set of filters, e.g. one Iris has just built. */
export function openWith(view: DashId, st: Partial<AnyDashState>) {
  set({ view, [view]: { ...DEFAULTS[view], ...st } } as Partial<Store>)
}
/** Save a dashboard from a spec, not from whatever is on screen. Iris builds it; you keep it. */
export function saveSpec(view: DashId, name: string, st: Partial<AnyDashState>) {
  const s: SavedDashboard = { id: `s-${Date.now()}`, name, view, state: { ...DEFAULTS[view], ...st } as AnyDashState, savedAt: Date.now(), by: "You" }
  set({ saved: [s, ...state.saved] })
  return s
}
export const isSaved = (name: string) => state.saved.some((s) => s.name === name)
