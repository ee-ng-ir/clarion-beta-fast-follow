import { useState } from "react"
import { ChevronDown, Download, Save } from "lucide-react"
import {
  Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Field, FieldControl, FieldDescription, FieldLabel, Input,
} from "@ir/ui"
import { toast } from "@/components/ui/toast"
import { saveDashboard, type DashId } from "./store"

/**
 * Export, with the format chosen from a menu (as in the PO's Reporting prototype).
 * The label stays generic: CSV is the only format for now, and image is listed
 * but not available, so the format is open to what customers turn out to need.
 * Requested by the PO, 11 Nov.
 */
export function ExportMenu({ onCsv, label = "Export" }: { onCsv: () => void; label?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm"><Download aria-hidden />{label}<ChevronDown aria-hidden /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={onCsv}>CSV</DropdownMenuItem>
        <DropdownMenuItem disabled>Image (PNG) · not available yet</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Save (name it, keep the filters and range) and Export, at the right of each dashboard's filter bar. */
export function DashboardActions({ view, suggestedName, onExport }: { view: DashId; suggestedName: string; onExport: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const start = () => { setName(suggestedName); setOpen(true) }
  const save = () => {
    const n = name.trim()
    if (!n) return
    saveDashboard(view, n)
    setOpen(false)
    toast({ title: `Saved "${n}"`, description: "Find it under Saved dashboards.", variant: "success" })
  }
  return (
    <div className="flex shrink-0 items-center gap-2">
      <ExportMenu onCsv={onExport} />
      <Button variant="outline" size="sm" onClick={start}><Save aria-hidden />Save</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={(e) => { e.preventDefault(); save() }} className="contents">
            <DialogHeader>
              <DialogTitle>Save dashboard</DialogTitle>
              <DialogDescription>Keeps this dashboard with its filters and date range, so you can open it again in one click.</DialogDescription>
            </DialogHeader>
            <DialogBody>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldControl><Input autoFocus value={name} onChange={(e) => setName(e.target.value)} /></FieldControl>
              <FieldDescription>Only you can see your saved dashboards.</FieldDescription>
            </Field>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!name.trim()}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
