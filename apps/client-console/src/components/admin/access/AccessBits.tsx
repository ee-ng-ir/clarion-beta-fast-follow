import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { Eye, Search, X } from "lucide-react"
import {
  Alert, AlertDescription, Avatar, AvatarFallback, Badge, Button, Checkbox,
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  FieldOption, InputGroup, InputGroupAddon, InputGroupInput, Radio, RadioGroup,
  SegmentedControl, SegmentedControlItem,
} from "@ir/ui"
import { useViewer } from "@/lib/viewer"
import {
  access, assignmentLabel, describeRole, initials, locationName, productName, products, roleDef, roles, widgetUsersIn,
  type Assignment, type Person, type ProductId, type RoleId, type Scope,
} from "@ir/mock-data/access"
import { store as widgetStore } from "@ir/mock-data/widget-users"

/** Re-render when people, groups, locations or widget users change. */
export function useAccess() {
  const a = useSyncExternalStore(access.subscribe, access.version)
  const w = useSyncExternalStore(widgetStore.subscribe, widgetStore.version)
  return `${a}.${w}`
}

export const fmt = (n: number) => n.toLocaleString()
export const plural = (n: number, one: string, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`

export function PersonCell({ p, sub }: { p: Person; sub?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar size="sm"><AvatarFallback>{initials(p.name)}</AvatarFallback></Avatar>
      <div className="flex min-w-0 flex-col">
        <span className="flex items-center gap-2 truncate text-label-md text-content-neutral-emphasis">
          {p.name}
          {p.breakGlass && <Badge color="warning">Break-glass</Badge>}
        </span>
        <span className="truncate text-body-xs text-content-neutral-muted">{sub ?? p.email}</span>
      </div>
    </div>
  )
}

/** A role assignment as a badge: "Clarion Viewer · Sydney". */
export function RoleBadge({ x, exception }: { x: Assignment; exception?: boolean }) {
  const tenant = roleDef(x.role).level === "tenant"
  return (
    <Badge color={x.role === "tenant_admin" ? "info" : tenant ? "neutral" : "success"} variant={exception ? "outline" : undefined} className="max-w-full">
      <span className="truncate">{assignmentLabel(x)}{exception ? " · direct" : ""}</span>
    </Badge>
  )
}

// ------------------------------------------------------------ add a role ----

/**
 * Give a role to a group (normal) or straight to a person (an exception).
 * Tenant roles are tenant-wide. Product roles are for one product, everywhere or
 * limited to some locations.
 */
export function AddRoleDialog({
  open, onOpenChange, title, direct, onAdd, existing = [], scope,
}: {
  /** Limit the choices to one tab's roles. Omitted = every product and the tenant. */
  scope?: Scope
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  direct?: boolean
  existing?: Assignment[]
  onAdd: (x: Omit<Assignment, "id">) => void
}) {
  useAccess()
  const { perm } = useViewer()
  const first = !scope || scope === "tenant" ? (scope === "tenant" ? "tenant:auditor" : "clarion:viewer") : `${scope}:viewer`
  const [pick, setPick] = useState(first)
  const [sc, role] = pick.split(":") as [Scope, RoleId]
  const prodId = sc === "tenant" ? undefined : (sc as ProductId)
  const [where, setWhere] = useState<"all" | "some">("some")
  const [locs, setLocs] = useState<string[]>([])
  const [tried, setTried] = useState(false)
  useEffect(() => { if (open) { setPick(first); setWhere("some"); setLocs([]); setTried(false) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const def = roleDef(role)
  const product = def.level === "product"
  const needLocs = product && where === "some" && locs.length === 0
  const draft: Omit<Assignment, "id"> = { role, product: product ? prodId : undefined, locations: product && where === "some" ? locs : [] }
  const dupe = existing.some((x) => x.role === draft.role && x.product === draft.product && [...x.locations].sort().join() === [...draft.locations].sort().join())

  const submit = () => {
    setTried(true)
    if (needLocs || dupe) return
    onAdd(draft)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {direct
              ? "Giving a role to one person is an exception. It shows as direct in access reviews. Use a group where you can."
              : "Everyone in the group gets this role. Roles add up: people get everything all their roles allow."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="max-h-[64vh] gap-5 overflow-y-auto">
          <RadioGroup value={pick} onValueChange={setPick} className="gap-4">
            {products.filter((p) => !scope || scope === p.id).map((p) => <RoleGroup key={p.id} scope={p.id} label={p.name} ids={["viewer", "editor", "product_admin"]} />)}
            {(!scope || scope === "tenant") && <RoleGroup scope="tenant" label="Whole tenant" ids={perm.grantTenantAdmin ? ["auditor", "user_admin", "tenant_admin"] : ["auditor", "user_admin"]} />}
          </RadioGroup>

          {product && (
            <div className="flex flex-col gap-3 rounded-lg border border-line-neutral-muted p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-label-md text-content-neutral-emphasis">Which {productName(prodId)} data?</span>
                <SegmentedControl size="sm" value={where} onValueChange={(v: string) => setWhere(v as "all" | "some")} aria-label="Which locations">
                  <SegmentedControlItem value="some">Some locations</SegmentedControlItem>
                  <SegmentedControlItem value="all">All locations</SegmentedControlItem>
                </SegmentedControl>
              </div>
              {where === "some" ? (
                <>
                  <LocationChecklist value={locs} onChange={setLocs} />
                  {tried && needLocs && <p className="text-body-sm text-content-danger-emphasis">Pick at least one location, or choose All locations.</p>}
                </>
              ) : (
                <p className="text-body-sm text-content-neutral-muted">Every location, plus anything with no location.</p>
              )}
            </div>
          )}
          {!needLocs && (() => { const d = describeRole(role, draft.locations, prodId); return (
            <div className="flex items-start gap-3 rounded-lg bg-surface-neutral-subtle p-4" aria-live="polite">
              <Eye className="mt-0.5 size-4 shrink-0 text-content-neutral-muted" aria-hidden />
              <div className="flex flex-col gap-1">
                <span className="text-body-md text-content-neutral-emphasis">{direct ? "They'll" : "Members will"} see {d.sees}.</span>
                {d.not && <span className="text-body-sm text-content-neutral-muted">Not {d.not}.</span>}
              </div>
            </div>
          ) })()}
          {tried && dupe && (
            <Alert variant="warning"><AlertDescription>{direct ? "They" : "This group"} already {direct ? "have" : "has"} this role.</AlertDescription></Alert>
          )}
          {role === "tenant_admin" && (
            <Alert variant="info"><AlertDescription>Tenant Admin can change sign-in settings and give anyone any role. Keep this group small.</AlertDescription></Alert>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Add role</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RoleGroup({ label, ids, scope }: { label: string; ids: RoleId[]; scope: Scope }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-label-sm text-content-neutral-muted">{label}</span>
      {ids.map((id) => {
        const r = roles.find((x) => x.id === id)!
        return (
          <FieldOption key={id} control={<Radio value={`${scope}:${id}`} />} description={r.level === "product" ? (scope === "clarion" ? r.clarion : r.summary) : r.summary}>
            {r.name}
          </FieldOption>
        )
      })}
    </div>
  )
}

export function LocationChecklist({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  useAccess()
  const locs = access.locations()
  if (!locs.length) return <p className="text-body-sm text-content-neutral-muted">No locations yet. Add them on the Locations page.</p>
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
      {locs.map((l) => (
        <label key={l.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-body-sm hover:bg-surface-neutral-subtle-hovered">
          <Checkbox size="sm" checked={value.includes(l.id)} onCheckedChange={() => onChange(value.includes(l.id) ? value.filter((x) => x !== l.id) : [...value, l.id])} />
          <span className="flex-1 truncate text-content-neutral-emphasis">{l.name}</span>
          <span className="text-body-xs text-content-neutral-muted">{fmt(widgetUsersIn(l.id))}</span>
        </label>
      ))}
    </div>
  )
}

// ------------------------------------------------------------ pick people ---

export function PeoplePicker({
  open, onOpenChange, title, exclude, onPick,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  exclude: string[]
  onPick: (ids: string[]) => void
}) {
  useAccess()
  const [q, setQ] = useState("")
  const [picked, setPicked] = useState<string[]>([])
  useEffect(() => { if (open) { setQ(""); setPicked([]) } }, [open])
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return access.people().filter((p) => p.status !== "deactivated" && !exclude.includes(p.id) && (!s || p.name.toLowerCase().includes(s) || p.email.toLowerCase().includes(s)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, exclude, open])
  const toggle = (id: string) => setPicked((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <DialogBody className="gap-3">
          <InputGroup>
            <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
            <InputGroupInput aria-label="Search people" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            {q && <InputGroupAddon align="end"><Button variant="ghost" size="icon-xs" aria-label="Clear search" onClick={() => setQ("")}><X aria-hidden /></Button></InputGroupAddon>}
          </InputGroup>
          <div className="max-h-72 overflow-y-auto rounded-lg border border-line-neutral-muted p-1">
            {list.length ? list.map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-surface-neutral-subtle-hovered">
                <Checkbox size="sm" checked={picked.includes(p.id)} onCheckedChange={() => toggle(p.id)} />
                <PersonCell p={p} />
              </label>
            )) : <p className="px-2 py-6 text-center text-body-sm text-content-neutral-muted">Nobody to add{q ? ` matching “${q}”` : ""}.</p>}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!picked.length} onClick={() => { onPick(picked); onOpenChange(false) }}>
            {picked.length ? `Add ${plural(picked.length, "person", "people")}` : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** "Sydney, Melbourne" or "All locations". */
export const locList = (ids: string[] | null) => (ids === null ? "All locations" : ids.length ? ids.map(locationName).join(", ") : "None")
