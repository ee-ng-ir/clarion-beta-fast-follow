import type { Status } from "@/data/dashboard"
import { cn } from "@/lib/utils"

const statusVar: Record<Status, string> = {
  healthy: "var(--status-healthy)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
}

/** A small status dot with a card-coloured ring + xs shadow (per spec). */
export function StatusDot({
  status,
  className,
}: {
  status: Status
  className?: string
}) {
  return (
    <span
      className={cn("inline-block size-3 shrink-0 rounded-full", className)}
      style={{
        backgroundColor: statusVar[status],
        border: "1px solid var(--bg-card)",
        boxShadow: "var(--shadow-xs)",
      }}
    />
  )
}

/** Dot + label legend item. */
export function LegendItem({
  status,
  label,
  muted = false,
  showDot = true,
}: {
  status?: Status
  label: string
  muted?: boolean
  showDot?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {showDot && status && <StatusDot status={status} />}
      <span
        className="text-body-xs"
        style={{
          color: muted
            ? "var(--fg-neutral-subtle)"
            : "var(--fg-neutral-emphasis)",
        }}
      >
        {label}
      </span>
    </span>
  )
}

const statusLabel: Record<Status, string> = {
  healthy: "Healthy",
  warning: "Warning",
  critical: "Critical",
}

/** Horizontal segmented bar (healthy / warning / critical proportions).
 *  When a segment carries a `count`, hovering it reveals a tooltip with the
 *  status + quantity so the admin can read the number behind each colour. */
export function SegmentedBar({
  segments,
  className,
}: {
  segments: { status: Status; flex: number; count?: number; label?: string }[]
  className?: string
}) {
  return (
    <div className={cn("flex h-2 w-full items-center rounded-full", className)}>
      {segments.map((s, i) => (
        <div
          key={i}
          className="group/seg relative h-full min-w-px first:rounded-l-full last:rounded-r-full"
          style={{ flex: `${s.flex} 0 0` }}
        >
          <span
            className={cn("block size-full", i === 0 && "rounded-l-full", i === segments.length - 1 && "rounded-r-full")}
            style={{ backgroundColor: statusVar[s.status] }}
          />
          {/* enlarged, invisible hit area so the thin bar is easy to hover */}
          {s.count != null && <span className="absolute inset-x-0 -top-2 -bottom-2" />}
          {s.count != null && (
            <span
              className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium group-hover/seg:block"
              style={{ background: "var(--bg-neutral-emphasis)", color: "var(--fg-on-neutral-emphasis)", boxShadow: "var(--shadow-md)" }}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full" style={{ background: statusVar[s.status] }} />
                {s.label ?? statusLabel[s.status]} · {s.count.toLocaleString()}
              </span>
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
