import { useCallback, useEffect, useState } from "react"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@ir/ui"
import { NewDot } from "./ExploringTag"
import { clearSettingsTab, setLeaveGuard, takeSettingsTab } from "./navigator"
import { AlertsSection } from "./settings/AlertsSection"
import { NotificationsSection } from "./settings/NotificationsSection"
import { StabilitySection } from "./settings/StabilitySection"
import { ApprovedHeadsetsSection } from "./settings/ApprovedHeadsetsSection"

/**
 * Settings: the top-level home for everything an IT Admin configures in Clarion,
 * grouped by job (canvas IA option 2): Alerting is what raises an alert, Delivery
 * is where alerts go (email now; ticketing and push later slot in here), Devices
 * is the approved headset list. Picasso's Line tabs, its pattern for
 * settings-style navigation. The Alerts page links in ("Alert settings").
 * One pattern throughout (D9): each section is a form — change things, then Save.
 * Leaving a section, or Settings itself, with unsaved changes asks first.
 */
const GROUPS: { label: string; items: { value: string; label: string; isNew?: boolean }[] }[] = [
  { label: "Alerting", items: [{ value: "alerts", label: "Alerts & thresholds", isNew: true }, { value: "stability", label: "Alert stability", isNew: true }] },
  { label: "Delivery", items: [{ value: "notifications", label: "Email", isNew: true }] },
  { label: "Devices", items: [{ value: "devices", label: "Approved headsets", isNew: true }] },
]

export function SettingsPage() {
  const [tab, setTab] = useState(() => takeSettingsTab() ?? "alerts")
  const [dirty, setDirty] = useState(false)
  useEffect(() => clearSettingsTab(), [])
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
      <div className="@container w-full">
        <Tabs value={tab} onValueChange={go} variant="line" orientation="vertical" className="flex-col gap-gutter @3xl:flex-row">
          {/* one tab list per group, so each group is named for screen readers too */}
          <nav aria-label="Settings sections" className="flex shrink-0 flex-col gap-5 self-start @3xl:sticky @3xl:top-0 @3xl:w-56">
            {GROUPS.map((g) => (
              <div key={g.label} className="flex flex-col gap-2">
                <h2 className="px-3.5 text-label-sm uppercase tracking-wide text-content-neutral-muted">{g.label}</h2>
                <TabsList aria-label={g.label}>
                  {g.items.map((i) => (
                    <TabsTrigger key={i.value} value={i.value}>{i.label}{i.isNew && <NewDot className="ms-1.5" />}</TabsTrigger>
                  ))}
                </TabsList>
              </div>
            ))}
          </nav>
          <TabsContent value="alerts" className="min-w-0"><AlertsSection onDirtyChange={onDirtyChange} /></TabsContent>
          <TabsContent value="stability" className="min-w-0"><StabilitySection onDirtyChange={onDirtyChange} /></TabsContent>
          <TabsContent value="notifications" className="min-w-0"><NotificationsSection onDirtyChange={onDirtyChange} /></TabsContent>
          <TabsContent value="devices" className="min-w-0"><ApprovedHeadsetsSection onDirtyChange={onDirtyChange} /></TabsContent>
        </Tabs>
      </div>

      <Dialog open={pending !== null} onOpenChange={(o) => { if (!o) setPending(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>You've changed settings in this section without saving. Leaving now discards those changes.</DialogDescription>
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
