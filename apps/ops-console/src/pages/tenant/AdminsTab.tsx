import { useMemo, useState } from "react"
import { MailPlus, MoreHorizontal, Plus, UserCheck, UserX, Users } from "lucide-react"
import {
  Alert, AlertDescription, Avatar, AvatarFallback, Button, Card, CardAction, CardDescription, CardHeader, CardHeaderText,
  CardTitle, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, EmptyState, Field, FieldControl, FieldError,
  FieldLabel, Input, SegmentedControl, SegmentedControlItem, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import { SearchField, StatusBadge } from "@/components/ui"
import { toast } from "@/lib/toast"
import { ago, emailOk, fmtDate, initials } from "@/lib/format"
import { addAdmin, resendInvite, setAdminStatus } from "@/data/store"
import type { AdminStatus, Tenant } from "@/data/tenants"

type Filter = "all" | AdminStatus

/**
 * Client admins — the tenant's Iris Tenant Admins, as IR sees them. IR invites
 * the first one; after that the customer manages their own people in the
 * client console, and this tab is mostly for support.
 */
export function AdminsTab({ tenant }: { tenant: Tenant }) {
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [adding, setAdding] = useState(false)
  // Admins are tenant-wide; each product's plan sets admin licences, so the
  // largest one is the ceiling. Whether they should be per product is open.
  const liveSubs = tenant.subscriptions.filter((s) => s.status !== "cancelled")
  const limit = liveSubs.length ? Math.max(...liveSubs.map((s) => s.adminLicenses)) : undefined
  const used = tenant.admins.filter((a) => a.status !== "inactive").length
  const full = limit !== undefined && used >= limit
  const readOnly = tenant.status !== "active"

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase()
    return tenant.admins.filter((a) => (filter === "all" || a.status === filter) && (!n || `${a.name} ${a.email}`.toLowerCase().includes(n)))
  }, [tenant.admins, q, filter])

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardHeaderText>
          <CardTitle>Client admins</CardTitle>
          <CardDescription>
            {limit !== undefined ? `${used} of ${limit} admin licences in use.` : `${used} active or invited. No product, so no licence limit yet.`}
          </CardDescription>
        </CardHeaderText>
        {!readOnly ? (
          <CardAction>
            <Button size="sm" onClick={() => setAdding(true)} disabled={full}><Plus aria-hidden /> Add admin</Button>
          </CardAction>
        ) : null}
      </CardHeader>
      {full && !readOnly ? (
        <div className="px-6 pt-4">
          <Alert variant="warning"><AlertDescription>Every admin licence is in use. Raise the limit on the Products tab, or deactivate someone first.</AlertDescription></Alert>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <SearchField value={q} onChange={setQ} placeholder="Search admins" size="sm" />
        <SegmentedControl value={filter} onValueChange={(v) => setFilter(v as Filter)} size="sm" aria-label="Filter admins">
          <SegmentedControlItem value="all">All</SegmentedControlItem>
          <SegmentedControlItem value="active">Active</SegmentedControlItem>
          <SegmentedControlItem value="invited">Invited</SegmentedControlItem>
          <SegmentedControlItem value="inactive">Inactive</SegmentedControlItem>
        </SegmentedControl>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<Users />}
          title={tenant.admins.length ? "No admins match" : "No client admins"}
          description={tenant.admins.length ? "Try another search or filter." : tenant.status === "failed" ? "Provisioning failed before the first admin was invited." : "Add the first client admin to hand the tenancy over."}
          className="pb-10"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead align="start">Name</TableHead>
              <TableHead align="start">Last sign-in</TableHead>
              <TableHead align="start">Status</TableHead>
              <TableHead align="start">Invited</TableHead>
              <TableHead align="start" className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => (
              <TableRow key={a.id} className="last:border-b-0">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar size="sm"><AvatarFallback>{initials(a.name)}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <div className="text-label-md">{a.name}</div>
                      <div className="truncate text-body-xs text-content-neutral-muted">{a.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell title={a.lastLogin ? fmtDate(a.lastLogin) : undefined}>{a.status === "invited" ? <span className="text-content-neutral-subtle">Not yet</span> : ago(a.lastLogin)}</TableCell>
                <TableCell><StatusBadge status={a.status} /></TableCell>
                <TableCell className="whitespace-nowrap">{fmtDate(a.invited)}</TableCell>
                <TableCell>
                  {!readOnly ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${a.name}`}><MoreHorizontal aria-hidden /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {a.status === "invited" ? (
                          <DropdownMenuItem onSelect={() => { resendInvite(tenant.id, a.id); toast({ title: "Invite resent", description: a.email }) }}>
                            <MailPlus aria-hidden /> Resend invite
                          </DropdownMenuItem>
                        ) : null}
                        {a.status === "inactive" ? (
                          <DropdownMenuItem disabled={full} onSelect={() => { setAdminStatus(tenant.id, a.id, "active"); toast({ title: `${a.name} reactivated` }) }}>
                            <UserCheck aria-hidden /> Reactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem variant="destructive" onSelect={() => { setAdminStatus(tenant.id, a.id, "inactive"); toast({ title: `${a.name} deactivated`, description: "They can no longer sign in." }) }}>
                            <UserX aria-hidden /> Deactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <AddAdminDialog tenant={tenant} open={adding} onClose={() => setAdding(false)} />
    </Card>
  )
}

function AddAdminDialog({ tenant, open, onClose }: { tenant: Tenant; open: boolean; onClose: () => void }) {
  const [first, setFirst] = useState("")
  const [last, setLast] = useState("")
  const [email, setEmail] = useState("")
  const [tried, setTried] = useState(false)
  const exists = tenant.admins.some((a) => a.email.toLowerCase() === email.trim().toLowerCase())
  const err = {
    first: !first.trim() ? "Enter a first name." : undefined,
    last: !last.trim() ? "Enter a last name." : undefined,
    email: !emailOk(email) ? "Enter a valid email address." : exists ? "This person is already a client admin here." : undefined,
  }
  const close = () => { setFirst(""); setLast(""); setEmail(""); setTried(false); onClose() }
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close() }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Add a client admin</DialogTitle>
          <DialogDescription>They're created in Cognito and emailed an invite to {tenant.name}'s sign-in page.</DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field invalid={tried && !!err.first}>
              <FieldLabel required>First name</FieldLabel>
              <FieldControl required><Input value={first} onChange={(e) => setFirst(e.target.value)} /></FieldControl>
              {tried && err.first ? <FieldError>{err.first}</FieldError> : null}
            </Field>
            <Field invalid={tried && !!err.last}>
              <FieldLabel required>Last name</FieldLabel>
              <FieldControl required><Input value={last} onChange={(e) => setLast(e.target.value)} /></FieldControl>
              {tried && err.last ? <FieldError>{err.last}</FieldError> : null}
            </Field>
          </div>
          <Field invalid={tried && !!err.email}>
            <FieldLabel required>Email address</FieldLabel>
            <FieldControl required><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`name@${tenant.domains[0] ?? "company.com"}`} /></FieldControl>
            {tried && err.email ? <FieldError>{err.email}</FieldError> : null}
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button onClick={() => {
            setTried(true)
            if (Object.values(err).some(Boolean)) return
            const name = `${first.trim()} ${last.trim()}`
            addAdmin(tenant.id, { id: `a-${Date.now()}`, name, email: email.trim(), status: "invited", lastLogin: null, invited: new Date().toISOString() })
            toast({ title: "Invite sent", description: `${name} · ${email.trim()}` })
            close()
          }}>Send invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
