import type { Severity } from "./groups"

/** Severity → Picasso Badge colour and the icon tile's semantic utilities. */
export const sevBadge: Record<Severity, "danger" | "warning"> = { critical: "danger", warning: "warning" }
export const sevTile: Record<Severity, string> = {
  critical: "bg-surface-danger-subtle text-content-on-danger-subtle",
  warning: "bg-surface-warning-subtle text-content-on-warning-subtle",
}
export const sevLabel: Record<Severity, string> = { critical: "Critical", warning: "Warning" }
