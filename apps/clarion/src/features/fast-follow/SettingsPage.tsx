import { useCallback, useEffect, useState } from "react"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@ir/ui"
import { clearSettingsTab, setLeaveGuard, takeSettingsTab } from "./navigator"
import { AlertsSection } from "./settings/AlertsSection"
import { NotificationsSection } from "./settings/NotificationsSection"
import { ApprovedHeadsetsSection } from "./settings/ApprovedHeadsetsSection"
import { ThresholdsSection } from "./settings/ThresholdsSection"

/**
 * Settings: the top-level home for everything an IT Admin configures in Clarion.
 * One row of tabs, like User management: no second menu inside Settings (the PO
 * found the side menu under the main sidebar too deep, 11 Nov). Alerts = which
 * alerts are on; Thresholds = the numbers that raise them; Notifications = where
 * alerts go (email now, push and ITSM later); Approved headsets.
 * One pattern throughout (D9): each tab is a form — change things, then Save.
 * Leaving a tab, or Settings itself, with unsaved changes asks first.
 */
const TABS = [
  { value: "alerts", label: "Alerts" },
  { value: "thresholds", label: "Thresholds" },
  { value: "notifications", label: "Notifications" },
  { value: "devices", label: "Approved headsets" },
]

export function SettingsPage() {
  const [tab, setTab] = useState(() => takeSettingsTab() ?? "alerts")
  const [dirty, setDirty] = useState(false)
  useEffect(() => clearSettingsTab(), [])
  // what's waiting on "Discard unsaved changes?": another tab, or another page
  const [pending, setPending] = useState<{ tab: string } | { proceed: () => void } | null>(null)
  const onDirtyChange = useCallback((d: boolean) => setDirty(d), [])
  // Thresholds' "Turn on in Alerts" opens Alerts on that alert's tile
  const [focusAlert, setFocusAlert] = useState<string | null>(null)
  const clearFocus = useCallback(() => setFocusAlert(null), [])

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
        {/* sticky, so the tabs stay one click away on a long tab */}
        <TabsList aria-label="Settings sections" className="sticky -top-4 z-20 -mt-4 bg-surface-app pt-4">
          {TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="alerts"><AlertsSection focus={focusAlert} onFocused={clearFocus} /></TabsContent>
        <TabsContent value="thresholds"><ThresholdsSection onDirtyChange={onDirtyChange} onOpenAlert={(id) => { setFocusAlert(id); go("alerts") }} /></TabsContent>
        <TabsContent value="notifications"><NotificationsSection onDirtyChange={onDirtyChange} /></TabsContent>
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
