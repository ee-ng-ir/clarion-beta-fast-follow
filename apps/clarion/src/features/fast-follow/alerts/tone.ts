import type { Severity } from "./groups"

export const sevTone: Record<Severity, { bg: string; fg: string; bar: string }> = {
  critical: { bg: "var(--bg-danger-subtle)", fg: "var(--fg-on-danger-subtle)", bar: "var(--status-critical)" },
  warning: { bg: "var(--bg-warning-subtle)", fg: "var(--fg-on-warning-subtle)", bar: "var(--status-warning)" },
}
