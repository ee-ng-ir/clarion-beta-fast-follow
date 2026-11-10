import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import {
  Badge, Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardHeaderText, CardTitle, EmptyState,
  InputGroup, InputGroupAddon, InputGroupInput, KpiTile, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@ir/ui"
import { complianceLabel, type Compliance } from "@ir/telemetry"
import type { Endpoint } from "@/data/endpoints"
import { complianceBadge, complianceFor, useHeadsetsVersion } from "../headsets/headsets"
import { HeadsetCell } from "../headsets/HeadsetBits"
import { goToSettings } from "../navigator"
import { DashboardActions } from "./DashboardActions"
import { downloadCsv } from "./csv"
import { endpointsIn, INV_LABEL, invValueLabel, inventoryCounts, inventoryFor, LATEST_WIDGET, locationName, LOCATIONS, type InvCategory } from "./data"
import { patchInventory, useDashboards } from "./store"

const CATS: InvCategory[] = ["headset", "microphone", "camera", "windows", "widget"]
const ROWS_SHOWN = 6
const PAGE = 50
const locationOptions = LOCATIONS.map((l) => ({ value: l.id, label: l.name }))
const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0)

/** "category|value" keys: OR within a category, AND across categories. */
function matches(e: Endpoint, filters: string[], approved: string[]) {
  const byCat = new Map<string, string[]>()
  for (const f of filters) { const [c, ...v] = f.split("|"); byCat.set(c, [...(byCat.get(c) ?? []), v.join("|")]) }
  const inv = inventoryFor(e)
  for (const [c, vals] of byCat) {
    const have = c === "compliance" ? complianceFor(e, approved) : inv[c as InvCategory]
    if (!vals.includes(have)) return false
  }
  return true
}
const filterLabel = (key: string) => {
  const [c, ...v] = key.split("|")
  return c === "compliance" ? `Headset: ${complianceLabel[v.join("|") as Compliance].toLowerCase()}` : invValueLabel(c as InvCategory, v.join("|"))
}

/**
 * Device inventory: what's in use right now, from each endpoint. Summary counts
 * per device and version; pick any row to see those endpoints. The approval
 * column only shows once an approved headset list is set (R4).
 */
export function InventoryDashboard({ onOpenEndpoint }: { onOpenEndpoint: (rows: Endpoint[], index: number) => void }) {
  const { inventory: st } = useDashboards()
  const { approved } = useHeadsetsVersion()
  const hasList = approved.length > 0
  const [shown, setShown] = useState(PAGE)
  const [expanded, setExpanded] = useState<InvCategory[]>([])

  const eps = useMemo(() => endpointsIn(st.locations), [st.locations])
  const counts = useMemo(() => Object.fromEntries(CATS.map((c) => [c, inventoryCounts(eps, c)])) as Record<InvCategory, ReturnType<typeof inventoryCounts>>, [eps, approved]) // eslint-disable-line react-hooks/exhaustive-deps
  const compliance = useMemo(() => {
    const m = new Map<string, Compliance>()
    for (const e of eps) { const k = inventoryFor(e).headset; if (!m.has(k)) m.set(k, complianceFor(e, approved)) }
    return m
  }, [eps, approved])
  const approvedEps = eps.filter((e) => complianceFor(e, approved) === "approved").length
  const notApprovedEps = eps.filter((e) => complianceFor(e, approved) === "not-approved").length
  const win10 = counts.windows.find((r) => r.key.startsWith("Windows 10"))?.count ?? 0
  const outdated = eps.length - (counts.widget.find((r) => r.key === LATEST_WIDGET)?.count ?? 0)

  const q = st.q.trim().toLowerCase()
  const rows = useMemo(() => eps.filter((e) => matches(e, st.filters, approved) && (!q || `${e.user} ${e.machine}`.toLowerCase().includes(q))),
    [eps, st.filters, q, approved])

  const scope = st.locations.length ? st.locations.map(locationName).join(", ") : "All locations"
  const pick = (key: string) => { patchInventory({ filters: [key], tab: "endpoints", q: "" }); setShown(PAGE) }

  const filterOptions = [
    ...(hasList ? [{ value: "compliance|not-approved", label: "Not approved", group: "Headset approval" }, { value: "compliance|not-checked", label: "Can't be checked", group: "Headset approval" }] : []),
    ...CATS.flatMap((c) => counts[c].map((r) => ({ value: `${c}|${r.key}`, label: r.key, detail: String(r.count), group: INV_LABEL[c] }))),
  ]

  const exportCsv = () => {
    const about = ["Device inventory", `Scope: ${scope}`]
    if (st.tab === "summary") {
      downloadCsv("Device-inventory-summary", about, [["Category", "Model or version", "Endpoints", "% of endpoints", ...(hasList ? ["Approval"] : [])],
        ...CATS.flatMap((c) => counts[c].map((r) => [INV_LABEL[c], r.key, r.count, pct(r.count, eps.length), ...(hasList ? [c === "headset" ? complianceLabel[compliance.get(r.key) ?? "none"] : ""] : [])]))])
    } else {
      downloadCsv("Device-inventory-endpoints", [...about, ...st.filters.map(filterLabel)], [["User", "Machine", "Location", "Headset", ...(hasList ? ["Headset approval"] : []), "Microphone", "Camera", "Windows", "Widget version"],
        ...rows.map((e) => { const i = inventoryFor(e); return [e.user, e.machine, e.locationName, i.headset, ...(hasList ? [complianceLabel[complianceFor(e, approved)]] : []), i.microphone, i.camera, i.windows, i.widget] })])
    }
  }

  return (
    <div className="@container flex w-full flex-col gap-4">
      <Card>
        <CardContent className="flex-row flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Select label="Location" className="w-44" options={locationOptions} value={st.locations} onValueChange={(v) => patchInventory({ locations: v })} />
            <span className="text-body-sm text-content-neutral-muted">{scope} · as reported now</span>
          </div>
          <DashboardActions view="inventory" suggestedName={st.filters.length ? `${st.filters.map(filterLabel).join(", ")} · ${scope}` : `Device inventory · ${scope}`} onExport={exportCsv} />
        </CardContent>
      </Card>

      <div className="grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-4">
        <KpiTile label="Endpoints in scope" value={eps.length.toLocaleString()} footer={scope} />
        {hasList ? (
          <KpiTile label="Headsets approved" value={pct(approvedEps, eps.length)} unit="%"
            footer={`${notApprovedEps.toLocaleString()} endpoints on a headset that isn't approved`}
            action={notApprovedEps ? <Button variant="ghost" size="sm" onClick={() => pick("compliance|not-approved")}>View</Button> : undefined} />
        ) : (
          <KpiTile label="Headsets approved" value="—" footer="No approved headset list yet"
            action={<Button variant="ghost" size="sm" onClick={() => goToSettings("devices")}>Set up</Button>} />
        )}
        <KpiTile label="Still on Windows 10" value={win10.toLocaleString()} footer={`${pct(win10, eps.length)}% of endpoints · out of Microsoft support`}
          action={win10 ? <Button variant="ghost" size="sm" onClick={() => pick("windows|Windows 10 22H2")}>View</Button> : undefined} />
        <KpiTile label="Widget not on the latest" value={outdated.toLocaleString()} footer={`Latest is v${LATEST_WIDGET}`} />
      </div>

      <Tabs value={st.tab} onValueChange={(t) => patchInventory({ tab: t as "summary" | "endpoints" })} className="flex w-full flex-col gap-4">
        <TabsList aria-label="Device inventory">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints · {rows.length.toLocaleString()}</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid gap-4 @4xl:grid-cols-2">
            {CATS.map((c) => {
              const all = counts[c]
              const open = expanded.includes(c)
              const list = open ? all : all.slice(0, ROWS_SHOWN)
              const showApproval = c === "headset" && hasList
              return (
                <Card key={c} className={c === "headset" ? "@4xl:col-span-2" : undefined}>
                  <CardHeader>
                    <CardHeaderText>
                      <CardTitle>{INV_LABEL[c]}</CardTitle>
                      <CardDescription>{all.length} {all.length === 1 ? "kind" : "kinds"} in use. Pick one to see those endpoints.</CardDescription>
                    </CardHeaderText>
                    {c === "headset" && !hasList && (
                      <CardAction><Button variant="ghost" size="sm" onClick={() => goToSettings("devices")}>Set up approved headsets</Button></CardAction>
                    )}
                  </CardHeader>
                  <Table size="sm" aria-label={INV_LABEL[c]}>
                    <TableHeader>
                      <TableRow>
                        <TableHead align="start">{c === "windows" || c === "widget" ? "Version" : "Model"}</TableHead>
                        {showApproval && <TableHead align="start">Approval</TableHead>}
                        <TableHead numeric>Endpoints</TableHead>
                        <TableHead numeric>Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {list.map((r) => {
                        const comp = compliance.get(r.key) ?? "none"
                        return (
                          <TableRow key={r.key} className="cursor-pointer" onClick={() => pick(`${c}|${r.key}`)}>
                            <TableCell align="start">
                              <button type="button" onClick={(ev) => { ev.stopPropagation(); pick(`${c}|${r.key}`) }}
                                className="rounded-xs text-start text-label-md text-content-neutral-emphasis outline-none hover:underline focus-visible:ring-2 focus-visible:ring-line-focused">
                                {c === "widget" ? `v${r.key}` : r.key}
                              </button>
                            </TableCell>
                            {showApproval && (
                              <TableCell align="start">{comp !== "none" && <Badge color={complianceBadge[comp]}>{complianceLabel[comp]}</Badge>}</TableCell>
                            )}
                            <TableCell numeric>{r.count.toLocaleString()}</TableCell>
                            <TableCell numeric className="text-content-neutral-muted">{pct(r.count, eps.length)}%</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                  {all.length > ROWS_SHOWN && (
                    <CardContent className="pt-3">
                      <Button variant="ghost" size="sm" className="self-start" onClick={() => setExpanded(open ? expanded.filter((x) => x !== c) : [...expanded, c])}>
                        {open ? "Show fewer" : `Show all ${all.length}`}
                      </Button>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="endpoints">
          <Card>
            <CardContent className="flex flex-col gap-3 @2xl:flex-row @2xl:items-center">
              <InputGroup className="@2xl:max-w-xs">
                <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
                <InputGroupInput aria-label="Search user or machine" placeholder="Search user or machine" value={st.q} onChange={(e) => { patchInventory({ q: e.target.value }); setShown(PAGE) }} />
                {st.q && <InputGroupAddon align="end"><Button variant="ghost" size="icon-xs" aria-label="Clear search" onClick={() => patchInventory({ q: "" })}><X /></Button></InputGroupAddon>}
              </InputGroup>
              <Select label="Device or version" className="w-60" options={filterOptions} value={st.filters} showDetail
                onValueChange={(v) => { patchInventory({ filters: v }); setShown(PAGE) }} />
              {st.filters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {st.filters.map((f) => <Badge key={f}>{filterLabel(f)}</Badge>)}
                  <Button variant="ghost" size="sm" onClick={() => patchInventory({ filters: [] })}>Clear</Button>
                </div>
              )}
            </CardContent>
            {rows.length === 0 ? (
              <CardContent>
                <EmptyState size="sm" illustration="dashboards" title="No endpoints match" description="Try another location, device or search."
                  action={<Button variant="outline" size="sm" onClick={() => patchInventory({ filters: [], q: "" })}>Clear filters</Button>} />
              </CardContent>
            ) : (
              <>
                <Table size="sm" aria-label="Endpoints">
                  <TableHeader>
                    <TableRow>
                      <TableHead align="start">User / Machine</TableHead>
                      <TableHead align="start" className="hidden @3xl:table-cell">Location</TableHead>
                      <TableHead align="start">Headset</TableHead>
                      <TableHead align="start" className="hidden @4xl:table-cell">Camera</TableHead>
                      <TableHead align="start" className="hidden @2xl:table-cell">Windows</TableHead>
                      <TableHead align="start" className="hidden @5xl:table-cell">Widget</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, shown).map((e, i) => {
                      const inv = inventoryFor(e)
                      return (
                        <TableRow key={e.id} className="cursor-pointer" onClick={() => onOpenEndpoint(rows, i)}>
                          <TableCell align="start">
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate text-label-md text-content-neutral-emphasis">{e.user}</span>
                              <span className="truncate font-mono text-body-xs text-content-neutral-muted">{e.machine}</span>
                            </div>
                          </TableCell>
                          <TableCell align="start" className="hidden @3xl:table-cell">{e.locationName}</TableCell>
                          <TableCell align="start"><HeadsetCell e={e} approved={approved} /></TableCell>
                          <TableCell align="start" className="hidden @4xl:table-cell">{inv.camera}</TableCell>
                          <TableCell align="start" className="hidden @2xl:table-cell">{inv.windows}</TableCell>
                          <TableCell align="start" className="hidden @5xl:table-cell">v{inv.widget}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                <CardContent className="flex-row items-center justify-between gap-3">
                  <span className="text-body-sm text-content-neutral-muted">Showing {Math.min(shown, rows.length).toLocaleString()} of {rows.length.toLocaleString()}</span>
                  {shown < rows.length && <Button variant="outline" size="sm" onClick={() => setShown(shown + PAGE)}>Show {Math.min(PAGE, rows.length - shown)} more</Button>}
                </CardContent>
              </>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
