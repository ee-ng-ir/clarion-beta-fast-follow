import { useMemo } from "react"
import { listName } from "../alerts/names"
import {
  Button, Card, CardContent, CardDescription, CardHeader, CardHeaderText, CardTitle,
  SegmentedControl, SegmentedControlItem, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TimeSeriesChart,
} from "@ir/ui"
import { ALERT_TYPES, categoryLabel } from "../alerts/catalogue"
import { DashboardActions } from "./DashboardActions"
import { downloadCsv } from "./csv"
import { filtered, fmtWeeks, locationName, LOCATIONS, SITES, spanLabel, spanOf, weekly, weeks } from "./data"
import { PeriodControl } from "./PeriodControl"
import { DataAsOf } from "./DataAsOf"
import { COUNTING_NOTE, MEASURE_LABEL, patchTrends, useDashboards, type Measure } from "./store"
import { useSettings } from "../settings/store"
import { OffNotice } from "../OffNotice"

const RANGES = [30, 60, 90]
const MAX_LINES = 5
const typeOptions = ALERT_TYPES.map((t) => ({ value: t.id, label: listName(t), group: categoryLabel[t.category] }))
const locationOptions = LOCATIONS.map((l) => ({ value: l.id, label: l.name }))
const siteOptions = SITES.map((s) => ({ value: s, label: s }))
const NO_SITES: string[] = []

/** Up or down over the period: the last two weeks against the first two, so one noisy week doesn't decide it. */
function direction(points: number[]) {
  if (points.length < 4) return null
  const a = points[0] + points[1]
  const b = points[points.length - 1] + points[points.length - 2]
  if (!a && !b) return null
  const ch = a ? Math.round(((b - a) / a) * 100) : 100
  return Math.abs(ch) < 10 ? "about the same" : ch > 0 ? `up ${ch}%` : `down ${Math.abs(ch)}%`
}

/**
 * Alert trends: is a problem growing, recurring or fixed? Week by week over
 * 30, 60 or 90 days, one line per location picked (or the whole fleet).
 */
export function TrendsDashboard() {
  const { trends: st } = useDashboards()
  const { version: settingsVersion } = useSettings()
  const sp = useMemo(() => spanOf(st.days, st.range), [st.days, st.range])
  const wk = weeks(sp.days, sp.end)
  const period = spanLabel(sp)
  const sites = st.sites ?? NO_SITES
  const series = useMemo(() => {
    const lines = st.locations.slice(0, MAX_LINES)
    const groups = lines.length ? lines.map((id) => ({ id, label: locationName(id), locs: [id] })) : [{ id: "all", label: "All locations", locs: [] as string[] }]
    return groups.map((g) => ({ id: g.id, label: g.label, points: weekly(filtered({ days: Math.ceil(sp.days / 7) * 7, end: sp.end, types: st.types, locations: g.locs, sites }), sp.days, st.measure, sp.end) }))
  }, [sp, st.types, st.measure, st.locations, sites, settingsVersion]) // eslint-disable-line react-hooks/exhaustive-deps
  const lines = st.locations.slice(0, MAX_LINES)

  const what = st.types.length === 0 ? "All alerts" : st.types.length === 1 ? listName(ALERT_TYPES.find((t) => t.id === st.types[0])!) : `${st.types.length} alerts`
  const summary = series.map((s) => { const d = direction(s.points); return d ? (s.id === "all" ? d : `${s.label}: ${d}`) : null }).filter(Boolean).join(" · ")

  const exportCsv = () => downloadCsv(`Alert-trends_${what}_${period.replace(/[^A-Za-z0-9]+/g, "-")}`,
    ["Alert trends", `${what} · ${MEASURE_LABEL[st.measure]} per week`, ...(sites.length ? [`Site: ${sites.join(", ")}`] : []), `${wk.length} weeks (${fmtWeeks(sp.days, sp.end)})`, COUNTING_NOTE],
    [["Week starting", ...series.map((s) => s.label)], ...wk.map((w, i) => [w.label, ...series.map((s) => s.points[i])])])

  return (
    <div data-dashboard-root className="@container flex w-full flex-col gap-4">
      <Card data-export-skip>
        <CardContent className="flex-row flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <PeriodControl presets={RANGES} days={st.days} range={st.range} presetLabel={(d) => `${d} days`}
              onPreset={(d) => patchTrends({ days: d, range: undefined })} onRange={(r) => patchTrends({ range: r })} />
            <Select size="sm" icon={null} showDetail={false} label="Alert" className="w-auto" options={typeOptions} value={st.types} onValueChange={(v) => patchTrends({ types: v })} />
            <Select size="sm" icon={null} showDetail={false} label="Location" className="w-auto" options={locationOptions} value={st.locations} onValueChange={(v) => patchTrends({ locations: v.slice(0, MAX_LINES) })} />
            <Select size="sm" icon={null} showDetail={false} label="Site" className="w-auto" options={siteOptions} value={sites} onValueChange={(v) => patchTrends({ sites: v })} />
            {(st.types.length + st.locations.length + sites.length) > 0 && <Button variant="ghost" size="sm" onClick={() => patchTrends({ types: [], locations: [], sites: [] })}>Clear filters</Button>}
          </div>
          <DashboardActions view="trends" suggestedName={`${what} · ${lines.length ? lines.map(locationName).join(" vs ") : "all locations"}${sites.length ? ` · ${sites.join(", ")}` : ""} · ${period}`} onExport={exportCsv} />
        </CardContent>
      </Card>
      <DataAsOf view="trends" />

      <OffNotice types={st.types} />
      <Card>
        <CardHeader>
          <CardHeaderText>
            <CardTitle>{what}</CardTitle>
            <CardDescription>{summary ? `${period}${lines.length ? ", " : ": "}${summary}.` : `${period}.`}</CardDescription>
          </CardHeaderText>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <SegmentedControl aria-label="Measure" size="sm" className="self-start" value={st.measure} onValueChange={(v) => v && patchTrends({ measure: v as Measure })}>
            <SegmentedControlItem value="times">Times raised</SegmentedControlItem>
            <SegmentedControlItem value="endpoints">Endpoints affected</SegmentedControlItem>
          </SegmentedControl>
          <TimeSeriesChart
            x={wk.map((w) => w.label)}
            series={series}
            title={`${MEASURE_LABEL[st.measure]} per week`}
            subtitle={`${fmtWeeks(sp.days, sp.end)} · ${wk.length} weeks, each labelled by the day it starts`}
            yLabel={MEASURE_LABEL[st.measure]}
            xLabel="Week starting"
            yZero
            format={(v) => Math.round(v).toLocaleString()}
            label={`${what}: ${MEASURE_LABEL[st.measure].toLowerCase()} per week, ${period.toLowerCase()}, ${series.map((s) => s.label).join(", ")}.`}
          />
          <p className="text-body-xs text-content-neutral-muted">{COUNTING_NOTE}{st.locations.length > MAX_LINES ? ` Showing the first ${MAX_LINES} locations.` : ""}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Week by week</CardTitle></CardHeader>
        <Table size="sm" aria-label={`${what} week by week`}>
          <TableHeader>
            <TableRow>
              <TableHead align="start">Week starting</TableHead>
              {series.map((s) => <TableHead key={s.id} numeric>{s.label}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...wk].reverse().map((w, ri) => {
              const i = wk.length - 1 - ri
              return (
                <TableRow key={w.label}>
                  <TableCell align="start">{w.label}</TableCell>
                  {series.map((s) => <TableCell key={s.id} numeric>{s.points[i].toLocaleString()}</TableCell>)}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
