import { useMemo } from "react"
import { ArrowRight, BarChart3, Boxes, TrendingUp, Trash2 } from "lucide-react"
import {
  Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardHeaderText, CardTitle, EmptyState,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import type { Endpoint } from "@/data/endpoints"
import { ComingSoon } from "./ComingSoon"
import { complianceFor, useHeadsetsVersion } from "./headsets/headsets"
import { CommonAlertsDashboard } from "./dashboards/CommonAlertsDashboard"
import { InventoryDashboard } from "./dashboards/InventoryDashboard"
import { TrendsDashboard } from "./dashboards/TrendsDashboard"
import { commonAlerts, endpointsIn, filtered, weekly } from "./dashboards/data"
import { describeSaved, savedAgo } from "./dashboards/describe"
import { DASH_BLURB, DASH_TITLE, deleteSaved, openSaved, showDashboard, useDashboards, type DashId } from "./dashboards/store"

const ICON: Record<DashId, typeof BarChart3> = { inventory: Boxes, alerts: BarChart3, trends: TrendingUp }

/**
 * Dashboards: three fixed dashboards over recent history (R1: name to confirm),
 * plus the ones you've saved. Each dashboard is its own page under Dashboards,
 * with the breadcrumb following the hierarchy (D8).
 */
export function DashboardsPage({ onOpenEndpoint }: { onOpenEndpoint: (rows: Endpoint[], index: number) => void }) {
  const { view } = useDashboards()
  if (view === "inventory") return <InventoryDashboard onOpenEndpoint={onOpenEndpoint} />
  if (view === "alerts") return <CommonAlertsDashboard onOpenEndpoint={onOpenEndpoint} />
  if (view === "trends") return <TrendsDashboard />
  return <DashboardsHome />
}

function useHeadlines(): Record<DashId, string> {
  const { approved } = useHeadsetsVersion()
  return useMemo(() => {
    const eps = endpointsIn([])
    const ok = eps.filter((e) => complianceFor(e, approved) === "approved").length
    const top = commonAlerts(filtered({ days: 30 })).sort((a, b) => b.times - a.times)[0]
    const wifi = weekly(filtered({ days: 90, types: ["wifi"], locations: ["manilla"] }), 90, "times")
    const ch = Math.round((((wifi.at(-2) ?? 0) + (wifi.at(-3) ?? 0)) / Math.max(1, wifi[0] + wifi[1]) - 1) * 100)
    return {
      inventory: `${eps.length.toLocaleString()} endpoints · ${approved.length ? `${Math.round((ok / eps.length) * 100)}% of headsets approved` : "no approved headset list yet"}`,
      alerts: top ? `Last 30 days: ${top.name}, raised ${top.times.toLocaleString()} times` : "No alerts in the last 30 days",
      trends: `Weak Wi-Fi in Manila is ${ch >= 0 ? `up ${ch}%` : `down ${-ch}%`} over 90 days`,
    }
  }, [approved])
}

function DashboardsHome() {
  const { saved } = useDashboards()
  const headline = useHeadlines()
  return (
    <div className="@container flex w-full flex-col gap-4">
      <div className="grid gap-4 @3xl:grid-cols-3">
        {(["inventory", "alerts", "trends"] as DashId[]).map((id) => {
          const Icon = ICON[id]
          return (
            <Card key={id} className="cursor-pointer transition-colors hover:border-line-neutral-emphasis" onClick={() => showDashboard(id)}>
              <CardHeader>
                <CardHeaderText>
                  <CardTitle className="flex items-center gap-2"><Icon className="size-4 text-content-neutral-muted" aria-hidden />{DASH_TITLE[id]}</CardTitle>
                  <CardDescription>{DASH_BLURB[id]}</CardDescription>
                </CardHeaderText>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-end gap-3">
                <p className="text-label-md text-content-neutral-emphasis">{headline[id]}</p>
                <Button variant="outline" size="sm" className="self-start" onClick={(e) => { e.stopPropagation(); showDashboard(id) }}>
                  Open <ArrowRight aria-hidden />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardHeaderText>
            <CardTitle>Saved dashboards</CardTitle>
            <CardDescription>A dashboard with its filters and date range. Save one from any dashboard.</CardDescription>
          </CardHeaderText>
          {saved.length > 0 && <CardAction><span className="text-body-sm text-content-neutral-muted">{saved.length} saved</span></CardAction>}
        </CardHeader>
        {saved.length === 0 ? (
          <CardContent>
            <EmptyState size="sm" illustration="dashboards" title="Nothing saved yet" description="Open a dashboard, set the filters you check often, then choose Save." />
          </CardContent>
        ) : (
          <Table size="sm" aria-label="Saved dashboards">
            <TableHeader>
              <TableRow>
                <TableHead align="start">Name</TableHead>
                <TableHead align="start" className="hidden @3xl:table-cell">Dashboard</TableHead>
                <TableHead align="start" className="hidden @4xl:table-cell">Filters</TableHead>
                <TableHead align="end" className="hidden @2xl:table-cell">Saved</TableHead>
                <TableHead align="end"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {saved.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => openSaved(s)}>
                  <TableCell align="start">
                    <button type="button" onClick={(e) => { e.stopPropagation(); openSaved(s) }}
                      className="rounded-xs text-start text-label-md text-content-neutral-emphasis outline-none hover:underline focus-visible:ring-2 focus-visible:ring-line-focused">
                      {s.name}
                    </button>
                  </TableCell>
                  <TableCell align="start" className="hidden @3xl:table-cell">{DASH_TITLE[s.view]}</TableCell>
                  <TableCell align="start" className="hidden text-content-neutral-muted @4xl:table-cell">{describeSaved(s)}</TableCell>
                  <TableCell align="end" className="hidden text-content-neutral-muted @2xl:table-cell">{s.by} · {savedAgo(s.savedAt)}</TableCell>
                  <TableCell align="end">
                    <Button variant="ghost" size="icon-sm" aria-label={`Delete ${s.name}`} onClick={(e) => { e.stopPropagation(); deleteSaved(s.id) }}><Trash2 /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <ComingSoon illustration="assistant" title="Ask Iris for a dashboard" body="Ask in plain words, like “Weak Wi-Fi in Manila over 90 days”, and Iris opens the matching dashboard with those filters, so the numbers always match." exploring questions={["R6", "X5"]} />
    </div>
  )
}
