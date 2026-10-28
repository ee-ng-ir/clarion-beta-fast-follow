import { useMemo, useState, useEffect, useRef } from "react"
import { useFeedVersion } from "@/data/agentFeed"
import { Search, X, Check, Minus, Monitor, ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, CircleCheck, ArrowUp, ArrowDown, ArrowDownUp, MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Chip } from "@/components/ui/chip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { countries, citiesInCountry } from "@/data/dashboard"
import { queryEndpoints, type Endpoint, type EndpointStatus, type SortKey, type SortDir } from "@/data/endpoints"
import { StatusFilter, statusVar, statusBadge, cap, initials, CountBadge, filterTriggerCls } from "./status"
import { useIsMobile } from "@/components/dashboard/MobileNav"
import {
  BottomSheet, BottomSheetTrigger, BottomSheetContent, BottomSheetHeader, BottomSheetTitle, BottomSheetClose,
  BottomSheetCloseButton, BottomSheetBody, BottomSheetItem, BottomSheetFooter, SheetButton, SheetCheck,
} from "@/components/ui/bottom-sheet"
import { formatAgo } from "@/lib/utils"

// Locations grouped under their country (label only — cities are selectable), all alphabetical.
const countryGroups = [...countries]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((c) => ({ name: c.name, cities: [...citiesInCountry(c.id)].sort((a, b) => a.name.localeCompare(b.name)) }))
const allCities = countryGroups.flatMap((g) => g.cities)

/** Multi-select location filter: tri-state country checkboxes (all / some / none)
 *  select or clear all their cities; cities are individually selectable. */
function LocationFilter({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const mobile = useIsMobile()
  if (mobile) return <LocationSheet value={value} onChange={onChange} />
  return <LocationPopover value={value} onChange={onChange} />
}

function LocationSheet({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>(value)
  const [q, setQ] = useState("")
  const query = q.trim().toLowerCase()
  const groups = countryGroups
    .map((g) => ({ ...g, cities: g.cities.filter((c) => !query || c.name.toLowerCase().includes(query) || g.name.toLowerCase().includes(query)) }))
    .filter((g) => g.cities.length > 0)
  const toggle = (id: string) => setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))
  return (
    <BottomSheet open={open} onOpenChange={(o) => { setOpen(o); if (o) { setDraft(value); setQ("") } }}>
      <BottomSheetTrigger asChild>
        <button type="button" className={filterTriggerCls}
          style={{ background: "var(--bg-input-default)", border: "1px solid var(--border-input-default)", color: "var(--fg-neutral-emphasis)" }}>
          <span>Location</span>
          {value.length > 0 && <CountBadge n={value.length} />}
          <ChevronDown className="size-4" style={{ color: "var(--fg-neutral-muted)" }} />
        </button>
      </BottomSheetTrigger>
      <BottomSheetContent>
        <BottomSheetHeader>
          <BottomSheetTitle>Location</BottomSheetTitle>
          <BottomSheetCloseButton />
        </BottomSheetHeader>
        <BottomSheetBody>
          <div className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5" style={{ background: "var(--bg-input-default)", border: "1px solid var(--border-input-default)" }}>
            <Search className="size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search locations" aria-label="Search locations"
              className="min-w-px flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--fg-neutral-muted)]" style={{ color: "var(--fg-neutral-emphasis)" }} />
          </div>
          <div>
            {groups.length === 0 && (
              <p className="py-6 text-center text-sm" style={{ color: "var(--fg-neutral-muted)" }}>No locations match "{q}".</p>
            )}
            {groups.map((g) => {
              const cityIds = g.cities.map((c) => c.id)
              const sel = cityIds.filter((id) => draft.includes(id)).length
              const state = sel === 0 ? "unchecked" : sel === cityIds.length ? "checked" : "indeterminate"
              return (
                <div key={g.name}>
                  <BottomSheetItem>
                    <input type="checkbox" className="sr-only" checked={state === "checked"} aria-checked={state === "indeterminate" ? "mixed" : state === "checked"}
                      onChange={() => setDraft((d) => (sel > 0 ? d.filter((id) => !cityIds.includes(id)) : [...d, ...cityIds]))} />
                    <SheetCheck state={state} />
                    <span className="flex-1 font-medium">{g.name}</span>
                  </BottomSheetItem>
                  {g.cities.map((c) => (
                    <BottomSheetItem key={c.id} className="pl-8">
                      <input type="checkbox" className="sr-only" checked={draft.includes(c.id)} onChange={() => toggle(c.id)} />
                      <SheetCheck state={draft.includes(c.id) ? "checked" : "unchecked"} />
                      <span className="flex-1">{c.name}</span>
                    </BottomSheetItem>
                  ))}
                </div>
              )
            })}
          </div>
        </BottomSheetBody>
        <BottomSheetFooter>
          <SheetButton onClick={() => setDraft([])} disabled={draft.length === 0}>Clear</SheetButton>
          <SheetButton primary onClick={() => { onChange(draft); setOpen(false) }}>Apply{draft.length ? ` · ${draft.length}` : ""}</SheetButton>
        </BottomSheetFooter>
      </BottomSheetContent>
    </BottomSheet>
  )
}

function LocationPopover({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const label =
    value.length === 0
      ? "All locations"
      : value.length === 1
        ? allCities.find((c) => c.id === value[0])?.name ?? "1 location"
        : `${value.length} locations`
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])

  const Box = ({ state }: { state: "checked" | "indeterminate" | "unchecked" }) => {
    const filled = state !== "unchecked"
    return (
      <span
        className="flex size-4 shrink-0 items-center justify-center rounded"
        style={{
          background: filled ? "var(--bg-primary-emphasis)" : "var(--bg-input-default)",
          border: `1px solid ${filled ? "var(--bg-primary-emphasis)" : "var(--border-input-default)"}`,
        }}
      >
        {state === "checked" && <Check className="size-3" style={{ color: "var(--fg-on-primary-emphasis)" }} />}
        {state === "indeterminate" && <Minus className="size-3" style={{ color: "var(--fg-on-primary-emphasis)" }} />}
      </span>
    )
  }
  const rowCls = "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
  const cityCls = "flex w-full items-center gap-2 rounded-md py-1.5 pl-7 pr-2 text-left text-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm transition-colors"
          style={{ background: "var(--bg-input-default)", border: "1px solid var(--border-input-default)", color: "var(--fg-neutral-emphasis)" }}
        >
          <span>{label}</span>
          <ChevronDown className="size-4" style={{ color: "var(--fg-neutral-muted)" }} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1">
        <div className="max-h-72 overflow-y-auto">
          <button type="button" onClick={() => onChange([])} className={rowCls} style={{ color: "var(--fg-neutral-emphasis)" }}>
            <Box state={value.length === 0 ? "checked" : "unchecked"} />
            <span>All locations</span>
          </button>
          {countryGroups.map((g) => {
            const cityIds = g.cities.map((c) => c.id)
            const selCount = cityIds.filter((id) => value.includes(id)).length
            const countryState: "checked" | "indeterminate" | "unchecked" =
              selCount === 0 ? "unchecked" : selCount === cityIds.length ? "checked" : "indeterminate"
            // any selected → clear this country's cities; none selected → select them all
            const toggleCountry = () =>
              onChange(selCount > 0 ? value.filter((id) => !cityIds.includes(id)) : [...value, ...cityIds])
            return (
              <div key={g.name} className="pt-1">
                <button type="button" onClick={toggleCountry} className={rowCls}>
                  <Box state={countryState} />
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>{g.name}</span>
                  {selCount > 0 && <span className="ml-auto text-xs font-medium" style={{ color: "var(--fg-link-default)" }}>Clear</span>}
                </button>
                {g.cities.map((c) => (
                  <button key={c.id} type="button" onClick={() => toggle(c.id)} className={cityCls} style={{ color: "var(--fg-neutral-emphasis)" }}>
                    <Box state={value.includes(c.id) ? "checked" : "unchecked"} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
        {value.length > 0 && (
          <div className="mt-1 pt-1" style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}>
            <button type="button" onClick={() => onChange([])} className={rowCls} style={{ color: "var(--fg-link-default)" }}>
              Clear selection
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function SortHeader({
  label, col, sortKey, sortDir, onSort, className,
}: {
  label: string; col: SortKey; sortKey: SortKey; sortDir: SortDir
  onSort: (c: SortKey) => void; className?: string
}) {
  const active = sortKey === col
  const Icon = !active ? ChevronsUpDown : sortDir === "asc" ? ChevronUp : ChevronDown
  return (
    <th className={"h-10 px-4 align-middle " + (className ?? "")}>
      <button
        type="button"
        onClick={() => onSort(col)}
        className="inline-flex items-center gap-1 text-xs font-medium transition-colors hover:text-[var(--fg-neutral-emphasis)]"
        style={{ color: active ? "var(--fg-neutral-emphasis)" : "var(--fg-neutral-muted)" }}
      >
        {label}
        <Icon className="size-3.5" style={{ color: active ? "var(--fg-neutral-muted)" : "var(--fg-neutral-subtle)" }} />
      </button>
    </th>
  )
}

/* ---------------- Mobile (< md) ---------------- */

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "status", label: "Status" },
  { key: "event", label: "Alert" },
  { key: "user", label: "User / Machine" },
  { key: "location", label: "Location" },
  { key: "score", label: "Network score" },
]

/** Column headers don't exist on phones, so sorting opens a sheet: one of a few →
 *  a radio list (Picasso RadioGroup), and the order as a two-button group. Picking
 *  applies straight away (the list is right there when it closes); Done closes. */
function MobileSort({
  sortKey, sortDir, onKey, onToggleDir, showLocation,
}: {
  sortKey: SortKey; sortDir: SortDir; onKey: (k: SortKey) => void; onToggleDir: () => void; showLocation: boolean
}) {
  const current = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? "Status"
  const options = SORT_OPTIONS.filter((o) => showLocation || o.key !== "location")
  const setDir = (d: SortDir) => { if (d !== sortDir) onToggleDir() }
  return (
    <BottomSheet>
      <BottomSheetTrigger asChild>
        <button
          type="button"
          aria-label={`Sort by ${current}, ${sortDir === "asc" ? "ascending" : "descending"}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
          style={{ background: "var(--bg-input-default)", border: "1px solid var(--border-input-default)", color: "var(--fg-neutral-emphasis)" }}
        >
          <ArrowDownUp className="size-4" aria-hidden />
        </button>
      </BottomSheetTrigger>
      <BottomSheetContent>
        <BottomSheetHeader>
          <BottomSheetTitle>Sort</BottomSheetTitle>
          <BottomSheetCloseButton />
        </BottomSheetHeader>
        <BottomSheetBody>
          <div role="radiogroup" aria-label="Sort by">
            {options.map((o) => {
              const on = o.key === sortKey
              return (
                <BottomSheetItem key={o.key}>
                  <input type="radio" name="sort-by" className="sr-only" checked={on} onChange={() => onKey(o.key)} />
                  <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-full"
                    style={{ border: `1px solid ${on ? "var(--bg-primary-emphasis)" : "var(--border-input-default)"}`, background: "var(--bg-input-default)" }}>
                    {on && <span className="size-2.5 rounded-full" style={{ background: "var(--bg-primary-emphasis)" }} />}
                  </span>
                  <span className="flex-1">{o.label}</span>
                </BottomSheetItem>
              )
            })}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium" style={{ color: "var(--fg-neutral-muted)" }}>Order</span>
            <div role="group" aria-label="Order" className="flex w-fit overflow-hidden rounded-lg" style={{ border: "1px solid var(--border-neutral-muted)" }}>
              {(["asc", "desc"] as const).map((d, i) => {
                const on = d === sortDir
                const Icon = d === "asc" ? ArrowUp : ArrowDown
                return (
                  <button key={d} type="button" aria-pressed={on} onClick={() => setDir(d)}
                    className="flex h-10 items-center gap-1.5 px-3 text-sm font-medium"
                    style={{ background: on ? "var(--bg-neutral-subtle)" : "var(--bg-card)", color: "var(--fg-neutral-emphasis)", borderLeft: i ? "1px solid var(--border-neutral-muted)" : undefined }}>
                    <Icon className="size-4" aria-hidden />{d === "asc" ? "Ascending" : "Descending"}
                  </button>
                )
              })}
            </div>
          </div>
        </BottomSheetBody>
        <BottomSheetFooter>
          <BottomSheetClose asChild>
            <SheetButton primary>Done</SheetButton>
          </BottomSheetClose>
        </BottomSheetFooter>
      </BottomSheetContent>
    </BottomSheet>
  )
}

/**
 * One endpoint as a stacked card (mobile). Follows Picasso's Card `sm` anatomy —
 * 16 padding, radius xl, border/neutral/muted, shadow xs — and its rules:
 * the whole card is the one target (clickable-card-needs-a-target), selection
 * is bg/selected/subtle on the card itself (selection-belongs-to-the-row), the
 * status badge keeps its word (never-colour-alone), the score is mono and
 * right-aligned (align-numbers-right). Type roles: name label/md, machine
 * code/xs, alert body/md, meta body/xs, score metric/sm.
 */
function EndpointCard({
  e, selected, showLocation, moreBreakdown, onOpen,
}: {
  e: Endpoint; selected: boolean; showLocation: boolean; moreBreakdown: string; onOpen: () => void
}) {
  const scoreColor = e.score === null ? "var(--fg-neutral-subtle)" : e.status === "critical" ? "var(--fg-danger-emphasis)" : e.status === "warning" ? "var(--fg-warning-emphasis)" : "var(--fg-neutral-emphasis)"
  const offline = e.status === "offline"
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-current={selected || undefined}
        aria-label={`${offline ? e.machine : `${e.user}, ${e.machine}`} — ${cap(e.status)}${e.event ? `. ${e.event}` : ""}`}
        className="flex w-full flex-col gap-3 rounded-xl border p-4 text-start shadow-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--border-focused)] active:bg-[var(--bg-neutral-subtle-pressed)]"
        style={{
          background: selected ? "var(--bg-selected-subtle)" : "var(--bg-card)",
          borderColor: selected ? "var(--border-primary-emphasis)" : "var(--border-neutral-muted)",
        }}
      >
        {/* header: identity + the one badge that changes what you do next */}
        <div className="flex w-full items-center gap-3">
          {offline ? (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}>
              <Monitor className="size-4" aria-hidden />
            </span>
          ) : (
            <Avatar className="size-8"><AvatarFallback>{initials(e.user)}</AvatarFallback></Avatar>
          )}
          <div className="flex min-w-px flex-1 flex-col">
            {offline ? (
              <span className="truncate font-mono text-xs font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{e.machine}</span>
            ) : (
              <>
                <span className="truncate text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{e.user}</span>
                <span className="truncate font-mono text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{e.machine}</span>
              </>
            )}
          </div>
          <Badge variant={statusBadge[e.status]} className="shrink-0 gap-1.5">
            <span className="size-1.5 rounded-full" style={{ background: statusVar[e.status] }} aria-hidden />
            {cap(e.status)}
          </Badge>
        </div>

        {/* body: the latest alert */}
        {e.event && (
          <div className="flex w-full items-start gap-2">
            <p className="min-w-px flex-1 text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>
              {e.event}
              {e.eventAgo !== null && <span className="text-xs" style={{ color: "var(--fg-neutral-subtle)" }}> · {formatAgo(e.eventAgo)} ago</span>}
            </p>
            {/* a count, so a neutral subtle badge — written as a label because touch has no hover */}
            {e.eventCount > 1 && (
              <span
                className="shrink-0 rounded-sm border px-1 py-0.5 text-xs font-medium"
                style={{ background: "var(--bg-neutral-subtle)", borderColor: "var(--border-neutral-muted)", color: "var(--fg-neutral-emphasis)" }}
                aria-label={`${e.eventCount - 1} more: ${moreBreakdown}`}
              >
                +{e.eventCount - 1}
              </span>
            )}
          </div>
        )}

        {/* footer: where it is, and its score */}
        <div className="flex w-full items-center gap-3 border-t pt-3" style={{ borderColor: "var(--border-neutral-muted)" }}>
          {showLocation && (
            <span className="flex min-w-px items-center gap-1 truncate text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
              <MapPin className="size-3.5 shrink-0" aria-hidden />{e.locationName}
            </span>
          )}
          <span className="ms-auto flex shrink-0 items-baseline gap-2">
            <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>Network score</span>
            <span className="font-mono text-sm font-medium" style={{ color: scoreColor }}>{e.score === null ? "—" : e.score}</span>
          </span>
          <ChevronRight className="size-4 shrink-0 rtl:rotate-180" style={{ color: "var(--fg-neutral-subtle)" }} aria-hidden />
        </div>
      </button>
    </li>
  )
}

const CHUNK = 25 // rows added per lazy-load step

// nearest vertically-scrollable ancestor (the page content scroller), so the
// lazy-load observer fires whether the page or a container is doing the scrolling
function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  let el = node?.parentElement ?? null
  while (el) {
    const oy = getComputedStyle(el).overflowY
    if (oy === "auto" || oy === "scroll") return el
    el = el.parentElement
  }
  return null
}

export function EndpointsTable({
  locationIds,
  onLocationsChange,
  onOpenEndpoint,
  openEndpointId,
}: {
  locationIds: string[]
  onLocationsChange: (ids: string[]) => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
  openEndpointId?: string | null
}) {
  const [search, setSearch] = useState("")
  // single source of truth for status filtering (empty = all). Landing on the
  // Endpoints tab defaults to the "Alerts only" triage view.
  const [statuses, setStatuses] = useState<EndpointStatus[]>(["critical", "warning"])
  const [sortKey, setSortKey] = useState<SortKey>("status")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [visible, setVisible] = useState(CHUNK)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // hide the Location column only when exactly one city is selected
  const showLocation = locationIds.length !== 1
  // the "Issues only" preset = exactly {critical, warning}
  const issuesActive = statuses.length === 2 && statuses.includes("critical") && statuses.includes("warning")
  const toggleStatus = (s: EndpointStatus) =>
    setStatuses((xs) => (xs.includes(s) ? xs.filter((x) => x !== s) : [...xs, s]))

  const feedVersion = useFeedVersion()
  const rows = useMemo(
    () => queryEndpoints({ search, locationIds, statuses, sortKey, sortDir }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search, locationIds, statuses, sortKey, sortDir, feedVersion]
  )

  // Freeze the highlight on the row that OPENED the drawer — it doesn't follow the
  // ↑/↓ flick, and the table stays put (we don't poll/track it) until the drawer
  // closes, at which point the highlight clears.
  const [openedId, setOpenedId] = useState<string | null>(null)
  useEffect(() => { if (!openEndpointId) setOpenedId(null) }, [openEndpointId])

  const shown = rows.slice(0, visible)
  // the +N tooltip breaks down only the ADDITIONAL alerts (the shown one excluded)
  const breakdownOf = (e: Endpoint) => {
    const critN = e.events.filter((ev) => ev.severity === "critical").length
    const warnN = e.events.filter((ev) => ev.severity === "warning").length
    const extraCrit = critN - (critN > 0 ? 1 : 0)
    const extraWarn = warnN - (critN > 0 ? 0 : 1)
    return [extraCrit ? `${extraCrit} critical` : "", extraWarn ? `${extraWarn} warning` : ""].filter(Boolean).join(" · ")
  }
  const colCount = 2 + (showLocation ? 1 : 0) + 1 + 1 + 1

  const resetPage = () => setVisible(CHUNK)
  const onSort = (c: SortKey) => {
    if (c === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(c); setSortDir("asc") }
    resetPage()
  }

  // lazy-load: pull in more rows as the footer sentinel scrolls into view.
  // Re-armed on `visible` so it keeps filling while the sentinel stays in view.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisible((v) => Math.min(v + CHUNK, rows.length)) },
      { root: getScrollParent(el), rootMargin: "400px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rows.length, visible])

  const emptyState = (
    <div className="flex flex-col items-center gap-2 text-center">
      {issuesActive ? (
        <>
          <CircleCheck className="size-6" style={{ color: "var(--fg-success)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>All clear</span>
          <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>No endpoints with alerts here. Turn off “Alerts only” to see all.</span>
        </>
      ) : (
        <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>No endpoints match your filters.</span>
      )}
    </div>
  )

  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0 max-md:overflow-visible max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none">
      {/* header */}
      <div className="flex items-center gap-2 px-4 py-4 max-md:hidden">
        <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Endpoints</h2>
        <Badge variant="secondary">
          {rows.length.toLocaleString()} {issuesActive ? "with alerts" : rows.length === 1 ? "endpoint" : "endpoints"}
        </Badge>
      </div>

      {/* toolbar */}
      <div className="flex flex-col gap-2 px-4 pb-4 max-md:px-0 max-md:pb-3 sm:flex-row sm:items-center">
        <div className="flex w-full items-center gap-2 sm:max-w-xs">
        <div className="flex h-9 min-w-px flex-1 items-center gap-1.5 rounded-lg px-2.5" style={{ background: "var(--bg-input-default)", border: "1px solid var(--border-input-default)" }}>
          <Search className="size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage() }}
            placeholder="Search endpoint, user or alert…"
            className="min-w-px flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--fg-neutral-muted)]"
            style={{ color: "var(--fg-neutral-emphasis)" }}
          />
          {search && (
            <button type="button" aria-label="Clear search" onClick={() => { setSearch(""); resetPage() }} className="flex size-5 shrink-0 items-center justify-center rounded-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]" style={{ color: "var(--fg-neutral-muted)" }}>
              <X className="size-3.5" />
            </button>
          )}
        </div>
        {/* phones: sort sits beside search, since column headers aren't there to click */}
        <div className="shrink-0 md:hidden">
          <MobileSort
            sortKey={sortKey}
            sortDir={sortDir}
            showLocation={showLocation}
            onKey={(k) => { setSortKey(k); setSortDir("asc"); resetPage() }}
            onToggleDir={() => { setSortDir((d) => (d === "asc" ? "desc" : "asc")); resetPage() }}
          />
        </div>
        </div>
        <div className="flex items-center gap-2 max-md:-mx-1 max-md:overflow-x-auto max-md:px-1 max-md:py-0.5 max-md:[scrollbar-width:none] sm:ml-auto md:flex-wrap [&::-webkit-scrollbar]:hidden">
          {/* quick-filter preset */}
          <Chip
            selected={issuesActive}
            aria-pressed={issuesActive}
            leading={issuesActive ? <Check /> : undefined}
            onClick={() => { setStatuses(issuesActive ? [] : ["critical", "warning"]); resetPage() }}
          >
            Alerts only
          </Chip>
          {/* divider separating quick-filter presets from precise filters */}
          <span className="mx-0.5 hidden h-5 w-px sm:block" style={{ background: "var(--border-neutral-muted)" }} aria-hidden />
          <LocationFilter value={locationIds} onChange={(ids) => { onLocationsChange(ids); resetPage() }} />
          <StatusFilter value={statuses} onToggle={(s) => { toggleStatus(s); resetPage() }} onClear={() => { setStatuses([]); resetPage() }} />
        </div>
      </div>

      {/* mobile: stacked endpoint cards instead of a horizontally-scrolling table */}
      <div className="md:hidden">
        <p className="pb-2 text-xs" style={{ color: "var(--fg-neutral-muted)" }} aria-live="polite">
          {rows.length.toLocaleString()} {issuesActive ? "with alerts" : rows.length === 1 ? "endpoint" : "endpoints"}
        </p>
        {shown.length > 0 ? (
          <ul className="flex flex-col gap-3" aria-label="Endpoints">
            {shown.map((e, i) => (
              <EndpointCard
                key={e.id}
                e={e}
                selected={openedId === e.id}
                showLocation={showLocation}
                moreBreakdown={breakdownOf(e)}
                onOpen={() => { setOpenedId(e.id); onOpenEndpoint(rows, i) }}
              />
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border px-4 py-16" style={{ borderColor: "var(--border-neutral-muted)", background: "var(--bg-card)" }}>{emptyState}</div>
        )}
      </div>

      {/* table (md and up) */}
      <div className="hidden w-full overflow-x-auto md:block" style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-neutral-muted)", background: "var(--bg-neutral-subtle)" }}>
              <SortHeader label="User / Machine" col="user" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="text-left" />
              <SortHeader label="Status" col="status" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="text-left" />
              {showLocation && <SortHeader label="Location" col="location" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="text-left" />}
              <SortHeader label="Clarion Network Score" col="score" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="text-left" />
              <SortHeader label="Alert" col="event" sortKey={sortKey} sortDir={sortDir} onSort={onSort} className="text-left" />
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {shown.map((e, i) => {
              const isSel = openedId === e.id
              const moreBreakdown = breakdownOf(e)
              return (
                <tr
                  key={e.id}
                  onClick={() => { setOpenedId(e.id); onOpenEndpoint(rows, i) }}
                  className="group cursor-pointer transition-colors"
                  style={{
                    borderBottom: "1px solid var(--border-neutral-subtle)",
                    background: isSel ? "var(--bg-selected-subtle)" : "transparent",
                  }}
                  onMouseEnter={(ev) => { if (!isSel && !openEndpointId) ev.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)" }}
                  onMouseLeave={(ev) => { ev.currentTarget.style.background = isSel ? "var(--bg-selected-subtle)" : "transparent" }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {e.status === "offline" ? (
                        <>
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}>
                            <Monitor className="size-4" />
                          </span>
                          <span className="truncate font-mono text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{e.machine}</span>
                        </>
                      ) : (
                        <>
                          <Avatar className="size-8"><AvatarFallback>{initials(e.user)}</AvatarFallback></Avatar>
                          <div className="flex min-w-px flex-col">
                            <span className="truncate text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{e.user}</span>
                            <span className="truncate font-mono text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{e.machine}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadge[e.status]} className="gap-1.5">
                      <span className="size-1.5 rounded-full" style={{ background: statusVar[e.status] }} />
                      {cap(e.status)}
                    </Badge>
                  </td>
                  {showLocation && (
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{e.locationName}</span>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span
                      className="font-mono text-sm font-medium"
                      style={{ color: e.score === null ? "var(--fg-neutral-subtle)" : e.status === "critical" ? "var(--fg-danger-emphasis)" : e.status === "warning" ? "var(--fg-warning-emphasis)" : "var(--fg-neutral-emphasis)" }}
                    >
                      {e.score === null ? "—" : e.score}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {e.event ? (
                      <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
                        <span className="size-1.5 shrink-0 rounded-full" style={{ background: statusVar[e.status] }} />
                        {e.event}
                        {e.eventCount > 1 && e.eventAgo !== null && (
                          <span className="text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>· {formatAgo(e.eventAgo)} ago · </span>
                        )}
                        {e.eventCount > 1 && (
                          <span className="group/more relative text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>
                            +{e.eventCount - 1}
                            <span
                              role="tooltip"
                              className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium group-hover/more:block"
                              style={{ background: "var(--bg-neutral-emphasis)", color: "var(--fg-on-neutral-emphasis)", boxShadow: "var(--shadow-md)" }}
                            >
                              {moreBreakdown}
                            </span>
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-sm" style={{ color: "var(--fg-neutral-subtle)" }}>—</span>
                    )}
                  </td>
                  <td className="pr-3">
                    <ChevronRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--fg-neutral-subtle)" }} />
                  </td>
                </tr>
              )
            })}
            {shown.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-4 py-16">{emptyState}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* footer doubles as the lazy-load sentinel — rows load automatically as it scrolls into view */}
      {rows.length > 0 && (
        <div ref={sentinelRef} className="flex items-center justify-center border-t px-4 py-3 text-sm max-md:border-t-0 max-md:text-xs" style={{ borderColor: "var(--border-neutral-muted)", color: "var(--fg-neutral-muted)" }}>
          Showing {shown.length.toLocaleString()} of {rows.length.toLocaleString()} endpoints
        </div>
      )}
    </Card>
  )
}
