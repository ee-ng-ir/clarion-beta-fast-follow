import { useState } from "react"
import { Info, MoreHorizontal, Package, Pause, Play, Plus, RefreshCw, Tag } from "lucide-react"
import {
  Alert, AlertDescription, AlertTitle, Button, Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader,
  CardHeaderText, CardTitle, DatePicker, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, EmptyState, Field, FieldControl,
  FieldDescription, FieldLabel, FieldOption, NumberInput, Separator, Switch, Tooltip, TooltipContent, TooltipTrigger,
} from "@ir/ui"
import { ChoiceSelect, Mono, StatusBadge, SyncBadge, TrialBadge, Usage } from "@/components/ui"
import { toast } from "@/lib/toast"
import { fmtDate, remaining } from "@/lib/format"
import { LATEST_VERSION, clarionPlanFlags, flagDef, productCatalog, productName, type FlagValue, type ProductId } from "@/data/catalog"
import { updateSubscription } from "@/data/store"
import type { Subscription, Tenant } from "@/data/tenants"
import { ProvisionProductDialog } from "./ProvisionProductDialog"

export function ProductsTab({ tenant }: { tenant: Tenant }) {
  const subs = tenant.subscriptions
  const [selected, setSelected] = useState<string | undefined>(() => {
    const live = subs.find((s) => s.status !== "cancelled") ?? subs[0]
    return live ? `${live.product}:${live.status === "cancelled" ? "c" : "l"}` : undefined
  })
  const [provisioning, setProvisioning] = useState(false)
  const keyOf = (s: Subscription) => `${s.product}:${s.status === "cancelled" ? "c" : "l"}`
  const sub = subs.find((s) => keyOf(s) === selected) ?? subs[0]
  const readOnly = tenant.status !== "active"
  const canProvision = !readOnly && productCatalog.some((p) => p.available && !subs.some((s) => s.product === p.id && s.status !== "cancelled"))

  if (!sub) {
    return (
      <Card>
        <EmptyState
          icon={<Package />}
          title="No products provisioned"
          description={readOnly ? "This tenancy never had a product." : "Give this tenancy a product. Its plan sets licences, renewal and the product's feature flags."}
          action={canProvision ? <Button onClick={() => setProvisioning(true)}><Plus aria-hidden /> Provision product</Button> : undefined}
          className="py-12"
        />
        <ProvisionProductDialog tenant={tenant} open={provisioning} onClose={() => setProvisioning(false)} />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-gutter">
      {subs.length > 1 || canProvision ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          {subs.length > 1 ? (
            <Field className="w-80">
              <FieldLabel>Subscription</FieldLabel>
              <FieldControl>
                <ChoiceSelect
                  value={keyOf(sub)}
                  onChange={setSelected}
                  options={subs.map((s) => ({ value: keyOf(s), label: `${productName(s.product)} ${s.version}`, detail: s.status === "cancelled" ? "Cancelled" : s.status === "suspended" ? "Suspended" : "Active" }))}
                />
              </FieldControl>
            </Field>
          ) : <span />}
          {canProvision ? <Button variant="outline" onClick={() => setProvisioning(true)}><Plus aria-hidden /> Provision product</Button> : null}
        </div>
      ) : null}

      <SummaryCard tenant={tenant} sub={sub} readOnly={readOnly} />
      {sub.status !== "cancelled" && !readOnly ? (
        <ConfigCard key={`${sub.product}-${sub.updated}`} tenant={tenant} sub={sub} />
      ) : null}
      <ProvisionProductDialog tenant={tenant} open={provisioning} onClose={() => setProvisioning(false)} />
    </div>
  )
}

function SummaryCard({ tenant, sub, readOnly }: { tenant: Tenant; sub: Subscription; readOnly: boolean }) {
  const [versioning, setVersioning] = useState(false)
  const [confirmSuspend, setConfirmSuspend] = useState(false)
  const live = sub.status !== "cancelled" && !readOnly
  return (
    <Card>
      <CardHeader>
        <CardHeaderText>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {productName(sub.product)} <StatusBadge status={sub.status} />
            {sub.trial ? <TrialBadge /> : null}
            {sub.status !== "cancelled" ? <SyncBadge sync={sub.sync} /> : null}
          </CardTitle>
          <CardDescription><Mono>{sub.version}</Mono> · {sub.plan}</CardDescription>
        </CardHeaderText>
        {live ? (
          <CardAction>
            {sub.status === "suspended" ? (
              <Button size="sm" onClick={() => { updateSubscription(tenant.id, sub.product, { status: "active" }, "subscription.resumed"); toast({ title: `${productName(sub.product)} resumed`, description: `${tenant.name}'s users can use it again.` }) }}>
                <Play aria-hidden /> Resume
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setConfirmSuspend(true)}><Pause aria-hidden /> Suspend</Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="More subscription actions"><MoreHorizontal aria-hidden /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => { updateSubscription(tenant.id, sub.product, { sync: "in-sync" }, "subscription.resynced"); toast({ title: "Resync requested", description: "The plan's flags and licences were written again." }) }}>
                  <RefreshCw aria-hidden /> Resync plan
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setVersioning(true)}><Tag aria-hidden /> Change version</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {sub.sync === "failed" && sub.status !== "cancelled" ? (
          <Alert variant="destructive">
            <AlertTitle>The last sync failed</AlertTitle>
            <AlertDescription>The tenant may be running on old flag values. Resync the plan from the menu.</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-6 sm:grid-cols-2 @3xl:grid-cols-4">
          <Usage label="Admin licences" used={tenant.admins.filter((a) => a.status !== "inactive").length} total={sub.adminLicenses} />
          <Usage label="Widget licences" used={sub.widgetsUsed} total={sub.widgetLicenses} />
          <Stat label="Provisioned" value={fmtDate(sub.provisioned)} />
          <Stat label={sub.status === "cancelled" ? "Ended" : "Renews"} value={fmtDate(sub.expiry)} hint={sub.status === "cancelled" ? undefined : `${remaining(sub.expiry)} left`} />
        </div>
      </CardContent>

      <VersionDialog tenant={tenant} sub={sub} open={versioning} onClose={() => setVersioning(false)} />
      <Dialog open={confirmSuspend} onOpenChange={setConfirmSuspend}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend {productName(sub.product)} for {tenant.name}?</DialogTitle>
            <DialogDescription>Users lose access to {productName(sub.product)} until it's resumed. The plan, licences and data are kept.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSuspend(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              updateSubscription(tenant.id, sub.product, { status: "suspended" }, "subscription.suspended")
              toast({ title: `${productName(sub.product)} suspended`, variant: "warning" })
              setConfirmSuspend(false)
            }}>Suspend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-body-sm text-content-neutral-muted">{label}</span>
      <span className="text-label-md text-content-neutral-emphasis">{value}{hint ? <span className="text-content-neutral-muted"> · {hint}</span> : null}</span>
    </div>
  )
}

function VersionDialog({ tenant, sub, open, onClose }: { tenant: Tenant; sub: Subscription; open: boolean; onClose: () => void }) {
  const [v, setV] = useState(sub.version)
  const versions = productCatalog.find((p) => p.id === sub.product)?.versions ?? []
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change {productName(sub.product)} version</DialogTitle>
          <DialogDescription>{tenant.name} is on {sub.version}. The new version rolls out on the next sync.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ChoiceSelect value={v} onChange={setV} aria-label="Version" options={versions.map((x) => ({ value: x, label: x, detail: x === LATEST_VERSION ? "Latest" : x === sub.version ? "Current" : undefined }))} />
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={v === sub.version} onClick={() => {
            updateSubscription(tenant.id, sub.product, { version: v, sync: "pending" }, "subscription.version.updated")
            toast({ title: "Version updated", description: `${tenant.name} moves to ${v}.` })
            onClose()
          }}>Update version</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type Draft = Pick<Subscription, "adminLicenses" | "widgetLicenses" | "billing" | "trial" | "widgetExperience"> & { expiry: Date; flags: Record<string, FlagValue> }

function ConfigCard({ tenant, sub }: { tenant: Tenant; sub: Subscription }) {
  const initial: Draft = {
    adminLicenses: sub.adminLicenses, widgetLicenses: sub.widgetLicenses, billing: sub.billing, trial: sub.trial,
    widgetExperience: sub.widgetExperience, expiry: new Date(sub.expiry), flags: { ...sub.flags },
  }
  const [d, setD] = useState<Draft>(initial)
  const changes = [
    d.adminLicenses !== initial.adminLicenses, d.widgetLicenses !== initial.widgetLicenses, d.billing !== initial.billing,
    d.trial !== initial.trial, d.widgetExperience !== initial.widgetExperience, d.expiry.getTime() !== initial.expiry.getTime(),
    ...clarionPlanFlags.map((k) => d.flags[k] !== initial.flags[k]),
  ].filter(Boolean).length
  const activeAdmins = tenant.admins.filter((a) => a.status !== "inactive").length
  const tooFewAdmins = d.adminLicenses < activeAdmins
  const tooFewWidgets = d.widgetLicenses < sub.widgetsUsed
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))
  const setFlag = (k: string, v: FlagValue) => setD((x) => ({ ...x, flags: { ...x.flags, [k]: v } }))

  return (
    <Card>
      <CardHeader>
        <CardHeaderText>
          <CardTitle>Plan configuration</CardTitle>
          <CardDescription>Licences, renewal and the flags this plan writes. Nothing changes for {tenant.name} until you save.</CardDescription>
        </CardHeaderText>
      </CardHeader>
      <CardContent className="gap-6">
        <div className="grid gap-4 @3xl:grid-cols-2">
          <Field invalid={tooFewAdmins}>
            <FieldLabel>Admin licences</FieldLabel>
            <FieldControl><NumberInput value={d.adminLicenses} onValueChange={(v) => set("adminLicenses", v ?? 1)} min={1} max={100} /></FieldControl>
            <FieldDescription>{tooFewAdmins ? `${activeAdmins} admins are active or invited. Deactivate some first.` : `${activeAdmins} in use.`}</FieldDescription>
          </Field>
          <Field invalid={tooFewWidgets}>
            <FieldLabel>Widget licences</FieldLabel>
            <FieldControl><NumberInput value={d.widgetLicenses} onValueChange={(v) => set("widgetLicenses", v ?? 1)} min={1} max={100000} step={50} /></FieldControl>
            <FieldDescription>{tooFewWidgets ? `${sub.widgetsUsed.toLocaleString()} widgets already use a licence.` : `${sub.widgetsUsed.toLocaleString()} in use.`}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Billing cycle</FieldLabel>
            <FieldControl><ChoiceSelect value={d.billing} onChange={(v) => set("billing", v)} options={[{ value: "annual", label: "Annual" }, { value: "monthly", label: "Monthly" }]} /></FieldControl>
          </Field>
          <Field>
            <FieldLabel>Expiry date</FieldLabel>
            <DatePicker value={d.expiry} onValueChange={(v) => v && set("expiry", v)} />
          </Field>
          <Field>
            <FieldLabel help="clarion-widget-ui-enabled">Widget experience</FieldLabel>
            <FieldControl>
              <ChoiceSelect value={d.widgetExperience} onChange={(v) => set("widgetExperience", v)} options={[
                { value: "interactive", label: "Interactive", detail: "UI on the endpoint" },
                { value: "passive", label: "Passive", detail: "Telemetry only" },
              ]} />
            </FieldControl>
          </Field>
          <div className="flex items-end pb-2">
            <FieldOption control={<Switch checked={d.trial} onCheckedChange={(c) => set("trial", c)} />}>
              Trial
            </FieldOption>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-1">
          <h3 className="text-heading-xs text-content-neutral-emphasis">Plan feature flags</h3>
          <p className="text-body-sm text-content-neutral-muted">Written to this tenant on save. Tenant overrides on the Feature flags tab can't change these.</p>
        </div>
        <ul className="flex flex-col">
          {clarionPlanFlags.map((k) => {
            const def = flagDef(k)!
            const v = d.flags[k]
            return (
              <li key={k} className="flex min-h-11 items-center justify-between gap-4 border-b border-line-neutral-muted py-1 last:border-b-0">
                <span className="inline-flex min-w-0 items-center gap-1">
                  <Mono className="truncate">{k}</Mono>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label={`About ${k}`} className="inline-flex size-4 cursor-help items-center justify-center rounded-full text-content-neutral-subtle outline-none hover:text-content-neutral-emphasis focus-visible:ring-2 focus-visible:ring-line-focused">
                        <Info aria-hidden className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-72">{def.description}</TooltipContent>
                  </Tooltip>
                  {v !== initial.flags[k] ? <span className="text-body-xs text-content-primary-emphasis">Changed</span> : null}
                </span>
                {def.type === "boolean" ? (
                  <Switch checked={v === true} onCheckedChange={(c) => setFlag(k, c)} aria-label={k} />
                ) : (
                  <NumberInput size="sm" groupClassName="w-36" value={Number(v)} onValueChange={(n) => setFlag(k, n ?? 0)} min={1} max={3650} aria-label={k} />
                )}
              </li>
            )
          })}
        </ul>
      </CardContent>
      <CardFooter className="sticky bottom-0 justify-between border-t border-line-neutral-muted bg-surface-card pt-4">
        <span className="text-body-sm text-content-neutral-muted" aria-live="polite">
          {changes ? `${changes} unsaved change${changes === 1 ? "" : "s"}` : "No unsaved changes"}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" disabled={!changes} onClick={() => setD(initial)}>Discard</Button>
          <Button disabled={!changes || tooFewAdmins || tooFewWidgets} onClick={() => {
            updateSubscription(tenant.id, sub.product as ProductId, {
              adminLicenses: d.adminLicenses, widgetLicenses: d.widgetLicenses, billing: d.billing, trial: d.trial,
              plan: d.trial ? "Clarion Trial" : "Clarion Enterprise", widgetExperience: d.widgetExperience,
              expiry: d.expiry.toISOString(), flags: d.flags, sync: "pending",
            }, "subscription.updated")
            toast({ title: "Plan saved", description: `${changes} change${changes === 1 ? "" : "s"} syncing to ${tenant.name}.` })
          }}>Save changes</Button>
        </div>
      </CardFooter>
    </Card>
  )
}
