import { useMemo, useState } from "react"
import { CheckCheck, MapPin, MoreHorizontal, Search, Server, X } from "lucide-react"
import {
  Alert, AlertDescription, AlertTitle, Badge, Button, Card, CardDescription, CardHeader, CardHeaderText, CardTitle,
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  EmptyState, FieldOption, InputGroup, InputGroupAddon, InputGroupInput, Radio, RadioGroup, Select,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import { access, locationName } from "@ir/mock-data/access"
import { useVantage, vantage, type SystemStatus, type VantageSystem } from "@ir/mock-data/vantage"
import { toast } from "@/components/ui/toast"
import { useAccess } from "@/components/admin/access/AccessBits"
import { useViewer } from "@/lib/viewer"

const statusBadge: Record<SystemStatus, { color: "success" | "warning" | "danger"; label: string }> = {
  healthy: { color: "success", label: "Healthy" },
  warning: { color: "warning", label: "Warning" },
  critical: { color: "danger", label: "Critical" },
}

/**
 * Vantage's space (placeholder product). Its systems, scoped like the server would:
 * a role limited to locations only gets systems in them. Viewers read; Editors also
 * acknowledge alerts; Product Admins also set a system's location.
 */
export function VantagePage() {
  useAccess()
  const all = useVantage()
  const { person, perm } = useViewer()
  const v = perm.products.vantage
  const visible = vantage.visible(v.scope)
  const [q, setQ] = useState("")
  const [locF, setLocF] = useState<string[]>([])
  const [placing, setPlacing] = useState<VantageSystem | null>(null)

  const locOptions = useMemo(() => {
    const ids = [...new Set(visible.map((s) => s.locationId ?? "none"))]
    return ids.map((id) => ({ value: id, label: id === "none" ? "No location" : locationName(id) })).sort((a, b) => a.label.localeCompare(b.label))
  }, [visible])
  const rows = visible.filter((s) =>
    (!q.trim() || s.name.toLowerCase().includes(q.trim().toLowerCase()) || s.kind.toLowerCase().includes(q.trim().toLowerCase())) &&
    (!locF.length || locF.includes(s.locationId ?? "none")))
  const unplaced = all.filter((s) => !s.locationId).length

  return (
    <div className="flex flex-col gap-gutter">
      {v.manage && v.scope === null && unplaced > 0 && (
        <Alert variant="warning">
          <AlertTitle>{unplaced} {unplaced === 1 ? "system has" : "systems have"} no location</AlertTitle>
          <AlertDescription>Only people with Vantage access to all locations see them. Set a location from each row&apos;s menu.</AlertDescription>
        </Alert>
      )}

      <Card className="gap-0 overflow-hidden p-0">
        <CardHeader className="p-6 pb-4">
          <Server className="size-5 text-content-neutral-muted" aria-hidden />
          <CardHeaderText>
            <CardTitle><h2 className="flex items-center gap-2">Systems <Badge>{rows.length === visible.length ? visible.length : `${rows.length} of ${visible.length}`}</Badge></h2></CardTitle>
            <CardDescription>
              {v.scope === null
                ? `Every system in the tenant, ${all.length} in all.`
                : `Systems in ${v.scope.map(locationName).join(", ")}. ${all.length - visible.length} others are outside your access.`}
            </CardDescription>
          </CardHeaderText>
        </CardHeader>
        <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
          <InputGroup className="w-72">
            <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
            <InputGroupInput aria-label="Search systems" placeholder="Search name or kind" value={q} onChange={(e) => setQ(e.target.value)} />
            {q && <InputGroupAddon align="end"><Button variant="ghost" size="icon-xs" aria-label="Clear search" onClick={() => setQ("")}><X aria-hidden /></Button></InputGroupAddon>}
          </InputGroup>
          <div className="w-48"><Select label="Location" options={locOptions} value={locF} onValueChange={setLocF} showDetail={false} icon={<MapPin />} /></div>
        </div>

        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead align="start">System</TableHead>
                <TableHead align="start">Location</TableHead>
                <TableHead align="start">Health</TableHead>
                <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => {
                const alerting = s.status !== "healthy"
                const canAck = v.act && alerting && !s.acknowledgedBy
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-mono text-body-sm text-content-neutral-emphasis">{s.name}</span>
                        <span className="text-body-xs text-content-neutral-muted">{s.kind}</span>
                      </div>
                    </TableCell>
                    <TableCell>{s.locationId ? locationName(s.locationId) : <Badge color="warning">No location</Badge>}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge color={statusBadge[s.status].color} dot>{statusBadge[s.status].label}</Badge>
                        {s.acknowledgedBy && <span className="text-body-xs text-content-neutral-muted">Acknowledged by {s.acknowledgedBy}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="pe-3">
                      {(canAck || v.manage) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Actions for ${s.name}`}><MoreHorizontal aria-hidden /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canAck && <DropdownMenuItem onSelect={() => { vantage.acknowledge(s.id, person.name); toast({ title: `${s.name} alert acknowledged.` }) }}><CheckCheck aria-hidden /> Acknowledge alert</DropdownMenuItem>}
                            {v.manage && <DropdownMenuItem onSelect={() => setPlacing(s)}><MapPin aria-hidden /> Set location…</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="border-t border-line-neutral-muted p-6">
            <EmptyState size="sm" icon={<Server />}
              title={visible.length ? "No systems match" : "No systems in your locations"}
              description={visible.length ? "Try a different name, or clear the location filter." : "Systems appear here once an admin places them in a location you have access to."} />
          </div>
        )}
      </Card>

      <SetSystemLocationDialog system={placing} scope={v.scope} onClose={() => setPlacing(null)} />
    </div>
  )
}

function SetSystemLocationDialog({ system, scope, onClose }: { system: VantageSystem | null; scope: string[] | null; onClose: () => void }) {
  const [value, setValue] = useState("")
  const [last, setLast] = useState<string | null>(null)
  if ((system?.id ?? null) !== last) { setLast(system?.id ?? null); setValue(system?.locationId ?? (system ? "none" : "")) }
  const locs = access.locations().filter((l) => scope === null || scope.includes(l.id))
  return (
    <Dialog open={!!system} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Set location for {system?.name}</DialogTitle>
          <DialogDescription>Decides who can see this system in Vantage. The list is shared with every Iris product.</DialogDescription>
        </DialogHeader>
        <DialogBody className="max-h-[60vh] overflow-y-auto">
          <RadioGroup value={value} onValueChange={setValue} className="gap-2">
            {locs.map((l) => <FieldOption key={l.id} control={<Radio value={l.id} />}>{l.name}</FieldOption>)}
            {scope === null && <FieldOption control={<Radio value="none" />} description="Only people with access to all locations see it.">No location</FieldOption>}
          </RadioGroup>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!value} onClick={() => {
            if (!system) return
            vantage.setLocation([system.id], value === "none" ? null : value)
            toast({ title: `${system.name} is now in ${value === "none" ? "no location" : locationName(value)}.` })
            onClose()
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
