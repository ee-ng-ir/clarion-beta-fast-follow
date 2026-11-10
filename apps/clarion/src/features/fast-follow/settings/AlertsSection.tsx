import { useEffect, useMemo, useState } from "react"
import { CircleAlert, CircleHelp, TriangleAlert } from "lucide-react"
import {
  Alert, AlertDescription, Badge, Button, Card, CardAction, CardDescription, CardHeader, CardHeaderText, CardTitle, Checkbox,
  Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle, FieldOption, SegmentedControl, SegmentedControlItem,
  Table, TableBody, TableCell, TableCol, TableColGroup, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import { endpoints } from "@/data/endpoints"
import { useViewer } from "@/lib/viewer"
import { ALERT_TYPES, categoryLabel, type AlertCategory, type AlertType } from "../alerts/catalogue"
import { classify } from "../alerts/groups"
import { alertName } from "../alerts/names"
import { saveStability, saveTypes, savedLine, useSettings, type Saved, type Stability } from "./store"
import { PRESETS } from "./stability"
import { SectionFooter } from "./SectionFooter"
import { StabilityExample } from "./StabilityExample"

const categories: AlertCategory[] = ["network", "system", "platform", "devices"]
/** Platform and device alerts have no reading that hovers around a threshold. */
const RAISED_AS_IT_HAPPENS: AlertCategory[] = ["platform", "devices"]

/**
 * Settings › Alerting › Alerts: which alerts Clarion raises, and how settled a
 * problem must be before one is raised or cleared (alert stability, anti-flapping).
 * Both shape how noisy alerts are, and both are set per category, so the
 * category heading carries its stability and the rows carry on/off.
 * The numbers that raise each alert stay on Thresholds (their own section).
 * A form like every Settings section (D9): change things, then one Save.
 * Off isn't evaluated (D10). Stability applies to the widget and Fleet-view alike.
 */
export function AlertsSection({ onEditThresholds, onDirtyChange }: { onEditThresholds: () => void; onDirtyChange?: (dirty: boolean) => void }) {
  const settings = useSettings()
  const { person } = useViewer()
  const [off, setOff] = useState<string[]>(settings.disabledTypes)
  const [stability, setStability] = useState(settings.stability)
  const [explain, setExplain] = useState(false)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const typesDirty = off.slice().sort().join() !== settings.disabledTypes.slice().sort().join()
  const stabilityDirty = JSON.stringify(stability) !== JSON.stringify(settings.stability)
  const dirty = typesDirty || stabilityDirty
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])

  // endpoints each type alerts on right now, so turning one off isn't a blind choice
  const affected = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of endpoints) if (e.status === "critical" || e.status === "warning") m.set(classify(e), (m.get(classify(e)) ?? 0) + 1)
    return m
  }, [])

  const toggle = (id: string, on: boolean) => { setConfirmation(null); setOff((cur) => (on ? cur.filter((x) => x !== id) : [...cur, id])) }
  const setCategory = (c: AlertCategory, v: Stability) => { setConfirmation(null); setStability((s) => ({ ...s, [c]: v })) }
  const save = () => {
    if (typesDirty) saveTypes(off, person.name)
    if (stabilityDirty) saveStability(stability, person.name)
    setConfirmation("Alerts saved")
  }
  const lastSaved = [settings.saved.types, settings.saved.stability].filter((s): s is Saved => !!s).sort((a, b) => b.at.getTime() - a.at.getTime())[0]

  return (
    <div className="flex w-full flex-col gap-gutter">
      {off.length > 0 && (
        <Alert variant="warning">
          <AlertDescription>
            {off.length} alert{off.length === 1 ? " is" : "s are"} off. Agents won't see {off.length === 1 ? "it" : "them"} in the widget, and no one will be emailed about {off.length === 1 ? "it" : "them"}.
          </AlertDescription>
        </Alert>
      )}

      <Card className="@container gap-0 overflow-hidden">
        <CardHeader className="pb-6">
          <CardHeaderText>
            <CardTitle>Alerts</CardTitle>
            <CardDescription>
              Choose which alerts Clarion raises, and how long a problem must last before an alert is raised or cleared. For every endpoint, in the widget and Fleet-view alike.
            </CardDescription>
          </CardHeaderText>
          <CardAction>
            <Button variant="ghost" size="sm" onClick={() => setExplain(true)}><CircleHelp aria-hidden />What does stability change?</Button>
          </CardAction>
        </CardHeader>

        {/* One table: thresholds in their own columns (read-only here, set on
            Thresholds), so values line up and nothing on a settings page looks
            alarming. Each category row carries its stability (decided 10 Nov). */}
        <Table className="min-w-[44rem]">
          <TableColGroup>
            <TableCol />
            <TableCol className="w-44" />
            <TableCol className="w-44" />
            <TableCol className="w-36" />
          </TableColGroup>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="ps-6 text-start">Alert</TableHead>
              <TableHead className="text-start"><span className="flex items-center gap-1.5"><TriangleAlert className="size-3.5 text-status-warning" aria-hidden />Warning</span></TableHead>
              <TableHead className="text-start"><span className="flex items-center gap-1.5"><CircleAlert className="size-3.5 text-status-critical" aria-hidden />Critical</span></TableHead>
              <TableHead className="pe-6 text-end">Active now</TableHead>
            </TableRow>
          </TableHeader>
          {categories.map((c) => (
            <TableBody key={c}>
              <TableRow className="bg-surface-neutral-subtle hover:bg-surface-neutral-subtle">
                <TableCell className="py-4 ps-6 align-top">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-label-md font-semibold text-content-neutral-emphasis">{categoryLabel[c]}</h3>
                    <p className="text-body-sm text-content-neutral-muted">
                      {RAISED_AS_IT_HAPPENS.includes(c)
                        ? "Raised as they happen. Stability sets how long a recovery must hold before the alert clears."
                        : PRESETS[stability[c]].words}
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-body-sm text-content-neutral-muted">Stability</span>
                      <SegmentedControl size="sm" aria-label={`${categoryLabel[c]} stability`} value={stability[c]}
                        onValueChange={(v) => v && setCategory(c, v as Stability)}>
                        {(Object.keys(PRESETS) as Stability[]).map((k) => <SegmentedControlItem key={k} value={k}>{PRESETS[k].label}</SegmentedControlItem>)}
                      </SegmentedControl>
                    </div>
                  </div>
                </TableCell>
                {/* platforms share one pair of thresholds: said once, under the column headers */}
                <TableCell className="py-4 align-top">{c === "platform" ? `Quality below ${settings.thresholds.platformmos.warn.toFixed(1)}` : c === "devices" ? <span className="text-content-neutral-subtle">No threshold</span> : null}</TableCell>
                <TableCell className="py-4 align-top">{c === "platform" ? "Can't be reached" : null}</TableCell>
                <TableCell className="pe-6" />
              </TableRow>
              {ALERT_TYPES.filter((t) => t.category === c).map((t) => {
                const on = !off.includes(t.id)
                const at = threshold(t)
                return (
                  <TableRow key={t.id}>
                    <TableCell className="ps-6">
                      <FieldOption className={on ? undefined : "text-content-neutral-subtle"} control={<Checkbox checked={on} onCheckedChange={(v) => toggle(t.id, v === true)} />}>
                        {alertName(t)}
                      </FieldOption>
                    </TableCell>
                    <TableCell>{at?.warn}</TableCell>
                    <TableCell>{at?.crit}</TableCell>
                    <TableCell className="pe-6 text-end">
                      <RowStatus on={on} wasOn={!settings.disabledTypes.includes(t.id)} active={affected.get(t.id) ?? 0} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          ))}
        </Table>
      </Card>

      <SectionFooter
        saved={savedLine(lastSaved)}
        dirty={dirty}
        onDiscard={() => { setOff(settings.disabledTypes); setStability(settings.stability) }}
        onSave={save}
        saveLabel="Save alerts"
        confirmation={confirmation}
        extra={<Button variant="ghost" onClick={onEditThresholds}>Edit thresholds</Button>}
      />

      <Dialog open={explain} onOpenChange={setExplain}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>What alert stability changes</DialogTitle>
            <DialogDescription>It stops alerts popping up and clearing when a reading hovers around its threshold. An alert held back in the widget never shows in Fleet-view either.</DialogDescription>
          </DialogHeader>
          <DialogBody><StabilityExample setting={stability.network} /></DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** How many endpoints have it now ("None" when none), or "Off" once it has been saved off. An unsaved change says nothing here; the footer covers it. */
function RowStatus({ on, wasOn, active }: { on: boolean; wasOn: boolean; active: number }) {
  if (!on && !wasOn) return <Badge>Off</Badge>
  if (active === 0) return <span className="text-content-neutral-subtle">None</span>
  return <span className="text-content-neutral-muted">{active} endpoint{active === 1 ? "" : "s"}</span>
}

/** When the alert is raised (set on Thresholds), as plain text for its column. Platforms say it once, in their group row; devices have no threshold. */
function threshold(t: AlertType): { warn: string; crit: string } | null {
  if (t.category === "platform" || !t.metric) return null
  const m = t.metric
  const v = (n: number) => `${m.lowerIsWorse ? "Below" : "Above"} ${n}${m.unit}`
  return { warn: v(m.warn), crit: v(m.crit) }
}
