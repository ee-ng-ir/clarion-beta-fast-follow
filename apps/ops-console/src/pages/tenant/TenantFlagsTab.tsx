import { useMemo, useState } from "react"
import { Flag, Info, Plus } from "lucide-react"
import {
  Badge, Button, Card, CardAction, CardDescription, CardHeader, CardHeaderText, CardTitle,
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, EmptyState,
  Field, FieldControl, FieldDescription, FieldLabel, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Tooltip, TooltipContent, TooltipTrigger,
} from "@ir/ui"
import { FlagEditor, FlagEditorInline, FlagValueView } from "@/components/FlagControl"
import { ChoiceSelect, Mono, SearchField } from "@/components/ui"
import { toast } from "@/lib/toast"
import { flagDef, productName, type FlagValue } from "@/data/catalog"
import { addableFlags, defaultFor, effectiveFlags, setOverride, useOps, type EffectiveFlag } from "@/data/store"
import type { Tenant } from "@/data/tenants"

const SOURCE = {
  global: { label: "Global", color: "neutral" },
  subscription: { label: "Plan", color: "info" },
  tenant: { label: "Tenant", color: "warning" },
} as const

export function TenantFlagsTab({ tenant, onTab }: { tenant: Tenant; onTab: (t: string) => void }) {
  const globals = useOps((s) => s.globalFlags)
  const flags = useMemo(() => effectiveFlags(tenant, globals), [tenant, globals])
  const [q, setQ] = useState("")
  const [adding, setAdding] = useState(false)
  const readOnly = tenant.status !== "active"
  const rows = flags.filter((f) => !q || f.key.includes(q.trim().toLowerCase()))

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardHeaderText>
          <CardTitle>Feature flags</CardTitle>
          <CardDescription>
            What applies to this tenant, and where it comes from. A tenant override beats the global default.
            Plan values are set by the product subscription, so they're changed on Products.
          </CardDescription>
        </CardHeaderText>
        {!readOnly ? <CardAction><Button size="sm" variant="outline" onClick={() => setAdding(true)}><Plus aria-hidden /> Add override</Button></CardAction> : null}
      </CardHeader>
      <div className="flex items-center justify-between gap-3 px-6 py-4">
        <SearchField value={q} onChange={setQ} placeholder="Search flags" size="sm" />
        <span className="text-body-sm text-content-neutral-muted">{rows.length} of {flags.length}</span>
      </div>
      {rows.length === 0 ? (
        <EmptyState size="sm" icon={<Flag />} title="No flags match" description="Try part of the key, like “ingest”." className="pb-10" />
      ) : (
        <Table size="sm">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead align="start">Flag</TableHead>
              <TableHead align="start">Type</TableHead>
              <TableHead align="start">Set by</TableHead>
              <TableHead align="start">Value</TableHead>
              <TableHead align="start">Tenant override</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((f) => <FlagRow key={f.key} f={f} tenant={tenant} readOnly={readOnly} onTab={onTab} />)}
          </TableBody>
        </Table>
      )}
      <AddOverrideDialog tenant={tenant} globals={globals} open={adding} onClose={() => setAdding(false)} />
    </Card>
  )
}

function FlagRow({ f, tenant, readOnly, onTab }: { f: EffectiveFlag; tenant: Tenant; readOnly: boolean; onTab: (t: string) => void }) {
  const commit = (v: FlagValue) => {
    setOverride(tenant.id, f.key, v)
    toast({ title: "Override saved", description: `${f.key} = ${String(v)} for ${tenant.name}` })
  }
  return (
    <TableRow className="last:border-b-0">
      <TableCell>
        <span className="inline-flex items-center gap-1">
          <Mono>{f.key}</Mono>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label={`About ${f.key}`} className="inline-flex size-4 cursor-help items-center justify-center rounded-full text-content-neutral-subtle outline-none hover:text-content-neutral-emphasis focus-visible:ring-2 focus-visible:ring-line-focused">
                <Info aria-hidden className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-72">{f.description}</TooltipContent>
          </Tooltip>
        </span>
      </TableCell>
      <TableCell className="text-content-neutral-muted">{f.type}</TableCell>
      <TableCell>
        <Badge color={SOURCE[f.decidedBy].color} variant="subtle">
          {f.decidedBy === "subscription" && f.subscription ? `${productName(f.subscription)} plan` : SOURCE[f.decidedBy].label}
        </Badge>
      </TableCell>
      <TableCell><FlagValueView value={f.value} /></TableCell>
      <TableCell>
        {f.decidedBy === "subscription" ? (
          <Button variant="link" size="sm" onClick={() => onTab("products")}>Change on Products</Button>
        ) : readOnly ? (
          <span className="text-content-neutral-subtle">{f.override !== undefined ? "Overridden" : "Inherited"}</span>
        ) : f.override !== undefined ? (
          <div className="flex items-center gap-2">
            <FlagEditor type={f.type} value={f.override} onCommit={commit} label={`${f.key} override`} />
            <Button variant="ghost" size="sm" onClick={() => {
              setOverride(tenant.id, f.key, undefined)
              toast({ title: "Override removed", description: f.global !== undefined ? `${f.key} falls back to the global default (${String(f.global)}).` : `${f.key} no longer applies to ${tenant.name}.` })
            }}>Remove</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <FlagEditor type={f.type} value={f.value} onCommit={commit} label={`Override ${f.key}`} />
            <span className="text-body-xs text-content-neutral-subtle">Inherited</span>
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}

function AddOverrideDialog({ tenant, globals, open, onClose }: { tenant: Tenant; globals: Record<string, FlagValue>; open: boolean; onClose: () => void }) {
  const options = addableFlags(tenant, globals)
  const [key, setKey] = useState<string | undefined>()
  const [value, setValue] = useState<FlagValue>(false)
  const def = key ? flagDef(key) : undefined
  const close = () => { setKey(undefined); setValue(false); onClose() }
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close() }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Add a tenant override</DialogTitle>
          <DialogDescription>Writes targeting[{tenant.id}] for a flag that doesn't apply to {tenant.name} yet.</DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-4">
          {options.length === 0 ? (
            <p className="text-body-md text-content-neutral-muted">Every registered flag already applies to this tenant. Change its value in the table instead.</p>
          ) : (
            <>
              <Field>
                <FieldLabel>Flag</FieldLabel>
                <FieldControl>
                  <ChoiceSelect value={key} placeholder="Choose a flag" onChange={(k) => { setKey(k); setValue(defaultFor(k)) }} options={options.map((o) => ({ value: o.key, label: <Mono>{o.key}</Mono>, detail: o.type }))} />
                </FieldControl>
                {def ? <FieldDescription>{def.description}</FieldDescription> : null}
              </Field>
              {def ? (
                <Field>
                  <FieldLabel>Value</FieldLabel>
                  <FlagEditorInline type={def.type} value={value} onChange={setValue} />
                </Field>
              ) : null}
            </>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button disabled={!key} onClick={() => {
            if (!key) return
            setOverride(tenant.id, key, value)
            toast({ title: "Override added", description: `${key} = ${String(value)} for ${tenant.name}` })
            close()
          }}>Add override</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

