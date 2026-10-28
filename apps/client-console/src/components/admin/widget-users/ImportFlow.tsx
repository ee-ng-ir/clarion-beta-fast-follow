import { useEffect, useMemo, useState } from "react"
import {
  Alert, AlertDescription, AlertTitle, Badge, Button,
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Field, FieldControl, FieldLabel, FileUpload,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import { toast } from "@/components/ui/toast"
import { TEMPLATE_CSV, applyPlan, downloadText, planImport, samples, type PlanRow } from "@ir/mock-data/widget-users"

const fmt = (n: number) => n.toLocaleString()

/**
 * Import does one thing: add new people and update people already on the list.
 * It never takes anyone off — that happens in the table (filter, select, deactivate).
 * So a bad row is simply skipped: nobody disappears because of it.
 */
export function ImportFlow({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [text, setText] = useState<string | null>(null)
  useEffect(() => { if (open) setText(null) }, [open])

  const plan = useMemo(() => (text != null ? planImport(text) : null), [text])
  const changes = plan ? plan.counts.new + plan.counts.update : 0
  const problems = plan ? plan.rows.filter((r) => r.kind === "invalid" || r.kind === "duplicate") : []
  const listed: PlanRow[] = plan ? [...problems, ...plan.rows.filter((r) => r.kind === "new" || r.kind === "update")] : []

  const apply = () => {
    if (!plan || text == null) return
    const s = applyPlan(plan, text)
    const parts = [s.added && `${fmt(s.added)} added`, s.updated && `${fmt(s.updated)} updated`].filter(Boolean)
    toast({ title: parts.length ? `Imported: ${parts.join(", ")}.` : "Nothing to change.", description: s.skipped ? `${fmt(s.skipped)} rows skipped.` : undefined })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size={plan ? "lg" : "sm"}>
        <DialogHeader>
          <DialogTitle>Import users</DialogTitle>
          <DialogDescription>Adds new login IDs and updates people already on the list, including their location. Nobody is removed.</DialogDescription>
        </DialogHeader>

        <DialogBody className="max-h-[68vh] gap-4 overflow-y-auto">
          <Field>
            <FieldLabel>CSV file</FieldLabel>
            <FieldControl><FileUpload accept=".csv,text/csv" onFilesChange={async (fs) => { if (fs[0]) setText(await fs[0].text()) }} /></FieldControl>
          </Field>
          <div className="flex gap-3 text-body-sm">
            <button type="button" className="text-content-link-default hover:underline" onClick={() => downloadText("clarion-widget-users-template.csv", TEMPLATE_CSV)}>Download template</button>
            {/* prototype only */}
            <button type="button" className="text-content-neutral-muted hover:underline" onClick={() => setText(samples.addUpdate())}>Use a test file</button>
          </div>

          {plan && (
            <>
              {plan.blocking.length > 0 ? (
                plan.blocking.map((b) => <Alert key={b} variant="destructive" role="alert"><AlertTitle>{b}</AlertTitle></Alert>)
              ) : (
                <p className="text-body-md text-content-neutral-emphasis">
                  <strong>{fmt(plan.counts.new)}</strong> new, <strong>{fmt(plan.counts.update)}</strong> updated
                  {problems.length > 0 && <>, <strong className="text-content-danger-emphasis">{fmt(problems.length)}</strong> can't be imported and will be skipped</>}.
                  {plan.counts.unchanged > 0 && <span className="text-content-neutral-muted"> {fmt(plan.counts.unchanged)} already match.</span>}
                </p>
              )}

              {plan.lookalikes > 0 && (
                <Alert variant="warning">
                  <AlertTitle>{fmt(plan.lookalikes)} new login {plan.lookalikes === 1 ? "ID looks" : "IDs look"} like someone already on the list</AlertTitle>
                  <AlertDescription>They'll be added as separate people and use a licence each. Marked below.</AlertDescription>
                </Alert>
              )}

              {listed.length > 0 && (
                <div className="max-h-72 overflow-y-auto rounded-lg border border-line-neutral-muted">
                  <Table size="sm">
                    <TableHeader>
                      <TableRow><TableHead>Login ID</TableHead><TableHead>Name</TableHead><TableHead>What happens</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {listed.slice(0, 200).map((r) => (
                        <TableRow key={`${r.row}-${r.loginId}`}>
                          <TableCell className="max-w-52 truncate font-mono text-body-sm">{r.loginId || `Row ${r.row}`}</TableCell>
                          <TableCell className="max-w-40 truncate">{r.name || "—"}</TableCell>
                          <TableCell><Outcome r={r} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!plan || !!plan.blocking.length || changes === 0} onClick={apply}>
            {plan && changes > 0 ? `Import ${fmt(changes)} ${changes === 1 ? "change" : "changes"}` : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Outcome({ r }: { r: PlanRow }) {
  if (r.kind === "new") return (
    <div className="flex flex-col gap-1">
      <Badge color="success" className="self-start">New</Badge>
      {r.lookalike && <span className="text-body-sm text-content-warning-emphasis">Looks like <span className="font-mono">{r.lookalike}</span></span>}
      {r.note && <span className="text-body-sm text-content-warning-emphasis">Imported, but {r.note}</span>}
    </div>
  )
  if (r.kind === "update") return (
    <div className="flex flex-col gap-0.5 text-body-sm">
      {r.changes?.map((c) => (
        <span key={c.field} className="text-content-neutral-muted">
          {c.field}: <s>{c.from || "blank"}</s> → <span className="text-content-neutral-emphasis">{c.to}</span>
        </span>
      ))}
      {r.note && <span className="text-content-warning-emphasis">{r.note}</span>}
    </div>
  )
  return <span className="text-body-sm text-content-danger-emphasis">Skipped — {r.reason}</span>
}
