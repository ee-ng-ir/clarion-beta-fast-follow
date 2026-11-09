import { BarChart3, ListOrdered, MonitorSmartphone, TrendingUp } from "lucide-react"
import { ComingSoon } from "./ComingSoon"

/** Dashboards: three fixed reports over recent history. Placeholder until built. */
export function DashboardsPage() {
  return (
    <div className="grid w-full gap-4 md:grid-cols-3">
      <ComingSoon icon={MonitorSmartphone} title="Device inventory" body="Which headsets, microphones, cameras, Windows and widget versions are in use, with counts." questions={["R4"]} />
      <ComingSoon icon={ListOrdered} title="Most common alerts" body="The top alert types over a period, by times raised and endpoints affected." questions={["R2"]} />
      <ComingSoon icon={TrendingUp} title="Alert trends" body="Whether alerts are getting better or worse over 30, 60 or 90 days." questions={["R5"]} />
      <div className="md:col-span-3">
        <ComingSoon icon={BarChart3} title="Ask Iris for a report" body="Ask in plain words and get the same chart and table as the dashboards." exploring questions={["R6", "X5"]} />
      </div>
    </div>
  )
}
