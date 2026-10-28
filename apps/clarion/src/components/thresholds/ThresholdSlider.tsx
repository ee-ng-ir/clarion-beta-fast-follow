import { Fragment, useRef } from "react"
import type { MetricDef } from "@/data/thresholds"
import { fmtValue } from "@/data/thresholds"

/**
 * Dual-thumb threshold slider with three status bands behind the track.
 * - positive metrics (higher worse): bands healthy → warning → critical
 * - inverted metrics (lower worse, e.g. MOS): bands critical → warning → healthy
 * Thumbs cannot cross. Keyboard: arrows adjust, Home/End jump, tab between thumbs.
 */
export function ThresholdSlider({
  metric, warn, crit, onChange,
}: {
  metric: MetricDef
  warn: number
  crit: number
  onChange: (warn: number, crit: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const inverted = metric.direction === "lower"
  const { min, max, step } = metric
  const span = max - min || 1
  const pct = (v: number) => ((v - min) / span) * 100
  const lp = Math.min(pct(warn), pct(crit))
  const hp = Math.max(pct(warn), pct(crit))

  // bands use the status namespace (consistent hue in light + dark); softened via the track opacity below
  const bands = inverted
    ? ["var(--status-critical)", "var(--status-warning)", "var(--status-healthy)"]
    : ["var(--status-healthy)", "var(--status-warning)", "var(--status-critical)"]

  const snap = (v: number) => Math.min(max, Math.max(min, Number((Math.round(v / step) * step).toFixed(4))))
  const setWarn = (v: number) => { v = snap(v); onChange(inverted ? Math.max(v, crit) : Math.min(v, crit), crit) }
  const setCrit = (v: number) => { v = snap(v); onChange(warn, inverted ? Math.min(v, warn) : Math.max(v, warn)) }

  const valueFromX = (clientX: number) => {
    const el = trackRef.current
    if (!el) return min
    const r = el.getBoundingClientRect()
    return min + Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * span
  }

  const startDrag = (which: "warn" | "crit") => (e: React.PointerEvent) => {
    e.preventDefault()
    const move = (ev: PointerEvent) => (which === "warn" ? setWarn : setCrit)(valueFromX(ev.clientX))
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up) }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  const onKey = (which: "warn" | "crit") => (e: React.KeyboardEvent) => {
    const set = which === "warn" ? setWarn : setCrit
    const cur = which === "warn" ? warn : crit
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); set(cur + step) }
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); set(cur - step) }
    else if (e.key === "Home") { e.preventDefault(); set(min) }
    else if (e.key === "End") { e.preventDefault(); set(max) }
  }

  const renderThumb = (which: "warn" | "crit") => {
    const v = which === "warn" ? warn : crit
    const color = which === "warn" ? "var(--status-warning)" : "var(--status-critical)"
    const labelColor = color
    const p = pct(v)
    return (
      <Fragment key={which}>
        {/* role text ("Warn"/"Crit") so the threshold is legible without relying on colour */}
        <div className="pointer-events-none absolute -top-9 z-10 flex -translate-x-1/2 flex-col items-center leading-tight" style={{ left: `${p}%` }}>
          <span className="text-[10px] font-semibold" style={{ color: "var(--fg-neutral-muted)" }}>{which === "warn" ? "Warning" : "Critical"}</span>
          <span className="whitespace-nowrap font-mono text-xs font-semibold" style={{ color: labelColor }}>{fmtValue(metric, v)}</span>
        </div>
        <div
          role="slider"
          tabIndex={0}
          aria-label={`${metric.name} ${which === "warn" ? "warning" : "critical"} threshold`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={v}
          aria-valuetext={fmtValue(metric, v)}
          aria-orientation="horizontal"
          onPointerDown={startDrag(which)}
          onKeyDown={onKey(which)}
          className="absolute top-1/2 z-10 size-4 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focused)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]"
          style={{ left: `${p}%`, background: "var(--bg-card)", border: `3px solid ${color}`, boxShadow: "var(--shadow-xs)" }}
        />
      </Fragment>
    )
  }

  const field = (which: "warn" | "crit") => {
    const v = which === "warn" ? warn : crit
    const set = which === "warn" ? setWarn : setCrit
    const labelColor = which === "warn" ? "var(--status-warning)" : "var(--status-critical)"
    return (
      <label className="flex min-w-px flex-1 flex-col gap-1">
        <span className="text-xs font-semibold" style={{ color: labelColor }}>{which === "warn" ? "Warning" : "Critical"}</span>
        <div className="relative">
          <input
            type="number" inputMode="decimal" value={v} min={min} max={max} step={step}
            aria-label={`${metric.name} ${which === "warn" ? "warning" : "critical"} threshold`}
            onChange={(e) => { const n = Number(e.target.value); if (!Number.isNaN(n)) set(n) }}
            className="h-9 w-full rounded-md pl-3 pr-8 font-mono text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focused)]"
            style={{ border: "1px solid var(--border-input-default)", background: "var(--bg-input-default)", color: "var(--fg-neutral-emphasis)" }}
          />
          {metric.unit && <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{metric.unit}</span>}
        </div>
      </label>
    )
  }

  return (
    <div className="w-full select-none">
      {/* Drag slider — sm and up */}
      <div className="hidden pt-9 sm:block">
        <div className="relative h-4" ref={trackRef}>
          <div className="absolute inset-x-0 top-1/2 flex h-2 -translate-y-1/2 overflow-hidden rounded-full">
            <span className="h-full" style={{ width: `${lp}%`, background: bands[0] }} />
            <span className="h-full" style={{ width: `${hp - lp}%`, background: bands[1] }} />
            <span className="h-full" style={{ flex: 1, background: bands[2] }} />
          </div>
          {renderThumb("warn")}
          {renderThumb("crit")}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[11px]" style={{ color: "var(--fg-neutral-subtle)" }}>
          <span>{fmtValue(metric, min)}</span>
          <span>{fmtValue(metric, max)}</span>
        </div>
      </div>

      {/* Numeric fields — below sm (precise + touch-friendly), with a read-only band bar for context */}
      <div className="flex flex-col gap-2.5 sm:hidden">
        <div className="flex h-1.5 w-full overflow-hidden rounded-full" aria-hidden>
          <span className="h-full" style={{ width: `${lp}%`, background: bands[0] }} />
          <span className="h-full" style={{ width: `${hp - lp}%`, background: bands[1] }} />
          <span className="h-full" style={{ flex: 1, background: bands[2] }} />
        </div>
        <div className="flex items-end gap-3">
          {field("warn")}
          {field("crit")}
        </div>
      </div>
    </div>
  )
}
