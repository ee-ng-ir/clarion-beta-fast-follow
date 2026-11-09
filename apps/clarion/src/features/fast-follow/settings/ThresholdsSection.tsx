import { useEffect, useState } from "react"
import { Info, RotateCcw } from "lucide-react"
import {
  Alert, AlertDescription, Button, Card, CardContent, CardHeader, CardTitle, ThresholdSlider, Tooltip, TooltipContent, TooltipTrigger,
} from "@ir/ui"
import { useViewer } from "@/lib/viewer"
import { savedLine, saveThresholds, useSettings } from "./store"
import { SectionFooter } from "./SectionFooter"
import { IR_THRESHOLDS, samePolicy, THRESHOLD_CATEGORIES, THRESHOLD_METRICS, type Policy } from "./thresholds"

/**
 * Settings › Thresholds: the original Clarion Thresholds page, on Picasso, minus
 * custom thresholds by location (not in Fast Follow). One set of defaults for the
 * whole tenancy. A form like every Settings tab (D9): drag, then Save.
 * If custom thresholds come in later, where they sit is an IA question (X2).
 */
export function ThresholdsSection({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const settings = useSettings()
  const { person, thresholds: acc } = useViewer()
  const readOnly = !acc.editDefaults
  const [draft, setDraft] = useState<Policy>(settings.thresholds)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const dirty = !samePolicy(draft, settings.thresholds)
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])

  const set = (id: string, warn: number, crit: number) => { setConfirmation(null); setDraft((d) => ({ ...d, [id]: { warn, crit } })) }
  const save = () => {
    saveThresholds(draft, person.name)
    setConfirmation("Thresholds saved. New alerts use them straight away; alerts already raised keep the threshold they were raised against.")
  }

  return (
    <div className="flex w-full max-w-content-reading flex-col gap-gutter">
      <p className="text-body-md text-content-neutral-muted">
        When an endpoint is flagged Warning or Critical. One set for every endpoint in the tenancy. Alert stability then decides how long a reading has to stay past a threshold before the alert is raised.
      </p>
      {readOnly && (
        <Alert variant="info"><AlertDescription>Read-only. Thresholds are set by administrators with access to every location.</AlertDescription></Alert>
      )}

      {THRESHOLD_CATEGORIES.map((cat) => {
        const metrics = THRESHOLD_METRICS.filter((m) => m.category === cat)
        if (!metrics.length) return null
        return (
          <Card key={cat}>
            <CardHeader><CardTitle>{cat}</CardTitle></CardHeader>
            <CardContent className="gap-0 p-0">
              {metrics.map((m, i) => {
                const b = draft[m.id]
                const ir = IR_THRESHOLDS[m.id]
                const changed = b.warn !== ir.warn || b.crit !== ir.crit
                const fmt = (v: number) => `${v.toFixed(m.decimals)}${m.unit}`
                return (
                  <div key={m.id} className={`flex flex-col gap-3 px-6 py-4 @container ${i ? "border-t border-line-neutral-subtle" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-neutral-subtle text-content-neutral-muted">
                          <m.icon className="size-4" aria-hidden />
                        </span>
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1.5 text-label-md text-content-neutral-emphasis">
                            {m.name}
                            {m.tooltip && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button type="button" aria-label={`About ${m.name}`} className="rounded-xs text-content-neutral-subtle outline-none focus-visible:ring-2 focus-visible:ring-line-focused"><Info className="size-3.5" /></button>
                                </TooltipTrigger>
                                <TooltipContent>{m.tooltip}</TooltipContent>
                              </Tooltip>
                            )}
                          </span>
                          <span className="text-body-xs text-content-neutral-muted">
                            {m.direction === "higher" ? "Higher is worse" : "Lower is worse"} · IR default {fmt(ir.warn)} / {fmt(ir.crit)}
                          </span>
                        </div>
                      </div>
                      {!readOnly && changed && (
                        <Button variant="ghost" size="icon-sm" aria-label={`Set ${m.name} back to IR's default`} title="Back to IR's default" onClick={() => set(m.id, ir.warn, ir.crit)}>
                          <RotateCcw />
                        </Button>
                      )}
                    </div>
                    <ThresholdSlider min={m.min} max={m.max} step={m.step} warning={b.warn} critical={b.crit} disabled={readOnly}
                      format={fmt} aria-label={`${m.name} thresholds`}
                      onChange={({ warning, critical }) => set(m.id, warning, critical)} />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}

      {!readOnly && (
        <SectionFooter
          saved={savedLine(settings.saved.thresholds)}
          dirty={dirty}
          onDiscard={() => setDraft(settings.thresholds)}
          onSave={save}
          saveLabel="Save thresholds"
          confirmation={confirmation}
          extra={!samePolicy(draft, IR_THRESHOLDS) ? <Button variant="ghost" onClick={() => { setConfirmation(null); setDraft(IR_THRESHOLDS) }}>Reset all to IR defaults</Button> : undefined}
        />
      )}
    </div>
  )
}
