import { useEffect, useMemo, useState } from "react"
import {
  Alert, AlertDescription, Badge, Button, Card, CardDescription, CardHeader, CardHeaderText, CardTitle, Checkbox,
  FieldOption, Table, TableBody, TableCell, TableCol, TableColGroup, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import { endpoints } from "@/data/endpoints"
import { useViewer } from "@/lib/viewer"
import { ALERT_TYPES, categoryLabel, type AlertCategory } from "../alerts/catalogue"
import { classify } from "../alerts/groups"
import { alertName } from "../alerts/names"
import { saveTypes, savedLine, useSettings } from "./store"
import { SectionFooter, type Confirmation } from "./SectionFooter"

const categories: AlertCategory[] = ["network", "system", "platform", "devices"]

/**
 * Settings › Alerts: which alerts Clarion raises, on or off for every endpoint.
 * That's all: the core ask is a toggle per alert type (PO, 11 Nov). The numbers
 * that raise each alert stay on Thresholds. Flapping isn't set here any more:
 * the widget handles it (PO and R&D, 11 Nov), so the Sensitive / Balanced / Calm
 * control is gone.
 * A form like every Settings tab (D9): change things, then Save.
 * Off isn't evaluated (D10).
 */
export function AlertsSection({ onEditThresholds, onDirtyChange }: { onEditThresholds: () => void; onDirtyChange?: (dirty: boolean) => void }) {
  const settings = useSettings()
  const { person } = useViewer()
  const [off, setOff] = useState<string[]>(settings.disabledTypes)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)

  const dirty = off.slice().sort().join() !== settings.disabledTypes.slice().sort().join()
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])

  // endpoints each type alerts on right now, so turning one off isn't a blind choice
  const affected = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of endpoints) if (e.status === "critical" || e.status === "warning") m.set(classify(e), (m.get(classify(e)) ?? 0) + 1)
    return m
  }, [])

  const toggle = (id: string, on: boolean) => { setConfirmation(null); setOff((cur) => (on ? cur.filter((x) => x !== id) : [...cur, id])) }
  const save = () => {
    const turnedOff = off.filter((x) => !settings.disabledTypes.includes(x)).length
    const turnedOn = settings.disabledTypes.filter((x) => !off.includes(x)).length
    const changes = [
      turnedOff && `${turnedOff} alert${turnedOff === 1 ? "" : "s"} turned off`,
      turnedOn && `${turnedOn} turned back on`,
    ].filter(Boolean)
    saveTypes(off, person.name)
    setConfirmation({ title: "Alerts saved", description: changes.join(" · ") })
  }
  const savedOff = settings.disabledTypes.length

  return (
    <div className="flex w-full flex-col gap-gutter">
      {/* Reflects what's saved, not the draft: an unsaved switch-off hasn't taken effect yet. */}
      {savedOff > 0 && (
        <Alert variant="warning">
          <AlertDescription>
            {savedOff} alert{savedOff === 1 ? " is" : "s are"} off. Agents won't see {savedOff === 1 ? "it" : "them"} in the widget, and no one will be emailed about {savedOff === 1 ? "it" : "them"}.
          </AlertDescription>
        </Alert>
      )}

      <Card className="@container gap-0 overflow-hidden">
        <CardHeader className="pb-6">
          <CardHeaderText>
            <CardTitle>Alerts</CardTitle>
            <CardDescription>Choose which alerts Clarion raises, for every endpoint. All are on by default. Turning one off stops the alert, not the data: readings still show in endpoint detail.</CardDescription>
          </CardHeaderText>
        </CardHeader>
        <Table>
          <TableColGroup>
            <TableCol />
            <TableCol className="w-40" />
          </TableColGroup>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="ps-6 text-start">Alert</TableHead>
              <TableHead className="pe-6 text-end">Active now</TableHead>
            </TableRow>
          </TableHeader>
          {categories.map((c) => (
            <TableBody key={c}>
              <TableRow className="bg-surface-neutral-subtle hover:bg-surface-neutral-subtle">
                <TableCell colSpan={2} className="py-3 ps-6">
                  <h3 className="text-label-md font-semibold text-content-neutral-emphasis">{categoryLabel[c]}</h3>
                </TableCell>
              </TableRow>
              {ALERT_TYPES.filter((t) => t.category === c).map((t) => {
                const on = !off.includes(t.id)
                return (
                  <TableRow key={t.id}>
                    <TableCell className="ps-6">
                      <FieldOption className={on ? undefined : "text-content-neutral-subtle"} control={<Checkbox checked={on} onCheckedChange={(v) => toggle(t.id, v === true)} />}>
                        {alertName(t)}
                      </FieldOption>
                    </TableCell>
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
        saved={savedLine(settings.saved.types)}
        dirty={dirty}
        onDiscard={() => setOff(settings.disabledTypes)}
        onSave={save}
        saveLabel="Save alerts"
        confirmation={confirmation}
        extra={<Button variant="ghost" onClick={onEditThresholds}>Edit thresholds</Button>}
      />
    </div>
  )
}

/** How many endpoints have it now ("None" when none), or "Off" once it has been saved off. An unsaved change says nothing here; the footer covers it. */
function RowStatus({ on, wasOn, active }: { on: boolean; wasOn: boolean; active: number }) {
  if (!on && !wasOn) return <Badge>Off</Badge>
  if (active === 0) return <span className="text-content-neutral-subtle">None</span>
  return <span className="text-content-neutral-muted">{active} endpoint{active === 1 ? "" : "s"}</span>
}
