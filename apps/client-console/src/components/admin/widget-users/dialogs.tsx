import { useEffect, useMemo, useState } from "react"
import { Download, MapPin } from "lucide-react"
import {
  Alert, AlertDescription, AlertTitle, Badge, Button,
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  Field, FieldControl, FieldDescription, FieldError, FieldLabel, FileUpload, Input, InputButton,
} from "@ir/ui"
import { access, locationName } from "@ir/mock-data/access"
import { toast } from "@/components/ui/toast"
import {
  TEMPLATE_CSV, connectionLabel, connectionOf, createUser, downloadText, emailOk, importCurrent,
  stats, store, updateUser, validateCurrent, type WidgetUser,
} from "@ir/mock-data/widget-users"

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`
const fmtN = (n: number) => n.toLocaleString()

// ------------------------------------------------------------------ Add user --

/**
 * Decided 28 Oct: in the proposal, Location is required when adding a widget user, so
 * nobody lands unassigned and invisible to their site's managers. `scope` limits the
 * choice to the adder's own locations; with one location it's filled in. In the
 * as-built view (no Location field) `location` is where they land.
 */
export function AddUserDialog({ open, onOpenChange, proposed, location = null, scope = null }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  proposed: boolean
  location?: string | null
  /** Locations the adder may use. null = every location. */
  scope?: string[] | null
}) {
  const [f, setF] = useState({ first: "", last: "", loginId: "", email: "", site: "" })
  const [locId, setLocId] = useState<string>("")
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { if (open) { setF({ first: "", last: "", loginId: "", email: "", site: "" }); setLocId(location ?? ""); setTouched(false); setError(null) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const locs = access.locations().filter((l) => scope === null || scope.includes(l.id))

  const loginErr = touched && !f.loginId.trim() ? "Login ID is required." : null
  const emailErr = touched && f.email.trim() && !emailOk(f.email.trim()) ? "Enter a valid email address." : null
  const locErr = proposed && touched && !locId ? "Choose where they work." : null

  const submit = () => {
    setTouched(true)
    if (!f.loginId.trim() || (f.email.trim() && !emailOk(f.email.trim())) || (proposed && !locId)) return
    const r = createUser({ loginId: f.loginId, name: `${f.first} ${f.last}`.trim(), email: f.email, site: f.site, locationId: proposed ? locId : location })
    if (!r.ok) { setError(r.error); return }
    toast({ title: `${`${f.first} ${f.last}`.trim() || f.loginId} was added.` })
    onOpenChange(false)
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Add Clarion user</DialogTitle>
          {proposed && <DialogDescription>They use a licence as soon as they're added.</DialogDescription>}
        </DialogHeader>
        <DialogBody className="gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field><FieldLabel>First name</FieldLabel><FieldControl><Input placeholder="Enter first name" value={f.first} onChange={set("first")} autoFocus /></FieldControl></Field>
            <Field><FieldLabel>Last name</FieldLabel><FieldControl><Input placeholder="Enter last name" value={f.last} onChange={set("last")} /></FieldControl></Field>
          </div>
          <Field invalid={!!loginErr}>
            <FieldLabel required>Login ID</FieldLabel>
            <FieldControl required><Input placeholder="domain\username" value={f.loginId} onChange={set("loginId")} /></FieldControl>
            {proposed && !loginErr && <FieldDescription>The Windows sign-in the widget reports. It can't be changed later.</FieldDescription>}
            <FieldError>{loginErr}</FieldError>
          </Field>
          <Field invalid={!!emailErr}>
            <FieldLabel>Email</FieldLabel>
            <FieldControl><Input type="email" placeholder="Enter email address" value={f.email} onChange={set("email")} /></FieldControl>
            <FieldError>{emailErr}</FieldError>
          </Field>
          {proposed && (
            <Field invalid={!!locErr}>
              <FieldLabel required>Location</FieldLabel>
              <DropdownMenu>
                <FieldControl required>
                  <DropdownMenuTrigger asChild>
                    <InputButton icon={<MapPin />} value={locId ? locationName(locId) : undefined} placeholder="Choose a location" />
                  </DropdownMenuTrigger>
                </FieldControl>
                <DropdownMenuContent align="start" className="max-h-72 w-(--radix-dropdown-menu-trigger-width) overflow-y-auto">
                  {locs.map((l) => <DropdownMenuItem key={l.id} onSelect={() => setLocId(l.id)}>{l.name}</DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
              {!locErr && <FieldDescription>Decides who can see them and their endpoints.</FieldDescription>}
              <FieldError>{locErr}</FieldError>
            </Field>
          )}
          <Field>
            <FieldLabel>Site</FieldLabel>
            <FieldControl><SiteInput value={f.site} onChange={(v) => setF({ ...f, site: v })} suggest={proposed} /></FieldControl>
          </Field>
          {error && <Alert variant="destructive" role="alert"><AlertTitle>{error}</AlertTitle></Alert>}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Add user</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Free text today. Proposed: suggest the sites already in use, so "Sydney" stops
 *  turning into "sydney", "SYD" and "Sydney CBD". */
export function SiteInput({ value, onChange, suggest }: { value: string; onChange: (v: string) => void; suggest: boolean }) {
  // Only built when the field is shown, so 20k users aren't scanned on every render.
  const list = useMemo(() => (suggest ? Array.from(new Set(store.all().map((u) => u.site).filter(Boolean))).sort() : []), [suggest])
  return (
    <>
      <Input placeholder="Choose site" value={value} onChange={(e) => onChange(e.target.value)} list={suggest ? "widget-user-sites" : undefined} />
      {suggest && <datalist id="widget-user-sites">{list.map((s) => <option key={s} value={s} />)}</datalist>}
    </>
  )
}

// ------------------------------------------------- CSV upload, as built today --

/** csv-bulk-upload-modal.tsx: validate in the browser, any bad row fails the file,
 *  then upload in the background. Duplicates and existing users are skipped silently. */
export function CurrentCsvDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [busy, setBusy] = useState(false)
  const handle = async (file: File | undefined) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".csv")) { toast({ title: "Upload a CSV file.", variant: "danger" }); return }
    const text = await file.text()
    const v = validateCurrent(text)
    if (!v.ok) {
      onOpenChange(false)
      toast({
        title: v.invalidRowCount
          ? `Upload not completed. ${v.invalidRowCount === 1 ? "1 row has" : `${v.invalidRowCount} rows have`} invalid fields. No users were added`
          : "Fix the CSV file and try again.",
        description: v.errors.slice(0, 4).join(" ") + (v.errors.length > 4 ? ` …and ${v.errors.length - 4} more.` : ""),
        variant: "danger",
      })
      return
    }
    setBusy(true)
    onOpenChange(false)
    toast({ title: "Uploading widget users, please do not refresh.", variant: "info" })
    await new Promise((r) => setTimeout(r, 900))
    const r = importCurrent(text)
    setBusy(false)
    if (!r.ok) { toast({ title: r.error, variant: "danger" }); return }
    toast({ title: r.imported > 0 ? `Successfully added ${r.imported} clarion widget ${r.imported === 1 ? "user" : "users"}` : "No new Clarion widget users to add." })
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader><DialogTitle>CSV bulk upload</DialogTitle></DialogHeader>
        <DialogBody className="gap-4">
          <div><Button variant="outline" size="sm" onClick={() => downloadText("clarion-widget-users-template.csv", TEMPLATE_CSV)}><Download /> Download bulk template</Button></div>
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-neutral-muted px-4 py-8 text-center">
            <span className="text-label-md text-content-neutral-emphasis">Bulk invite your widget users to Clarion</span>
            <span className="text-body-sm text-content-neutral-muted">Drag and drop .CSV or choose a file</span>
            <div className="mt-2 w-64"><FileUpload accept=".csv,text/csv" disabled={busy} onFilesChange={(fs) => void handle(fs[0])} /></div>
          </div>
        </DialogBody>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------------ Remove (proposed) --

export interface Target {
  /** Users in hand (selected rows, or one row). */
  users: WidgetUser[]
  /** For "all matching": the count the admin saw, re-checked on confirm. */
  count: number
  label: string
}

export function RemoveDialog({ open, onOpenChange, target, onRemove, onDeactivateInstead }: {
  open: boolean; onOpenChange: (o: boolean) => void; target: Target | null
  onRemove: () => void; onDeactivateInstead: () => void
}) {
  const [typed, setTyped] = useState("")
  useEffect(() => { if (open) setTyped("") }, [open])
  if (!target) return null
  const n = target.count
  const needsCount = n >= 10
  const okToGo = !needsCount || typed.replace(/[,\s]/g, "") === String(n)
  // Only active users can be deactivated, and only active users hold a licence.
  const active = target.users.filter((u) => u.active).length
  const allInactive = active === 0
  const sample = target.users.slice(0, 4)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Remove {n === 1 ? target.label : plural(n, "user")}?</DialogTitle>
          <DialogDescription>
            {allInactive
              ? `${n === 1 ? "They're" : "They're all"} already deactivated. Removing takes them off the list for good.`
              : "Their widget stops working the next time it checks in. This can't be undone."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-4">
          {n > 1 && (
            <ul className="flex flex-col gap-1 rounded-lg bg-surface-neutral-subtle p-3 text-body-sm text-content-neutral-emphasis">
              {sample.map((u) => <li key={u.userId} className="truncate">{u.name || u.loginId} <span className="text-content-neutral-muted">· {u.loginId}</span></li>)}
              {n > sample.length && <li className="text-content-neutral-muted">…and {plural(n - sample.length, "other")}</li>}
            </ul>
          )}
          <p className="text-body-sm text-content-neutral-muted">
            {active > 0 ? `Frees ${plural(active, "licence")}. ` : ""}The audit log records who removed them and how many.
          </p>
          {!allInactive && (
            <Alert variant="info" action={
              <Button variant="outline" size="xs" onClick={onDeactivateInstead}>
                {active === n ? "Deactivate instead" : `Deactivate the ${fmtN(active)} active instead`}
              </Button>
            }>
              <AlertTitle>Offboarding people who left?</AlertTitle>
              <AlertDescription>Deactivating frees the licence too, keeps their history, and can be undone.</AlertDescription>
            </Alert>
          )}
          {needsCount && (
            <Field>
              <FieldLabel>Type the number of users to remove</FieldLabel>
              <FieldControl><Input inputMode="numeric" placeholder={n.toLocaleString()} value={typed} onChange={(e) => setTyped(e.target.value)} /></FieldControl>
            </Field>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={!okToGo} onClick={onRemove}>Remove {n === 1 ? "user" : plural(n, "user")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DeactivateDialog({ open, onOpenChange, target, onConfirm }: {
  open: boolean; onOpenChange: (o: boolean) => void; target: Target | null; onConfirm: () => void
}) {
  if (!target) return null
  const n = target.count
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Deactivate {n === 1 ? target.label : plural(n, "user")}?</DialogTitle>
          <DialogDescription>
            Their widget stops working and the {n === 1 ? "licence is" : "licences are"} freed. They stay on the list, and you can reactivate them any time.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm}>Deactivate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ----------------------------------------------------------------- Edit --

/** Fix someone's details in place (PATCH name / email / site). Login ID can't change:
 *  fleet-config derives the user's ID from it. */
export function EditUserDialog({ open, onOpenChange, user }: { open: boolean; onOpenChange: (o: boolean) => void; user: WidgetUser | null }) {
  const [f, setF] = useState({ name: "", email: "", site: "" })
  useEffect(() => { if (open && user) setF({ name: user.name, email: user.email, site: user.site }) }, [open, user])
  if (!user) return null
  const emailErr = f.email.trim() && !emailOk(f.email.trim()) ? "Enter a valid email address." : null
  const dirty = f.name.trim() !== user.name || f.email.trim() !== user.email || f.site.trim() !== user.site
  const save = () => {
    if (emailErr) return
    updateUser(user.userId, { name: f.name.trim(), email: f.email.trim(), site: f.site.trim() })
    toast({ title: "Changes saved.", description: "Recorded in the audit log." })
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Edit {user.name || user.loginId}</DialogTitle>
        </DialogHeader>
        <DialogBody className="gap-4">
          <Field>
            <FieldLabel>Login ID</FieldLabel>
            <FieldControl><Input value={user.loginId} disabled readOnly /></FieldControl>
            <FieldDescription>Can't be changed — it's how the widget is matched to this user. To use a different login ID, add a new user and remove this one.</FieldDescription>
          </Field>
          <Field><FieldLabel>Name</FieldLabel><FieldControl><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></FieldControl></Field>
          <Field invalid={!!emailErr}>
            <FieldLabel>Email</FieldLabel>
            <FieldControl><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></FieldControl>
            <FieldError>{emailErr}</FieldError>
          </Field>
          <Field><FieldLabel>Site</FieldLabel><FieldControl><SiteInput value={f.site} onChange={(v) => setF({ ...f, site: v })} suggest /></FieldControl></Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!dirty || !!emailErr} onClick={save}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------------------ bits --

export function ConnectionBadge({ user }: { user: WidgetUser }) {
  const c = connectionOf(user)
  const color = c === "connected" ? "success" : c === "invite_failed" ? "warning" : "neutral"
  return <Badge color={color} dot>{connectionLabel[c]}</Badge>
}

export function licenceLine() {
  const s = stats()
  return { used: s.active, total: s.limit }
}
