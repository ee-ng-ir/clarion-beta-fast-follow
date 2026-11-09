import { useCallback, useEffect, useState } from "react"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@ir/ui"
import { NewDot } from "./ExploringTag"
import { setLeaveGuard, takeSettingsTab } from "./navigator"
import { AlertTypesSection } from "./settings/AlertTypesSection"
import { NotificationsSection } from "./settings/NotificationsSection"
import { StabilitySection } from "./settings/StabilitySection"
import { ApprovedHeadsetsSection } from "./settings/ApprovedHeadsetsSection"

/**
 * Settings: the top-level home for everything an IT Admin configures in Clarion.
 * One pattern throughout (D9): each tab is a form — change things, then Save.
 * On/off choices are checkboxes, never switches next to Save. Leaving a tab, or
 * Settings itself, with unsaved changes asks first. Hierarchy is still a draft (X2).
 * No Thresholds tab: custom thresholds aren't in this release, so every alert
 * uses IR's thresholds. If they come in, where they sit is an IA question (X2).
 */
export function SettingsPage() {
  const [tab, setTab] = useState(() => takeSettingsTab() ?? "types")
  const [dirty, setDirty] = useState(false)
  // what's waiting on "Discard unsaved changes?": another tab, or another page
  const [pending, setPending] = useState<{ tab: string } | { proceed: () => void } | null>(null)
  const onDirtyChange = useCallback((d: boolean) => setDirty(d), [])

  // leaving Settings for another page with unsaved changes asks first
  useEffect(() => {
    setLeaveGuard(dirty ? (proceed) => { setPending({ proceed }); return true } : null)
    return () => setLeaveGuard(null)
  }, [dirty])

  // closing the browser tab with unsaved changes asks too
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const go = (next: string) => {
    if (next === tab) return
    if (dirty) setPending({ tab: next })
    else setTab(next)
  }
  // leaving a tab unmounts its form, which drops its draft
  const discardAndGo = () => {
    const p = pending
    setPending(null)
    setDirty(false)
    setLeaveGuard(null)
    if (!p) return
    if ("tab" in p) setTab(p.tab)
    else p.proceed()
  }

  return (
    <>
      <Tabs value={tab} onValueChange={go} className="flex w-full flex-col gap-4">
        <TabsList aria-label="Settings sections">
          <TabsTrigger value="types">Alert types <NewDot className="ms-1.5" /></TabsTrigger>
          <TabsTrigger value="notifications">Notifications <NewDot className="ms-1.5" /></TabsTrigger>
          <TabsTrigger value="stability">Alert stability <NewDot className="ms-1.5" /></TabsTrigger>
          <TabsTrigger value="devices">Approved headsets <NewDot className="ms-1.5" /></TabsTrigger>
        </TabsList>
        <TabsContent value="types"><AlertTypesSection onDirtyChange={onDirtyChange} /></TabsContent>
        <TabsContent value="notifications"><NotificationsSection onDirtyChange={onDirtyChange} /></TabsContent>
        <TabsContent value="stability"><StabilitySection onDirtyChange={onDirtyChange} /></TabsContent>
        <TabsContent value="devices"><ApprovedHeadsetsSection onDirtyChange={onDirtyChange} /></TabsContent>
      </Tabs>

      <Dialog open={pending !== null} onOpenChange={(o) => { if (!o) setPending(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>You've changed settings on this tab without saving. Leaving now discards those changes.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>Keep editing</Button>
            <Button variant="destructive" onClick={discardAndGo}>Discard changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
