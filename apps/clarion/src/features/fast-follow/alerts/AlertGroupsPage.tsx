import { useMemo, useState } from "react"
import { ChevronRight, Search, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFeedVersion } from "@/data/agentFeed"
import type { Endpoint } from "@/data/endpoints"
import { activeGroups, closedGroups, type AlertGroup } from "./groups"
import { categoryLabel, type AlertCategory } from "./catalogue"
import { ago, duration, whereLine } from "./format"
import { NotifiedChip, SeveritySplit, EnergySaverChip, sevTone } from "./bits"
import { GroupDrawer } from "./GroupDrawer"
import { openGroup, useOpenGroup } from "./store"

type View = "active" | "closed"

/**
 * Alerts: one row per alert group — one problem, however many endpoints.
 * Replaces the per-location rollups. Groups update live and close once every
 * endpoint has recovered.
 */
export function AlertGroupsPage({ onOpenEndpoint }: { onOpenEndpoint: (rows: Endpoint[], index: number) => void }) {
  const version = useFeedVersion()
  const [view, setView] = useState<View>("active")
  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState<"all" | "critical" | "warning">("all")
  const [category, setCategory] = useState<"all" | AlertCategory>("all")
  const openId = useOpenGroup()

  const active = activeGroups(version)
  const closed = closedGroups()
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (view === "active" ? active : closed).filter((g) => {
      if (severity !== "all" && g.severity !== severity) return false
      if (category !== "all" && g.type.category !== category) return false
      if (term && !`${g.title} ${g.type.warning} ${g.locations.map((l) => l.name).join(" ")}`.toLowerCase().includes(term)) return false
      return true
    })
  }, [view, active, closed, search, severity, category])

  const endpointsInAlert = active.reduce((s, g) => s + g.endpoints.length, 0)
  const openGroupData = openId ? [...active, ...closed].find((g) => g.id === openId) ?? null : null

  return (
    <>
      <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
        <div className="flex flex-wrap items-center gap-2 px-4 pt-4">
          <div role="tablist" aria-label="Alert groups" className="flex rounded-lg p-0.5" style={{ background: "var(--bg-neutral-subtle)" }}>
            {(["active", "closed"] as View[]).map((v) => (
              <button key={v} role="tab" type="button" aria-selected={view === v} onClick={() => setView(v)}
                className="h-8 rounded-md px-3 text-sm font-medium transition-colors"
                style={view === v ? { background: "var(--bg-card)", color: "var(--fg-neutral-emphasis)", boxShadow: "0 1px 2px rgb(0 0 0 / 0.06)" } : { color: "var(--fg-neutral-muted)" }}>
                {v === "active" ? `Active · ${active.length}` : `Closed · ${closed.length}`}
              </button>
            ))}
          </div>
          {view === "active" && (
            <Badge variant="secondary" className="ml-1">{endpointsInAlert.toLocaleString()} endpoints affected</Badge>
          )}
        </div>

        {/* toolbar */}
        <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
          <div className="flex h-9 w-full items-center gap-1.5 rounded-lg px-2.5 sm:max-w-xs" style={{ background: "var(--bg-input-default)", border: "1px solid var(--border-input-default)" }}>
            <Search className="size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} aria-hidden />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search alerts or locations…" aria-label="Search alerts"
              className="min-w-px flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--fg-neutral-muted)]" style={{ color: "var(--fg-neutral-emphasis)" }} />
            {search && (
              <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="flex size-5 items-center justify-center rounded-sm hover:bg-[var(--bg-neutral-subtle-hovered)]" style={{ color: "var(--fg-neutral-muted)" }}>
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
              <SelectTrigger className="h-9" aria-label="Alert category"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {(Object.keys(categoryLabel) as AlertCategory[]).map((c) => <SelectItem key={c} value={c}>{categoryLabel[c]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
              <SelectTrigger className="h-9" aria-label="Severity"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full overflow-x-auto" style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}>
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-neutral-muted)", background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}>
                <th className="h-10 px-4 text-left text-xs font-medium">Alert</th>
                <th className="h-10 px-4 text-right text-xs font-medium">{view === "active" ? "Endpoints" : "Peak"}</th>
                <th className="h-10 px-4 text-left text-xs font-medium">{view === "active" ? "Severity" : "Lasted"}</th>
                <th className="h-10 px-4 text-left text-xs font-medium">Location</th>
                <th className="h-10 px-4 text-left text-xs font-medium">{view === "active" ? "First seen" : "Closed"}</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => <GroupRow key={g.id} g={g} selected={openId === g.id} onOpen={() => openGroup(g.id)} />)}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
                  {view === "active" ? "No alert groups match your filters." : "No groups closed in the last 7 days."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <GroupDrawer group={openGroupData} onClose={() => openGroup(null)} onOpenEndpoint={onOpenEndpoint} />
    </>
  )
}

function GroupRow({ g, selected, onOpen }: { g: AlertGroup; selected: boolean; onOpen: () => void }) {
  const Icon = g.type.icon
  const tone = sevTone[g.severity]
  const closed = !!g.closed
  return (
    <tr onClick={onOpen} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen() } }} tabIndex={0}
      className="group cursor-pointer outline-none transition-colors focus-visible:bg-[var(--bg-neutral-subtle-hovered)]"
      style={{ borderBottom: "1px solid var(--border-neutral-subtle)", background: selected ? "var(--bg-selected-subtle)" : undefined }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)" }}
      onMouseLeave={(e) => { e.currentTarget.style.background = selected ? "var(--bg-selected-subtle)" : "" }}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg"
            style={closed ? { background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" } : { background: tone.bg, color: tone.fg }}>
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{g.title}</span>
              {g.notifiedMinAgo !== null && !closed && <NotifiedChip />}
              {g.energySaverOn > 0 && <EnergySaverChip count={g.energySaverOn} of={g.endpoints.length} />}
            </div>
            <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
              {categoryLabelShort(g)}{g.recurrenceThisWeek > 2 && ` · recurring ${g.recurrenceThisWeek} times this week`}
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right font-mono tabular-nums" style={{ color: "var(--fg-neutral-emphasis)" }}>
        {closed ? g.closed!.peak : g.endpoints.length}
      </td>
      <td className="px-4 py-3">
        {closed
          ? <span style={{ color: "var(--fg-neutral-muted)" }}>{duration(g.closed!.lastedMin)}</span>
          : <SeveritySplit critical={g.counts.critical} warning={g.counts.warning} />}
      </td>
      <td className="px-4 py-3"><span style={{ color: "var(--fg-neutral-muted)" }}>{whereLine(g.locations)}</span></td>
      <td className="px-4 py-3"><span style={{ color: "var(--fg-neutral-muted)" }}>{ago(closed ? g.closed!.minutesAgo : g.firstSeenMinAgo)}</span></td>
      <td className="pr-3"><ChevronRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--fg-neutral-subtle)" }} aria-hidden /></td>
    </tr>
  )
}

const categoryLabelShort = (g: AlertGroup) => categoryLabel[g.type.category]
