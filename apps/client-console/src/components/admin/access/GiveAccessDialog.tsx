import { useEffect, useMemo, useState } from "react"
import { Eye, FolderPlus, Search, Users as UsersIcon, X } from "lucide-react"
import {
  Button, Checkbox, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Field, FieldControl, FieldLabel, FieldOption, Input, InputGroup, InputGroupAddon, InputGroupInput, Radio, RadioGroup,
  SegmentedControl, SegmentedControlItem,
} from "@ir/ui"
import { toast } from "@/components/ui/toast"
import {
  access, describeRole, grantsOf, jobsFor, matchingGroup, productName, suggestGroupName, type Assignment, type Job, type Scope,
} from "@ir/mock-data/access"
import { LocationChecklist, PersonCell, plural, useAccess } from "@/components/admin/access/AccessBits"
import { useViewer } from "@/lib/viewer"

/**
 * "Give access": the IT Admin answers what someone should do and where, and we put
 * them in the group that already gives exactly that (or create it). Nobody ends up
 * with a direct role by accident, and the preview says what they'll see before saving.
 */
export function GiveAccessDialog({
  open, onOpenChange, people: preset = [], locations: presetLocs = [], scope = "clarion",
}: {
  scope?: Scope
  open: boolean
  onOpenChange: (o: boolean) => void
  people?: string[]
  locations?: string[]
}) {
  useAccess()
  const [who, setWho] = useState<string[]>([])
  const [job, setJob] = useState<Job>("view")
  const [where, setWhere] = useState<"some" | "all">("some")
  const [locs, setLocs] = useState<string[]>([])
  const [name, setName] = useState("")
  const [nameTouched, setNameTouched] = useState(false)
  const [tried, setTried] = useState(false)
  const [q, setQ] = useState("")

  useEffect(() => {
    if (!open) return
    setWho(preset); setJob(jobsFor(scope)[0].id); setWhere("some"); setLocs(presetLocs)
    setName(""); setNameTouched(false); setTried(false); setQ("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // A User Admin can't give Tenant Admin (assumed rule, open question 4).
  const { perm } = useViewer()
  const jobs = jobsFor(scope).filter((j) => perm.grantTenantAdmin || j.role !== "tenant_admin")
  const def = jobs.find((j) => j.id === job) ?? jobs[0]
  const scopedLocs = def.scoped && where === "some" ? locs : []
  const draft: Omit<Assignment, "id"> = { role: def.role, product: def.product, locations: scopedLocs }
  const match = matchingGroup(draft)
  const suggested = suggestGroupName(def.id, scopedLocs, def.product)
  const groupName = nameTouched ? name : suggested
  const already = match ? who.filter((id) => match.members.includes(id)) : []
  const needLocs = def.scoped && where === "some" && locs.length === 0
  const nameClash = !match && access.groups().some((g) => g.name.trim().toLowerCase() === groupName.trim().toLowerCase())
  const d = describeRole(def.role, scopedLocs, def.product)
  const first = access.person(who[0] ?? "")
  const hasOther = who.some((id) => grantsOf(id).length > 0)

  const people = useMemo(() => {
    const s = q.trim().toLowerCase()
    return access.people().filter((p) => p.status !== "deactivated" && (!s || p.name.toLowerCase().includes(s) || p.email.toLowerCase().includes(s)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, open])

  const save = () => {
    setTried(true)
    if (!who.length || needLocs || (!match && (!groupName.trim() || nameClash))) return
    let gid = match?.id
    let created = false
    if (!gid) {
      gid = access.createGroup({ name: groupName, description: "" })
      access.addGroupRole(gid, draft)
      created = true
    }
    access.addMembers(gid, who)
    const g = access.group(gid)!
    toast({
      title: `${who.length === 1 ? first?.name : plural(who.length, "person", "people")} added to ${g.name}.`,
      description: created ? "New group created with this role. Applies from their next request." : "Applies from their next request. Recorded in the audit log.",
    })
    onOpenChange(false)
  }

  const subject = who.length === 1 ? first?.name.split(" ")[0] : "They"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{scope === "tenant" ? "Give tenant access" : `Give ${productName(scope)} access`}</DialogTitle>
          <DialogDescription>Say what they should do and where. We&apos;ll add them to the right group.</DialogDescription>
        </DialogHeader>
        <DialogBody className="max-h-[68vh] gap-6 overflow-y-auto">
          {/* Who */}
          <section className="flex flex-col gap-2">
            <span className="text-label-md text-content-neutral-emphasis">Who</span>
            {preset.length ? (
              <div className="flex flex-wrap gap-2">
                {who.map((id) => { const p = access.person(id)!; return <span key={id} className="rounded-full border border-line-neutral-muted px-3 py-1 text-body-sm">{p.name}</span> })}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <InputGroup>
                  <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
                  <InputGroupInput aria-label="Search people" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
                  {q && <InputGroupAddon align="end"><Button variant="ghost" size="icon-xs" aria-label="Clear search" onClick={() => setQ("")}><X aria-hidden /></Button></InputGroupAddon>}
                </InputGroup>
                <div className="max-h-44 overflow-y-auto rounded-lg border border-line-neutral-muted p-1">
                  {people.map((p) => (
                    <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-surface-neutral-subtle-hovered">
                      <Checkbox size="sm" checked={who.includes(p.id)} onCheckedChange={() => setWho((xs) => (xs.includes(p.id) ? xs.filter((x) => x !== p.id) : [...xs, p.id]))} />
                      <PersonCell p={p} />
                    </label>
                  ))}
                </div>
                {tried && !who.length && <p className="text-body-sm text-content-danger-emphasis">Pick at least one person.</p>}
              </div>
            )}
          </section>

          {/* What */}
          <section className="flex flex-col gap-2">
            <span className="text-label-md text-content-neutral-emphasis">What should they do?</span>
            <RadioGroup value={def.id} onValueChange={(v) => setJob(v as Job)} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {jobs.map((j) => (
                <div key={j.id} className="rounded-lg border border-line-neutral-muted p-3">
                  <FieldOption control={<Radio value={j.id} />} description={j.hint}>{j.label}</FieldOption>
                </div>
              ))}
            </RadioGroup>
          </section>

          {/* Where */}
          {def.scoped && (
            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-label-md text-content-neutral-emphasis">Where?</span>
                <SegmentedControl size="sm" value={where} onValueChange={(v: string) => setWhere(v as "some" | "all")} aria-label="Which locations">
                  <SegmentedControlItem value="some">Some locations</SegmentedControlItem>
                  <SegmentedControlItem value="all">All locations</SegmentedControlItem>
                </SegmentedControl>
              </div>
              {where === "some"
                ? <LocationChecklist value={locs} onChange={setLocs} />
                : <p className="text-body-sm text-content-neutral-muted">Every location, plus widget users with no location.</p>}
              {tried && needLocs && <p className="text-body-sm text-content-danger-emphasis">Pick at least one location, or choose All locations.</p>}
            </section>
          )}

          {/* Which group */}
          <section className="flex flex-col gap-2 rounded-lg border border-line-neutral-muted p-4">
            {match ? (
              <div className="flex items-start gap-3">
                <UsersIcon className="mt-0.5 size-4 shrink-0 text-content-neutral-muted" aria-hidden />
                <div className="flex flex-col gap-0.5">
                  <span className="text-label-md text-content-neutral-emphasis">Adds them to {match.name}</span>
                  <span className="text-body-sm text-content-neutral-muted">
                    {plural(match.members.length, "person is", "people are")} already in it{already.length ? `, including ${who.length === 1 ? first?.name : `${already.length} of these people`}` : ""}.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <FolderPlus className="mt-0.5 size-4 shrink-0 text-content-neutral-muted" aria-hidden />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="text-label-md text-content-neutral-emphasis">No group gives exactly this yet. We&apos;ll create one.</span>
                  <Field invalid={tried && (nameClash || !groupName.trim())}>
                    <FieldLabel>Group name</FieldLabel>
                    <FieldControl><Input value={groupName} onChange={(e) => { setNameTouched(true); setName(e.target.value) }} /></FieldControl>
                    {tried && nameClash && <p className="text-body-sm text-content-danger-emphasis">A group with this name already exists.</p>}
                  </Field>
                </div>
              </div>
            )}
          </section>

          {/* Preview */}
          <section className="flex items-start gap-3 rounded-lg bg-surface-neutral-subtle p-4" aria-live="polite">
            <Eye className="mt-0.5 size-4 shrink-0 text-content-neutral-muted" aria-hidden />
            <div className="flex flex-col gap-1">
              {needLocs
                ? <span className="text-body-md text-content-neutral-muted">Pick a location to see what they&apos;ll get.</span>
                : <span className="text-body-md text-content-neutral-emphasis">{who.length > 1 ? "They'll each see" : `${subject} will see`} {d.sees}.</span>}
              {!needLocs && d.not && <span className="text-body-sm text-content-neutral-muted">Not {d.not}.</span>}
              {hasOther && <span className="text-body-sm text-content-neutral-muted">Any access they already have from other groups stays.</span>}
            </div>
          </section>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{who.length > 1 ? `Give ${who.length} people access` : "Give access"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
