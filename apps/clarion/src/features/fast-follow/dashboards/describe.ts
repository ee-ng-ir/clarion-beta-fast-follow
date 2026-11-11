import { complianceLabel, type Compliance } from "@ir/telemetry"
import { categoryLabel, ALERT_TYPES, type AlertCategory } from "../alerts/catalogue"
import { invValueLabel, locationName, scopeLabel, spanLabel, spanOf, type InvCategory } from "./data"
import { listName } from "../alerts/names"
import type { AlertsState, InventoryState, SavedDashboard, TrendsState } from "./store"


/** One line saying what a saved dashboard shows: its range and filters. */
export function describeSaved(s: SavedDashboard): string {
  if (s.view === "inventory") {
    const st = s.state as InventoryState
    const f = st.filters.map((k) => {
      const [c, ...v] = k.split("|")
      return c === "compliance" ? `Headset ${complianceLabel[v.join("|") as Compliance].toLowerCase()}` : invValueLabel(c as InvCategory, v.join("|"))
    })
    return [scopeLabel(st.locations, st.sites), ...f].join(" · ")
  }
  if (s.view === "alerts") {
    const st = s.state as AlertsState
    return [spanLabel(spanOf(st.days, st.range)), scopeLabel(st.locations, st.sites), ...st.severity, ...st.categories.map((c) => categoryLabel[c as AlertCategory])].join(" · ")
  }
  const st = s.state as TrendsState
  const what = st.types.length ? st.types.map((t) => (() => { const a = ALERT_TYPES.find((x) => x.id === t); return a ? listName(a) : t })()).join(", ") : "All alerts"
  return [spanLabel(spanOf(st.days, st.range)), what, st.locations.length ? st.locations.map(locationName).join(" vs ") : "All locations", ...(st.sites?.length ? [`Site: ${st.sites.join(", ")}`] : [])].join(" · ")
}

export function savedAgo(t: number) {
  const m = Math.round((Date.now() - t) / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.round(h / 24)
  return d === 1 ? "yesterday" : `${d} days ago`
}
