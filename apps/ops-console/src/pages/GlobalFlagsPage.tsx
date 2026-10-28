import { useState } from "react"
import { Flag, Info, Plus } from "lucide-react"
import {
  Button, Card, CardDescription, CardHeader, CardHeaderText, CardTitle, Dialog, DialogBody, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, EmptyState, Field, FieldControl, FieldDescription, FieldLabel,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tooltip, TooltipContent, TooltipTrigger,
} from "@ir/ui"
import { PageTop } from "@/components/PageTop"
import { FlagEditor, FlagEditorInline, FlagValueView } from "@/components/FlagControl"
import { ChoiceSelect, Mono, SearchField } from "@/components/ui"
import { toast } from "@/lib/toast"
import { flagDef, flagDefs, type FlagValue } from "@/data/catalog"
import { defaultFor, setGlobal, useOps, useOverrideCounts } from "@/data/store"

/** targeting["*"] — the default every tenant gets unless it has its own override. */
export function GlobalFlagsPage() {
  const globals = useOps((s) => s.globalFlags)
  const counts = useOverrideCounts()
  const [q, setQ] = useState("")
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const keys = Object.keys(globals).sort().filter((k) => !q || k.includes(q.trim().toLowerCase()) || flagDef(k)?.type.includes(q.trim().toLowerCase()))

  return (
    <div className="flex flex-col gap-gutter">
      <PageTop
        title="Global feature flags"
        description={<>Platform-wide defaults (<Mono>targeting["*"]</Mono>) A default applies to every tenant without its own override.</>}
        actions={<Button onClick={() => setAdding(true)}><Plus aria-hidden /> Add global default</Button>}
      />

      <Card className="overflow-hidden">
        <CardHeader>
          <CardHeaderText>
            <CardTitle>Flags with a global default</CardTitle>
            <CardDescription>Removing a default only clears <Mono>targeting["*"]</Mono>. The flag stays registered and tenant overrides stay as they are.</CardDescription>
          </CardHeaderText>
        </CardHeader>
        <div className="px-6 py-4"><SearchField value={q} onChange={setQ} placeholder="Search by key or type" size="sm" /></div>
        {keys.length === 0 ? (
          <EmptyState size="sm" icon={<Flag />} title="No flags match" description="Try part of the key." className="pb-10" />
        ) : (
          <Table size="sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead align="start">Flag</TableHead>
                <TableHead align="start">Type</TableHead>
                <TableHead align="start">Global default</TableHead>
                <TableHead numeric>Tenant overrides</TableHead>
                <TableHead align="start">Change default</TableHead>
                <TableHead align="start" className="w-24"><span className="sr-only">Remove</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => {
                const def = flagDef(k)
                return (
                  <TableRow key={k} className="last:border-b-0">
                    <TableCell>
                      <span className="inline-flex items-center gap-1">
                        <Mono>{k}</Mono>
                        {def ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" aria-label={`About ${k}`} className="inline-flex size-4 cursor-help items-center justify-center rounded-full text-content-neutral-subtle outline-none hover:text-content-neutral-emphasis focus-visible:ring-2 focus-visible:ring-line-focused">
                                <Info aria-hidden className="size-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-72">{def.description}{def.subscription ? " Plans that set this flag take precedence." : ""}</TooltipContent>
                          </Tooltip>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-content-neutral-muted">{def?.type}</TableCell>
                    <TableCell><FlagValueView value={globals[k]} /></TableCell>
                    <TableCell numeric>{counts[k] ?? 0}</TableCell>
                    <TableCell>
                      <FlagEditor type={def?.type ?? "string"} value={globals[k]} label={`Global default for ${k}`} onCommit={(v) => {
                        setGlobal(k, v)
                        toast({ title: "Global default saved", description: `${k} = ${String(v)}${counts[k] ? `. ${counts[k]} tenant override${counts[k] === 1 ? "" : "s"} unchanged.` : "."}` })
                      }} />
                    </TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => setRemoving(k)}>Remove</Button></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={!!removing} onOpenChange={(o) => { if (!o) setRemoving(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove the global default for {removing}?</DialogTitle>
            <DialogDescription>
              Tenants without an override stop getting this flag.
              {removing && counts[removing] ? ` The ${counts[removing]} tenant override${counts[removing] === 1 ? "" : "s"} stay.` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (removing) { setGlobal(removing, undefined); toast({ title: "Global default removed", description: removing }) } setRemoving(null) }}>Remove default</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddGlobalDialog open={adding} onClose={() => setAdding(false)} existing={globals} />
    </div>
  )
}

function AddGlobalDialog({ open, onClose, existing }: { open: boolean; onClose: () => void; existing: Record<string, FlagValue> }) {
  const options = flagDefs.filter((f) => !(f.key in existing) && !f.tenantOnly)
  const [key, setKey] = useState<string | undefined>()
  const [value, setValue] = useState<FlagValue>(false)
  const def = key ? flagDef(key) : undefined
  const close = () => { setKey(undefined); setValue(false); onClose() }
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close() }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Add a global default</DialogTitle>
          <DialogDescription>Sets <Mono>targeting["*"]</Mono> for a registered flag. Every tenant without an override gets it straight away.</DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-4">
          <Field>
            <FieldLabel>Flag</FieldLabel>
            <FieldControl>
              <ChoiceSelect value={key} placeholder="Choose a registered flag" onChange={(k) => { setKey(k); setValue(defaultFor(k)) }} options={options.map((o) => ({ value: o.key, label: <Mono>{o.key}</Mono>, detail: o.type }))} />
            </FieldControl>
            {def ? <FieldDescription>{def.description}{def.subscription ? " Plans that set this flag still win for their tenants." : ""}</FieldDescription> : null}
          </Field>
          {def ? (
            <Field>
              <FieldLabel>Default value</FieldLabel>
              <FlagEditorInline type={def.type} value={value} onChange={setValue} />
            </Field>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button disabled={!key} onClick={() => { if (key) { setGlobal(key, value); toast({ title: "Global default added", description: `${key} = ${String(value)}` }) } close() }}>Add default</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
