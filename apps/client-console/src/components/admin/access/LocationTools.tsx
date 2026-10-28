import { useMemo, useState } from "react"
import { Eye, Globe, MapPin, Plus } from "lucide-react"
import {
  Alert, AlertDescription, Badge, Button, Checkbox,
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@ir/ui"
import { toast } from "@/components/ui/toast"
import {
  access, applyMatch, locationName, planMatch, roleDef, whoCanSee,
} from "@ir/mock-data/access"
import type { WidgetUser } from "@ir/mock-data/widget-users"
import { PersonCell, fmt, plural, useAccess } from "@/components/admin/access/AccessBits"

/**
 * Match from site: most widget users already have a typed site ("Sydney", "SYD",
 * "Sydney CBD"). Read those as locations, show the admin the grouping, and set them
 * all in one go. Sites that match nothing can become a location with one click.
 */
export function MatchLocationsDialog({ open, onOpenChange, onShowUnassigned }: { open: boolean; onOpenChange: (o: boolean) => void; onShowUnassigned?: () => void }) {
  const v = useAccess()
  const plan = useMemo(() => planMatch(), [v, open]) // eslint-disable-line react-hooks/exhaustive-deps
  const [off, setOff] = useState<string[]>([])
  const chosen = plan.matched.filter((m) => !off.includes(m.locationId))
  const n = chosen.reduce((s, m) => s + m.users.length, 0)
  const unmatchedUsers = plan.unmatched.reduce((s, u) => s + u.users.length, 0)

  const addAsLocation = (site: string) => {
    const name = site.trim().replace(/\b\w/g, (c) => c.toUpperCase())
    access.createLocation({ name, description: "" })
    toast({ title: `${name} was added as a location.`, description: "Its users now appear in the matches above." })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) setOff([]); onOpenChange(o) }}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Match widget users to locations</DialogTitle>
          <DialogDescription>We read each user&apos;s site and found the location it most likely means. Untick anything that looks wrong.</DialogDescription>
        </DialogHeader>
        <DialogBody className="max-h-[66vh] gap-5 overflow-y-auto">
          {plan.matched.length ? (
            <ul className="flex flex-col divide-y divide-line-neutral-muted rounded-lg border border-line-neutral-muted">
              {plan.matched.map((m) => (
                <li key={m.locationId} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
                  <Checkbox aria-label={`Match ${locationName(m.locationId)}`} checked={!off.includes(m.locationId)}
                    onCheckedChange={() => setOff((xs) => (xs.includes(m.locationId) ? xs.filter((x) => x !== m.locationId) : [...xs, m.locationId]))} />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="flex items-center gap-2 text-label-md text-content-neutral-emphasis"><MapPin className="size-4 text-content-neutral-muted" aria-hidden /> {locationName(m.locationId)}</span>
                    <span className="flex flex-wrap items-center gap-1 text-body-xs text-content-neutral-muted">
                      from site {m.sites.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                    </span>
                  </div>
                  <span className="text-body-sm tabular-nums text-content-neutral-emphasis">{plural(m.users.length, "user")}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-body-sm text-content-neutral-muted">No site matches a location yet.</p>}

          {plan.unmatched.length > 0 && (
            <section className="flex flex-col gap-2">
              <span className="text-label-md text-content-neutral-emphasis">Sites that match no location <span className="text-content-neutral-muted">· {plural(unmatchedUsers, "user")}</span></span>
              <ul className="flex flex-col divide-y divide-line-neutral-muted rounded-lg border border-line-neutral-muted">
                {plan.unmatched.slice(0, 8).map((u) => (
                  <li key={u.site} className="flex items-center justify-between gap-3 px-4 py-2">
                    <span className="text-body-sm text-content-neutral-emphasis">“{u.site}” <span className="text-content-neutral-muted">· {plural(u.users.length, "user")}</span></span>
                    <Button variant="ghost" size="sm" onClick={() => addAsLocation(u.site)}><Plus aria-hidden /> Add as location</Button>
                  </li>
                ))}
              </ul>
              <p className="text-body-xs text-content-neutral-muted">Not a real site (like “Remote”)? Leave them; set their location by hand in Widget users.</p>
            </section>
          )}

          {plan.blank > 0 && (
            <Alert variant="info" action={onShowUnassigned && <Button variant="outline" size="xs" onClick={() => { onOpenChange(false); onShowUnassigned() }}>Show them</Button>}>
              <AlertDescription>{plural(plan.blank, "user has", "users have")} no site typed, so there&apos;s nothing to match. Set them by hand.</AlertDescription>
            </Alert>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!n} onClick={() => {
            const done = applyMatch(plan, chosen.map((m) => m.locationId))
            toast({ title: `${plural(done, "widget user")} now ${done === 1 ? "has a location" : "have a location"}.`, description: "Managers limited to those locations see them from their next page load." })
            onOpenChange(false)
          }}>{n ? `Set location for ${plural(n, "user")}` : "Set locations"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** "Who can see this?" — everyone whose access covers this widget user, and why. */
export function WhoCanSeeDialog({ user, onClose }: { user: WidgetUser | null; onClose: () => void }) {
  useAccess()
  const rows = user ? whoCanSee(user.locationId) : []
  const everywhere = rows.filter((r) => r.everywhere)
  const here = rows.filter((r) => !r.everywhere)
  const where = user?.locationId ? locationName(user.locationId) : null

  const list = (xs: typeof rows) => (
    <ul className="flex flex-col divide-y divide-line-neutral-muted rounded-lg border border-line-neutral-muted">
      {xs.map((r) => (
        <li key={r.person.id} className="flex items-center justify-between gap-3 px-4 py-2">
          <PersonCell p={r.person} sub={r.via.map((g) => (g.via.kind === "group" ? g.via.group.name : r.person.breakGlass ? "Break-glass" : "Direct role")).join(" · ")} />
          <Badge color={r.role === "tenant_admin" ? "info" : "success"}>{roleDef(r.role).name}</Badge>
        </li>
      ))}
    </ul>
  )

  return (
    <Dialog open={!!user} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Who can see {user?.name || user?.loginId}?</DialogTitle>
          <DialogDescription>
            {where ? `In ${where}. ` : "No location, so only people with access to all locations. "}
            {fmt(rows.length)} {rows.length === 1 ? "person sees" : "people see"} this user and their endpoints.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="max-h-[64vh] gap-5 overflow-y-auto">
          {where && (
            <section className="flex flex-col gap-2">
              <span className="flex items-center gap-2 text-label-md text-content-neutral-emphasis"><MapPin className="size-4" aria-hidden /> Because they cover {where} <span className="text-content-neutral-muted">· {here.length}</span></span>
              {here.length ? list(here) : <p className="text-body-sm text-content-neutral-muted">Nobody is limited to {where}. Only people with access to all locations see this user.</p>}
            </section>
          )}
          <section className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-label-md text-content-neutral-emphasis"><Globe className="size-4" aria-hidden /> Because they see every location <span className="text-content-neutral-muted">· {everywhere.length}</span></span>
            {list(everywhere)}
          </section>
          <p className="flex items-start gap-2 text-body-xs text-content-neutral-muted"><Eye className="mt-0.5 size-3.5" aria-hidden /> Based on roles right now. Changes apply from each person&apos;s next page load.</p>
        </DialogBody>
        <DialogFooter><Button variant="outline" onClick={onClose}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
