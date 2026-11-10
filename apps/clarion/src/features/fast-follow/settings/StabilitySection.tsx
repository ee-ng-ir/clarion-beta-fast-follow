import { useEffect, useMemo, useState } from "react"
import {
  Alert, AlertDescription, Card, CardContent, CardDescription, CardHeader, CardHeaderText, CardTitle,
  Field, FieldDescription, FieldLabel, SegmentedControl, SegmentedControlItem, TimeSeriesChart,
} from "@ir/ui"
import { useViewer } from "@/lib/viewer"
import { categoryLabel, type AlertCategory } from "../alerts/catalogue"
import { saveStability, savedLine, useSettings, type Stability } from "./store"
import { PRESETS, countAlerts } from "./stability"
import { SectionFooter } from "./SectionFooter"

/**
 * Settings › Alerting › Alert stability (anti-flapping). Presets, not raw timings: each says
 * in plain words how long a problem must last before it's raised, and how far
 * it must recover before it clears. Applies to the widget and Fleet-view alike,
 * so they always agree (epic rule 11). Questions log A1, A2.
 */
const categories: AlertCategory[] = ["network", "system", "platform", "devices"]

// Priya at the edge of the office Wi-Fi: signal hovering around the 50% warning threshold for two hours.
// one reading a minute: flickers either side of 50% (weak Wi-Fi), with one real drop around 10:10–10:28
const HOVER = Array.from({ length: 120 }, (_, i) => Math.round(52 + Math.sin(i / 1.3) * 3 + Math.sin(i / 0.6) * 3 - (i > 70 && i < 88 ? 16 : 0)))
const X = HOVER.map((_, i) => {
  const d = new Date(); d.setHours(9, i, 0, 0)
  return d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })
})

export function StabilitySection({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const settings = useSettings()
  const { person } = useViewer()
  const [draft, setDraft] = useState(settings.stability)
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings.stability)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])
  const counts = useMemo(() => Object.fromEntries((Object.keys(PRESETS) as Stability[]).map((k) => [k, countAlerts(HOVER, PRESETS[k])])) as Record<Stability, number>, [])
  const network = draft.network

  return (
    <div className="flex w-full max-w-content-reading flex-col gap-gutter">
      <p className="text-body-md text-content-neutral-muted">
        Stops alerts popping up and clearing when a reading hovers around its threshold. Applies to the widget and Fleet-view alike, so an alert held back on the widget never shows in Fleet-view either.
      </p>

      <Card size="sm">
        <CardHeader>
          <CardHeaderText>
            <CardTitle>What it changes</CardTitle>
            <CardDescription>Priya sits at the edge of the office Wi-Fi. Her signal hovers around the 50% warning threshold all morning.</CardDescription>
          </CardHeaderText>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <TimeSeriesChart
            size="sm"
            x={X}
            series={[{ id: "priya-wifi", label: "Wi-Fi signal", points: HOVER }]}
            title="Wi-Fi signal"
            subtitle="9:00 to 11:00 am"
            yLabel="Wi-Fi signal (%)"
            yMin={0}
            yMax={100}
            format={(v) => `${v}%`}
            threshold={{ value: 50, label: "Warning 50%" }}
            label="Wi-Fi signal from 9 to 11 am hovering around the 50% warning threshold, with one real drop to the 30s from about 10:10 to 10:28."
          />
          <Alert variant="info">
            <AlertDescription>
              Network set to <strong>{PRESETS[network].label}</strong>: {counts[network]} alert{counts[network] === 1 ? "" : "s"} for Priya this morning
              {network !== "sensitive" && ` instead of ${counts.sensitive}`}. The real drop around 10:10 {counts[network] > 0 ? "is still raised" : "is not raised"}.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardHeaderText>
            <CardTitle>Stability by category</CardTitle>
            <CardDescription>Platform and device alerts have no threshold to hover around, so they're raised as they happen; the setting only sets how long a recovery must hold.</CardDescription>
          </CardHeaderText>
        </CardHeader>
        <CardContent className="flex flex-col gap-gutter">
          {categories.map((c) => (
            <Field key={c}>
              <FieldLabel id={`stability-${c}`}>{categoryLabel[c]}</FieldLabel>
              <SegmentedControl aria-labelledby={`stability-${c}`} value={draft[c]} onValueChange={(v) => { if (!v) return; setConfirmation(null); setDraft((d) => ({ ...d, [c]: v as Stability })) }} className="self-start">
                {(Object.keys(PRESETS) as Stability[]).map((k) => <SegmentedControlItem key={k} value={k}>{PRESETS[k].label}</SegmentedControlItem>)}
              </SegmentedControl>
              <FieldDescription>{PRESETS[draft[c]].words}</FieldDescription>
            </Field>
          ))}
        </CardContent>
      </Card>

      <SectionFooter
        saved={savedLine(settings.saved.stability)}
        dirty={dirty}
        onDiscard={() => setDraft(settings.stability)}
        onSave={() => { saveStability(draft, person.name); setConfirmation("Saved. The widget and Fleet-view now raise and clear alerts with these settings.") }}
        saveLabel="Save alert stability"
        confirmation={confirmation}
      />
    </div>
  )
}
