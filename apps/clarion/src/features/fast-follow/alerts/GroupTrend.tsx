import { useMemo } from "react"
import { Card, CardContent, TimeSeriesChart } from "@ir/ui"
import { evidenceFor, type Series } from "../evidence/evidence"
import type { AlertGroup } from "./groups"

const clock = (minAgo: number) =>
  new Date(Date.now() - minAgo * 60000).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })
const STEPS = 24

/** An endpoint's reading at `t` minutes ago: the nearest earlier point, or its first. */
function at(s: Series, t: number) {
  let v = s.points[0].v
  for (const p of s.points) { if (p.t <= t) v = p.v; else break }
  return v
}
const median = (xs: number[]) => { const a = [...xs].sort((x, y) => x - y); const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2 }

/**
 * The single alert's chart, for the whole group (PO, 11 Nov): the reading
 * against its threshold over time. A group is many endpoints, so the line is
 * the typical (median) reading across them, with the worst endpoint drawn
 * beside it. Same Picasso chart as an alert's evidence (TrendChart); its one
 * threshold is the group's severity. Nothing to draw for alerts with no
 * reading (can't reach a platform, a headset problem).
 */
export function GroupTrend({ g }: { g: AlertGroup }) {
  const data = useMemo(() => {
    const all = g.endpoints
      .map((e) => ({ e, s: evidenceFor(e).active.find((a) => a.type.id === g.type.id)?.main ?? null }))
      .filter((x): x is { e: typeof x.e; s: Series } => !!x.s && x.s.points.length > 1)
    if (!all.length) return null
    const ref = all[0].s
    const window = Math.max(...all.map((x) => -x.s.points[0].t))
    const ts = Array.from({ length: STEPS + 1 }, (_, i) => Math.round(-window + (window * i) / STEPS))
    const typical = ts.map((t) => Math.round(median(all.map((x) => at(x.s, t))) * 10) / 10)
    // worst = furthest past the line right now
    const worst = all.reduce((w, x) => {
      const now = at(x.s, 0), wn = at(w.s, 0)
      return (ref.lowerIsWorse ? now < wn : now > wn) ? x : w
    })
    return { ref, ts, typical, worst: { name: worst.e.user, points: ts.map((t) => at(worst.s, t)) }, n: all.length }
  }, [g])

  if (!data) return null
  const { ref, ts, typical, worst, n } = data
  const threshold = g.severity === "critical" ? ref.crit : ref.warn
  const level = g.severity === "critical" ? "Critical" : "Warning"
  return (
    <Card size="sm">
      <CardContent>
        <TimeSeriesChart
          size="sm"
          x={ts.map((t) => clock(-t))}
          series={[
            { id: "typical", label: `Typical across ${n} endpoint${n === 1 ? "" : "s"}`, points: typical },
            ...(n > 1 ? [{ id: "worst", label: `Worst: ${worst.name}`, points: worst.points }] : []),
          ]}
          title={ref.name}
          subtitle={`First seen ${clock(g.firstSeenMinAgo)} (${g.firstSeenMinAgo} min ago)`}
          yLabel={ref.name}
          xLabel="Time"
          yMin={ref.min}
          yMax={ref.max}
          format={(v) => `${Number.isInteger(v) ? v : v.toFixed(1)}${ref.unit}`}
          threshold={{ value: threshold, label: `${level} ${threshold}${ref.unit}` }}
          label={`${ref.name} across the group's ${n} endpoints from ${clock(-ts[0])} to now: the typical reading and the worst, against the ${level.toLowerCase()} threshold of ${threshold}${ref.unit}.`}
        />
      </CardContent>
    </Card>
  )
}
