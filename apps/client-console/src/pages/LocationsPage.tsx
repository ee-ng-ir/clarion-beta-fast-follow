import { useState } from "react"
import { MapPin, MoreHorizontal, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react"
import {
  Alert, AlertDescription, AlertTitle, Badge, Button, Card, CardAction, CardHeader, CardHeaderText, CardTitle,
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  Checkbox, EmptyState, Field, FieldControl, FieldDescription, FieldError, FieldLabel, FieldOption, Input,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea,
} from "@ir/ui"
import { toast } from "@/components/ui/toast"
import { access, planMatch, unassignedWidgetUsers, usersForNewLocation, whoSees, widgetUsersIn, type Location } from "@ir/mock-data/access"
import { setLocation } from "@ir/mock-data/widget-users"
import { MatchLocationsDialog } from "@/components/admin/access/LocationTools"
import { PersonCell, RoleBadge, fmt, plural, useAccess } from "@/components/admin/access/AccessBits"
import { GiveAccessDialog } from "@/components/admin/access/GiveAccessDialog"

/**
 * Locations (Iris platform, Client Admin). Flat, named by the customer, shared by every
 * Iris product. In Clarion each widget user — and so their endpoints — sits in at most
 * one location. A product role limited to locations only sees what's in them.
 */
export function LocationsPage({ onOpenWidgetUsers }: { onOpenWidgetUsers?: () => void }) {
  useAccess()
  const [editing, setEditing] = useState<Location | "new" | null>(null)
  const [deleting, setDeleting] = useState<Location | null>(null)
  const [giveFor, setGiveFor] = useState<string | null>(null)
  const [matchOpen, setMatchOpen] = useState(false)
  const locs = access.locations()
  const unassigned = unassignedWidgetUsers()
  const matchable = planMatch().matched.reduce((n, m) => n + m.users.length, 0)

  return (
    <div className="flex flex-col gap-4">
      {unassigned > 0 && (
        <Alert variant="warning" action={matchable
          ? <Button variant="outline" size="xs" onClick={() => setMatchOpen(true)}><MapPin aria-hidden /> Match {fmt(matchable)} from site</Button>
          : onOpenWidgetUsers && <Button variant="outline" size="xs" onClick={onOpenWidgetUsers}>Set locations</Button>}>
          <AlertTitle>{plural(unassigned, "widget user has", "widget users have")} no location</AlertTitle>
          <AlertDescription>
            Only people with Clarion access to all locations see them.
            {matchable ? ` ${fmt(matchable)} can be matched from the site they already have.` : " Set their location in Widget users."}
          </AlertDescription>
        </Alert>
      )}

      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-4">
          <CardHeaderText>
            <div className="flex items-center gap-2"><CardTitle>Locations</CardTitle><Badge>{fmt(locs.length)}</Badge></div>
          </CardHeaderText>
          <CardAction><Button size="sm" onClick={() => setEditing("new")}><Plus aria-hidden /> Add location</Button></CardAction>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead align="start">Location</TableHead>
              <TableHead align="start">Clarion widget users</TableHead>
              <TableHead align="start">Limited to this location</TableHead>
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locs.map((l) => {
              const who = whoSees(l.id)
              return (
                <TableRow key={l.id}>
                  <TableCell className="max-w-64">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-label-md text-content-neutral-emphasis">{l.name}</span>
                      {l.description && <span className="truncate text-body-xs text-content-neutral-muted">{l.description}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">{fmt(widgetUsersIn(l.id))}</TableCell>
                  <TableCell className="max-w-96">
                    {who.groups.length + who.people.length ? (
                      <div className="flex flex-wrap items-center gap-1">
                        {who.groups.map((g) => <Badge key={g.id} variant="outline">{g.name}</Badge>)}
                        {who.people.length > 0 && <Badge color="warning">{plural(who.people.length, "person", "people")} directly</Badge>}
                      </div>
                    ) : <span className="text-content-neutral-subtle">Nobody yet</span>}
                    <Button variant="link" size="xs" className="mt-1 px-0" onClick={() => setGiveFor(l.id)}>Give someone access</Button>
                  </TableCell>
                  <TableCell className="pe-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Actions for ${l.name}`}><MoreHorizontal aria-hidden /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setGiveFor(l.id)}><ShieldCheck aria-hidden /> Give access to {l.name}</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setEditing(l)}><Pencil aria-hidden /> Rename</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(l)}><Trash2 aria-hidden /> Delete…</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
            {!locs.length && (
              <TableRow className="hover:bg-transparent"><TableCell colSpan={4}>
                <EmptyState size="sm" icon={<MapPin />} title="No locations yet" description="Add the sites, offices or regions you want to limit access by." />
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <p className="border-t border-line-neutral-muted px-6 py-3 text-body-sm text-content-neutral-muted">
          People with a Clarion role for all locations, and Tenant Admins, see every location without being listed here.
        </p>
      </Card>

      <LocationDialog value={editing} onClose={() => setEditing(null)} />
      <DeleteLocationDialog loc={deleting} onClose={() => setDeleting(null)} />
      <MatchLocationsDialog open={matchOpen} onOpenChange={setMatchOpen} onShowUnassigned={onOpenWidgetUsers} />
      <GiveAccessDialog open={giveFor !== null} onOpenChange={(o) => { if (!o) setGiveFor(null) }} locations={giveFor ? [giveFor] : []} />
    </div>
  )
}

function LocationDialog({ value, onClose }: { value: Location | "new" | null; onClose: () => void }) {
  const isNew = value === "new"
  const l = value && value !== "new" ? value : null
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [tried, setTried] = useState(false)
  const [skipUsers, setSkipUsers] = useState<string[]>([])
  const [withGroup, setWithGroup] = useState(true)
  const [gName, setGName] = useState("")
  const [managers, setManagers] = useState<string[]>([])
  const [lastKey, setLastKey] = useState<string | null>(null)
  const key = value === null ? null : isNew ? "new" : l!.id
  if (key !== lastKey) { setLastKey(key); setStep(1); setName(l?.name ?? ""); setDesc(l?.description ?? ""); setTried(false); setSkipUsers([]); setWithGroup(true); setGName(""); setManagers([]) }

  const clash = access.locations().some((x) => x.id !== l?.id && x.name.trim().toLowerCase() === name.trim().toLowerCase())
  const err = tried && !name.trim() ? "Give the location a name." : clash ? "Another location already has this name." : null
  const suggestedUsers = isNew && step > 1 ? usersForNewLocation(name.trim()) : []
  const pickedUsers = suggestedUsers.filter((u) => !skipUsers.includes(u.userId))
  const groupName = gName || `${name.trim()} CC managers`
  const groupClash = access.groups().some((g) => g.name.toLowerCase() === groupName.trim().toLowerCase())
  const people = access.people().filter((p) => p.status !== "deactivated")

  const next = () => { setTried(true); if (!name.trim() || clash) return; setStep(step + 1) }
  const finish = () => {
    const id = access.createLocation({ name, description: desc })
    if (pickedUsers.length) setLocation(pickedUsers.map((u) => u.userId), id)
    let gid: string | null = null
    if (withGroup && !groupClash) {
      gid = access.createGroup({ name: groupName, description: `Contact centre managers at ${name.trim()}` })
      access.addGroupRole(gid, { role: "viewer", product: "clarion", locations: [id] })
      if (managers.length) access.addMembers(gid, managers)
    }
    toast({
      title: `${name.trim()} is set up.`,
      description: [pickedUsers.length && `${plural(pickedUsers.length, "widget user")} moved in`, gid && `${groupName} created${managers.length ? ` with ${plural(managers.length, "person", "people")}` : ""}`].filter(Boolean).join(" · ") || "Add widget users and managers when you're ready.",
    })
    onClose()
  }
  const rename = () => { setTried(true); if (!name.trim() || clash) return; access.updateLocation(l!.id, { name: name.trim(), description: desc.trim() }); toast({ title: "Location updated." }); onClose() }

  return (
    <Dialog open={value !== null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent size={isNew && step > 1 ? "md" : "sm"}>
        <DialogHeader>
          <DialogTitle>{isNew ? (step === 1 ? "Add location" : step === 2 ? `Who's in ${name.trim()}?` : `Who manages ${name.trim()}?`) : `Rename ${l?.name}`}</DialogTitle>
          <DialogDescription>
            {!isNew ? "Shared by every Iris product in your tenant." : step === 1 ? "Step 1 of 3 · Name the site. Used by every Iris product in your tenant."
              : step === 2 ? "Step 2 of 3 · We found widget users whose site matches. Untick anyone who isn't there."
              : "Step 3 of 3 · Give the site's managers the Clarion dashboard for it. You can skip this."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="max-h-[64vh] gap-4 overflow-y-auto">
          {step === 1 && (
            <>
              <Field invalid={!!err}>
                <FieldLabel required>Name</FieldLabel>
                <FieldControl required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Brisbane" autoFocus /></FieldControl>
                <FieldError>{err}</FieldError>
                <FieldDescription>A site, office or region. Locations can&apos;t contain other locations.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <FieldControl><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} /></FieldControl>
              </Field>
            </>
          )}
          {step === 2 && (suggestedUsers.length ? (
            <div className="max-h-80 overflow-y-auto rounded-lg border border-line-neutral-muted p-1">
              {suggestedUsers.map((u) => (
                <label key={u.userId} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-surface-neutral-subtle-hovered">
                  <Checkbox size="sm" checked={!skipUsers.includes(u.userId)} onCheckedChange={() => setSkipUsers((xs) => (xs.includes(u.userId) ? xs.filter((x) => x !== u.userId) : [...xs, u.userId]))} />
                  <span className="flex min-w-0 flex-1 flex-col"><span className="truncate text-body-sm text-content-neutral-emphasis">{u.name || u.loginId}</span><span className="truncate text-body-xs text-content-neutral-muted">{u.loginId} · site “{u.site}”</span></span>
                </label>
              ))}
            </div>
          ) : <p className="text-body-sm text-content-neutral-muted">No widget users without a location have a site matching “{name.trim()}”. You can move users here later from Widget users.</p>)}
          {step === 3 && (
            <>
              <div className="rounded-lg border border-line-neutral-muted p-3">
                <FieldOption control={<Checkbox checked={withGroup && !groupClash} disabled={groupClash} onCheckedChange={() => setWithGroup((v) => !v)} />}
                  description={groupClash ? "A group with this name already exists." : `Sees Overview and Endpoints for ${name.trim()}, read-only.`}>
                  Create a group for this site&apos;s managers
                </FieldOption>
                {withGroup && !groupClash && <div className="mt-3 ps-7"><Input size="sm" aria-label="Group name" value={groupName} onChange={(e) => setGName(e.target.value)} /></div>}
              </div>
              {withGroup && !groupClash && (
                <div className="flex flex-col gap-2">
                  <span className="text-label-md text-content-neutral-emphasis">Add people now <span className="text-content-neutral-muted">· optional</span></span>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-line-neutral-muted p-1">
                    {people.map((p) => (
                      <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-surface-neutral-subtle-hovered">
                        <Checkbox size="sm" checked={managers.includes(p.id)} onCheckedChange={() => setManagers((xs) => (xs.includes(p.id) ? xs.filter((x) => x !== p.id) : [...xs, p.id]))} />
                        <PersonCell p={p} />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogBody>
        <DialogFooter>
          {isNew && step > 1 && <Button variant="ghost" className="me-auto" onClick={() => setStep(step - 1)}>Back</Button>}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {!isNew ? <Button onClick={rename}>Save</Button>
            : step < 3 ? <Button onClick={next}>{step === 2 && pickedUsers.length ? `Next · ${plural(pickedUsers.length, "user")}` : "Next"}</Button>
            : <Button onClick={finish}>Add {name.trim()}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteLocationDialog({ loc, onClose }: { loc: Location | null; onClose: () => void }) {
  const n = loc ? widgetUsersIn(loc.id) : 0
  const who = loc ? whoSees(loc.id) : { groups: [], people: [] }
  const assignments = loc
    ? [...who.groups.flatMap((g) => g.assignments.filter((x) => x.locations.includes(loc.id)).map((x) => ({ x, by: g.name }))),
       ...who.people.flatMap((p) => p.direct.filter((x) => x.locations.includes(loc.id)).map((x) => ({ x, by: p.name })))]
    : []
  return (
    <Dialog open={!!loc} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Delete {loc?.name}?</DialogTitle>
          <DialogDescription>
            {n ? `${plural(n, "widget user")} will have no location, so only people with access to all locations will see them.` : "No widget users are in this location."}
          </DialogDescription>
        </DialogHeader>
        {assignments.length > 0 && (
          <DialogBody>
            <div className="flex flex-col gap-2 rounded-lg bg-surface-neutral-subtle p-3">
              <span className="text-label-sm text-content-neutral-muted">Roles limited to {loc?.name} lose it. A role limited only to {loc?.name} is removed.</span>
              {assignments.map(({ x, by }) => (
                <div key={x.id + by} className="flex flex-wrap items-center gap-2 text-body-sm">
                  <span className="text-content-neutral-emphasis">{by}</span><RoleBadge x={x} />
                  {x.locations.length === 1 && <Badge color="danger">Removed</Badge>}
                </div>
              ))}
            </div>
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => { access.deleteLocation(loc!.id); toast({ title: `${loc!.name} was deleted.`, description: "Recorded in the audit log." }); onClose() }}>Delete location</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
