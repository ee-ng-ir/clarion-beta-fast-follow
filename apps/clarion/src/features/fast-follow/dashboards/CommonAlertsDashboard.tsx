import { useMemo } from "react"
import { X } from "lucide-react"
import {
  BarChart, Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardHeaderText, CardTitle, EmptyState,
  SegmentedControl, SegmentedControlItem, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import type { Endpoint } from "@/data/endpoints"
import { alertType, categoryLabel, type AlertCategory } from "../alerts/catalogue"
import { AlertIcon } from "../alerts/bits"
import { DashboardActions, ExportMenu } from "./DashboardActions"
import { downloadCsv } from "./csv"
import { affectedEndpoints, commonAlerts, dayAgo, dayDate, filtered, fmtDay, fmtRange, fmtWeeks, LOCATIONS, scopeLabel, siteOf, SITES, spanLabel, spanOf, weekly, weeks, type Raise, type Span } from "./data"
import { PeriodControl } from "./PeriodControl"
import { DataAsOf } from "./DataAsOf"
import { useSettings } from "../settings/store"
import { OffNotice } from "../OffNotice"
import { COUNTING_NOTE, MEASURE_LABEL, patchAlerts, patchTrends, showDashboard, useDashboards, type Measure } from "./store"

const PERIODS = [7, 30, 90]
const locationOptions = LOCATIONS.map((l) => ({ value: l.id, label: l.name }))
const siteOptions = SITES.map((s) => ({ value: s, label: s }))
const NO_SITES: string[] = []
const severityOptions = [{ value: "critical", label: "Critical" }, { value: "warning", label: "Warning" }]
const categoryOptions = (Object.keys(categoryLabel) as AlertCategory[]).map((c) => ({ value: c, label: categoryLabel[c] }))
const OFFENDERS_SHOWN = 10

/**
 * Most common alerts over a period, ranked by times raised or endpoints affected.
 * Pick an alert to see its week-by-week count and the endpoints it hit most.
 */
/** Up to this many days, the chart goes day by day: too few for whole weeks. */
const BY_DAY_MAX = 14
/** Each day of a span, oldest first (0 = today). */
const daysOf = (sp: Span) => Array.from({ length: sp.days }, (_, i) => sp.end + sp.days - 1 - i)
/** One count per day: every raise, or each endpoint once a day. */
function daily(rs: Raise[], measure: Measure, sp: Span): number[] {
  return daysOf(sp).map((d) => {
    const onDay = rs.filter((x) => x.day === d)
    return measure === "times" ? onDay.length : new Set(onDay.map((x) => x.ep)).size
  })
}

export function CommonAlertsDashboard({ onOpenEndpoint }: { onOpenEndpoint: (rows: Endpoint[], index: number) => void }) {
  const { alerts: st } = useDashboards()
  const { version: settingsVersion } = useSettings()
  const sites = st.sites ?? NO_SITES
  const sp = useMemo(() => spanOf(st.days, st.range), [st.days, st.range])
  const period = spanLabel(sp)
  const dates = fmtRange(sp.days, sp.end)
  const raises = useMemo(() => filtered({ days: sp.days, end: sp.end, locations: st.locations, sites, severity: st.severity as ("critical" | "warning")[], categories: st.categories as AlertCategory[] }),
    [sp, st.locations, sites, st.severity, st.categories, settingsVersion]) // eslint-disable-line react-hooks/exhaustive-deps
  const ranked = useMemo(() => commonAlerts(raises).sort((a, b) => (st.rank === "times" ? b.times - a.times : b.endpoints - a.endpoints)), [raises, st.rank])
  const sel = ranked.find((r) => r.typeId === st.selected) ?? null
  const offenders = useMemo(() => (sel ? affectedEndpoints(raises, sel.typeId) : []), [raises, sel])
  // the chart counts whole weeks, so it reaches a few days further back than the table
  const selRaises = useMemo(() => (sel ? filtered({ days: sp.days > BY_DAY_MAX ? Math.ceil(sp.days / 7) * 7 : sp.days, end: sp.end, types: [sel.typeId], locations: st.locations, sites, severity: st.severity as ("critical" | "warning")[] }) : []),
    [sel, sp, st.locations, sites, st.severity])
  const total = raises.length

  const scope = scopeLabel(st.locations, sites)
  const extra = [st.severity.length === 1 ? (st.severity[0] === "critical" ? "Critical only" : "Warning only") : null, st.categories.length ? st.categories.map((c) => categoryLabel[c as AlertCategory]).join(", ") : null].filter(Boolean)

  const exportCsv = () => downloadCsv(`Most-common-alerts_${period.replace(/[^A-Za-z0-9]+/g, "-")}`,
    ["Most common alerts", sp.custom ? dates : `${period} (${dates})`, `Scope: ${scope}`, ...extra.map(String), COUNTING_NOTE],
    [["Rank", "Alert", "Category", "Times raised", "Endpoints affected", "Critical"], ...ranked.map((r, i) => [i + 1, r.name, r.category, r.times, r.endpoints, r.critical])])

  const exportOffenders = () => {
    if (!sel) return
    downloadCsv(`${sel.name}_endpoints_${period.replace(/[^A-Za-z0-9]+/g, "-")}`, [`${sel.name}: endpoints affected`, sp.custom ? dates : `${period} (${dates})`, `Scope: ${scope}`],
      [["User", "Machine", "Location", "Site", "Times raised", "Last raised"], ...offenders.map((o) => [o.e.user, o.e.machine, o.e.locationName, siteOf(o.e), o.times, dayAgo(o.lastDay)])])
  }

  const openTrend = () => {
    if (!sel) return
    patchTrends({ types: [sel.typeId], locations: st.locations.slice(0, 4), sites, days: Math.max(30, st.days), range: sp.custom && sp.days >= 28 ? st.range : undefined, measure: st.rank })
    showDashboard("trends")
  }

  const sum = ranked.reduce((n, x) => n + (st.rank === "times" ? x.times : x.endpoints), 0) || 1
  return (
    <div className="@container flex w-full flex-col gap-4">
      <Card>
        <CardContent className="flex-row flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <PeriodControl presets={PERIODS} days={st.days} range={st.range} presetLabel={(d) => `Last ${d} days`}
              onPreset={(d) => patchAlerts({ days: d, range: undefined })} onRange={(r) => patchAlerts({ range: r })} />
            <Select showDetail={false} label="Location" className="w-40" options={locationOptions} value={st.locations} onValueChange={(v) => patchAlerts({ locations: v })} />
            <Select showDetail={false} label="Site" className="w-40" options={siteOptions} value={sites} onValueChange={(v) => patchAlerts({ sites: v })} />
            <Select showDetail={false} label="Severity" className="w-36" options={severityOptions} value={st.severity} onValueChange={(v) => patchAlerts({ severity: v })} />
            <Select showDetail={false} label="Category" className="w-40" options={categoryOptions} value={st.categories} onValueChange={(v) => patchAlerts({ categories: v })} />
          </div>
          <DashboardActions view="alerts" suggestedName={`Top alerts · ${period.toLowerCase()} · ${scope}`} onExport={exportCsv} />
        </CardContent>
      </Card>
      <DataAsOf view="alerts" />

      <OffNotice />
      <Card>
        <CardHeader>
          <CardHeaderText>
            <CardTitle>Most common alerts</CardTitle>
            <CardDescription>{dates} · {scope}{extra.length ? ` · ${extra.join(" · ")}` : ""} · {total.toLocaleString()} raised in total</CardDescription>
          </CardHeaderText>
          <CardAction>
            <SegmentedControl aria-label="Rank by" size="sm" value={st.rank} onValueChange={(v) => v && patchAlerts({ rank: v as Measure })}>
              <SegmentedControlItem value="times">Times raised</SegmentedControlItem>
              <SegmentedControlItem value="endpoints">Endpoints affected</SegmentedControlItem>
            </SegmentedControl>
          </CardAction>
        </CardHeader>
        {ranked.length === 0 ? (
          <CardContent>
            <EmptyState size="sm" illustration="activity-log" title="No alerts in this period" description="Nothing matches these filters. Try a longer period or clear a filter."
              action={<Button variant="outline" size="sm" onClick={() => patchAlerts({ locations: [], sites: [], severity: [], categories: [] })}>Clear filters</Button>} />
          </CardContent>
        ) : (
          <Table size="sm" aria-label="Most common alerts">
            <TableHeader>
              <TableRow>
                <TableHead numeric className="w-10">#</TableHead>
                <TableHead align="start">Alert</TableHead>
                <TableHead align="start" className="hidden @3xl:table-cell">Category</TableHead>
                <TableHead numeric>{MEASURE_LABEL[st.rank]}</TableHead>
                <TableHead numeric className="hidden @2xl:table-cell">{MEASURE_LABEL[st.rank === "times" ? "endpoints" : "times"]}</TableHead>
                <TableHead numeric className="hidden @3xl:table-cell">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranked.map((r, i) => {
                const t = alertType(r.typeId)
                const main = st.rank === "times" ? r.times : r.endpoints
                const other = st.rank === "times" ? r.endpoints : r.times
                const selected = r.typeId === st.selected
                return (
                  <TableRow key={r.typeId} className="cursor-pointer" data-state={selected ? "selected" : undefined} aria-selected={selected}
                    onClick={() => patchAlerts({ selected: selected ? null : r.typeId })}>
                    <TableCell numeric className="text-content-neutral-subtle">{i + 1}</TableCell>
                    <TableCell align="start">
                      <div className="flex items-center gap-3">
                        <AlertIcon icon={t.icon} severity={r.critical * 2 > r.times ? "critical" : "warning"} />
                        <button type="button" onClick={(ev) => { ev.stopPropagation(); patchAlerts({ selected: selected ? null : r.typeId }) }}
                          className="rounded-xs text-start text-label-md text-content-neutral-emphasis outline-none hover:underline focus-visible:ring-2 focus-visible:ring-line-focused">
                          {r.name}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell align="start" className="hidden @3xl:table-cell">{r.category}</TableCell>
                    <TableCell numeric className="text-label-md text-content-neutral-emphasis">{main.toLocaleString()}</TableCell>
                    <TableCell numeric className="hidden text-content-neutral-muted @2xl:table-cell">{other.toLocaleString()}</TableCell>
                    <TableCell numeric className="hidden text-content-neutral-muted @3xl:table-cell">{Math.round((main / sum) * 100)}%</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
        <CardContent className="text-body-xs text-content-neutral-muted">{COUNTING_NOTE}</CardContent>
      </Card>

      {sel && (
        <Card>
          <CardHeader>
            <CardHeaderText>
              <CardTitle>{sel.name}</CardTitle>
              <CardDescription>
                {sel.times.toLocaleString()} times on {sel.endpoints.toLocaleString()} endpoints · {sel.critical.toLocaleString()} at Critical ({alertType(sel.typeId).critical}) · {sp.custom ? dates : period.toLowerCase()}
              </CardDescription>
            </CardHeaderText>
            <CardAction className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={openTrend}>See the trend</Button>
              <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => patchAlerts({ selected: null })}><X /></Button>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-6 @4xl:grid-cols-2">
            {/* two weeks or less is too short for weeks, so it shows day by day: never an empty half of the card */}
            {sp.days > BY_DAY_MAX ? (
              <BarChart size="sm"
                x={weeks(sp.days, sp.end).map((w) => w.label)}
                series={[{ id: sel.typeId, label: MEASURE_LABEL[st.rank], points: weekly(selRaises, sp.days, st.rank, sp.end) }]}
                title={`${MEASURE_LABEL[st.rank]} by week`}
                subtitle={`${fmtWeeks(sp.days, sp.end)} · whole weeks`}
                yLabel={MEASURE_LABEL[st.rank]}
                xLabel="Week starting"
                label={`${sel.name}: ${MEASURE_LABEL[st.rank].toLowerCase()} each week, ${dates}.`} />
            ) : (
              <BarChart size="sm"
                x={daysOf(sp).map((d) => fmtDay(dayDate(d)))}
                series={[{ id: sel.typeId, label: MEASURE_LABEL[st.rank], points: daily(selRaises, st.rank, sp) }]}
                title={`${MEASURE_LABEL[st.rank]} by day`}
                subtitle={dates}
                yLabel={MEASURE_LABEL[st.rank]}
                xLabel="Day"
                label={`${sel.name}: ${MEASURE_LABEL[st.rank].toLowerCase()} each day, ${dates}.`} />
            )}
            <div className="flex min-w-0 flex-col gap-2">
              <h3 className="text-label-lg text-content-neutral-emphasis">Endpoints it hit most</h3>
              <Table size="sm" aria-label={`Endpoints affected by ${sel.name}`}>
                <TableHeader>
                  <TableRow>
                    <TableHead align="start">User / Machine</TableHead>
                    <TableHead align="start" className="hidden @2xl:table-cell">Location</TableHead>
                    <TableHead numeric>Times</TableHead>
                    <TableHead align="end">Last raised</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offenders.slice(0, OFFENDERS_SHOWN).map((o, i) => (
                    <TableRow key={o.e.id} className="cursor-pointer" onClick={() => onOpenEndpoint(offenders.map((x) => x.e), i)}>
                      <TableCell align="start">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-label-md text-content-neutral-emphasis">{o.e.user}</span>
                          <span className="truncate font-mono text-body-xs text-content-neutral-muted">{o.e.machine}</span>
                        </div>
                      </TableCell>
                      <TableCell align="start" className="hidden @2xl:table-cell">{o.e.locationName}</TableCell>
                      <TableCell numeric>{o.times}</TableCell>
                      <TableCell align="end" className="text-content-neutral-muted">{dayAgo(o.lastDay)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-body-xs text-content-neutral-muted">
                  {offenders.length > OFFENDERS_SHOWN ? `Top ${OFFENDERS_SHOWN} of ${offenders.length.toLocaleString()}` : `All ${offenders.length.toLocaleString()}`}
                </span>
                <ExportMenu onCsv={exportOffenders} label={`Export all ${offenders.length.toLocaleString()}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
