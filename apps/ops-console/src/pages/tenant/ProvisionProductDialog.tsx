import { useState } from "react"
import {
  Button, DatePicker, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Field, FieldControl, FieldLabel, NumberInput, SegmentedControl, SegmentedControlItem,
} from "@ir/ui"
import { ChoiceSelect } from "@/components/ui"
import { toast } from "@/lib/toast"
import { NOW } from "@/lib/format"
import { LATEST_VERSION, defaultPlanFlags, productCatalog, type ProductId } from "@/data/catalog"
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
  const [version, setVersion] = useState(LATEST_VERSION)
  const [admins, setAdmins] = useState<number | null>(5)
  const [widgets, setWidgets] = useState<number | null>(500)
  const [billing, setBilling] = useState<"annual" | "monthly">("annual")
  const [expiry, setExpiry] = useState<Date | undefined>(addDays(NOW, 365))

  const versions = productCatalog.find((p) => p.id === product)?.versions ?? []
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
            <FieldControl><ChoiceSelect value={product} onChange={setProduct} options={options} placeholder="Choose a product" /></FieldControl>
          </Field>
          <Field>
            <FieldLabel>Plan</FieldLabel>
            <SegmentedControl
              value={kind}
              aria-label="Plan"
              onValueChange={(v) => {
                setKind(v as "plan" | "trial")
                if (v === "trial") { setAdmins(2); setWidgets(50); setBilling("monthly"); setExpiry(addDays(NOW, 30)) }
                else { setAdmins(5); setWidgets(500); setBilling("annual"); setExpiry(addDays(NOW, 365)) }
              }}
            >
              <SegmentedControlItem value="plan">Enterprise</SegmentedControlItem>
              <SegmentedControlItem value="trial">Trial</SegmentedControlItem>
            </SegmentedControl>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Admin licences</FieldLabel>
              <FieldControl><NumberInput value={admins} onValueChange={setAdmins} min={1} max={100} /></FieldControl>
            </Field>
            <Field>
              <FieldLabel>Widget licences</FieldLabel>
              <FieldControl><NumberInput value={widgets} onValueChange={setWidgets} min={1} max={100000} step={50} /></FieldControl>
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
            <FieldControl><ChoiceSelect value={version} onChange={setVersion} options={versions.map((v) => ({ value: v, label: v, detail: v === LATEST_VERSION ? "Latest" : undefined }))} /></FieldControl>
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!ok}
            onClick={() => {
              if (!product || !admins || !widgets || !expiry) return
              const now = new Date().toISOString()
              provisionProduct(tenant.id, {
                product, version, plan: kind === "trial" ? "Clarion Trial" : "Clarion Enterprise", status: "active", trial: kind === "trial",
                sync: "pending", provisioned: now, updated: now, expiry: expiry.toISOString(), billing,
                adminLicenses: admins, widgetLicenses: widgets, widgetsUsed: 0, widgetExperience: "interactive", flags: defaultPlanFlags(),
              })
              toast({ title: "Product provisioned", description: `Clarion is syncing to ${tenant.name}.` })
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
