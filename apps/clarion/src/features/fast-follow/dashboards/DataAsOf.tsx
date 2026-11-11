import { historyStart } from "./data"
import type { DashId } from "./store"

const time = (d: Date) => d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })
const date = (d: Date) => d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })

/**
 * How fresh a dashboard's data is and how far back its history goes, under the
 * filters on every dashboard, so a short history isn't read as a trend
 * (Dashboards epic: "data as of" always stated; R5).
 */
export function DataAsOf({ view }: { view: DashId }) {
  const now = time(new Date())
  return (
    <p className="text-body-xs text-content-neutral-muted">
      {view === "inventory"
        ? `Data as of ${now} · the latest report from each endpoint; offline endpoints show what they last reported`
        : `Data as of ${now} · history from ${date(historyStart())}`}
    </p>
  )
}
