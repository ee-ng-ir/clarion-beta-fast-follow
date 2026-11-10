import { useMemo, useState } from "react"
import { Search, Settings2, X } from "lucide-react"
import {
  Badge, Button, Card, CardContent, EmptyState, InputGroup, InputGroupAddon, InputGroupInput,
  SegmentedControl, SegmentedControlItem, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import { useFeedVersion } from "@/data/agentFeed"
import type { Endpoint } from "@/data/endpoints"
import { canOpen, useViewer } from "@/lib/viewer"
import { goToSettings } from "../navigator"
import { activeGroups, closedGroups, type AlertGroup } from "./groups"
import { categoryLabel, type AlertCategory } from "./catalogue"
import { ago, duration, whereLine } from "./format"
import { AlertIcon, EnergySaverBadge, NotifiedBadge, SeveritySplit } from "./bits"
import { GroupDrawer } from "./GroupDrawer"
import { openGroup, useOpenGroup } from "./store"

type View = "active" | "closed"

const categoryOptions = (Object.keys(categoryLabel) as AlertCategory[]).map((c) => ({ value: c, label: categoryLabel[c] }))
const severityOptions = [{ value: "critical", label: "Critical" }, { value: "warning", label: "Warning" }]

/**
 * Alerts: one row per alert group — one problem, however many endpoints.
 * Replaces the per-location rollups. Groups update live and close once every
 * endpoint has recovered.
 */
export function AlertGroupsPage({ onOpenEndpoint }: { onOpenEndpoint: (rows: Endpoint[], index: number) => void }) {
  const version = useFeedVersion()
  const [view, setView] = useState<View>("active")
  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState<string[]>([])
  const [category, setCategory] = useState<string[]>([])
  const openId = useOpenGroup()

  const active = activeGroups(version)
  const closed = closedGroups()
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (view === "active" ? active : closed).filter((g) => {
      if (severity.length && !severity.includes(g.severity)) return false
      if (category.length && !category.includes(g.type.category)) return false
      if (term && !`${g.title} ${g.type.warning} ${g.locations.map((l) => l.name).join(" ")}`.toLowerCase().includes(term)) return false
      return true
    })
  }, [view, active, closed, search, severity, category])

  const endpointsInAlert = active.reduce((s, g) => s + g.endpoints.length, 0)
  const openGroupData = openId ? [...active, ...closed].find((g) => g.id === openId) ?? null : null
  const filtered = search || severity.length || category.length
  const mayConfigure = canOpen("settings", useViewer())

  return (
    <>
      {/* @container: columns step down with the card's width, not the viewport (Picasso App shell) */}
      <Card className="@container">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl aria-label="Alert groups" value={view} onValueChange={(v) => v && setView(v as View)}>
              <SegmentedControlItem value="active">Active · {active.length}</SegmentedControlItem>
              <SegmentedControlItem value="closed">Closed · {closed.length}</SegmentedControlItem>
            </SegmentedControl>
            {view === "active" && <Badge>{endpointsInAlert.toLocaleString()} endpoints affected</Badge>}
            {/* the way in to what raises these alerts (Settings › Alerting), for people who may change it */}
            {mayConfigure && (
              <Button variant="ghost" size="sm" className="ms-auto" onClick={() => goToSettings("alerts")}><Settings2 aria-hidden />Alert settings</Button>
            )}
          </div>

          {/* toolbar */}
          <div className="flex flex-col gap-2 @2xl:flex-row @2xl:items-center">
            <InputGroup className="@2xl:max-w-xs">
              <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
              <InputGroupInput aria-label="Search alerts or locations" placeholder="Search alerts or locations" value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && (
                <InputGroupAddon align="end">
                  <Button variant="ghost" size="icon-xs" aria-label="Clear search" onClick={() => setSearch("")}><X /></Button>
                </InputGroupAddon>
              )}
            </InputGroup>
            <div className="flex items-center gap-2 @2xl:ms-auto">
              <Select label="Category" className="w-44" options={categoryOptions} value={category} onValueChange={setCategory} />
              <Select label="Severity" className="w-40" options={severityOptions} value={severity} onValueChange={setSeverity} />
            </div>
          </div>
        </CardContent>

        {rows.length === 0 ? (
          <CardContent>
            <EmptyState size="sm" illustration="issue-alerts"
              title={filtered ? "No alert groups match" : view === "active" ? "No open alert groups" : "No closed groups this week"}
              description={filtered ? "Try a different search or clear a filter." : view === "active" ? "Every endpoint is within its thresholds." : "Groups appear here for 7 days after every endpoint recovers."}
              action={filtered ? <Button variant="outline" size="sm" onClick={() => { setSearch(""); setSeverity([]); setCategory([]) }}>Clear filters</Button> : undefined} />
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead align="start">Alert</TableHead>
                <TableHead numeric>{view === "active" ? "Endpoints" : "Peak"}</TableHead>
                <TableHead align="start" className="hidden @xl:table-cell">{view === "active" ? "Severity" : "Lasted"}</TableHead>
                <TableHead align="start" className="hidden @4xl:table-cell">Location</TableHead>
                <TableHead align="start" className="hidden @3xl:table-cell">{view === "active" ? "First seen" : "Closed"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((g) => <GroupRow key={g.id} g={g} selected={openId === g.id} onOpen={() => openGroup(g.id)} />)}
            </TableBody>
          </Table>
        )}
      </Card>

      <GroupDrawer group={openGroupData} onClose={() => openGroup(null)} onOpenEndpoint={onOpenEndpoint} />
    </>
  )
}

function GroupRow({ g, selected, onOpen }: { g: AlertGroup; selected: boolean; onOpen: () => void }) {
  const closed = !!g.closed
  return (
    <TableRow selected={selected} className="cursor-pointer" onClick={onOpen}>
      <TableCell align="start">
        <div className="flex items-center gap-3">
          <AlertIcon icon={g.type.icon} severity={g.severity} closed={closed} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* the row's real control: keyboard users tab to the alert name */}
              <button type="button" onClick={(e) => { e.stopPropagation(); onOpen() }}
                className="rounded-xs text-start text-label-lg text-content-neutral-emphasis outline-none hover:underline focus-visible:ring-2 focus-visible:ring-line-focused">
                {g.title}
              </button>
              {g.notifiedMinAgo !== null && !closed && <NotifiedBadge />}
              {g.energySaverOn > 0 && <EnergySaverBadge count={g.energySaverOn} of={g.endpoints.length} />}
            </div>
            {/* narrow cards drop the Severity column, so the split moves under the name */}
            {!closed && <span className="@xl:hidden"><SeveritySplit critical={g.counts.critical} warning={g.counts.warning} /></span>}
            <span className="text-body-sm text-content-neutral-muted">
              {categoryLabel[g.type.category]}{g.recurrenceThisWeek > 2 && ` · recurring ${g.recurrenceThisWeek} times this week`}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell numeric>{closed ? g.closed!.peak : g.endpoints.length}</TableCell>
      <TableCell align="start" className="hidden @xl:table-cell">{closed ? duration(g.closed!.lastedMin) : <SeveritySplit critical={g.counts.critical} warning={g.counts.warning} />}</TableCell>
      <TableCell align="start" className="hidden text-content-neutral-muted @4xl:table-cell">{whereLine(g.locations)}</TableCell>
      <TableCell align="start" className="hidden text-content-neutral-muted @3xl:table-cell">{ago(closed ? g.closed!.minutesAgo : g.firstSeenMinAgo)}</TableCell>
    </TableRow>
  )
}
