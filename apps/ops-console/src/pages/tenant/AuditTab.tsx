import { Fragment, useMemo, useState } from "react"
import { ChevronRight, Filter, ScrollText } from "lucide-react"
import {
  Badge, Button, Card, CardDescription, CardHeader, CardHeaderText, CardTitle, DatePicker, EmptyState, Select,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import { CopyButton, Mono, SearchField } from "@/components/ui"
import { cx, fmtDateTime } from "@/lib/format"
import { useOps } from "@/data/store"
import type { AuditEvent, Tenant } from "@/data/tenants"

type Range = { from: Date | undefined; to?: Date }
const PAGE = 25
const NONE: AuditEvent[] = []

const tone = (action: string) =>
  action.endsWith(".failed") || action.includes("cancel") || action.includes("deactivated") ? "danger"
    : action.endsWith(".succeeded") || action.endsWith(".provisioned") ? "success"
      : action.startsWith("flag.") || action.startsWith("subscription.") ? "info"
        : "neutral"

export function AuditTab({ tenant }: { tenant: Tenant }) {
  const events = useOps((s) => s.audit[tenant.id] ?? NONE)
  const [q, setQ] = useState("")
  const [actions, setActions] = useState<string[]>([])
  const [range, setRange] = useState<Range | undefined>()
  const [open, setOpen] = useState<string | null>(null)
  const [shown, setShown] = useState(PAGE)

  const actionOptions = useMemo(() => {
    const counts = new Map<string, number>()
    events.forEach((e) => counts.set(e.action, (counts.get(e.action) ?? 0) + 1))
    return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([a, n]) => ({ value: a, label: a, detail: String(n), group: a.split(".")[0] }))
  }, [events])

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase()
    return events.filter((e) => {
      if (actions.length && !actions.includes(e.action)) return false
      const t = new Date(e.ts)
      if (range?.from && t < range.from) return false
      if (range?.to && t > new Date(range.to.getTime() + 86_400_000)) return false
      return !n || [e.action, e.target, e.actor, e.id].some((v) => v.toLowerCase().includes(n))
    })
  }, [events, q, actions, range])

  const filtered = !!(q || actions.length || range?.from)

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardHeaderText>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>Everything that happened in this tenancy: sign-ins and changes by the client, and changes made by IR in this console.</CardDescription>
        </CardHeaderText>
      </CardHeader>
      <div className="flex flex-wrap items-center gap-2 px-6 py-4">
        <SearchField value={q} onChange={setQ} placeholder="Search actor, target, event or ID" size="sm" className="sm:w-80" />
        <Select className="w-auto min-w-36" label="Actions" icon={<Filter />} size="sm" options={actionOptions} value={actions} onValueChange={setActions} showDetail searchPlaceholder="Search actions" />
        <div className="w-60">
          <DatePicker mode="range" value={range} onValueChange={setRange} placeholder="Any date" />
        </div>
        {filtered ? <Button variant="ghost" size="sm" onClick={() => { setQ(""); setActions([]); setRange(undefined) }}>Clear filters</Button> : null}
        <span className="ms-auto text-body-sm text-content-neutral-muted">{rows.length} event{rows.length === 1 ? "" : "s"}</span>
      </div>
      {rows.length === 0 ? (
        <EmptyState size="sm" icon={<ScrollText />} title={filtered ? "No events match" : "No events yet"} description={filtered ? "Widen the date range or clear a filter." : "Events appear here as soon as anyone signs in or changes something."} className="pb-10" />
      ) : (
        <>
          <Table size="sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead align="start" className="w-10"><span className="sr-only">Details</span></TableHead>
                <TableHead align="start">Time (AEDT)</TableHead>
                <TableHead align="start">Action</TableHead>
                <TableHead align="start">Target</TableHead>
                <TableHead align="start">Origin</TableHead>
                <TableHead align="start">Actor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, shown).map((e) => (
                <Fragment key={e.id}>
                  <TableRow className="cursor-pointer" onClick={() => setOpen(open === e.id ? null : e.id)} selected={open === e.id}>
                    <TableCell>
                      <Button variant="ghost" size="icon-xs" aria-expanded={open === e.id} aria-label={`Details for ${e.action} at ${fmtDateTime(e.ts)}`} onClick={(ev) => { ev.stopPropagation(); setOpen(open === e.id ? null : e.id) }}>
                        <ChevronRight aria-hidden className={cx("transition-transform motion-reduce:transition-none", open === e.id && "rotate-90")} />
                      </Button>
                    </TableCell>
                    <TableCell className="whitespace-nowrap"><Mono>{fmtDateTime(e.ts)}</Mono></TableCell>
                    <TableCell><Badge color={tone(e.action)} variant="subtle" className="font-mono">{e.action}</Badge></TableCell>
                    <TableCell className="max-w-72"><span className="block truncate"><span className="text-content-neutral-muted">{e.targetType} · </span>{e.target}</span></TableCell>
                    <TableCell><Badge variant="outline" color={e.origin === "Internal" ? "warning" : "neutral"}>{e.origin === "Internal" ? "IR" : "Client"}</Badge></TableCell>
                    <TableCell className="max-w-56"><span className="block truncate">{e.actor}</span></TableCell>
                  </TableRow>
                  {open === e.id ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="h-auto bg-surface-neutral-subtle py-3">
                        <EventJson e={e} />
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              ))}
            </TableBody>
          </Table>
          {rows.length > shown ? (
            <div className="flex justify-center p-4">
              <Button variant="outline" size="sm" onClick={() => setShown((n) => n + PAGE)}>Show {Math.min(PAGE, rows.length - shown)} more</Button>
            </div>
          ) : null}
        </>
      )}
    </Card>
  )
}

function EventJson({ e }: { e: AuditEvent }) {
  const json = JSON.stringify({ event_id: e.id, timestamp: e.ts, action: e.action, target: { type: e.targetType, label: e.target }, origin: e.origin.toLowerCase(), actor: e.actor, details: e.details ?? {} }, null, 2)
  return (
    <div className="relative">
      <div className="absolute end-0 top-0"><CopyButton value={json} label="event JSON" /></div>
      <pre className="overflow-x-auto pe-10 font-mono text-code-xs text-content-neutral-emphasis">{json}</pre>
    </div>
  )
}
