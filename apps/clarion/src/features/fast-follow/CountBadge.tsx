import { cn } from "@/lib/utils"

/**
 * A count on a tab or nav item: a circle for one digit, a pill for more.
 * Picasso's Badge has no count variant yet (questions log P5), so this uses the
 * same recipe as Picasso's own count in Select: h-5, min-w-5, rounded-full,
 * tabular figures, semantic surface colours.
 */
export function CountBadge({ count, tone = "danger", label, className }: {
  count: number; tone?: "danger" | "warning" | "neutral"; label: string; className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-label-sm tabular-nums",
        tone === "danger" && "bg-surface-danger-emphasis text-content-on-danger-emphasis",
        tone === "warning" && "bg-surface-warning-emphasis text-content-on-warning-emphasis",
        tone === "neutral" && "bg-surface-neutral-muted text-content-neutral-emphasis",
        className,
      )}
    >
      <span aria-hidden>{count > 99 ? "99+" : count}</span>
      <span className="sr-only">{label}</span>
    </span>
  )
}
