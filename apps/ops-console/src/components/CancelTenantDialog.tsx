import { useState } from "react"
import {
  Alert, AlertDescription, AlertTitle, Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, Field, FieldControl, FieldLabel, Input,
} from "@ir/ui"
import { cancelTenant } from "@/data/store"
import type { Tenant } from "@/data/tenants"
import { toast } from "@/lib/toast"

/**
 * The live console's row menu says "Delete tenant". What it does is cancel the
 * tenancy (cancelled tenants stay in the list), so the prototype says that,
 * and asks for the name typed back because it signs every client admin out.
 */
export function CancelTenantDialog({ tenant, onClose }: { tenant: Tenant | null; onClose: () => void }) {
  const [typed, setTyped] = useState("")
  const ok = !!tenant && typed.trim() === tenant.name
  return (
    <Dialog open={!!tenant} onOpenChange={(o) => { if (!o) { setTyped(""); onClose() } }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Cancel {tenant?.name}?</DialogTitle>
          <DialogDescription>
            Every product subscription ends now and the tenant's client admins can no longer sign in.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-4">
          <Alert variant="destructive">
            <AlertTitle>There's no undo in the console</AlertTitle>
            <AlertDescription>A cancelled tenancy stays in the list, but it can't be reactivated from here.</AlertDescription>
          </Alert>
          <Field>
            <FieldLabel>Type <strong className="font-semibold">{tenant?.name}</strong> to confirm</FieldLabel>
            <FieldControl><Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" /></FieldControl>
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setTyped(""); onClose() }}>Keep tenancy</Button>
          <Button
            variant="destructive"
            disabled={!ok}
            onClick={() => {
              if (!tenant) return
              cancelTenant(tenant.id)
              toast({ title: `${tenant.name} cancelled`, description: "Subscriptions ended and client admins signed out." })
              setTyped("")
              onClose()
            }}
          >
            Cancel tenancy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
