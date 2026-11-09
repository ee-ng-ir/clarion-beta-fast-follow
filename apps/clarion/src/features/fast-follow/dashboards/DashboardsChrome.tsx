import { ChevronRight } from "lucide-react"
import { DASH_BLURB, DASH_TITLE, showDashboard, useDashboards } from "./store"

/**
 * Breadcrumb tail for the top bar: "Dashboards › Device inventory". It follows
 * the hierarchy, not the path taken (D8).
 */
export function DashboardsCrumb() {
  const { view } = useDashboards()
  if (view === "home") return <span className="shrink-0 whitespace-nowrap text-label-md text-content-neutral-emphasis md:text-body-md" aria-current="page">Dashboards</span>
  return (
    <>
      <button type="button" onClick={() => showDashboard("home")}
        className="shrink-0 whitespace-nowrap rounded-xs text-body-md text-content-neutral-muted outline-none hover:text-content-neutral-emphasis hover:underline focus-visible:ring-2 focus-visible:ring-line-focused">
        Dashboards
      </button>
      <ChevronRight className="size-4 shrink-0 text-content-neutral-subtle" aria-hidden />
      <span className="truncate whitespace-nowrap text-label-md text-content-neutral-emphasis md:text-body-md" aria-current="page">{DASH_TITLE[view]}</span>
    </>
  )
}

/** Page title and one line on what it's for, for whichever dashboard is open. */
export function DashboardsTitle() {
  const { view } = useDashboards()
  return <>{view === "home" ? "Dashboards" : DASH_TITLE[view]}</>
}
export function DashboardsSubtitle() {
  const { view } = useDashboards()
  return <>{view === "home" ? "Fleet-wide summaries over recent history. Spot trends, export evidence and save the views you check often." : DASH_BLURB[view]}</>
}
