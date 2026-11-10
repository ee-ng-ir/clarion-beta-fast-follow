import { useMemo } from "react"
import { Alert, AlertDescription, TimeSeriesChart } from "@ir/ui"
import type { Stability } from "./store"
import { PRESETS, countAlerts } from "./stability"

// Priya at the edge of the office Wi-Fi: signal hovering around the 50% warning threshold for two hours.
// one reading a minute: flickers either side of 50% (weak Wi-Fi), with one real drop around 10:10–10:28
const HOVER = Array.from({ length: 120 }, (_, i) => Math.round(52 + Math.sin(i / 1.3) * 3 + Math.sin(i / 0.6) * 3 - (i > 70 && i < 88 ? 16 : 0)))
const X = HOVER.map((_, i) => {
  const d = new Date(); d.setHours(9, i, 0, 0)
  return d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })
})

/** What alert stability changes, on one worked example: how many alerts Priya gets this morning at the chosen setting. */
export function StabilityExample({ setting }: { setting: Stability }) {
  const counts = useMemo(() => Object.fromEntries((Object.keys(PRESETS) as Stability[]).map((k) => [k, countAlerts(HOVER, PRESETS[k])])) as Record<Stability, number>, [])
  return (
    <div className="flex flex-col gap-3">
      <p className="text-body-md text-content-neutral-muted">Priya sits at the edge of the office Wi-Fi. Her signal hovers around the 50% warning threshold all morning.</p>
      <TimeSeriesChart
        size="sm"
        x={X}
        series={[{ id: "priya-wifi", label: "Wi-Fi signal", points: HOVER }]}
        title="Wi-Fi signal"
        subtitle="9:00 to 11:00 am"
        yLabel="Wi-Fi signal (%)"
        yMin={0}
        yMax={100}
        format={(v) => `${v}%`}
        threshold={{ value: 50, label: "Warning 50%" }}
        label="Wi-Fi signal from 9 to 11 am hovering around the 50% warning threshold, with one real drop to the 30s from about 10:10 to 10:28."
      />
      <Alert variant="info">
        <AlertDescription>
          Network set to <strong>{PRESETS[setting].label}</strong>: {counts[setting]} alert{counts[setting] === 1 ? "" : "s"} for Priya this morning
          {setting !== "sensitive" && ` instead of ${counts.sensitive}`}. The real drop around 10:10 {counts[setting] > 0 ? "is still raised" : "is not raised"}.
        </AlertDescription>
      </Alert>
    </div>
  )
}
