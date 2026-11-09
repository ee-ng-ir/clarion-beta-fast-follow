import { useState } from "react"
import { Download, Save } from "lucide-react"
import {
  Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Field, FieldControl, FieldDescription, FieldLabel, Input,
} from "@ir/ui"
import { toast } from "@/components/ui/toast"
import { saveDashboard, type DashId } from "./store"

/** Save (name it, keep the filters and range) and Export CSV, at the right of each dashboard's filter bar. */
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
      <Button variant="outline" size="sm" onClick={onExport}><Download aria-hidden />Export CSV</Button>
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
