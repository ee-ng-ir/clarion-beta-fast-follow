// Which dashboard is open, the filters on each, and the saved dashboards.
// Saved dashboards keep a dashboard, its filters and its date range (PO prototype).

import { useSyncExternalStore } from "react"

export type DashId = "inventory" | "alerts" | "trends"
export type View = "home" | DashId
export type Measure = "times" | "endpoints"
export const MEASURE_LABEL: Record<Measure, string> = { times: "Times raised", endpoints: "Endpoints affected" }
export const COUNTING_NOTE = "Times raised counts every time an alert was raised on an endpoint. Endpoints affected counts each endpoint once, however often it was raised."

export interface InventoryState {
  locations: string[]
  tab: "summary" | "endpoints"
  /** "category|value" keys picked on the summary or in the filter: OR within a category, AND across */
  filters: string[]
  q: string
}
export interface AlertsState {
  days: number
  locations: string[]
  severity: string[]
  categories: string[]
  rank: Measure
  selected: string | null
}
export interface TrendsState {
  days: number
  types: string[]
  locations: string[]
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
  inventory: "Which headsets, microphones, cameras, Windows and widget versions are in use, and which headsets are approved.",
  alerts: "The alerts raised most often over a period, by times raised or endpoints affected.",
  trends: "Whether an alert is growing, recurring or fixed. Compare locations week by week.",
}

const DEFAULTS: DashState = {
  inventory: { locations: [], tab: "summary", filters: [], q: "" },
  alerts: { days: 30, locations: [], severity: [], categories: [], rank: "times", selected: null },
  trends: { days: 90, types: [], locations: [], measure: "times" },
}

const H = 3600000
const SEED: SavedDashboard[] = [
  { id: "seed-1", name: "Manila Wi-Fi vs Cebu", view: "trends", by: "Alex Kim", savedAt: Date.now() - 26 * H,
    state: { days: 90, types: ["wifi"], locations: ["manilla", "cebu"], measure: "times" } },
  { id: "seed-2", name: "Windows 10 in the Philippines", view: "inventory", by: "Alex Kim", savedAt: Date.now() - 5 * 24 * H,
    state: { locations: ["manilla", "cebu"], tab: "endpoints", filters: ["windows|Windows 10 22H2"], q: "" } },
  { id: "seed-3", name: "Top alerts this month", view: "alerts", by: "Alex Kim", savedAt: Date.now() - 12 * 24 * H,
    state: { ...DEFAULTS.alerts } },
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
let state: Store = { ...DEFAULTS, ...persisted, view: persisted.view ?? "home", saved: read(ls, SAVED_KEY, SEED) }
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
