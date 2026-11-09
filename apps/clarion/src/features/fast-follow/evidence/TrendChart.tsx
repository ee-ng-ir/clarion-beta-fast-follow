import { TimeSeriesChart } from "@ir/ui"
import type { Series } from "./evidence"

const clock = (minAgo: number) =>
  new Date(Date.now() - minAgo * 60000).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })

/**
 * How a reading developed around the alert, on Picasso's TimeSeriesChart.
 * It takes one threshold, so we draw the one the alert crossed (the evidence
 * text names it) and say when the alert was raised in the subtitle.
 * Picasso gap (logged): a second threshold and an event marker.
 */
export function TrendChart({ s, severity, raisedMinAgo, title }: { s: Series; severity: "critical" | "warning"; raisedMinAgo: number; title: string }) {
  const threshold = severity === "critical" ? s.crit : s.warn
  const unit = s.unit
  return (
    <TimeSeriesChart
      size="sm"
      x={s.points.map((p) => clock(-p.t))}
      series={[{ id: s.name, label: title, points: s.points.map((p) => p.v) }]}
      title={title}
      subtitle={`Alert raised at ${clock(raisedMinAgo)} (${raisedMinAgo} min ago)`}
      yLabel={s.name}
      xLabel="Time"
      yMin={s.min}
      yMax={s.max}
      format={(v) => `${Number.isInteger(v) ? v : v.toFixed(1)}${unit}`}
      threshold={{ value: threshold, label: `${severity === "critical" ? "Critical" : "Warning"} ${threshold}${unit}` }}
      label={`${s.name} from ${clock(-s.points[0].t)} to now, against the ${severity} threshold of ${threshold}${unit}. The alert was raised at ${clock(raisedMinAgo)}.`}
    />
  )
}
