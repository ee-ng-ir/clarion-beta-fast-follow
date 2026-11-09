import { complianceLabel, type Compliance } from "@ir/telemetry"
import { categoryLabel, ALERT_TYPES, type AlertCategory } from "../alerts/catalogue"
import { invValueLabel, locationName, type InvCategory } from "./data"
import type { AlertsState, InventoryState, SavedDashboard, TrendsState } from "./store"

const places = (ids: string[]) => (ids.length ? ids.map(locationName).join(", ") : "All locations")

/** One line saying what a saved dashboard shows: its range and filters. */
export function describeSaved(s: SavedDashboard): string {
  if (s.view === "inventory") {
    const st = s.state as InventoryState
    const f = st.filters.map((k) => {
      const [c, ...v] = k.split("|")
      return c === "compliance" ? `Headset ${complianceLabel[v.join("|") as Compliance].toLowerCase()}` : invValueLabel(c as InvCategory, v.join("|"))
    })
    return [places(st.locations), ...f].join(" · ")
  }
  if (s.view === "alerts") {
    const st = s.state as AlertsState
    return [`Last ${st.days} days`, places(st.locations), ...st.severity, ...st.categories.map((c) => categoryLabel[c as AlertCategory])].join(" · ")
  }
  const st = s.state as TrendsState
  const what = st.types.length ? st.types.map((t) => ALERT_TYPES.find((x) => x.id === t)?.warning ?? t).join(", ") : "All alerts"
  return [`${st.days} days`, what, st.locations.length ? st.locations.map(locationName).join(" vs ") : "All locations"].join(" · ")
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
