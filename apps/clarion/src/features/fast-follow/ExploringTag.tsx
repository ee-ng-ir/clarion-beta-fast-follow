import { cn } from "@/lib/utils"

/**
 * Marks anything still TBC in the epics (e.g. Iris Investigate, energy saver
 * detection). Committed Fast Follow items carry no tag.
 */
export function ExploringTag({ className, label = "Exploring" }: { className?: string; label?: string }) {
  return (
    <span
      title="Still being explored. Not committed for Fast Follow."
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-md border border-dashed px-1.5 text-[11px] font-medium leading-none",
        className,
      )}
      style={{ borderColor: "var(--border-primary-muted)", color: "var(--fg-primary-emphasis)", background: "var(--bg-primary-subtle)" }}
    >
      {label}
    </span>
  )
}

/** "New" marker for nav items and sections introduced by Fast Follow. */
export function NewTag({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex h-4 shrink-0 items-center rounded px-1 text-[10px] font-semibold uppercase leading-none tracking-wide", className)}
      style={{ background: "var(--bg-primary-subtle)", color: "var(--fg-on-primary-subtle)" }}
    >
      New
    </span>
  )
}
