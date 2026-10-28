import { useState } from "react"
import { X, CircleAlert, TriangleAlert, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Status } from "@/data/widget"

/**
 * Inline issue alert shown under a degraded component — matches the DS "Alert"
 * component (node 79:8042): a leading status icon, title + description, a full
 * tinted border, and a dismiss × (Close) on the right. Appears while the
 * component is degraded; the × clears it once read (it remounts fresh on the
 * next breach). The DS "Go to alert" action is omitted — there's no separate
 * alert to navigate to from an inline card.
 */
export function FixCard({
  status,
  title,
  description,
  onSendToIt,
}: {
  status: Status
  title: string
  description: string
  /** When provided (platform alerts), shows a neutral "Send to IT" button. Clicking it does NOT dismiss the alert. */
  onSendToIt?: () => void
}) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  const critical = status === "critical"
  const Icon = critical ? CircleAlert : TriangleAlert
  return (
    <div
      className="mt-1 rounded-lg py-2 pl-2.5 pr-2"
      style={{
        background: critical ? "var(--bg-danger-subtle)" : "var(--bg-warning-subtle)",
        border: `1px solid ${critical ? "var(--status-critical)" : "var(--status-warning)"}`,
      }}
    >
      <div className="flex items-start gap-2">
        <Icon className="mt-px size-4 shrink-0" style={{ color: "var(--fg-neutral-emphasis)" }} />
        <div className="min-w-px flex-1 text-xs font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{title}</div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="-my-0.5 flex size-5 shrink-0 items-center justify-center rounded-md transition-colors"
          style={{ color: "var(--fg-neutral-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = critical ? "var(--bg-danger-subtle-hovered)" : "var(--bg-warning-subtle-hovered)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="mt-1 text-xs leading-snug" style={{ color: "var(--fg-neutral-muted)" }}>{description}</div>
      <div className="mt-2.5 flex items-center gap-2">
        {onSendToIt && (
          // Neutral-emphasis DS button (bg.neutral.emphasis / fg.on.neutral-emphasis). Does not dismiss the alert.
          <Button variant="neutral" size="sm" onClick={onSendToIt}>
            <Send /> Send to IT
          </Button>
        )}
        {/* Don't ask again — dismisses and suppresses this alert. Right-aligned text action. */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="ml-auto rounded-md px-2 py-1 text-xs font-medium transition-colors"
          style={{ color: "var(--fg-neutral-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = critical ? "var(--bg-danger-subtle-hovered)" : "var(--bg-warning-subtle-hovered)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          Don't ask again
        </button>
      </div>
    </div>
  )
}
