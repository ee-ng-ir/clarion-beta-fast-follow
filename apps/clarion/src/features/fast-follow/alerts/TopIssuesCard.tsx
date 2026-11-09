import { ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useFeedVersion } from "@/data/agentFeed"
import { activeGroups } from "./groups"
import { NotifiedChip, sevTone } from "./bits"

/**
 * Top issues: the top 5 alert groups by a fixed, rule-based score (severity,
 * endpoints affected, recurrence), each with the reason it ranks where it does.
 * Replaces "Endpoints needing attention" on Overview.
 */
export function TopIssuesCard({ onOpenGroup, onViewAll }: { onOpenGroup: (id: string) => void; onViewAll: () => void }) {
  const version = useFeedVersion()
  const top = activeGroups(version).slice(0, 5)
  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      <div className="flex flex-wrap items-start gap-2 px-4 py-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Top issues</h2>
          <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>Alert groups ranked by severity, endpoints affected and how often they recur.</p>
        </div>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={onViewAll}>View all alerts <ArrowRight className="size-4" aria-hidden /></Button>
      </div>
      <ol style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}>
        {top.map((g, i) => {
          const Icon = g.type.icon
          const tone = sevTone[g.severity]
          return (
            <li key={g.id} style={{ borderBottom: i < top.length - 1 ? "1px solid var(--border-neutral-subtle)" : undefined }}>
              <button type="button" onClick={() => onOpenGroup(g.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]">
                <span className="w-4 shrink-0 text-center font-mono text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{i + 1}</span>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ background: tone.bg, color: tone.fg }}><Icon className="size-4" aria-hidden /></span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{g.title}</span>
                    {g.notifiedMinAgo !== null && <NotifiedChip />}
                  </span>
                  <span className="truncate text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{g.reason}</span>
                </span>
                <Badge variant={g.severity === "critical" ? "danger" : "warning"} className="hidden sm:inline-flex">{g.severity === "critical" ? "Critical" : "Warning"}</Badge>
                <span className="w-12 shrink-0 text-right">
                  <span className="block font-mono text-sm tabular-nums" style={{ color: "var(--fg-neutral-emphasis)" }}>{g.endpoints.length}</span>
                  <span className="block text-[11px]" style={{ color: "var(--fg-neutral-subtle)" }}>endpoints</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
