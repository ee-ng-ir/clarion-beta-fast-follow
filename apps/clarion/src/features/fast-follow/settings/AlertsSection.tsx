import { Fragment, useEffect, useMemo, useState } from "react"
import { ChevronDown, RotateCcw } from "lucide-react"
import {
  Alert, AlertDescription, Badge, Button, Card, CardAction, CardDescription, CardHeader, CardHeaderText, CardTitle, Checkbox,
  Slider, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, ThresholdSlider,
} from "@ir/ui"
import { endpoints } from "@/data/endpoints"
import { metricById } from "@/data/thresholds"
import { useViewer } from "@/lib/viewer"
import { ALERT_TYPES, categoryLabel, type AlertCategory, type AlertType } from "../alerts/catalogue"
import { classify } from "../alerts/groups"
import { alertName } from "../alerts/names"
import { takeSettingsFocus } from "../navigator"
import { saveThresholds, saveTypes, savedLine, useSettings, type Saved } from "./store"
import { SectionFooter } from "./SectionFooter"
import { IR_THRESHOLDS, metricForType, samePolicy, type Policy } from "./thresholds"

const categories: AlertCategory[] = ["network", "system", "platform", "devices"]
const COLS = 6

/**
 * Settings › Alerting › Alerts & thresholds (canvas option D). Which alerts
 * Clarion raises and the readings that raise them, in one table: Alerts and
 * Thresholds were one decision on two tabs. A row expands to its threshold;
 * every platform shares one (the Platform Quality Index), set on the group row.
 * A form like every Settings tab (D9): change things, then one Save.
 * Off isn't evaluated (D10); its threshold is kept for when it's back on.
 */
export function AlertsSection({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const settings = useSettings()
  const { person, thresholds: acc } = useViewer()
  const readOnly = !acc.editDefaults
  const [off, setOff] = useState<string[]>(settings.disabledTypes)
  const [policy, setPolicy] = useState<Policy>(settings.thresholds)
  // a deep link ("Edit this alert" on an alert group) opens straight to that row
  const [open, setOpen] = useState<string[]>(() => { const f = takeSettingsFocus(); return f ? [f] : [] })
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const typesDirty = off.slice().sort().join() !== settings.disabledTypes.slice().sort().join()
  const policyDirty = !samePolicy(policy, settings.thresholds)
  const dirty = typesDirty || policyDirty
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])

  useEffect(() => {
    if (!open.length) return
    document.getElementById(`alert-row-${open[0]}`)?.scrollIntoView({ block: "center" })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- once, for the deep link

  const affected = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of endpoints) if (e.status === "critical" || e.status === "warning") m.set(classify(e), (m.get(classify(e)) ?? 0) + 1)
    return m
  }, [])

  const edit = () => setConfirmation(null)
  const toggle = (id: string, on: boolean) => { edit(); setOff((cur) => (on ? cur.filter((x) => x !== id) : [...cur, id])) }
  const setBand = (metric: string, warn: number, crit: number) => { edit(); setPolicy((p) => ({ ...p, [metric]: { warn, crit } })) }
  const flip = (key: string) => setOpen((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]))

  const save = () => {
    const turnedOff = off.filter((x) => !settings.disabledTypes.includes(x)).length
    const turnedOn = settings.disabledTypes.filter((x) => !off.includes(x)).length
    const moved = Object.keys(policy).filter((k) => policy[k].warn !== settings.thresholds[k].warn || policy[k].crit !== settings.thresholds[k].crit).length
    if (typesDirty) saveTypes(off, person.name)
    if (policyDirty) saveThresholds(policy, person.name)
    const parts = [
      turnedOff && `${turnedOff} alert${turnedOff === 1 ? "" : "s"} turned off`,
      turnedOn && `${turnedOn} turned back on`,
      moved && `${moved} threshold${moved === 1 ? "" : "s"} changed`,
    ].filter(Boolean)
    setConfirmation(`Saved: ${parts.join(", ")}. New alerts follow this straight away; alerts already raised keep the threshold they were raised against.`)
  }

  const lastSaved = [settings.saved.types, settings.saved.thresholds].filter((s): s is Saved => !!s).sort((a, b) => b.at.getTime() - a.at.getTime())[0]
  const changedFromIr = !samePolicy(policy, IR_THRESHOLDS)

  return (
    <div className="flex w-full flex-col gap-gutter">
      {readOnly && (
        <Alert variant="info"><AlertDescription>Thresholds are read-only. They're set by administrators with access to every location.</AlertDescription></Alert>
      )}

      <Card className="@container gap-0 overflow-hidden">
        <CardHeader className="items-center">
          <CardHeaderText>
            <CardTitle>Alerts &amp; thresholds</CardTitle>
            <CardDescription>Which alerts Clarion raises, and the readings that raise them. For every endpoint.</CardDescription>
          </CardHeaderText>
          {!readOnly && (
            <CardAction>
              <Button variant="outline" size="sm" disabled={!changedFromIr} onClick={() => { edit(); setPolicy(IR_THRESHOLDS) }}>
                <RotateCcw aria-hidden />Reset thresholds
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead align="start" className="w-12">On</TableHead>
              <TableHead align="start">Alert</TableHead>
              <TableHead align="start">Warning</TableHead>
              <TableHead align="start">Critical</TableHead>
              <TableHead numeric>Active now</TableHead>
              <TableHead className="w-12"><span className="sr-only">Threshold</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => {
              const types = ALERT_TYPES.filter((t) => t.category === c)
              return (
                <Fragment key={c}>
                  {c === "platform" ? (
                    <PlatformGroupRow policy={policy} open={open.includes("platform")} onFlip={() => flip("platform")} readOnly={readOnly}
                      onWarn={(w) => setBand("platformmos", w, policy.platformmos.crit)} />
                  ) : (
                    <TableRow>
                      <TableCell colSpan={COLS} className="pt-5 pb-2 text-label-sm uppercase tracking-wide text-content-neutral-muted">{categoryLabel[c]}</TableCell>
                    </TableRow>
                  )}
                  {types.map((t) => (
                    <AlertRow key={t.id} t={t} policy={policy} on={!off.includes(t.id)} savedOff={settings.disabledTypes.includes(t.id)}
                      active={affected.get(t.id) ?? 0} open={open.includes(t.id)} onFlip={() => flip(t.id)}
                      onToggle={(v) => toggle(t.id, v)} onBand={setBand} readOnly={readOnly} />
                  ))}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <SectionFooter
        saved={savedLine(lastSaved)}
        dirty={dirty}
        onDiscard={() => { setOff(settings.disabledTypes); setPolicy(settings.thresholds) }}
        onSave={save}
        saveLabel="Save alerts"
        confirmation={confirmation}
      />
    </div>
  )
}

const fmtFor = (metricId: string) => { const m = metricById(metricId)!; return (v: number) => `${v.toFixed(m.decimals)}${m.unit}` }

function AlertRow({ t, policy, on, savedOff, active, open, onFlip, onToggle, onBand, readOnly }: {
  t: AlertType; policy: Policy; on: boolean; savedOff: boolean; active: number; open: boolean
  onFlip: () => void; onToggle: (on: boolean) => void; onBand: (metric: string, warn: number, crit: number) => void; readOnly: boolean
}) {
  const metricId = t.category === "platform" ? null : metricForType(t.id)
  const m = metricId ? metricById(metricId)! : null
  const band = metricId ? policy[metricId] : null
  const fmt = metricId ? fmtFor(metricId) : null
  const dir = m?.direction === "higher" ? "Above" : "Below"
  const name = alertName(t)
  const ir = metricId ? IR_THRESHOLDS[metricId] : null
  const muted = !on && "text-content-neutral-muted"
  return (
    <>
      <TableRow id={`alert-row-${t.id}`} selected={open}>
        <TableCell align="start"><Checkbox checked={on} onCheckedChange={(v) => onToggle(v === true)} aria-label={`${name} alerts on`} /></TableCell>
        <TableCell align="start" className={muted || "text-label-md text-content-neutral-emphasis"}>{name}</TableCell>
        {band && fmt ? (
          <>
            <TableCell align="start"><Badge color={on ? "warning" : undefined} dot={on}>{dir} {fmt(band.warn)}</Badge></TableCell>
            <TableCell align="start"><Badge color={on ? "danger" : undefined} dot={on}>{dir} {fmt(band.crit)}</Badge></TableCell>
          </>
        ) : (
          <TableCell align="start" colSpan={2} className="text-content-neutral-muted">
            {t.category === "platform" ? "As set for every platform" : "Whenever it happens"}
          </TableCell>
        )}
        <TableCell numeric className="text-content-neutral-muted">{savedOff && !on ? <Badge>Off</Badge> : active || "—"}</TableCell>
        <TableCell align="end">
          {band && (
            <Button variant="ghost" size="icon-sm" aria-expanded={open} aria-controls={`alert-edit-${t.id}`}
              aria-label={`${open ? "Hide" : "Edit"} ${name} thresholds`} onClick={onFlip}>
              <ChevronDown className={open ? "rotate-180 transition-transform" : "transition-transform"} />
            </Button>
          )}
        </TableCell>
      </TableRow>
      {open && band && m && fmt && ir && (
        <TableRow id={`alert-edit-${t.id}`} selected className="hover:bg-transparent">
          <TableCell />
          <TableCell colSpan={COLS - 1} align="start" className="pb-6">
            <div className="flex max-w-2xl flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-body-sm text-content-neutral-muted">
                <span>{m.name} · {m.direction === "higher" ? "higher is worse" : "lower is worse"}</span>
                {(band.warn !== ir.warn || band.crit !== ir.crit) && !readOnly && (
                  <Button variant="link" size="xs" onClick={() => onBand(metricId!, ir.warn, ir.crit)}>Set back to IR default ({fmt(ir.warn)} / {fmt(ir.crit)})</Button>
                )}
              </div>
              <ThresholdSlider min={m.min} max={m.max} step={m.step} warning={band.warn} critical={band.crit} disabled={readOnly}
                format={fmt} aria-label={`${name} thresholds`} onChange={({ warning, critical }) => onBand(metricId!, warning, critical)} />
              {!on && <span className="text-body-sm text-content-neutral-muted">This alert is off. The threshold is kept for when it's turned back on.</span>}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

/** UC/CC platforms: one threshold for all of them, on the group row. Warning on quality; Critical is "can't be reached", which has no number. */
function PlatformGroupRow({ policy, open, onFlip, onWarn, readOnly }: {
  policy: Policy; open: boolean; onFlip: () => void; onWarn: (w: number) => void; readOnly: boolean
}) {
  const m = metricById("platformmos")!
  const fmt = fmtFor("platformmos")
  const w = policy.platformmos.warn
  const ir = IR_THRESHOLDS.platformmos.warn
  return (
    <>
      <TableRow id="alert-row-platform" selected={open}>
        <TableCell colSpan={2} align="start" className="pt-5">
          <span className="flex flex-col gap-0.5">
            <span className="text-label-sm uppercase tracking-wide text-content-neutral-muted">{categoryLabel.platform}</span>
            <span className="text-body-xs text-content-neutral-muted">One threshold for every platform</span>
          </span>
        </TableCell>
        <TableCell align="start" className="pt-5"><Badge color="warning" dot>Quality below {fmt(w)}</Badge></TableCell>
        <TableCell align="start" className="pt-5"><Badge color="danger" dot>Can't be reached</Badge></TableCell>
        <TableCell className="pt-5" />
        <TableCell align="end" className="pt-5">
          <Button variant="ghost" size="icon-sm" aria-expanded={open} aria-controls="alert-edit-platform"
            aria-label={`${open ? "Hide" : "Edit"} the platform quality threshold`} onClick={onFlip}>
            <ChevronDown className={open ? "rotate-180 transition-transform" : "transition-transform"} />
          </Button>
        </TableCell>
      </TableRow>
      {open && (
        <TableRow id="alert-edit-platform" selected className="hover:bg-transparent">
          <TableCell />
          <TableCell colSpan={COLS - 1} align="start" className="pb-6">
            <div className="flex max-w-2xl flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-body-sm text-content-neutral-muted">
                <span>{m.name}: Warning below <span className="text-label-md text-content-warning-emphasis">{fmt(w)}</span></span>
                {w !== ir && !readOnly && <Button variant="link" size="xs" onClick={() => onWarn(ir)}>Set back to IR default ({fmt(ir)})</Button>}
              </div>
              <Slider min={m.min} max={m.max} step={m.step} value={[w]} disabled={readOnly} thumbLabels={["Warning below"]}
                onValueChange={([v]) => onWarn(v)} />
              <div className="flex justify-between text-body-xs text-content-neutral-muted"><span>{fmt(m.min)}</span><span>{fmt(m.max)}</span></div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
