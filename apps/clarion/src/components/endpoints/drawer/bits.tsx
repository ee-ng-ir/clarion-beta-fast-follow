import { type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { InfoTip } from "@/components/ui/info-tip"
import type { MetricStatus } from "@/data/endpointDetail"

/** an issue severity shown as a badge on the card that has the problem */
export type IssueStatus = "warning" | "critical"

// bar colour reflects the network MOS status (healthy / warning / critical)
const segColor: Record<MetricStatus, string> = {
  good: "var(--status-healthy)",
  warn: "var(--status-warning)",
  crit: "var(--status-critical)",
  none: "var(--fg-neutral-muted)",
}

export function SegBar({ fill, status, segments = 10 }: { fill: number; status: MetricStatus; segments?: number }) {
  const filled = Math.max(status === "none" ? 0 : 1, Math.round(fill * segments))
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: segments }).map((_, i) => (
        <span
          key={i}
          className="h-2 flex-1 rounded-sm"
          style={{ background: i < filled ? segColor[status] : "var(--bg-neutral-subtle-pressed)" }}
        />
      ))}
    </div>
  )
}

export function Panel({ children, className, status }: { children: ReactNode; className?: string; status?: IssueStatus }) {
  return (
    <div
      className={"relative rounded-xl p-4 " + (className ?? "")}
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-subtle)" }}
    >
      {/* cards share styling; a card with an issue shows its severity badge so you can see what's affected */}
      {status && (
        <Badge variant={status === "critical" ? "danger" : "warning"} className="absolute right-3 top-3">
          {status === "critical" ? "Critical" : "Warning"}
        </Badge>
      )}
      {children}
    </div>
  )
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>{children}</span>
      <span className="h-px flex-1" style={{ background: "var(--border-neutral-subtle)" }} />
      {right}
    </div>
  )
}

export function MetricBlock({ label, value, unit, children, status, info }: { label: string; value: string; unit: string; children?: ReactNode; status?: IssueStatus; info?: string }) {
  return (
    <Panel status={status}>
      <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>
        {label}
        {info && <InfoTip text={info} side="bottom" />}
      </div>
      <div className="mb-3 flex items-baseline gap-1">
        <span className="text-2xl font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{value}</span>
        <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{unit}</span>
      </div>
      {children}
    </Panel>
  )
}
