import { BellRing, Leaf } from "lucide-react"
import { sevTone } from "./tone"


/** Critical/Warning split as a thin two-colour bar with counts. */
export function SeveritySplit({ critical, warning, compact = false }: { critical: number; warning: number; compact?: boolean }) {
  const total = critical + warning || 1
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex h-1.5 w-full max-w-40 overflow-hidden rounded-full" style={{ background: "var(--bg-neutral-muted)" }} aria-hidden>
        <span style={{ width: `${(critical / total) * 100}%`, background: sevTone.critical.bar }} />
        <span style={{ width: `${(warning / total) * 100}%`, background: sevTone.warning.bar }} />
      </div>
      {!compact && (
        <span className="text-xs tabular-nums" style={{ color: "var(--fg-neutral-muted)" }}>
          {critical > 0 && `${critical} Critical`}{critical > 0 && warning > 0 && " · "}{warning > 0 && `${warning} Warning`}
        </span>
      )}
    </div>
  )
}

/** "IT notified" — a proactive email went out for this group. */
export function NotifiedChip() {
  return (
    <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium"
      style={{ background: "var(--bg-info-subtle)", color: "var(--fg-on-info-subtle)" }}>
      <BellRing className="size-3" aria-hidden /> IT notified
    </span>
  )
}

/** Energy saver is context, never an alert: neutral styling, no severity colour. */
export function EnergySaverChip({ count, of }: { count: number; of?: number }) {
  return (
    <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-md border px-1.5 text-[11px] font-medium"
      style={{ borderColor: "var(--border-neutral-muted)", color: "var(--fg-neutral-muted)" }}>
      <Leaf className="size-3" aria-hidden /> Energy saver on{of ? ` · ${count} of ${of}` : ""}
    </span>
  )
}
