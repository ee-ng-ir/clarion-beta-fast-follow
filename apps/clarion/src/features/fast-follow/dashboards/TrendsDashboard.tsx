import { useMemo } from "react"
import {
  Card, CardContent, CardDescription, CardHeader, CardHeaderText, CardTitle,
  SegmentedControl, SegmentedControlItem, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TimeSeriesChart,
} from "@ir/ui"
import { ALERT_TYPES, categoryLabel } from "../alerts/catalogue"
import { DashboardActions } from "./DashboardActions"
import { downloadCsv } from "./csv"
import { filtered, fmtWeeks, locationName, LOCATIONS, weekly, weeks } from "./data"
import { COUNTING_NOTE, MEASURE_LABEL, patchTrends, useDashboards, type Measure } from "./store"
import { useSettings } from "../settings/store"
import { OffNotice } from "../OffNotice"

const RANGES = [30, 60, 90]
const MAX_LINES = 5
const typeOptions = ALERT_TYPES.map((t) => ({ value: t.id, label: t.warning, group: categoryLabel[t.category] }))
const locationOptions = LOCATIONS.map((l) => ({ value: l.id, label: l.name }))

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
  const wk = weeks(st.days)
  const series = useMemo(() => {
    const lines = st.locations.slice(0, MAX_LINES)
    const groups = lines.length ? lines.map((id) => ({ id, label: locationName(id), locs: [id] })) : [{ id: "all", label: "All locations", locs: [] as string[] }]
    return groups.map((g) => ({ id: g.id, label: g.label, points: weekly(filtered({ days: Math.ceil(st.days / 7) * 7, types: st.types, locations: g.locs }), st.days, st.measure) }))
  }, [st.days, st.types, st.measure, st.locations, settingsVersion]) // eslint-disable-line react-hooks/exhaustive-deps
  const lines = st.locations.slice(0, MAX_LINES)

  const what = st.types.length === 0 ? "All alerts" : st.types.length === 1 ? ALERT_TYPES.find((t) => t.id === st.types[0])!.warning : `${st.types.length} alerts`
  const summary = series.map((s) => { const d = direction(s.points); return d ? (s.id === "all" ? d : `${s.label}: ${d}`) : null }).filter(Boolean).join(" · ")

  const exportCsv = () => downloadCsv(`Alert-trends_${what}_last-${st.days}-days`,
    ["Alert trends", `${what} · ${MEASURE_LABEL[st.measure]} per week`, `Last ${wk.length} weeks (${fmtWeeks(st.days)})`, COUNTING_NOTE],
    [["Week starting", ...series.map((s) => s.label)], ...wk.map((w, i) => [w.label, ...series.map((s) => s.points[i])])])

  return (
    <div className="@container flex w-full flex-col gap-4">
      <Card>
        <CardContent className="flex-row flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl aria-label="Range" value={String(st.days)} onValueChange={(v) => v && patchTrends({ days: Number(v) })}>
              {RANGES.map((d) => <SegmentedControlItem key={d} value={String(d)}>{d} days</SegmentedControlItem>)}
            </SegmentedControl>
            <Select showDetail={false} label="Alert" className="w-44" options={typeOptions} value={st.types} onValueChange={(v) => patchTrends({ types: v })} />
            <Select showDetail={false} label="Compare locations" className="w-52" options={locationOptions} value={st.locations} onValueChange={(v) => patchTrends({ locations: v.slice(0, MAX_LINES) })} />
          </div>
          <DashboardActions view="trends" suggestedName={`${what} · ${lines.length ? lines.map(locationName).join(" vs ") : "all locations"} · ${st.days} days`} onExport={exportCsv} />
        </CardContent>
      </Card>

      <OffNotice types={st.types} />
      <Card>
        <CardHeader>
          <CardHeaderText>
            <CardTitle>{what}</CardTitle>
            <CardDescription>{summary ? `Over ${st.days} days${lines.length ? ", " : ": "}${summary}.` : `Over ${st.days} days.`}</CardDescription>
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
            subtitle={`${fmtWeeks(st.days)} · ${wk.length} weeks, each labelled by the day it starts`}
            yLabel={MEASURE_LABEL[st.measure]}
            xLabel="Week starting"
            yZero
            format={(v) => Math.round(v).toLocaleString()}
            label={`${what}: ${MEASURE_LABEL[st.measure].toLowerCase()} per week over the last ${st.days} days, ${series.map((s) => s.label).join(", ")}.`}
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
