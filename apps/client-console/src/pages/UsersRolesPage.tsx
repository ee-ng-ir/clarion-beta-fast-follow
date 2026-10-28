import { useMemo, useState } from "react"
import {
  Check, FolderTree, KeyRound, Lock, Mail, MapPin, MoreHorizontal, Plus, Search, ShieldCheck, UserPlus,
  UserCheck, UserMinus, Users as UsersIcon, X,
} from "lucide-react"
import {
  Alert, AlertDescription, Badge, Button, Card, CardAction, CardHeader, CardHeaderText, CardTitle, Checkbox,
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerHeading,
  DrawerTitle, DrawerTitleGroup,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  EmptyState, Field, FieldControl, FieldDescription, FieldError, FieldLabel, Input, InputGroup, InputGroupAddon, InputGroupInput,
  FieldOption, Radio, RadioGroup, Select, Tabs, TabsList, TabsTrigger, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import { toast } from "@/components/ui/toast"
import {
  me, access, assignmentLabel, groupScopes, productAccess, products, scopes, tenantRolesOf, type Scope, describeRole, locationName, moveTarget, siteGroupsOf, clarionAccess, clarionReach, grantsOf, groupsOf, isTenantAdmin, roleDef, roles,
  statusLabel, tenantAdmins, wouldOrphanTenant, canChangeGroup, type Permissions, type Person, type PersonStatus,
} from "@ir/mock-data/access"
import { useViewer } from "@/lib/viewer"
import { AddRoleDialog, PersonCell, RoleBadge, fmt, locList, plural, useAccess } from "@/components/admin/access/AccessBits"
import { GiveAccessDialog } from "@/components/admin/access/GiveAccessDialog"

const statusColor: Record<PersonStatus, "success" | "info" | "neutral"> = { active: "success", invited: "info", deactivated: "neutral" }

/**
 * Users (Iris platform, Client Admin). Proposal for "Iris Platform: RBAC, Groups and
 * Locations": people get access from the groups they're in. The list shows where
 * each person's access comes from, and roles given directly are flagged as exceptions.
 */
// Remembered while moving between pages in the prototype.
let rememberedTab: Scope = "tenant"

export function UsersRolesPage() {
  useAccess()
  const { perm } = useViewer()
  const canManage = perm.manageAccess
  const [search, setSearch] = useState("")
  const [groupF, setGroupF] = useState<string[]>([])
  const [roleF, setRoleF] = useState<string[]>([])
  const [locF, setLocF] = useState<string[]>([])
  const [statusF, setStatusF] = useState<string[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [give, setGive] = useState<string[] | null>(null)
  const [bulkGroup, setBulkGroup] = useState<"add" | "remove" | null>(null)
  const [moveFor, setMoveFor] = useState<string | null>(null)
  const [tab, setTabState] = useState<Scope>(rememberedTab)
  const setTab = (t: Scope) => { rememberedTab = t; setTabState(t); setRoleF([]); setLocF([]); setSelected([]) }
  const isProduct = tab !== "tenant"
  const tabName = scopes.find((x) => x.id === tab)!.name
  const inTab = (pid: string) => (tab === "tenant" ? true : !!productAccess(pid, tab).role)

  const people = access.people().filter((p) => inTab(p.id))
  const filtered = people.filter((p) => {
    const q = search.trim().toLowerCase()
    if (q && !(p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))) return false
    if (statusF.length && !statusF.includes(p.status)) return false
    if (groupF.length && !groupsOf(p.id).some((g) => groupF.includes(g.id))) return false
    const grants = grantsOf(p.id).map((g) => g.assignment)
    if (roleF.length && !grants.some((x) => roleF.includes(x.role) && (tab === "tenant" ? !x.product : x.product === tab || x.role === "tenant_admin"))) return false
    if (locF.length && isProduct) {
      const acc = productAccess(p.id, tab)
      if (!acc.role) return false
      if (acc.locations !== null && !acc.locations.some((l) => locF.includes(l))) return false
    }
    return true
  })
  const exceptions = people.filter((p) => p.status !== "deactivated" && p.direct.length > 0 && !p.breakGlass).length
  const noAccess = people.filter((p) => p.status !== "deactivated" && grantsOf(p.id).length === 0).length
  const filteredOn = !!search || groupF.length + roleF.length + locF.length + statusF.length > 0

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as Scope)}>
        <TabsList>
          {scopes.map((x) => (
            <TabsTrigger key={x.id} value={x.id}>
              {x.name} <span className="ms-1.5 text-content-neutral-muted">{fmt(access.people().filter((p) => x.id === "tenant" || !!productAccess(p.id, x.id).role).length)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <p className="-mt-1 text-body-sm text-content-neutral-muted">
        {tab === "tenant"
          ? "Everyone who can sign in to Iris. Invite, deactivate and give tenant roles here."
          : `People with ${tabName} access. Each person is one Iris account; their other products show on their page.`}
      </p>
      {(exceptions > 0 || noAccess > 0) && tab === "tenant" && (
        <div className="flex flex-wrap gap-2">
          {exceptions > 0 && <Badge color="warning">{plural(exceptions, "person has", "people have")} a direct role</Badge>}
          {noAccess > 0 && <Badge>{plural(noAccess, "person has", "people have")} no access yet</Badge>}
        </div>
      )}

      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-4">
          <CardHeaderText>
            <div className="flex items-center gap-2">
              <CardTitle>{tab === "tenant" ? "All users" : `${tabName} users`}</CardTitle>
              <Badge>{filteredOn ? `${fmt(filtered.length)} of ${fmt(people.length)}` : fmt(people.length)}</Badge>
            </div>
          </CardHeaderText>
          {canManage && <CardAction className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setGive([])}><ShieldCheck aria-hidden /> {isProduct ? `Give ${tabName} access` : "Give tenant role"}</Button>
            <Button size="sm" onClick={() => setInviteOpen(true)}><Plus aria-hidden /> {isProduct ? `Invite to ${tabName}` : "Invite user"}</Button>
          </CardAction>}
        </CardHeader>

        <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
          <InputGroup className="w-72">
            <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
            <InputGroupInput aria-label="Search users" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" />
            {search && <InputGroupAddon align="end"><Button variant="ghost" size="icon-xs" aria-label="Clear search" onClick={() => setSearch("")}><X aria-hidden /></Button></InputGroupAddon>}
          </InputGroup>
          <div className="w-40"><Select label="Group" options={access.groups().map((g) => ({ value: g.id, label: g.name }))} value={groupF} onValueChange={setGroupF} showDetail={false} icon={<FolderTree />} /></div>
          <div className="w-36"><Select label="Role" options={roles.filter((r) => (tab === "tenant" ? r.level === "tenant" : r.level === "product" || r.id === "tenant_admin")).map((r) => ({ value: r.id, label: r.name }))} value={roleF} onValueChange={setRoleF} showDetail={false} icon={<ShieldCheck />} /></div>
          {isProduct && <div className="w-40"><Select label="Location" options={access.locations().map((l) => ({ value: l.id, label: l.name }))} value={locF} onValueChange={setLocF} showDetail={false} icon={<MapPin />} /></div>}
          <div className="w-36"><Select label="Status" options={(Object.keys(statusLabel) as PersonStatus[]).map((s) => ({ value: s, label: statusLabel[s] }))} value={statusF} onValueChange={setStatusF} showDetail={false} /></div>
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line-neutral-muted bg-surface-neutral-subtle px-6 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon-xs" aria-label="Clear selection" onClick={() => setSelected([])}><X aria-hidden /></Button>
              <span className="text-label-md text-content-neutral-emphasis">{fmt(selected.length)} selected</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setGive(selected)}><ShieldCheck aria-hidden /> Give access</Button>
              <Button size="sm" variant="outline" onClick={() => setBulkGroup("add")}><UserPlus aria-hidden /> Add to group</Button>
              <Button size="sm" variant="outline" onClick={() => setBulkGroup("remove")}>Remove from group</Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              {canManage && <TableHead className="w-10">
                <Checkbox aria-label="Select all shown" checked={filtered.length > 0 && filtered.every((p) => selected.includes(p.id)) ? true : filtered.some((p) => selected.includes(p.id)) ? "indeterminate" : false}
                  onCheckedChange={() => setSelected(filtered.every((p) => selected.includes(p.id)) ? selected.filter((id) => !filtered.some((p) => p.id === id)) : [...new Set([...selected, ...filtered.filter((p) => p.status !== "deactivated").map((p) => p.id)])])} />
              </TableHead>}
              <TableHead align="start">User</TableHead>
              <TableHead align="start">Groups</TableHead>
              <TableHead align="start">{tab === "tenant" ? "Tenant role · products" : `${tabName} role`}</TableHead>
              <TableHead align="start">Last active</TableHead>
              <TableHead align="start">Status</TableHead>
              <TableHead align="start" className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const gs = groupsOf(p.id)
              return (
                <TableRow key={p.id} selected={selected.includes(p.id)} className={p.status === "deactivated" ? "cursor-pointer text-content-neutral-muted" : "cursor-pointer"} onClick={() => setOpen(p.id)}>
                  {canManage && <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox aria-label={`Select ${p.name}`} disabled={p.status === "deactivated"} checked={selected.includes(p.id)}
                      onCheckedChange={() => setSelected((xs) => (xs.includes(p.id) ? xs.filter((x) => x !== p.id) : [...xs, p.id]))} />
                  </TableCell>}
                  <TableCell className="max-w-64"><PersonCell p={p} /></TableCell>
                  <TableCell className="max-w-56">
                    {gs.length ? (
                      <div className="flex flex-wrap items-center gap-1">
                        {gs.slice(0, 2).map((g) => <Badge key={g.id} variant="outline">{g.name}</Badge>)}
                        {gs.length > 2 && <span className="text-body-xs text-content-neutral-muted">+{gs.length - 2}</span>}
                      </div>
                    ) : <span className="text-content-neutral-subtle">No groups</span>}
                  </TableCell>
                  <TableCell className="max-w-72"><AccessSummary p={p} tab={tab} /></TableCell>
                  <TableCell className="text-content-neutral-muted">{p.status === "invited" ? `Invited ${p.invitedAgo}` : (p.lastActive ?? "—")}</TableCell>
                  <TableCell><Badge color={statusColor[p.status]} dot>{statusLabel[p.status]}</Badge></TableCell>
                  <TableCell className="pe-3" onClick={(e) => e.stopPropagation()}>
                    <RowMenu p={p} perm={perm} onOpen={() => setOpen(p.id)} onMove={() => setMoveFor(p.id)} />
                  </TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7}>
                  <EmptyState size="sm" icon={<UsersIcon />} title="No users match" description="Try a different name, or clear the filters."
                    action={<Button variant="outline" size="sm" onClick={() => { setSearch(""); setGroupF([]); setRoleF([]); setLocF([]); setStatusF([]) }}>Clear filters</Button>} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <UserDrawer id={open} onClose={() => setOpen(null)} onGive={(id) => setGive([id])} onMove={(id) => setMoveFor(id)} />
      <MoveSiteDialog personId={moveFor} onClose={() => setMoveFor(null)} />
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} scope={tab} />
      <GiveAccessDialog open={give !== null} onOpenChange={(o) => { if (!o) { if (give && give.length > 1) setSelected([]); setGive(null) } }} people={give ?? []} scope={tab} />
      <BulkGroupDialog mode={bulkGroup} people={selected} onClose={(done) => { setBulkGroup(null); if (done) setSelected([]) }} />
    </div>
  )
}

/** The access column: tenant roles, then what they get in Clarion. */
function AccessSummary({ p, tab }: { p: Person; tab: Scope }) {
  const grants = grantsOf(p.id)
  if (tab === "tenant") {
    const tenant = tenantRolesOf(p.id)
    const prods = products.filter((x) => !!productAccess(p.id, x.id).role)
    if (!grants.length) return <span className="text-content-neutral-subtle">No access</span>
    return (
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-label-md text-content-neutral-emphasis">{tenant.length ? tenant.map((r) => roleDef(r).name).join(", ") : "—"}</span>
        <span className="flex flex-wrap gap-1">{prods.map((x) => <Badge key={x.id} variant="outline">{x.name}</Badge>)}</span>
      </div>
    )
  }
  const c = productAccess(p.id, tab)
  const direct = p.direct.some((x) => x.product === tab) && !p.breakGlass
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate text-label-md text-content-neutral-emphasis">{c.role === "tenant_admin" ? "Tenant Admin (includes Product Admin)" : roleDef(c.role!).name}</span>
      <span className="truncate text-body-sm text-content-neutral-muted">{locList(c.locations)}</span>
      {direct && <span className="text-body-xs text-content-warning-emphasis">Includes a direct role</span>}
    </div>
  )
}

function RowMenu({ p, perm, onOpen, onMove }: { p: Person; perm: Permissions; onOpen: () => void; onMove: () => void }) {
  // Changing someone needs user management, and a User Admin can't change a Tenant Admin.
  const canChange = perm.manageAccess && (perm.grantTenantAdmin || !isTenantAdmin(p.id))
  const lastAdmin = isTenantAdmin(p.id) && tenantAdmins().length <= 1
  const deactivate = () => {
    if (p.breakGlass) { toast({ title: "Break-glass accounts can't be deactivated here.", description: "Turn off \"SSO required\" first, then remove the break-glass flag in Single sign-on.", variant: "danger" }); return }
    if (p.id === me()) { toast({ title: "You can't deactivate yourself.", variant: "danger" }); return }
    if (lastAdmin) { toast({ title: "Can't deactivate the last Tenant Admin.", description: "Give someone else Tenant Admin first.", variant: "danger" }); return }
    access.setStatus(p.id, "deactivated")
    toast({ title: `${p.name} was deactivated.`, description: "They can't sign in. Their groups stay, so reactivating restores their access." })
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${p.name}`}><MoreHorizontal aria-hidden /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onOpen}><ShieldCheck aria-hidden /> View access</DropdownMenuItem>
        {canChange && siteGroupsOf(p.id).some((g) => canChangeGroup(perm, g)) && <DropdownMenuItem onSelect={onMove}><MapPin aria-hidden /> Move to another site…</DropdownMenuItem>}
        {canChange && p.status === "invited" && <DropdownMenuItem onSelect={() => toast({ title: `Invite resent to ${p.email}.` })}><Mail aria-hidden /> Resend invite</DropdownMenuItem>}
        {canChange && p.status === "active" && <DropdownMenuItem onSelect={() => toast({ title: `Password reset sent to ${p.email}.` })}><KeyRound aria-hidden /> Send password reset</DropdownMenuItem>}
        {canChange && <DropdownMenuSeparator />}
        {!canChange ? null : p.status === "deactivated"
          ? <DropdownMenuItem onSelect={() => { access.setStatus(p.id, "active"); toast({ title: `${p.name} was reactivated.` }) }}><UserCheck aria-hidden /> Reactivate</DropdownMenuItem>
          : <DropdownMenuItem variant="destructive" onSelect={deactivate}><UserMinus aria-hidden /> Deactivate</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ---------------------------------------------------------------- drawer ----

function UserDrawer({ id, onClose, onGive, onMove }: { id: string | null; onClose: () => void; onGive: (id: string) => void; onMove: (id: string) => void }) {
  useAccess()
  const { perm } = useViewer()
  const p = id ? access.person(id) : undefined
  const [roleOpen, setRoleOpen] = useState(false)
  const [groupOpen, setGroupOpen] = useState(false)
  if (!p) return <Drawer open={false} />

  const grants = grantsOf(p.id)
  const gs = groupsOf(p.id)
  const c = clarionAccess(p.id)
  const reach = clarionReach(p.id)
  const admin = c.role === "tenant_admin"
  const canThresholds = admin || c.role === "product_admin"
  const canChange = perm.manageAccess && (perm.grantTenantAdmin || !isTenantAdmin(p.id))

  const leaveGroup = (gid: string) => {
    const g = access.group(gid)!
    if (g.source === "linked") { toast({ title: "Membership of this group comes from your identity provider.", variant: "danger" }); return }
    if (wouldOrphanTenant({ groupId: gid, personId: p.id })) { toast({ title: "Can't remove the last Tenant Admin.", description: "Give someone else Tenant Admin first.", variant: "danger" }); return }
    if (p.id === me() && g.assignments.some((x) => x.role === "tenant_admin")) { toast({ title: "You can't remove your own admin access.", variant: "danger" }); return }
    access.removeMember(gid, p.id)
    toast({ title: `${p.name} was removed from ${g.name}.`, description: "Applies from their next request. Recorded in the audit log." })
  }

  return (
    <Drawer open={!!id} onOpenChange={(o) => { if (!o) onClose() }}>
      <DrawerContent size="wide">
        <DrawerHeader type="title">
          <DrawerHeading>
            <DrawerTitleGroup>
              <DrawerTitle>{p.name}</DrawerTitle>
              <DrawerDescription>{p.email} · {statusLabel[p.status]}{p.breakGlass ? " · Break-glass account" : ""}</DrawerDescription>
            </DrawerTitleGroup>
            <DrawerCloseButton />
          </DrawerHeading>
        </DrawerHeader>
        <DrawerBody className="gap-6">
          {/* Every area at once — tabs answer "who has Clarion?", this answers "what can Priya do?" */}
          <section className="flex flex-col gap-3">
            <h3 className="text-label-lg text-content-neutral-emphasis">Access by area</h3>
            <Table size="sm">
              <TableHeader><TableRow><TableHead align="start">Area</TableHead><TableHead align="start">Role</TableHead><TableHead align="start">Where</TableHead><TableHead align="start">From</TableHead></TableRow></TableHeader>
              <TableBody>
                {(() => { const t = tenantRolesOf(p.id); const from = grants.filter((g) => roleDef(g.assignment.role).level === "tenant"); return (
                  <TableRow>
                    <TableCell className="text-label-md">Iris tenant</TableCell>
                    <TableCell>{t.length ? t.map((r) => roleDef(r).name).join(", ") : <span className="text-content-neutral-subtle">None</span>}</TableCell>
                    <TableCell className="text-content-neutral-muted">—</TableCell>
                    <TableCell className="text-body-sm text-content-neutral-muted">{from.map((g) => (g.via.kind === "group" ? g.via.group.name : p.breakGlass ? "Break-glass" : "Direct")).join(", ") || "—"}</TableCell>
                  </TableRow>) })()}
                {products.map((x) => { const acc = productAccess(p.id, x.id); const from = grants.filter((g) => g.assignment.product === x.id || g.assignment.role === "tenant_admin"); return (
                  <TableRow key={x.id}>
                    <TableCell className="text-label-md">{x.name}</TableCell>
                    <TableCell>{acc.role ? (acc.role === "tenant_admin" ? "Product Admin (via Tenant Admin)" : roleDef(acc.role).name) : <span className="text-content-neutral-subtle">No access</span>}</TableCell>
                    <TableCell className="text-content-neutral-muted">{acc.role ? locList(acc.locations) : "—"}</TableCell>
                    <TableCell className="text-body-sm text-content-neutral-muted">{from.map((g) => (g.via.kind === "group" ? g.via.group.name : p.breakGlass ? "Break-glass" : "Direct")).filter((v, i, xs) => xs.indexOf(v) === i).join(", ") || "—"}</TableCell>
                  </TableRow>) })}
              </TableBody>
            </Table>
          </section>

          {/* What they get */}
          <section className="flex flex-col gap-3">
            <h3 className="text-label-lg text-content-neutral-emphasis">What they can see in Clarion</h3>
            {c.role ? (
              <div className="flex flex-col gap-3 rounded-lg border border-line-neutral-muted p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge color={admin ? "info" : "success"}>{admin ? "Tenant Admin" : `Clarion ${roleDef(c.role).name}`}</Badge>
                  <span className="text-body-sm text-content-neutral-muted">{locList(c.locations)} · {plural(reach, "widget user")}</span>
                </div>
                <ul className="grid grid-cols-2 gap-1.5 text-body-sm">
                  <Can yes>Overview</Can>
                  <Can yes>Endpoints</Can>
                  <Can yes={canThresholds}>Thresholds</Can>
                  <Can yes={canThresholds}>Manage widget users</Can>
                  <Can yes={admin || grants.some((g) => g.assignment.role === "user_admin")}>Users and groups</Can>
                  <Can yes={admin}>Sign-in settings</Can>
                </ul>
                {c.locations !== null && <p className="text-body-xs text-content-neutral-muted">Endpoints outside these locations, and widget users with no location, don&apos;t appear anywhere for them, including search and exports.</p>}
              </div>
            ) : (
              <Alert variant="info"><AlertDescription>No Clarion access. Add them to a group with a Clarion role.</AlertDescription></Alert>
            )}
          </section>

          {/* Groups */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-label-lg text-content-neutral-emphasis">Groups</h3>
              {canChange && <div className="flex gap-2">
                {siteGroupsOf(p.id).some((g) => canChangeGroup(perm, g)) && <Button variant="outline" size="sm" onClick={() => onMove(p.id)}><MapPin aria-hidden /> Move site</Button>}
                <Button variant="outline" size="sm" onClick={() => onGive(p.id)}><ShieldCheck aria-hidden /> Give access</Button>
                <Button variant="ghost" size="sm" onClick={() => setGroupOpen(true)}><Plus aria-hidden /> Add to group</Button>
              </div>}
            </div>
            {gs.length ? (
              <ul className="flex flex-col divide-y divide-line-neutral-muted rounded-lg border border-line-neutral-muted">
                {gs.map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="text-label-md text-content-neutral-emphasis">{g.name}</span>
                      <div className="flex flex-wrap gap-1">{g.assignments.length ? g.assignments.map((x) => <RoleBadge key={x.id} x={x} />) : <span className="text-body-xs text-content-neutral-subtle">No roles</span>}</div>
                    </div>
                    {canChange && canChangeGroup(perm, g) && <Button variant="ghost" size="sm" onClick={() => leaveGroup(g.id)}>Remove</Button>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-body-sm text-content-neutral-muted">Not in any group.</p>}
          </section>

          {/* Where it comes from */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-label-lg text-content-neutral-emphasis">Roles, and where they come from</h3>
              {canChange && <Button variant="ghost" size="sm" onClick={() => setRoleOpen(true)}>Give a role directly…</Button>}
            </div>
            {grants.length ? (
              <Table size="sm">
                <TableHeader><TableRow><TableHead align="start">Role</TableHead><TableHead align="start">From</TableHead><TableHead className="w-10"><span className="sr-only">Remove</span></TableHead></TableRow></TableHeader>
                <TableBody>
                  {grants.map((g) => (
                    <TableRow key={g.assignment.id + (g.via.kind === "group" ? g.via.group.id : "d")}>
                      <TableCell>{assignmentLabel(g.assignment)}</TableCell>
                      <TableCell>
                        {g.via.kind === "group" ? g.via.group.name : p.breakGlass
                          ? <span className="inline-flex items-center gap-1 text-content-neutral-muted"><Lock className="size-3.5" aria-hidden /> Break-glass</span>
                          : <Badge color="warning">Direct (exception)</Badge>}
                      </TableCell>
                      <TableCell>
                        {canChange && g.via.kind === "direct" && !p.breakGlass && (perm.grantTenantAdmin || g.assignment.role !== "tenant_admin") && (
                          <Button variant="ghost" size="icon-xs" aria-label="Remove direct role" onClick={() => {
                            if (wouldOrphanTenant({ assignmentId: g.assignment.id })) { toast({ title: "Can't remove the last Tenant Admin.", variant: "danger" }); return }
                            access.removeDirect(p.id, g.assignment.id); toast({ title: "Direct role removed." })
                          }}><X aria-hidden /></Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-body-sm text-content-neutral-muted">No roles. They can sign in but see nothing.</p>}
          </section>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="outline" onClick={onClose}>Done</Button>
        </DrawerFooter>
      </DrawerContent>

      <AddRoleDialog open={roleOpen} onOpenChange={setRoleOpen} direct title={`Give ${p.name} a role directly`} existing={p.direct}
        onAdd={(x) => { access.addDirect(p.id, x); toast({ title: `${p.name} now has ${assignmentLabel({ ...x, id: "" })}.`, description: "Shown as a direct role in access reviews." }) }} />
      <JoinGroupDialog open={groupOpen} onOpenChange={setGroupOpen} person={p} />
    </Drawer>
  )
}

function Can({ yes, children }: { yes?: boolean; children: React.ReactNode }) {
  return (
    <li className={yes ? "flex items-center gap-2 text-content-neutral-emphasis" : "flex items-center gap-2 text-content-neutral-subtle"}>
      {yes ? <Check className="size-4 text-content-success-emphasis" aria-label="Yes" /> : <X className="size-4" aria-label="No" />}
      {children}
    </li>
  )
}

function JoinGroupDialog({ open, onOpenChange, person }: { open: boolean; onOpenChange: (o: boolean) => void; person: Person }) {
  const [picked, setPicked] = useState<string[]>([])
  const { perm } = useViewer()
  const available = access.groups().filter((g) => !g.members.includes(person.id) && canChangeGroup(perm, g))
  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) setPicked([]); onOpenChange(o) }}>
      <DialogContent size="md">
        <DialogHeader><DialogTitle>Add {person.name} to groups</DialogTitle><DialogDescription>They get every role these groups have.</DialogDescription></DialogHeader>
        <DialogBody><GroupChecklist groups={available} value={picked} onChange={setPicked} /></DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!picked.length} onClick={() => {
            picked.forEach((g) => access.addMembers(g, [person.id]))
            toast({ title: `${person.name} was added to ${plural(picked.length, "group")}.`, description: "Applies from their next request." })
            onOpenChange(false)
          }}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GroupChecklist({ groups, value, onChange }: { groups: ReturnType<typeof access.groups>; value: string[]; onChange: (v: string[]) => void }) {
  if (!groups.length) return <p className="text-body-sm text-content-neutral-muted">No more groups to add.</p>
  return (
    <div className="flex max-h-80 flex-col gap-1 overflow-y-auto rounded-lg border border-line-neutral-muted p-1">
      {groups.map((g) => (
        <label key={g.id} className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-surface-neutral-subtle-hovered">
          <Checkbox size="sm" className="mt-0.5" checked={value.includes(g.id)} onCheckedChange={() => onChange(value.includes(g.id) ? value.filter((x) => x !== g.id) : [...value, g.id])} />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-label-md text-content-neutral-emphasis">{g.name}</span>
            <span className="text-body-xs text-content-neutral-muted">{g.assignments.length ? g.assignments.map((x) => assignmentLabel(x)).join(" · ") : "No roles yet"}</span>
          </div>
        </label>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- invite ----

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function InviteDialog({ open, onOpenChange, scope }: { open: boolean; onOpenChange: (o: boolean) => void; scope: Scope }) {
  const scopeName = scopes.find((x) => x.id === scope)!.name
  const [email, setEmail] = useState("")
  const [groups, setGroups] = useState<string[]>([])
  const [touched, setTouched] = useState(false)
  const reset = () => { setEmail(""); setGroups([]); setTouched(false) }
  const trimmed = email.trim().toLowerCase()
  const valid = emailRe.test(trimmed)
  const dupe = valid && access.people().some((p) => p.email.toLowerCase() === trimmed)
  const err = touched && !valid ? "Enter a valid email address." : touched && dupe ? "Someone with this email is already a user." : null
  const { perm } = useViewer()
  const local = useMemo(() => access.groups().filter((g) => canChangeGroup(perm, g) && (scope === "tenant" || groupScopes(g).includes(scope))), [open, scope, perm.grantTenantAdmin]) // eslint-disable-line react-hooks/exhaustive-deps

  const send = () => {
    setTouched(true)
    if (!valid || dupe) return
    const name = trimmed.split("@")[0].split(/[._-]+/).filter(Boolean).map((s) => s[0].toUpperCase() + s.slice(1)).join(" ")
    access.invite({ email: email.trim(), name, groups })
    toast({ title: `Invite sent to ${email.trim()}.`, description: groups.length ? `Added to ${plural(groups.length, "group")}.` : "They can sign in but see nothing until they're in a group." })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) reset(); onOpenChange(o) }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{scope === "tenant" ? "Invite user" : `Invite to ${scopeName}`}</DialogTitle>
          <DialogDescription>{scope === "tenant" ? "Their access comes from the groups you add them to." : `Creates their Iris account and gives ${scopeName} access through the groups you pick.`}</DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-5">
          <Field invalid={!!err}>
            <FieldLabel required>Email address</FieldLabel>
            <FieldControl required><Input type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} autoFocus /></FieldControl>
            <FieldError>{err}</FieldError>
          </Field>
          <Field>
            <FieldLabel>{scope === "tenant" ? "Groups" : `${scopeName} groups`}</FieldLabel>
            <GroupChecklist groups={local} value={groups} onChange={setGroups} />
            <FieldDescription>To give one person a role outside a group, invite them, then open their access.</FieldDescription>
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={send}>Send invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------------ bulk groups ---

function BulkGroupDialog({ mode, people, onClose }: { mode: "add" | "remove" | null; people: string[]; onClose: (done?: boolean) => void }) {
  const [picked, setPicked] = useState<string[]>([])
  const [lastMode, setLastMode] = useState<typeof mode>(null)
  const { perm } = useViewer()
  if (mode !== lastMode) { setLastMode(mode); setPicked([]) }
  const local = access.groups().filter((g) => canChangeGroup(perm, g))
  const groups = mode === "remove" ? local.filter((g) => people.some((id) => g.members.includes(id))) : local
  const n = people.length

  const apply = () => {
    if (mode === "add") {
      picked.forEach((g) => access.addMembers(g, people))
      toast({ title: `${plural(n, "person", "people")} added to ${plural(picked.length, "group")}.`, description: "Applies from their next request." })
    } else {
      let blocked = 0
      for (const gid of picked) for (const pid of people) {
        const g = access.group(gid)!
        if (!g.members.includes(pid)) continue
        if (wouldOrphanTenant({ groupId: gid, personId: pid }) || (pid === me() && g.assignments.some((x) => x.role === "tenant_admin"))) { blocked++; continue }
        access.removeMember(gid, pid)
      }
      toast({ title: `Removed from ${plural(picked.length, "group")}.`, description: blocked ? `${plural(blocked, "removal was", "removals were")} skipped to keep a Tenant Admin, or your own admin access.` : "Applies from their next request.", variant: blocked ? "danger" : undefined })
    }
    onClose(true)
  }

  return (
    <Dialog open={mode !== null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? `Add ${plural(n, "person", "people")} to groups` : `Remove ${plural(n, "person", "people")} from groups`}</DialogTitle>
          <DialogDescription>{mode === "add" ? "They get every role these groups have." : "They lose the roles these groups give them, unless another group gives the same."}</DialogDescription>
        </DialogHeader>
        <DialogBody><GroupChecklist groups={groups} value={picked} onChange={setPicked} /></DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose()}>Cancel</Button>
          <Button variant={mode === "remove" ? "destructive" : undefined} disabled={!picked.length} onClick={apply}>{mode === "add" ? "Add" : "Remove"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// -------------------------------------------------------------- move site ---
// A manager moves from Sydney to Melbourne: one step, not remove-then-add.

function MoveSiteDialog({ personId, onClose }: { personId: string | null; onClose: () => void }) {
  useAccess()
  const p = personId ? access.person(personId) : undefined
  const from = p ? siteGroupsOf(p.id) : []
  const [fromId, setFromId] = useState<string>("")
  const [to, setTo] = useState<string>("")
  const [last, setLast] = useState<string | null>(null)
  if (personId !== last) { setLast(personId); setFromId(from[0]?.id ?? ""); setTo("") }
  if (!p || !from.length) return <Dialog open={false} />
  const g = access.group(fromId) ?? from[0]
  const current = g.assignments[0].locations[0]
  const target = to ? moveTarget(g.id, to) : null
  const d = target ? describeRole(target.draft.role, [to]) : null

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Move {p.name} to another site</DialogTitle>
          <DialogDescription>Takes them out of {g.name} and into the group for the new site, in one step.</DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-5">
          {from.length > 1 && (
            <section className="flex flex-col gap-2">
              <span className="text-label-md text-content-neutral-emphasis">Which site are they leaving?</span>
              <RadioGroup value={g.id} onValueChange={(v) => { setFromId(v); setTo("") }} className="gap-2">
                {from.map((x) => <FieldOption key={x.id} control={<Radio value={x.id} />} description={assignmentLabel(x.assignments[0])}>{x.name}</FieldOption>)}
              </RadioGroup>
            </section>
          )}
          <section className="flex flex-col gap-2">
            <span className="text-label-md text-content-neutral-emphasis">Moving from {locationName(current)} to</span>
            <RadioGroup value={to} onValueChange={setTo} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {access.locations().filter((l) => l.id !== current).map((l) => <FieldOption key={l.id} control={<Radio value={l.id} />}>{l.name}</FieldOption>)}
            </RadioGroup>
          </section>
          {target && d && (
            <section className="flex flex-col gap-3 rounded-lg border border-line-neutral-muted p-4">
              <span className="text-body-sm text-content-neutral-emphasis">
                <span className="text-content-danger-emphasis">− {g.name}</span>{"  "}<span className="text-content-success-emphasis">+ {target.match ? target.match.name : `${target.name} (new group)`}</span>
              </span>
              <span className="text-body-md text-content-neutral-emphasis">{p.name.split(" ")[0]} will see {d.sees}.</span>
            </section>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!target} onClick={() => {
            if (!target) return
            let gid = target.match?.id
            if (!gid) { gid = access.createGroup({ name: target.name, description: "" }); access.addGroupRole(gid, target.draft) }
            access.removeMember(g.id, p.id)
            access.addMembers(gid, [p.id])
            toast({ title: `${p.name} moved to ${locationName(to)}.`, description: `Now in ${access.group(gid)!.name}. Applies from their next page load.` })
            onClose()
          }}>Move</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
