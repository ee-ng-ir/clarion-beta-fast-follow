import { useEffect, useMemo, useState } from "react"
import { Alert, AlertDescription, Badge, Button, Card, CardDescription, CardHeader, CardHeaderText, CardTitle, Checkbox, FieldOption } from "@ir/ui"
import { endpoints } from "@/data/endpoints"
import { useViewer } from "@/lib/viewer"
import { ALERT_TYPES, categoryLabel, type AlertCategory } from "../alerts/catalogue"
import { classify } from "../alerts/groups"
import { alertName } from "../alerts/names"
import { saveTypes, savedLine, useSettings } from "./store"
import { SectionFooter } from "./SectionFooter"

const categories: AlertCategory[] = ["network", "system", "platform", "devices"]


/**
 * Settings › Alert types. Every alert type can be on or off, for the whole tenancy.
 * Settings are forms (D9): checkboxes, then Save — never switches next to Save.
 * All on by default. Turning one off stops the alert, its group, the Send to IT
 * prompt and notifications; readings still show in endpoint detail, and the
 * thresholds are kept for when it's turned back on.
 */
export function AlertTypesSection({ onEditThresholds, onDirtyChange }: { onEditThresholds: () => void; onDirtyChange?: (dirty: boolean) => void }) {
  const settings = useSettings()
  const { person } = useViewer()
  const [off, setOff] = useState<string[]>(settings.disabledTypes)
  const dirty = off.slice().sort().join() !== settings.disabledTypes.slice().sort().join()
  const [confirmation, setConfirmation] = useState<string | null>(null)
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])
  const save = () => {
    const turnedOff = off.filter((x) => !settings.disabledTypes.includes(x)).length
    const turnedOn = settings.disabledTypes.filter((x) => !off.includes(x)).length
    saveTypes(off, person.name)
    setConfirmation(`Saved. ${[turnedOff && `${turnedOff} alert${turnedOff === 1 ? "" : "s"} turned off`, turnedOn && `${turnedOn} turned back on`].filter(Boolean).join(", ")}. Alerts, Top issues and the widget now follow this.`)
  }

  // endpoints each type would alert on right now, so turning one off isn't a blind choice
  const affected = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of endpoints) if (e.status === "critical" || e.status === "warning") m.set(classify(e), (m.get(classify(e)) ?? 0) + 1)
    return m
  }, [])

  const toggle = (id: string, on: boolean) => { setConfirmation(null); setOff((cur) => (on ? cur.filter((x) => x !== id) : [...cur, id])) }

  return (
    <div className="flex w-full flex-col gap-gutter">
      {off.length > 0 && (
        <Alert variant="warning">
          <AlertDescription>
            {off.length} alert{off.length === 1 ? " is" : "s are"} off. Agents won't see {off.length === 1 ? "it" : "them"} in the widget, and no one will be emailed about {off.length === 1 ? "it" : "them"}.
          </AlertDescription>
        </Alert>
      )}

      {/* same structure as Thresholds: one card, category rows, edge-to-edge rows */}
      <Card className="@container gap-0 overflow-hidden">
        <CardHeader className="pb-6">
          <CardHeaderText>
            <CardTitle>Alerts</CardTitle>
            <CardDescription>
              Choose which alerts Clarion raises, for every endpoint. All are on by default. Turning one off stops the alert, not the data: readings still show in endpoint detail. When each alert is raised is set on Thresholds.
            </CardDescription>
          </CardHeaderText>
        </CardHeader>
        {categories.map((c) => (
          <section key={c} aria-label={categoryLabel[c]}>
            <div className="flex flex-col gap-0.5 border-t border-line-neutral-subtle px-6 py-3">
              <h3 className="text-label-sm uppercase tracking-wide text-content-neutral-muted">{categoryLabel[c]}</h3>
              {c === "platform" && <p className="text-body-xs text-content-neutral-muted">Each platform alerts when its call quality drops or it can't be reached. Turning one off leaves the others on.</p>}
            </div>
            {ALERT_TYPES.filter((t) => t.category === c).map((t) => {
              const on = !off.includes(t.id)
              const n = affected.get(t.id) ?? 0
              return (
                <div key={t.id} className="flex items-center gap-4 border-t border-line-neutral-subtle px-6 py-4">
                  <FieldOption
                    className="min-w-0 flex-1"
                    control={<Checkbox checked={on} onCheckedChange={(v) => toggle(t.id, v === true)} />}
                  >
                    {alertName(t)}
                  </FieldOption>
                  <RowStatus on={on} wasOn={!settings.disabledTypes.includes(t.id)} active={n} />
                </div>
              )
            })}
          </section>
        ))}
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

/**
 * What the row says on its right: context when on, the consequence while an
 * unsaved change would turn it off, and just "Off" once it's off.
 */
function RowStatus({ on, wasOn, active }: { on: boolean; wasOn: boolean; active: number }) {
  if (on) return active > 0 ? <span className="ms-auto shrink-0 text-body-sm text-content-neutral-muted">Active on {active} endpoint{active === 1 ? "" : "s"}</span> : null
  if (wasOn) return active > 0 ? <span className="ms-auto shrink-0 text-label-sm text-content-warning-emphasis">Off once you save · active on {active} endpoint{active === 1 ? "" : "s"}</span> : null
  return <Badge className="ms-auto shrink-0">Off</Badge>
}
