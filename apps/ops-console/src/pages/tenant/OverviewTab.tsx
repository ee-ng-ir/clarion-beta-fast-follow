import { useState } from "react"
import { Package, Pencil, Plus } from "lucide-react"
import {
  Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardHeaderText, CardTitle,
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  EmptyState, Field, FieldControl, FieldError, FieldLabel, Input, TagsInput,
} from "@ir/ui"
import { DetailRow, Mono, StatusBadge, SyncBadge, TrialBadge, Usage } from "@/components/ui"
import { toast } from "@/lib/toast"
import { domainOk, emailOk, fmtDate, remaining } from "@/lib/format"
import { productCatalog, productDef, productName, regionLabel } from "@/data/catalog"
import { updateTenant } from "@/data/store"
import { tenantUrl, type Subscription, type Tenant } from "@/data/tenants"
import { ProvisionProductDialog } from "./ProvisionProductDialog"

export function OverviewTab({ tenant, onTab }: { tenant: Tenant; onTab: (t: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [provisioning, setProvisioning] = useState(false)
  const readOnly = tenant.status !== "active"
  const contact = tenant.contact ? `${tenant.contact.firstName} ${tenant.contact.lastName} <${tenant.contact.email}>` : undefined
  const subs = [...tenant.subscriptions].sort((a, b) => (a.status === "cancelled" ? 1 : 0) - (b.status === "cancelled" ? 1 : 0))
  const canProvision = !readOnly && productCatalog.some((p) => p.available && !tenant.subscriptions.some((s) => s.product === p.id && s.status !== "cancelled"))

  return (
    <div className="grid gap-gutter @5xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Card>
        <CardHeader>
          <CardHeaderText>
            <CardTitle>Tenancy details</CardTitle>
            <CardDescription>What IR holds about this customer.</CardDescription>
          </CardHeaderText>
          {!readOnly ? (
            <CardAction><Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil aria-hidden /> Edit</Button></CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="gap-0 pt-4">
          <dl>
            <DetailRow label="Company name">{tenant.name}</DetailRow>
            <DetailRow label="IR customer ID" copyValue={tenant.accountCode}>{tenant.accountCode}</DetailRow>
            <DetailRow label="Client account contact" copyValue={tenant.contact?.email}>{contact ?? <span className="text-content-neutral-subtle">None</span>}</DetailRow>
            <DetailRow label="Tenant ID" copyValue={tenant.id}><Mono>{tenant.id}</Mono></DetailRow>
            <DetailRow label="Email domains" copyValue={tenant.domains.join(", ")}>{tenant.domains.join(", ")}</DetailRow>
            <DetailRow label="Sign-in URL" copyValue={`https://${tenantUrl(tenant.id)}`}><Mono>{tenantUrl(tenant.id)}</Mono></DetailRow>
            <DetailRow label="Region" copyValue={tenant.region}>{regionLabel(tenant.region)}</DetailRow>
            <DetailRow label="Created">{fmtDate(tenant.created)}</DetailRow>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardHeaderText>
            <CardTitle>Products</CardTitle>
            <CardDescription>What this tenancy can use, and how much of it.</CardDescription>
          </CardHeaderText>
          {canProvision ? (
            <CardAction><Button size="sm" onClick={() => setProvisioning(true)}><Plus aria-hidden /> Provision product</Button></CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="gap-4 pt-4">
          {subs.length === 0 ? (
            <EmptyState
              size="sm"
              icon={<Package />}
              title="No products yet"
              description={readOnly ? "This tenancy never had a product." : "Provision a product to give this tenancy access."}
              action={canProvision ? <Button variant="outline" size="sm" onClick={() => setProvisioning(true)}>Provision product</Button> : undefined}
            />
          ) : (
            subs.map((s) => <ProductSummary key={s.product + s.status} sub={s} onOpen={() => onTab("products")} />)
          )}
        </CardContent>
      </Card>

      <EditTenantDialog tenant={tenant} open={editing} onClose={() => setEditing(false)} />
      <ProvisionProductDialog tenant={tenant} open={provisioning} onClose={() => setProvisioning(false)} onDone={() => onTab("products")} />
    </div>
  )
}

function ProductSummary({ sub, onOpen }: { sub: Subscription; onOpen: () => void }) {
  const cancelled = sub.status === "cancelled"
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line-neutral-muted p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-heading-xs text-content-neutral-emphasis">{productName(sub.product)}</span>
        <StatusBadge status={sub.status} />
        {sub.trial ? <TrialBadge /> : null}
        {!cancelled && sub.sync !== "in-sync" ? <SyncBadge sync={sub.sync} /> : null}
        <Mono className="ms-auto text-content-neutral-muted">{sub.version}</Mono>
      </div>
      <div className="flex flex-wrap justify-between gap-2 text-body-sm text-content-neutral-muted">
        <span>{sub.plan} · {sub.billing === "annual" ? "Annual" : "Monthly"}</span>
        <span>{cancelled ? `Ended ${fmtDate(sub.expiry)}` : `${remaining(sub.expiry)} left · renews ${fmtDate(sub.expiry)}`}</span>
      </div>
      {!cancelled ? (
        <>
          <Usage label={productDef(sub.product).unit.label} used={sub.unitsUsed} total={sub.units} />
          <div className="flex items-center justify-between text-body-sm">
            <span className="text-content-neutral-muted">Admin licences: <span className="text-content-neutral-emphasis">{sub.adminLicenses}</span></span>
            <Button variant="link" size="sm" onClick={onOpen}>Manage plan</Button>
          </div>
        </>
      ) : null}
    </div>
  )
}

function EditTenantDialog({ tenant, open, onClose }: { tenant: Tenant; open: boolean; onClose: () => void }) {
  const [name, setName] = useState(tenant.name)
  const [first, setFirst] = useState(tenant.contact?.firstName ?? "")
  const [last, setLast] = useState(tenant.contact?.lastName ?? "")
  const [email, setEmail] = useState(tenant.contact?.email ?? "")
  const [domains, setDomains] = useState(tenant.domains)
  const [tried, setTried] = useState(false)

  const reset = () => {
    setName(tenant.name); setFirst(tenant.contact?.firstName ?? ""); setLast(tenant.contact?.lastName ?? "")
    setEmail(tenant.contact?.email ?? ""); setDomains(tenant.domains); setTried(false)
  }
  const anyContact = !!(first || last || email)
  const err = {
    name: !name.trim() ? "Enter the company name." : undefined,
    email: anyContact && !emailOk(email) ? "Enter a valid email, or clear the contact." : undefined,
    domains: !domains.length ? "Keep at least one email domain." : undefined,
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Edit tenancy details</DialogTitle>
          <DialogDescription>Tenant ID, region and sign-in URL are fixed once a tenancy exists.</DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-4">
          <Field invalid={tried && !!err.name}>
            <FieldLabel required>Company name</FieldLabel>
            <FieldControl required><Input value={name} onChange={(e) => setName(e.target.value)} /></FieldControl>
            {tried && err.name ? <FieldError>{err.name}</FieldError> : null}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field><FieldLabel>Contact first name</FieldLabel><FieldControl><Input value={first} onChange={(e) => setFirst(e.target.value)} /></FieldControl></Field>
            <Field><FieldLabel>Contact last name</FieldLabel><FieldControl><Input value={last} onChange={(e) => setLast(e.target.value)} /></FieldControl></Field>
          </div>
          <Field invalid={tried && !!err.email}>
            <FieldLabel>Contact email</FieldLabel>
            <FieldControl><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></FieldControl>
            {tried && err.email ? <FieldError>{err.email}</FieldError> : null}
          </Field>
          <Field invalid={tried && !!err.domains}>
            <FieldLabel required>Email domains</FieldLabel>
            <FieldControl required><TagsInput value={domains} onValueChange={(v) => setDomains(v.map((d) => d.toLowerCase()))} validate={domainOk} /></FieldControl>
            {tried && err.domains ? <FieldError>{err.domains}</FieldError> : null}
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose() }}>Cancel</Button>
          <Button onClick={() => {
            setTried(true)
            if (Object.values(err).some(Boolean)) return
            updateTenant(tenant.id, {
              name: name.trim(), domains,
              contact: anyContact ? { firstName: first.trim(), lastName: last.trim(), email: email.trim() } : undefined,
            })
            toast({ title: "Tenancy details saved" })
            onClose()
          }}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
