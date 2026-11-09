import { ArrowRight } from "lucide-react"
import { Badge, Button, Card, CardAction, CardDescription, CardHeader, CardHeaderText, CardTitle, Table, TableBody, TableCell, TableRow } from "@ir/ui"
import { useFeedVersion } from "@/data/agentFeed"
import { activeGroups } from "./groups"
import { AlertIcon, NotifiedBadge } from "./bits"
import { sevBadge, sevLabel } from "./tone"

/**
 * Top issues: the top 5 alert groups by a fixed, rule-based score (severity,
 * endpoints affected, recurrence), each with the reason it ranks where it does.
 * Replaces "Endpoints needing attention" on Overview.
 */
export function TopIssuesCard({ onOpenGroup, onViewAll }: { onOpenGroup: (id: string) => void; onViewAll: () => void }) {
  const version = useFeedVersion()
  const top = activeGroups(version).slice(0, 5)
  return (
    <Card className="@container">
      <CardHeader>
        <CardHeaderText>
          <CardTitle>Top issues</CardTitle>
          <CardDescription>Alert groups ranked by severity, endpoints affected and how often they recur.</CardDescription>
        </CardHeaderText>
        <CardAction><Button variant="ghost" size="sm" onClick={onViewAll}>View all alerts <ArrowRight aria-hidden /></Button></CardAction>
      </CardHeader>
      <Table size="sm" aria-label="Top issues">
        <TableBody>
          {top.map((g, i) => (
            <TableRow key={g.id} className="cursor-pointer" onClick={() => onOpenGroup(g.id)}>
              <TableCell numeric className="w-8 text-content-neutral-subtle">{i + 1}</TableCell>
              <TableCell align="start">
                <div className="flex items-center gap-3">
                  <AlertIcon icon={g.type.icon} severity={g.severity} />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <button type="button" onClick={(e) => { e.stopPropagation(); onOpenGroup(g.id) }}
                        className="rounded-xs text-start text-label-lg text-content-neutral-emphasis outline-none hover:underline focus-visible:ring-2 focus-visible:ring-line-focused">
                        {g.title}
                      </button>
                      {g.notifiedMinAgo !== null && <NotifiedBadge />}
                    </span>
                    <span className="truncate text-body-sm text-content-neutral-muted">{g.reason}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell align="start" className="hidden @lg:table-cell"><Badge color={sevBadge[g.severity]}>{sevLabel[g.severity]}</Badge></TableCell>
              <TableCell align="end">
                <span className="block text-metric-sm tabular-nums text-content-neutral-emphasis">{g.endpoints.length}</span>
                <span className="block text-body-xs text-content-neutral-subtle">endpoints</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
