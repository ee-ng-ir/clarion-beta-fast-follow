import { useMemo, useState } from "react"
import { useFeedVersion } from "@/data/agentFeed"
import { Search, X, Siren, Wifi, Activity, Gauge, ChevronRight, type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from "@/components/ui/select"
import { countries, citiesInCountry, type Status } from "@/data/dashboard"
import { rollupsAll, type Rollup, type RollupCause } from "@/data/endpoints"

// locations grouped under their country (label only, cities selectable), alphabetical
const locationGroups = [...countries]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((c) => ({ name: c.name, cities: [...citiesInCountry(c.id)].sort((a, b) => a.name.localeCompare(b.name)) }))

const causeIcon: Record<RollupCause, LucideIcon> = {
  platform: Siren, loss: Activity, latency: Gauge, jitter: Wifi, other: Activity,
}
const sevTone: Record<Exclude<Status, "healthy">, { bg: string; fg: string }> = {
  critical: { bg: "var(--bg-danger-subtle)", fg: "var(--fg-on-danger-subtle)" },
  warning: { bg: "var(--bg-warning-subtle)", fg: "var(--fg-on-warning-subtle)" },
}
const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

export function AlertsTable({
  locationId,
  onLocationChange,
  onOpenAlert,
  openAlertId,
}: {
  locationId: string
  onLocationChange: (id: string) => void
  onOpenAlert: (rollups: Rollup[], index: number) => void
  openAlertId?: string | null
}) {
  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState<"all" | "critical" | "warning">("all")

  const feedVersion = useFeedVersion()
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rollupsAll().filter((r) => {
      if (locationId !== "all" && r.locationId !== locationId) return false
      if (severity !== "all" && r.severity !== severity) return false
      if (term && !`${r.title} ${r.locationName}`.toLowerCase().includes(term)) return false
      return true
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, locationId, severity, feedVersion])

  const totalAffected = rows.reduce((s, r) => s + r.affected, 0)

  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      <div className="flex items-center gap-2 px-4 py-4">
        <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Alerts</h2>
        <Badge variant="secondary">{rows.length} open · {totalAffected.toLocaleString()} endpoints</Badge>
      </div>

      {/* toolbar */}
      <div className="flex flex-col gap-2 px-4 pb-4 sm:flex-row sm:items-center">
        <div className="flex h-9 w-full items-center gap-1.5 rounded-lg px-2.5 sm:max-w-xs" style={{ background: "var(--bg-input-default)", border: "1px solid var(--border-input-default)" }}>
          <Search className="size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search alerts…"
            className="min-w-px flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--fg-neutral-muted)]" style={{ color: "var(--fg-neutral-emphasis)" }} />
          {search && (
            <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="flex size-5 shrink-0 items-center justify-center rounded-sm hover:bg-[var(--bg-neutral-subtle-hovered)]" style={{ color: "var(--fg-neutral-muted)" }}>
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Select value={locationId} onValueChange={onLocationChange}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Location" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locationGroups.map((g) => (
                <SelectGroup key={g.name}>
                  <SelectLabel>{g.name}</SelectLabel>
                  {g.cities.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <Select value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full overflow-x-auto" style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-neutral-muted)", background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}>
              <th className="h-10 px-4 text-left text-xs font-medium">Alert</th>
              <th className="h-10 px-4 text-left text-xs font-medium">Location</th>
              <th className="h-10 px-4 text-left text-xs font-medium">Affected</th>
              <th className="h-10 px-4 text-left text-xs font-medium">Severity</th>
              <th className="h-10 px-4 text-left text-xs font-medium">Started</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const Icon = causeIcon[r.cause]
              const tone = sevTone[r.severity]
              const isSel = openAlertId === r.id
              return (
                <tr key={r.id} onClick={() => onOpenAlert(rows, i)} className="group cursor-pointer transition-colors"
                  style={{ borderBottom: "1px solid var(--border-neutral-subtle)", background: isSel ? "var(--bg-selected-subtle)" : "transparent" }}
                  onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isSel ? "var(--bg-selected-subtle)" : "transparent" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ background: tone.bg, color: tone.fg }}><Icon className="size-4" /></span>
                      <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{r.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{r.locationName}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-2">
                        {r.endpoints.slice(0, 3).map((e) => (
                          <span key={e.id} className="flex size-6 items-center justify-center rounded-full text-[10px] font-medium" style={{ background: "var(--bg-neutral-emphasis)", color: "var(--fg-on-neutral-emphasis)", border: "1.5px solid var(--bg-card)" }}>{initials(e.user)}</span>
                        ))}
                      </div>
                      <span className="font-mono text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{r.affected}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant={r.severity === "critical" ? "danger" : "warning"}>{cap(r.severity)}</Badge></td>
                  <td className="px-4 py-3"><span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{r.startedMinAgo}m ago</span></td>
                  <td className="pr-3"><ChevronRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--fg-neutral-subtle)" }} /></td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-16 text-center text-sm" style={{ color: "var(--fg-neutral-muted)" }}>No alerts match your filters — all clear.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
