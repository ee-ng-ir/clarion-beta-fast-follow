import { useEffect, useMemo, useState } from "react"
import { useFeedVersion } from "@/data/agentFeed"
import { ArrowRight, CircleCheck, MapPin, Search, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusFilter, statusVar, type StatusOption } from "@/components/endpoints/status"
import { formatAgo } from "@/lib/utils"
import { EndpointDetailPanel } from "@/components/endpoints/drawer/EndpointDetailPanel"
import { useIsMobile } from "@/components/dashboard/MobileNav"
import { queryEndpoints, type Endpoint, type EndpointStatus } from "@/data/endpoints"

// The Overview attention card only ever deals with unhealthy endpoints.
const ATTENTION_STATUSES: EndpointStatus[] = ["critical", "warning"]
// Default view = critical endpoints only (warning is opt-in via the filter).
const DEFAULT_STATUSES: EndpointStatus[] = ["critical"]
const ATTENTION_OPTIONS: StatusOption[] = [
  { id: "critical", label: "Critical" },
  { id: "warning", label: "Warning" },
]

/**
 * "Endpoints needing attention" — a fleet-wide master–detail view. The left half
 * lists unhealthy endpoints (critical first); selecting one shows its drilldown
 * inline on the right (no modal). "View all endpoints" jumps to the Endpoints tab.
 */
export function EndpointsAttentionCard({
  selectedLocationId,
  onViewEndpoints,
  onOpenEndpoint,
  openEndpointId,
}: {
  /** location picked on the map ("all" = whole fleet); its endpoints sort to the top */
  selectedLocationId?: string
  onViewEndpoints: (loc?: string | string[]) => void
  /** phones: tapping a row opens the endpoint drawer instead of the inline drilldown */
  onOpenEndpoint?: (rows: Endpoint[], index: number) => void
  openEndpointId?: string | null
}) {
  const isMobile = useIsMobile()
  const [statuses, setStatuses] = useState<EndpointStatus[]>(DEFAULT_STATUSES)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const toggleStatus = (s: EndpointStatus) =>
    setStatuses((xs) => (xs.includes(s) ? xs.filter((x) => x !== s) : [...xs, s]))

  // changing the map location resets the detail so it follows the map (shows the
  // top endpoint of the newly-selected location).
  useEffect(() => { setSelectedId(null) }, [selectedLocationId])

  // whole fleet unless a specific location is picked on the map (then scoped to it);
  // empty status falls back to the full attention set (never healthy/offline);
  // then a free-text search across endpoint, user and alert.
  const locationScoped = !!selectedLocationId && selectedLocationId !== "all"
  const feedVersion = useFeedVersion()
  const rows = useMemo(() => {
    const effective = statuses.length ? statuses : ATTENTION_STATUSES
    const locationIds = locationScoped ? [selectedLocationId!] : undefined
    let base = queryEndpoints({ statuses: effective, locationIds, sortKey: "status", sortDir: "asc" })
    const term = search.trim().toLowerCase()
    if (term) {
      base = base.filter((e) =>
        e.machine.toLowerCase().includes(term) ||
        e.users.join(" ").toLowerCase().includes(term) ||
        (e.event ?? "").toLowerCase().includes(term)
      )
    }
    return base
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses, search, selectedLocationId, locationScoped, feedVersion])

  const hasCritical = rows.some((r) => r.status === "critical")
  // selected row (defaults to the first / most critical) drives the detail pane
  const selected = rows.find((r) => r.id === selectedId) ?? rows[0] ?? null

  return (
    <Card className="flex w-full flex-col gap-0 overflow-hidden rounded-xl p-0">
      {/* row 1 — title + CTA */}
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Endpoints needing attention</h2>
          {rows.length > 0 && (
            <Badge variant={hasCritical ? "danger" : "warning"}>{rows.length.toLocaleString()}</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onViewEndpoints("all")}>
          View all endpoints
          <ArrowRight className="size-4" />
        </Button>
      </div>

      {/* row 2 — search + filter */}
      <div className="flex flex-col gap-2 px-4 pb-4 sm:flex-row sm:items-center" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
        <div className="flex h-9 w-full items-center gap-1.5 rounded-lg px-2.5 sm:max-w-xs" style={{ background: "var(--bg-input-default)", border: "1px solid var(--border-input-default)" }}>
          <Search className="size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} />
          <input
            value={search}
            onChange={(ev) => setSearch(ev.target.value)}
            placeholder="Search by endpoint, user, alert"
            className="min-w-px flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--fg-neutral-muted)]"
            style={{ color: "var(--fg-neutral-emphasis)" }}
          />
          {search && (
            <button type="button" aria-label="Clear search" onClick={() => setSearch("")}
              className="flex size-5 shrink-0 items-center justify-center rounded-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]" style={{ color: "var(--fg-neutral-muted)" }}>
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <StatusFilter
            value={statuses}
            onToggle={toggleStatus}
            onClear={() => setStatuses([])}
            options={ATTENTION_OPTIONS}
            allLabel="All"
          />
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="flex flex-col xl:h-[600px] xl:flex-row">
          {/* left — endpoint list. lg+: 50% side-by-side, height capped to the detail
              pane via the absolute inner (long lists scroll). Below lg: stacked
              full-width with a bounded scroll so it doesn't push the detail down. */}
          <div className="w-full min-w-0 border-b border-[var(--border-neutral-muted)] max-md:border-b-0 xl:relative xl:w-1/2 xl:border-b-0 xl:border-r">
            <div className="max-h-80 overflow-y-auto overscroll-contain max-md:max-h-[28rem] xl:absolute xl:inset-0 xl:max-h-none">
            {rows.map((e, i) => {
              // desktop: the selected row drives the inline drilldown (first row by default).
              // phones: no pre-selection — a row only highlights while its drawer is open.
              const isSel = isMobile ? openEndpointId === e.id : selected?.id === e.id
              const alertColor = e.status === "critical" ? "var(--fg-danger-emphasis)" : "var(--fg-warning-emphasis)"
              const critN = e.events.filter((ev) => ev.severity === "critical").length
              const warnN = e.events.filter((ev) => ev.severity === "warning").length
              // the shown alert is the top-priority one (critical if any, else warning);
              // the "+N more" tooltip breaks down only the ADDITIONAL alerts.
              const extraCrit = critN - (critN > 0 ? 1 : 0)
              const extraWarn = warnN - (critN > 0 ? 0 : 1)
              const moreBreakdown = [extraCrit ? `${extraCrit} critical` : "", extraWarn ? `${extraWarn} warning` : ""].filter(Boolean).join(" · ")
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => (isMobile && onOpenEndpoint ? onOpenEndpoint(rows, i) : setSelectedId(e.id))}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors"
                  style={{ borderBottom: "1px solid var(--border-neutral-subtle)", background: isSel ? "var(--bg-selected-subtle)" : "transparent" }}
                  onMouseEnter={(ev) => { if (!isSel) ev.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)" }}
                  onMouseLeave={(ev) => { ev.currentTarget.style.background = isSel ? "var(--bg-selected-subtle)" : "transparent" }}
                >
                  <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: statusVar[e.status] }} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-sm">
                        <span className="font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{e.user}</span>
                        <span style={{ color: "var(--fg-neutral-subtle)" }}> · {e.machine}</span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
                        <MapPin className="size-3 shrink-0" /> {e.locationName}
                      </span>
                    </div>
                    {e.event && (
                      <div className="flex flex-wrap items-center gap-x-1.5 text-sm">
                        <span className="font-medium" style={{ color: alertColor }}>{e.event}</span>
                        {e.eventAgo !== null && (
                          <span className="text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>· {formatAgo(e.eventAgo)} ago</span>
                        )}
                        {e.eventCount > 1 && (
                          <span className="group/more relative text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>
                            · +{e.eventCount - 1} more
                            <span
                              role="tooltip"
                              className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium group-hover/more:block"
                              style={{ background: "var(--bg-neutral-emphasis)", color: "var(--fg-on-neutral-emphasis)", boxShadow: "var(--shadow-md)" }}
                            >
                              {moreBreakdown}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
            </div>
          </div>

          {/* right — inline drilldown (50% on xl, full width when stacked) */}
          {/* phones: no inline drilldown — rows open the same endpoint drawer as the Endpoints page */}
          {!isMobile && (
            <div className="w-full min-w-0 xl:w-1/2">
              {selected && <EndpointDetailPanel endpoint={selected} />}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-0.5 px-4 py-16 text-center">
          {search.trim() ? (
            <>
              <p className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>No matching endpoints</p>
              <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>Nothing matches “{search.trim()}”. Try a different search.</p>
            </>
          ) : locationScoped ? (
            <p className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
              <CircleCheck className="size-4" style={{ color: "var(--fg-success-emphasis)" }} />
              No endpoints needing attention for this contact centre location.
            </p>
          ) : (
            <>
              <p className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
                <CircleCheck className="size-4" style={{ color: "var(--fg-success-emphasis)" }} />
                No endpoints need attention
              </p>
              <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>All endpoints are healthy right now.</p>
            </>
          )}
        </div>
      )}
    </Card>
  )
}
