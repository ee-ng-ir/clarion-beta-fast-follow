import { useState } from "react"
import {
  Button, DatePicker, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Field, FieldControl, FieldLabel, NumberInput, SegmentedControl, SegmentedControlItem,
} from "@ir/ui"
import { ChoiceSelect } from "@/components/ui"
import { toast } from "@/lib/toast"
import { NOW } from "@/lib/format"
import { defaultPlanFlags, latestVersion, productCatalog, productDef, type ProductId } from "@/data/catalog"
import { provisionProduct } from "@/data/store"
import type { Tenant } from "@/data/tenants"

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)

export function ProvisionProductDialog({ tenant, open, onClose, onDone }: {
  tenant: Tenant; open: boolean; onClose: () => void; onDone?: () => void
}) {
  const options = productCatalog.map((p) => {
    const has = tenant.subscriptions.some((s) => s.product === p.id && s.status !== "cancelled")
    return { value: p.id, label: p.name, disabled: !p.available || has, detail: has ? "Provisioned" : !p.available ? "Not released" : undefined }
  })
  const first = options.find((o) => !o.disabled)?.value
  const [product, setProduct] = useState<ProductId | undefined>(first)
  const [kind, setKind] = useState<"plan" | "trial">("plan")
  const start = first ? productDef(first) : undefined
  const [version, setVersion] = useState(first ? latestVersion(first) : "")
  const [admins, setAdmins] = useState<number | null>(start?.defaults.admins ?? 5)
  const [widgets, setWidgets] = useState<number | null>(start?.defaults.units ?? 500)
  const [billing, setBilling] = useState<"annual" | "monthly">("annual")
  const [expiry, setExpiry] = useState<Date | undefined>(addDays(NOW, 365))

  /** Picking a product or a plan type resets the numbers to that plan's defaults. */
  const applyDefaults = (p: ProductId | undefined, k: "plan" | "trial") => {
    if (!p) return
    const def = productDef(p)
    setVersion(latestVersion(p))
    if (k === "trial") { setAdmins(2); setWidgets(def.defaults.trialUnits); setBilling("monthly"); setExpiry(addDays(NOW, 30)) }
    else { setAdmins(def.defaults.admins); setWidgets(def.defaults.units); setBilling("annual"); setExpiry(addDays(NOW, 365)) }
  }
  const def = product ? productDef(product) : undefined
  const versions = def?.versions ?? []
  const ok = !!product && !!admins && !!widgets && !!expiry

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Provision a product</DialogTitle>
          <DialogDescription>Creates the subscription, writes the plan's feature flags and starts the product for {tenant.name}.</DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-4">
          <Field>
            <FieldLabel>Product</FieldLabel>
            <FieldControl><ChoiceSelect value={product} onChange={(p) => { setProduct(p); applyDefaults(p, kind) }} options={options} placeholder="Choose a product" /></FieldControl>
          </Field>
          <Field>
            <FieldLabel>Plan</FieldLabel>
            <SegmentedControl
              value={kind}
              aria-label="Plan"
              onValueChange={(v) => {
                setKind(v as "plan" | "trial")
                applyDefaults(product, v as "plan" | "trial")
              }}
            >
              <SegmentedControlItem value="plan">{def?.plans.full.replace(`${def.name} `, "") ?? "Full plan"}</SegmentedControlItem>
              <SegmentedControlItem value="trial">Trial</SegmentedControlItem>
            </SegmentedControl>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Admin licences</FieldLabel>
              <FieldControl><NumberInput value={admins} onValueChange={setAdmins} min={1} max={100} /></FieldControl>
            </Field>
            <Field>
              <FieldLabel>{def?.unit.label ?? "Licences"}</FieldLabel>
              <FieldControl><NumberInput value={widgets} onValueChange={setWidgets} min={1} max={100000} step={def?.defaults.step ?? 10} /></FieldControl>
            </Field>
            <Field>
              <FieldLabel>Billing cycle</FieldLabel>
              <FieldControl>
                <ChoiceSelect value={billing} onChange={setBilling} options={[{ value: "annual", label: "Annual" }, { value: "monthly", label: "Monthly" }]} />
              </FieldControl>
            </Field>
            <Field>
              <FieldLabel>Expiry date</FieldLabel>
              <DatePicker value={expiry} onValueChange={setExpiry} />
            </Field>
          </div>
          <Field>
            <FieldLabel>Version</FieldLabel>
            <FieldControl><ChoiceSelect value={version} onChange={setVersion} options={versions.map((v) => ({ value: v, label: v, detail: v === versions[0] ? "Latest" : undefined }))} /></FieldControl>
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!ok}
            onClick={() => {
              if (!product || !def || !admins || !widgets || !expiry) return
              const now = new Date().toISOString()
              provisionProduct(tenant.id, {
                product, version, plan: kind === "trial" ? def.plans.trial : def.plans.full, status: "active", trial: kind === "trial",
                sync: "pending", provisioned: now, updated: now, expiry: expiry.toISOString(), billing,
                adminLicenses: admins, units: widgets, unitsUsed: 0,
                widgetExperience: product === "clarion" ? "interactive" : undefined, flags: defaultPlanFlags(product),
              })
              toast({ title: "Product provisioned", description: `${def.name} is syncing to ${tenant.name}.` })
              onClose()
              onDone?.()
            }}
          >
            Provision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
