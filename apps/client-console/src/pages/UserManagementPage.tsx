import { useState } from "react"
import { KeyRound, MoreHorizontal, UserPlus, UserX } from "lucide-react"
import {
  Alert, AlertDescription, AlertTitle, Avatar, AvatarFallback, Badge, Button,
  Card, CardAction, CardDescription, CardHeader, CardHeaderText, CardTitle,
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
  Field, FieldControl, FieldError, FieldLabel, Input,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@ir/ui"
import { ACCOUNT_ADMIN_LIMIT, ME_ADMIN, accountAdmins, useAccountAdmins, type AccountAdmin } from "@ir/mock-data/tenant"
import { initials } from "@ir/mock-data/access"
import { toast } from "@/components/ui/toast"
import { LicenseUsage, formatSignIn } from "@/components/admin/portal/parts"
import { WidgetUsersPage } from "@/pages/WidgetUsersPage"
import type { UserTab } from "@/nav"

/**
 * User management, as in the live portal: Account admins and Clarion widget
 * users, as two views of the tenant's users. Underline tabs, synced to ?tab=.
 */
export function UserManagementPage({ tab, onTabChange }: { tab: UserTab; onTabChange: (t: UserTab) => void }) {
  return (
    <Tabs value={tab} onValueChange={(v) => onTabChange(v as UserTab)}>
      <TabsList>
        <TabsTrigger value="admins">Account admins</TabsTrigger>
        <TabsTrigger value="clarion">Clarion</TabsTrigger>
      </TabsList>
      <TabsContent value="admins" className="pt-gutter"><AccountAdminsPanel /></TabsContent>
      <TabsContent value="clarion" className="pt-gutter"><WidgetUsersPage asBuilt /></TabsContent>
    </Tabs>
  )
}

const statusBadge: Record<AccountAdmin["status"], React.ReactNode> = {
  active: <Badge color="success">Active</Badge>,
  invited: <Badge color="info">Invited</Badge>,
  deactivated: <Badge>Deactivated</Badge>,
}

function AccountAdminsPanel() {
  const admins = useAccountAdmins()
  const used = accountAdmins.seatsUsed()
  const full = used >= ACCOUNT_ADMIN_LIMIT
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deactivating, setDeactivating] = useState<AccountAdmin | null>(null)

  return (
    <div className="flex flex-col gap-gutter">
      {/* A live condition, so it stays until a seat frees up (no dismiss). */}
      {full && (
        <Alert variant="info">
          <AlertTitle>All Account admin licenses are in use</AlertTitle>
          <AlertDescription>To invite someone, deactivate an admin who no longer needs access, or ask your IR account manager for more licenses.</AlertDescription>
        </Alert>
      )}

      <Card className="gap-0 overflow-hidden p-0">
        <CardHeader className="p-6">
          <CardHeaderText>
            <CardTitle><h2>Account admins</h2></CardTitle>
            <CardDescription>Account admins can add and remove users, open the Fleet dashboard and manage this tenant.</CardDescription>
          </CardHeaderText>
          <CardAction>
            <Button onClick={() => setInviteOpen(true)} disabled={full}><UserPlus /> Invite admin</Button>
          </CardAction>
        </CardHeader>
        <div className="border-t border-line-neutral-muted px-6 py-4">
          <LicenseUsage label="Licenses in use" used={used} limit={ACCOUNT_ADMIN_LIMIT} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">User</TableHead>
              <TableHead className="text-start">Last sign-in</TableHead>
              <TableHead className="text-start">Status</TableHead>
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((a) => {
              const me = a.id === ME_ADMIN
              return (
                <TableRow key={a.id} className={a.status === "deactivated" ? "text-content-neutral-muted" : undefined}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar size="sm"><AvatarFallback>{initials(a.name)}</AvatarFallback></Avatar>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate">{a.name}{me && <span className="text-content-neutral-muted"> (you)</span>}</span>
                        <span className="truncate text-body-sm text-content-neutral-muted">{a.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatSignIn(a.lastLogin)}</TableCell>
                  <TableCell>{statusBadge[a.status]}</TableCell>
                  <TableCell>
                    {!me && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="xs" aria-label={`Actions for ${a.name}`}><MoreHorizontal /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {a.status === "deactivated" ? (
                            <DropdownMenuItem disabled={full} onSelect={() => { accountAdmins.setStatus(a.id, "active"); toast({ title: `${a.name} is active again.` }) }}>
                              Reactivate
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem onSelect={() => toast({ title: `Password reset sent to ${a.email}.` })}>
                                <KeyRound /> Send password reset
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onSelect={() => setDeactivating(a)}>
                                <UserX /> Deactivate…
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <InviteAdminDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <Dialog open={!!deactivating} onOpenChange={(o) => { if (!o) setDeactivating(null) }}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Deactivate {deactivating?.name}?</DialogTitle>
            <DialogDescription>They can no longer sign in to Iris or administer this tenant. Their license becomes free for someone else. You can reactivate them later.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivating(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (!deactivating) return
              accountAdmins.setStatus(deactivating.id, "deactivated")
              toast({ title: `${deactivating.name} was deactivated.` })
              setDeactivating(null)
            }}>Deactivate admin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InviteAdminDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [first, setFirst] = useState("")
  const [last, setLast] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const close = () => { setFirst(""); setLast(""); setEmail(""); setError(null); onOpenChange(false) }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const r = accountAdmins.invite({ name: `${first} ${last}`.trim(), email })
    if (!r.ok) { setError(r.error); return }
    toast({ title: `Invite sent to ${email.trim()}.` })
    close()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent size="md">
        <form onSubmit={submit} className="contents">
          <DialogHeader>
            <DialogTitle>Invite an Account admin</DialogTitle>
            <DialogDescription>They get an email to set a password. The invite uses a license until you deactivate them.</DialogDescription>
          </DialogHeader>
          <DialogBody className="gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field><FieldLabel>First name</FieldLabel><FieldControl><Input value={first} onChange={(e) => setFirst(e.target.value)} autoFocus /></FieldControl></Field>
              <Field><FieldLabel>Last name</FieldLabel><FieldControl><Input value={last} onChange={(e) => setLast(e.target.value)} /></FieldControl></Field>
            </div>
            <Field invalid={!!error}>
              <FieldLabel required>Work email</FieldLabel>
              <FieldControl required><Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null) }} /></FieldControl>
              {error && <FieldError>{error}</FieldError>}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>Cancel</Button>
            <Button type="submit">Send invite</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
