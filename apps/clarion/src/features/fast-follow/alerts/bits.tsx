import type { LucideIcon } from "lucide-react"
import { BellRing, Leaf } from "lucide-react"
import { Badge } from "@ir/ui"
import { cn } from "@/lib/utils"
import type { Severity } from "./groups"
import { sevTile } from "./tone"

/** Critical / Warning counts as Picasso badges, so the split reads as text, not just colour. */
export function SeveritySplit({ critical, warning }: { critical: number; warning: number }) {
  return (
    <span className="flex flex-wrap gap-1">
      {critical > 0 && <Badge color="danger" dot>{critical} Critical</Badge>}
      {warning > 0 && <Badge color="warning" dot>{warning} Warning</Badge>}
    </span>
  )
}

/** "IT notified": a proactive email went out for this group. */
export function NotifiedBadge() {
  return <Badge color="info"><BellRing aria-hidden />IT notified</Badge>
}

/** Energy saver is context, never an alert: neutral, never a severity colour. */
export function EnergySaverBadge({ count, of }: { count: number; of?: number }) {
  return <Badge variant="outline"><Leaf aria-hidden />Energy saver on{of ? ` · ${count} of ${of}` : ""}</Badge>
}

/** The alert type's icon on a severity-tinted tile (or neutral once closed). */
export function AlertIcon({ icon: Icon, severity, closed = false, size = "md" }: { icon: LucideIcon; severity: Severity; closed?: boolean; size?: "md" | "lg" }) {
  return (
    <span className={cn(
      "flex shrink-0 items-center justify-center rounded-md",
      size === "lg" ? "size-10" : "size-8",
      closed ? "bg-surface-neutral-subtle text-content-neutral-muted" : sevTile[severity],
    )}>
      <Icon className={size === "lg" ? "size-5" : "size-4"} aria-hidden />
    </span>
  )
}
