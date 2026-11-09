import { useEffect, useState } from "react"
import { Info, RotateCcw } from "lucide-react"
import {
  Alert, AlertDescription, Button, Card, CardAction, CardDescription, CardHeader, CardHeaderText, CardTitle, ThresholdSlider, Tooltip, TooltipContent, TooltipTrigger,
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

  const changedFromIr = !samePolicy(draft, IR_THRESHOLDS)
  return (
    <div className="flex w-full flex-col gap-gutter">
      {readOnly && (
        <Alert variant="info"><AlertDescription>Read-only. Thresholds are set by administrators with access to every location.</AlertDescription></Alert>
      )}
      <Card className="@container gap-0 overflow-hidden">
        {/* the card's gap is off so the rows run edge to edge; the header needs its own bottom padding back */}
        <CardHeader className="items-center pb-6">
          <CardHeaderText>
            <CardTitle>Threshold settings</CardTitle>
            <CardDescription>Applies to every endpoint</CardDescription>
          </CardHeaderText>
          {!readOnly && (
            <CardAction>
              <Button variant="outline" size="sm" disabled={!changedFromIr} onClick={() => { setConfirmation(null); setDraft(IR_THRESHOLDS) }}>
                <RotateCcw aria-hidden />Reset to defaults
              </Button>
            </CardAction>
          )}
        </CardHeader>
        {THRESHOLD_CATEGORIES.map((cat) => {
          const metrics = THRESHOLD_METRICS.filter((m) => m.category === cat)
          if (!metrics.length) return null
          return (
            <section key={cat} aria-label={cat}>
              <h3 className="border-t border-line-neutral-subtle px-6 py-3 text-label-sm uppercase tracking-wide text-content-neutral-muted">{cat}</h3>
              {metrics.map((m) => {
                const b = draft[m.id]
                const ir = IR_THRESHOLDS[m.id]
                const changed = b.warn !== ir.warn || b.crit !== ir.crit
                const fmt = (v: number) => `${v.toFixed(m.decimals)}${m.unit}`
                return (
                  <div key={m.id} className="flex flex-col gap-4 border-t border-line-neutral-subtle px-6 py-5 @2xl:flex-row @2xl:items-center @2xl:gap-8">
                    <div className="flex items-center gap-3 @2xl:w-60 @2xl:shrink-0">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line-neutral-subtle bg-surface-canvas text-content-neutral-muted">
                        <m.icon className="size-4" aria-hidden />
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-1.5 text-label-md text-content-neutral-emphasis">
                          {m.name}
                          {m.tooltip && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button type="button" aria-label={`About ${m.name}`} className="rounded-xs text-content-neutral-muted outline-none focus-visible:ring-2 focus-visible:ring-line-focused"><Info className="size-3.5" /></button>
                              </TooltipTrigger>
                              <TooltipContent>{m.tooltip}</TooltipContent>
                            </Tooltip>
                          )}
                        </span>
                        <span className="text-body-sm text-content-neutral-muted">{m.direction === "higher" ? "Higher is worse" : "Lower is worse"}</span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <ThresholdSlider min={m.min} max={m.max} step={m.step} warning={b.warn} critical={b.crit} disabled={readOnly}
                        format={fmt} aria-label={`${m.name} thresholds`}
                        onChange={({ warning, critical }) => set(m.id, warning, critical)} />
                    </div>
                    <div className="flex @2xl:w-8 @2xl:shrink-0 @2xl:justify-end">
                      {!readOnly && changed && (
                        <Button variant="ghost" size="icon-sm" aria-label={`Set ${m.name} back to the default`} title="Set to default" onClick={() => set(m.id, ir.warn, ir.crit)}>
                          <RotateCcw />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </section>
          )
        })}
      </Card>

      {!readOnly && (
        <SectionFooter
          saved={savedLine(settings.saved.thresholds)}
          dirty={dirty}
          onDiscard={() => setDraft(settings.thresholds)}
          onSave={save}
          saveLabel="Save thresholds"
          confirmation={confirmation}
        />
      )}
    </div>
  )
}
