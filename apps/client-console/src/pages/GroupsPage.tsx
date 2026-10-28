import { useState } from "react"
import { Eye, FolderTree, Link2, Lock, MapPin, MoreHorizontal, Pencil, Plus, Search, Sparkles, Trash2, X } from "lucide-react"
import {
  Alert, AlertDescription, AlertTitle, Avatar, AvatarFallback, Badge, Button, Card, CardAction, CardHeader, CardHeaderText, CardTitle,
  Checkbox, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerHeading,
  DrawerTitle, DrawerTitleGroup,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  EmptyState, Field, FieldControl, FieldError, FieldLabel, Input, InputGroup, InputGroupAddon, InputGroupInput,
  SegmentedControl, SegmentedControlItem, Tabs, TabsList, TabsTrigger, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea,
} from "@ir/ui"
import { toast } from "@/components/ui/toast"
import { me, access, canChangeGroup, canChangeMembers, assignmentLabel, groupScopes, scopes, type Scope, createSuggested, describeRole, locationName, updateGroupRole, initials, suggestedGroups, wouldOrphanTenant, type Group, type Suggestion } from "@ir/mock-data/access"
import { AddRoleDialog, LocationChecklist, PeoplePicker, PersonCell, RoleBadge, fmt, plural, useAccess } from "@/components/admin/access/AccessBits"
import { useViewer } from "@/lib/viewer"

/**
 * Groups (Iris platform, Client Admin). Flat — groups can't contain groups — so they
 * map one-to-one onto IdP groups later. Roles are given to groups; members inherit them.
 */
// Remembered while moving between pages in the prototype.
let suggestionsDismissed = false
let rememberedGroupTab: Scope = "tenant"

export function GroupsPage() {
  useAccess()
  const { perm } = useViewer()
  const [dismissed, setDismissed] = useState(suggestionsDismissed)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const suggestions = suggestedGroups()
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState<string | null>(null)
  const [editing, setEditing] = useState<Group | "new" | null>(null)
  const [deleting, setDeleting] = useState<Group | null>(null)

  const [tab, setTabState] = useState<Scope>(rememberedGroupTab)
  const setTab = (t: Scope) => { rememberedGroupTab = t; setTabState(t) }
  const tabName = scopes.find((x) => x.id === tab)!.name
  const all = access.groups().filter((g) => groupScopes(g).includes(tab))
  const q = search.trim().toLowerCase()
  const groups = all.filter((g) => !q || g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q))

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as Scope)}>
        <TabsList>
          {scopes.map((x) => (
            <TabsTrigger key={x.id} value={x.id}>
              {x.name} <span className="ms-1.5 text-content-neutral-muted">{fmt(access.groups().filter((g) => groupScopes(g).includes(x.id)).length)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <p className="-mt-1 text-body-sm text-content-neutral-muted">
        {tab === "tenant" ? "Groups that give tenant roles: who runs Iris. Only Tenant Admins can change these." : `Groups that give ${tabName} roles. A group can also give roles in another product; it shows in both tabs.`}
      </p>
      {perm.manageAccess && tab === "clarion" && suggestions.length > 0 && !dismissed && (
        <Alert variant="info" onDismiss={() => { suggestionsDismissed = true; setDismissed(true) }} dismissLabel="Not now"
          action={<Button variant="outline" size="xs" onClick={() => setSuggestOpen(true)}><Sparkles aria-hidden /> Review {suggestions.length} suggestions</Button>}>
          <AlertTitle>Set up groups from your locations</AlertTitle>
          <AlertDescription>
            {(() => { const sites = suggestions.filter((x) => x.key.startsWith("site-")).length; return sites
              ? `${plural(sites, "location has", "locations have")} no CC managers group yet. We can create them for you, ready to add people to.`
              : "A few common groups are missing. We can create them for you, ready to add people to." })()}
          </AlertDescription>
        </Alert>
      )}
      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-4">
          <CardHeaderText>
            <div className="flex items-center gap-2"><CardTitle>{tab === "tenant" ? "Tenant groups" : `${tabName} groups`}</CardTitle><Badge>{fmt(all.length)}</Badge></div>
          </CardHeaderText>
          {perm.manageAccess && <CardAction><Button size="sm" onClick={() => setEditing("new")}><Plus aria-hidden /> Create group</Button></CardAction>}
        </CardHeader>
        <div className="px-6 pb-4">
          <InputGroup className="w-72">
            <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
            <InputGroupInput aria-label="Search groups" placeholder="Search groups" value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <InputGroupAddon align="end"><Button variant="ghost" size="icon-xs" aria-label="Clear search" onClick={() => setSearch("")}><X aria-hidden /></Button></InputGroupAddon>}
          </InputGroup>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead align="start">Group</TableHead>
              <TableHead align="start">Roles</TableHead>
              <TableHead align="start">Members</TableHead>
              <TableHead align="start">Membership</TableHead>
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => (
              <TableRow key={g.id} className="cursor-pointer" onClick={() => setOpen(g.id)}>
                <TableCell className="max-w-64">
                  <div className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-2 truncate text-label-md text-content-neutral-emphasis">{g.name}{g.locked && <Badge><Lock className="size-3" aria-hidden /> Built-in</Badge>}</span>
                    {g.description && <span className="truncate text-body-xs text-content-neutral-muted">{g.description}</span>}
                  </div>
                </TableCell>
                <TableCell className="max-w-80">
                  {g.assignments.length
                    ? <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-1">{g.assignments.filter((x) => (tab === "tenant" ? !x.product : x.product === tab)).map((x) => <RoleBadge key={x.id} x={x} />)}</div>
                        {groupScopes(g).length > 1 && <span className="text-body-xs text-content-warning-emphasis">Also gives {groupScopes(g).filter((sc) => sc !== tab).map((sc) => scopes.find((x) => x.id === sc)!.name).join(" and ")} access</span>}
                      </div>
                    : <Badge color="warning">No roles yet</Badge>}
                </TableCell>
                <TableCell><Members ids={g.members} /></TableCell>
                <TableCell className="text-content-neutral-muted">{g.source === "local" ? "Managed in Iris" : <span className="inline-flex items-center gap-1"><Link2 className="size-3.5" aria-hidden /> {g.idpGroup}</span>}</TableCell>
                <TableCell className="pe-3" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Actions for ${g.name}`}><MoreHorizontal aria-hidden /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setOpen(g.id)}>Open</DropdownMenuItem>
                      {!g.locked && canChangeGroup(perm, g) && <DropdownMenuItem onSelect={() => setEditing(g)}><Pencil aria-hidden /> Rename</DropdownMenuItem>}
                      {!g.locked && canChangeGroup(perm, g) && <DropdownMenuSeparator />}
                      {!g.locked && canChangeGroup(perm, g) && <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(g)}><Trash2 aria-hidden /> Delete…</DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!groups.length && (
              <TableRow className="hover:bg-transparent"><TableCell colSpan={5}>
                <EmptyState size="sm" icon={<FolderTree />} title={q ? "No groups match" : "No groups yet"} description={q ? "Try a different name." : "Create a group, give it a role, then add people."} />
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <SuggestGroupsDialog open={suggestOpen} onOpenChange={setSuggestOpen} suggestions={suggestions} />
      <GroupDrawer id={open} onClose={() => setOpen(null)} onRename={(g) => setEditing(g)} onDelete={(g) => setDeleting(g)} />
      <GroupDialog value={editing} onClose={(id) => { setEditing(null); if (id) setOpen(id) }} />
      <DeleteGroupDialog group={deleting} onClose={() => setDeleting(null)} onDeleted={() => { setDeleting(null); setOpen(null) }} />
    </div>
  )
}

function Members({ ids }: { ids: string[] }) {
  const people = ids.map((id) => access.person(id)).filter(Boolean)
  if (!people.length) return <span className="text-content-neutral-subtle">Nobody</span>
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {people.slice(0, 3).map((p) => <Avatar key={p!.id} size="xs" className="ring-2 ring-[var(--bg-card)]"><AvatarFallback>{initials(p!.name)}</AvatarFallback></Avatar>)}
      </div>
      <span className="text-body-sm text-content-neutral-muted">{fmt(people.length)}</span>
    </div>
  )
}

// ---------------------------------------------------------------- drawer ----

function GroupDrawer({ id, onClose, onRename, onDelete }: { id: string | null; onClose: () => void; onRename: (g: Group) => void; onDelete: (g: Group) => void }) {
  useAccess()
  const { perm } = useViewer()
  const g = id ? access.group(id) : undefined
  const [roleOpen, setRoleOpen] = useState(false)
  const [peopleOpen, setPeopleOpen] = useState(false)
  const [editLocs, setEditLocs] = useState<string | null>(null)
  if (!g) return <Drawer open={false} />
  const members = g.members.map((m) => access.person(m)).filter(Boolean)
  const editable = canChangeGroup(perm, g)

  const removeRole = (aid: string) => {
    if (wouldOrphanTenant({ groupId: g.id, assignmentId: aid })) { toast({ title: "Can't remove the last Tenant Admin.", description: "Someone else needs Tenant Admin first.", variant: "danger" }); return }
    if (g.members.includes(me()) && g.assignments.find((x) => x.id === aid)?.role === "tenant_admin") { toast({ title: "You can't remove your own admin access.", variant: "danger" }); return }
    access.removeGroupRole(g.id, aid)
    toast({ title: "Role removed.", description: `${plural(g.members.length, "member")} lose it from their next request.` })
  }
  const removeMember = (pid: string) => {
    if (wouldOrphanTenant({ groupId: g.id, personId: pid })) { toast({ title: "Can't remove the last Tenant Admin.", variant: "danger" }); return }
    if (pid === me() && g.assignments.some((x) => x.role === "tenant_admin")) { toast({ title: "You can't remove your own admin access.", variant: "danger" }); return }
    access.removeMember(g.id, pid)
    toast({ title: `${access.person(pid)?.name} was removed from ${g.name}.` })
  }

  return (
    <Drawer open={!!id} onOpenChange={(o) => { if (!o) onClose() }}>
      <DrawerContent size="wide">
        <DrawerHeader type="title">
          <DrawerHeading>
            <DrawerTitleGroup>
              <DrawerTitle>{g.name}</DrawerTitle>
              <DrawerDescription>{g.description || "No description"}</DrawerDescription>
            </DrawerTitleGroup>
            {!g.locked && editable && <Button variant="ghost" size="icon-sm" aria-label="Rename group" onClick={() => onRename(g)}><Pencil aria-hidden /></Button>}
            <DrawerCloseButton />
          </DrawerHeading>
        </DrawerHeader>
        <DrawerBody className="gap-6">
          {g.locked && (
            <Alert variant="info">
              <AlertDescription>
                <span className="inline-flex items-center gap-1.5 font-medium"><Lock className="size-3.5" aria-hidden /> Built-in group.</span>{" "}
                It always has Tenant Admin and can&apos;t be renamed or deleted, so your tenant can&apos;t lose its admins by accident. You can still change who&apos;s in it.
              </AlertDescription>
            </Alert>
          )}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-label-lg text-content-neutral-emphasis">Roles</h3>
              {editable && <Button variant="outline" size="sm" onClick={() => setRoleOpen(true)}><Plus aria-hidden /> Add role</Button>}
            </div>
            {g.assignments.length ? (
              <ul className="flex flex-col divide-y divide-line-neutral-muted rounded-lg border border-line-neutral-muted">
                {g.assignments.map((x) => (
                  <li key={x.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <RoleBadge x={x} />
                    <div className="flex items-center gap-1">
                      {x.product && editable && <Button variant="ghost" size="sm" onClick={() => setEditLocs(x.id)}><MapPin aria-hidden /> Edit locations</Button>}
                      {g.locked && x.role === "tenant_admin"
                        ? <Lock className="size-4 text-content-neutral-subtle" aria-label="Locked" />
                        : editable && <Button variant="ghost" size="icon-xs" aria-label={`Remove ${assignmentLabel(x)}`} onClick={() => removeRole(x.id)}><X aria-hidden /></Button>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <Alert variant="warning"><AlertDescription>This group has no roles, so its members get nothing from it.</AlertDescription></Alert>}
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-label-lg text-content-neutral-emphasis">Members <span className="text-content-neutral-muted">{fmt(members.length)}</span></h3>
              {canChangeMembers(perm, g) && <Button variant="outline" size="sm" onClick={() => setPeopleOpen(true)}><Plus aria-hidden /> Add people</Button>}
            </div>
            {members.length ? (
              <ul className="flex flex-col divide-y divide-line-neutral-muted rounded-lg border border-line-neutral-muted">
                {members.map((p) => (
                  <li key={p!.id} className="flex items-center justify-between gap-3 px-4 py-2">
                    <PersonCell p={p!} sub={p!.status !== "active" ? `${p!.email} · ${p!.status}` : undefined} />
                    {canChangeMembers(perm, g) && <Button variant="ghost" size="sm" onClick={() => removeMember(p!.id)}>Remove</Button>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-body-sm text-content-neutral-muted">Nobody yet.</p>}
          </section>

          <section className="flex flex-col gap-2 rounded-lg bg-surface-neutral-subtle p-4">
            {g.source === "linked" ? (
              <>
                <span className="inline-flex items-center gap-2 text-label-md text-content-neutral-emphasis"><Link2 className="size-4" aria-hidden /> Membership: linked to {g.idpGroup}</span>
                <p className="text-body-sm text-content-neutral-muted">Members come from this group in your identity provider, at each sign-in and through SCIM. Change them there. Its roles are still set here.</p>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-2 text-label-md text-content-neutral-emphasis"><Link2 className="size-4" aria-hidden /> Membership: managed in Iris</span>
                <p className="text-body-sm text-content-neutral-muted">Once single sign-on or SCIM is on, you can link this group to a group in your identity provider. Its members then come from there and can&apos;t be changed here.</p>
              </>
            )}
          </section>
        </DrawerBody>
        <DrawerFooter className="justify-between">
          {g.locked || !editable ? <span /> : <Button variant="ghost" className="text-content-danger-emphasis" onClick={() => onDelete(g)}><Trash2 aria-hidden /> Delete group</Button>}
          <Button variant="outline" onClick={onClose}>Done</Button>
        </DrawerFooter>
      </DrawerContent>

      <EditLocationsDialog group={g} assignmentId={editLocs} onClose={() => setEditLocs(null)} />
      <AddRoleDialog open={roleOpen} onOpenChange={setRoleOpen} title={`Add a role to ${g.name}`} existing={g.assignments}
        onAdd={(x) => { access.addGroupRole(g.id, x); toast({ title: `${g.name} now has ${assignmentLabel({ ...x, id: "" })}.`, description: `${plural(g.members.length, "member")} get it from their next request.` }) }} />
      <PeoplePicker open={peopleOpen} onOpenChange={setPeopleOpen} title={`Add people to ${g.name}`} exclude={g.members}
        onPick={(ids) => { access.addMembers(g.id, ids); toast({ title: `${plural(ids.length, "person", "people")} added to ${g.name}.` }) }} />
    </Drawer>
  )
}

// --------------------------------------------------------- create / rename ---

function GroupDialog({ value, onClose }: { value: Group | "new" | null; onClose: (createdId?: string) => void }) {
  const isNew = value === "new"
  const g = value && value !== "new" ? value : null
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [tried, setTried] = useState(false)
  const [lastKey, setLastKey] = useState<string | null>(null)
  const key = value === null ? null : isNew ? "new" : g!.id
  if (key !== lastKey) { setLastKey(key); setName(g?.name ?? ""); setDesc(g?.description ?? ""); setTried(false) }

  const clash = access.groups().some((x) => x.id !== g?.id && x.name.trim().toLowerCase() === name.trim().toLowerCase())
  const err = tried && !name.trim() ? "Give the group a name." : clash ? "Another group already has this name." : null
  const save = () => {
    setTried(true)
    if (!name.trim() || clash) return
    if (isNew) { const id = access.createGroup({ name, description: desc }); toast({ title: `${name.trim()} was created.`, description: "Now give it a role and add people." }); onClose(id) }
    else { access.updateGroup(g!.id, { name: name.trim(), description: desc.trim() }); toast({ title: "Group updated." }); onClose() }
  }
  return (
    <Dialog open={value !== null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent size="sm">
        <DialogHeader><DialogTitle>{isNew ? "Create group" : `Rename ${g?.name}`}</DialogTitle></DialogHeader>
        <DialogBody className="gap-4">
          <Field invalid={!!err}>
            <FieldLabel required>Name</FieldLabel>
            <FieldControl required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sydney CC managers" autoFocus /></FieldControl>
            <FieldError>{err}</FieldError>
          </Field>
          <Field>
            <FieldLabel>Description</FieldLabel>
            <FieldControl><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Who's in it and why" /></FieldControl>
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose()}>Cancel</Button>
          <Button onClick={save}>{isNew ? "Create group" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteGroupDialog({ group, onClose, onDeleted }: { group: Group | null; onClose: () => void; onDeleted: () => void }) {
  const g = group
  const blocked = !!g && wouldOrphanTenant({ groupId: g.id, deleteGroup: true })
  return (
    <Dialog open={!!g} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Delete {g?.name}?</DialogTitle>
          <DialogDescription>
            {g && g.members.length
              ? `${plural(g.members.length, "member")} will lose the roles this group gives them, from their next request. They stay as users.`
              : "Nobody is in this group."}
          </DialogDescription>
        </DialogHeader>
        {g && (g.assignments.length > 0 || blocked) && (
          <DialogBody className="gap-3">
            {g.assignments.length > 0 && (
              <div className="flex flex-col gap-1.5 rounded-lg bg-surface-neutral-subtle p-3">
                <span className="text-label-sm text-content-neutral-muted">Roles they lose</span>
                <div className="flex flex-wrap gap-1">{g.assignments.map((x) => <RoleBadge key={x.id} x={x} />)}</div>
              </div>
            )}
            {blocked && <Alert variant="destructive"><AlertDescription>This group holds the only Tenant Admins. Give Tenant Admin to someone else first.</AlertDescription></Alert>}
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={blocked} onClick={() => { access.deleteGroup(g!.id); toast({ title: `${g!.name} was deleted.`, description: "Recorded in the audit log." }); onDeleted() }}>Delete group</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------- suggested groups ---

function SuggestGroupsDialog({ open, onOpenChange, suggestions }: { open: boolean; onOpenChange: (o: boolean) => void; suggestions: Suggestion[] }) {
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [names, setNames] = useState<Record<string, string>>({})
  const [wasOpen, setWasOpen] = useState(false)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) { setPicked(Object.fromEntries(suggestions.map((x) => [x.key, true]))); setNames(Object.fromEntries(suggestions.map((x) => [x.key, x.name]))) }
  }
  const chosen = suggestions.filter((x) => picked[x.key])
  const taken = (k: string) => { const n = (names[k] ?? "").trim().toLowerCase(); return !n || access.groups().some((g) => g.name.toLowerCase() === n) || chosen.some((x) => x.key !== k && (names[x.key] ?? "").trim().toLowerCase() === n) }
  const bad = chosen.some((x) => taken(x.key))
  const sites = suggestions.filter((x) => x.key.startsWith("site-"))
  const others = suggestions.filter((x) => !x.key.startsWith("site-"))

  const row = (x: Suggestion) => (
    <li key={x.key} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2">
      <Checkbox aria-label={`Create ${names[x.key]}`} checked={!!picked[x.key]} onCheckedChange={() => setPicked((p) => ({ ...p, [x.key]: !p[x.key] }))} />
      <Input size="sm" aria-label="Group name" value={names[x.key] ?? ""} disabled={!picked[x.key]} aria-invalid={!!picked[x.key] && taken(x.key)} onChange={(e) => setNames((n) => ({ ...n, [x.key]: e.target.value }))} />
      <RoleBadge x={{ ...x.assignment, id: x.key }} />
    </li>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Suggested groups</DialogTitle>
          <DialogDescription>Built from your locations. Rename or untick any you don&apos;t need. They&apos;re created empty; add people with Give access.</DialogDescription>
        </DialogHeader>
        <DialogBody className="max-h-[64vh] gap-5 overflow-y-auto">
          {sites.length > 0 && (
            <section className="flex flex-col gap-2">
              <span className="text-label-md text-content-neutral-emphasis">One per location <span className="text-content-neutral-muted">· see the dashboard for that site</span></span>
              <ul className="flex flex-col divide-y divide-line-neutral-muted rounded-lg border border-line-neutral-muted">{sites.map(row)}</ul>
            </section>
          )}
          {others.length > 0 && (
            <section className="flex flex-col gap-2">
              <span className="text-label-md text-content-neutral-emphasis">Across every location</span>
              <ul className="flex flex-col divide-y divide-line-neutral-muted rounded-lg border border-line-neutral-muted">{others.map(row)}</ul>
            </section>
          )}
          <p className="text-body-sm text-content-neutral-muted">Organise by team or line of business instead? Skip this and use Create group.</p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!chosen.length || bad} onClick={() => {
            createSuggested(chosen.map((x) => ({ name: names[x.key].trim(), description: x.description, assignment: x.assignment })))
            toast({ title: `${plural(chosen.length, "group")} created.`, description: "They're empty. Add people with Give access on Users." })
            onOpenChange(false)
          }}>{chosen.length ? `Create ${plural(chosen.length, "group")}` : "Create groups"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --------------------------------------------------------- edit locations ---
// Change which sites a group's role covers in place — tick Brisbane, done.

function EditLocationsDialog({ group, assignmentId, onClose }: { group: Group; assignmentId: string | null; onClose: () => void }) {
  const x = group.assignments.find((a) => a.id === assignmentId)
  const [where, setWhere] = useState<"some" | "all">("some")
  const [locs, setLocs] = useState<string[]>([])
  const [last, setLast] = useState<string | null>(null)
  if (assignmentId !== last) { setLast(assignmentId); setWhere(x && x.locations.length === 0 ? "all" : "some"); setLocs(x?.locations ?? []) }
  if (!x) return <Dialog open={false} />
  const next = where === "all" ? [] : locs
  const added = next.filter((l) => !x.locations.includes(l)), removed = x.locations.filter((l) => !next.includes(l))
  const changed = where === "all" ? x.locations.length > 0 : added.length + removed.length > 0 || x.locations.length === 0
  const d = describeRole(x.role, next)
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Locations for {group.name}</DialogTitle>
          <DialogDescription>Changes what all {plural(group.members.length, "member")} can see, from their next page load.</DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-4">
          <SegmentedControl size="sm" value={where} onValueChange={(v: string) => setWhere(v as "some" | "all")} aria-label="Which locations">
            <SegmentedControlItem value="some">Some locations</SegmentedControlItem>
            <SegmentedControlItem value="all">All locations</SegmentedControlItem>
          </SegmentedControl>
          {where === "some" ? <LocationChecklist value={locs} onChange={setLocs} /> : <p className="text-body-sm text-content-neutral-muted">Every location, plus widget users with no location.</p>}
          {(added.length > 0 || removed.length > 0) && where === "some" && (
            <div className="flex flex-wrap gap-1.5 text-body-sm">
              {added.map((l) => <Badge key={l} color="success">+ {locationName(l)}</Badge>)}
              {removed.map((l) => <Badge key={l} color="danger">− {locationName(l)}</Badge>)}
            </div>
          )}
          {!(where === "some" && !locs.length) && (
            <div className="flex items-start gap-3 rounded-lg bg-surface-neutral-subtle p-4" aria-live="polite">
              <Eye className="mt-0.5 size-4 shrink-0 text-content-neutral-muted" aria-hidden />
              <span className="text-body-md text-content-neutral-emphasis">Members will see {d.sees}.</span>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!changed || (where === "some" && !locs.length)} onClick={() => {
            updateGroupRole(group.id, x.id, next)
            toast({ title: `${group.name} updated.`, description: "Recorded in the audit log." })
            onClose()
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
