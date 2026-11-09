import { useMemo, useState } from "react"
import { Alert, AlertDescription, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardHeaderText, CardTitle, FieldOption, Switch } from "@ir/ui"
import { endpoints } from "@/data/endpoints"
import { useViewer } from "@/lib/viewer"
import { ALERT_TYPES, categoryLabel, type AlertCategory, type AlertType } from "../alerts/catalogue"
import { classify } from "../alerts/groups"
import { saveTypes, savedLine, useSettings } from "./store"
import { SectionFooter } from "./SectionFooter"

const categories: AlertCategory[] = ["network", "system", "platform", "devices"]

function thresholdLine(t: AlertType) {
  if (!t.metric) return "No threshold: raised when it happens"
  const u = t.metric.unit
  return `${t.metric.name} · Warning ${t.metric.warn}${u} · Critical ${t.metric.crit}${u}`
}

/**
 * Settings › Alert types. Every alert type has a switch, for the whole tenancy.
 * All on by default. Turning one off stops the alert, its group, the Send to IT
 * prompt and notifications; readings still show in endpoint detail, and the
 * thresholds are kept for when it's turned back on.
 */
export function AlertTypesSection({ onEditThresholds }: { onEditThresholds: () => void }) {
  const settings = useSettings()
  const { person } = useViewer()
  const [off, setOff] = useState<string[]>(settings.disabledTypes)
  const dirty = off.slice().sort().join() !== settings.disabledTypes.slice().sort().join()

  // endpoints each type would alert on right now, so turning one off isn't a blind choice
  const affected = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of endpoints) if (e.status === "critical" || e.status === "warning") m.set(classify(e), (m.get(classify(e)) ?? 0) + 1)
    return m
  }, [])

  const toggle = (id: string, on: boolean) => setOff((cur) => (on ? cur.filter((x) => x !== id) : [...cur, id]))

  return (
    <div className="flex w-full max-w-content-reading flex-col gap-gutter">
      <p className="text-body-md text-content-neutral-muted">
        Applies to every endpoint. All alert types are on by default. Turning one off stops the alert, not the data: readings still show in endpoint detail, and its thresholds are kept for when you turn it back on.
      </p>

      {off.length > 0 && (
        <Alert variant="warning">
          <AlertDescription>
            {off.length} alert type{off.length === 1 ? " is" : "s are"} off. Agents won't see {off.length === 1 ? "it" : "them"} in the widget, and no one will be emailed about {off.length === 1 ? "it" : "them"}.
          </AlertDescription>
        </Alert>
      )}

      {categories.map((c) => (
        <Card key={c} size="sm">
          <CardHeader>
            <CardHeaderText>
              <CardTitle>{categoryLabel[c]}</CardTitle>
              {c === "platform" && <CardDescription>One switch for each platform, so Teams and Zoom can be set separately.</CardDescription>}
            </CardHeaderText>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-line-neutral-subtle">
            {ALERT_TYPES.filter((t) => t.category === c).map((t) => {
              const on = !off.includes(t.id)
              const n = affected.get(t.id) ?? 0
              return (
                <div key={t.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <FieldOption
                    className="min-w-0 flex-1"
                    control={<Switch checked={on} onCheckedChange={(v) => toggle(t.id, v)} />}
                    description={thresholdLine(t)}
                  >
                    {t.warning} · {t.critical}
                  </FieldOption>
                  {n > 0 && <Badge color={on ? "warning" : "neutral"} className="shrink-0">{on ? `${n} alerting now` : `${n} would alert`}</Badge>}
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}

      <SectionFooter
        saved={savedLine(settings.saved.types)}
        dirty={dirty}
        onDiscard={() => setOff(settings.disabledTypes)}
        onSave={() => saveTypes(off, person.name)}
        saveLabel="Save alert types"
        extra={<Button variant="ghost" onClick={onEditThresholds}>Edit thresholds</Button>}
      />
    </div>
  )
}
