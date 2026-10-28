import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThresholdSlider } from "@/components/thresholds/ThresholdSlider"
import { InfoTip } from "@/components/ui/info-tip"
import { AlertRouting } from "@/components/thresholds/AlertRouting"
import { METRICS, METRIC_CATEGORIES, metricById, defaultPolicy, type ThresholdPolicy } from "@/data/thresholds"

export function ThresholdsPage() {
  // default policy: `policy` is the working draft, `savedPolicy` is the committed state.
  // Edits stay in the draft until Save (these thresholds drive alerting fleet-wide).
  // TODO(eng): seed/reset values from real engineering defaults.
  const clone = (p: ThresholdPolicy) => JSON.parse(JSON.stringify(p)) as ThresholdPolicy
  const [savedPolicy, setSavedPolicy] = useState<ThresholdPolicy>(() => clone(defaultPolicy))
  const [policy, setPolicy] = useState<ThresholdPolicy>(() => clone(defaultPolicy))
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const dirty = JSON.stringify(policy) !== JSON.stringify(savedPolicy)
  const isCustom = JSON.stringify(savedPolicy) !== JSON.stringify(defaultPolicy)

  const setBand = (id: string, warn: number, crit: number) => setPolicy((p) => ({ ...p, [id]: { warn, crit } }))
  const resetMetric = (id: string) => { const m = metricById(id); if (m) setBand(id, m.defaultWarn, m.defaultCrit) }
  // TODO(api): POST default thresholds; map the response → success/error here.
  const savePolicy = () => {
    setSaving(true)
    window.setTimeout(() => {
      setSavedPolicy(clone(policy))
      setSaving(false)
      setJustSaved(true)
      window.setTimeout(() => setJustSaved(false), 3000)
    }, 700) // mock backend round-trip
  }
  const discardPolicy = () => setPolicy(clone(savedPolicy))
  const resetToDefaults = () => setPolicy(clone(defaultPolicy))

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      {/* Section 1 — Default thresholds */}
      <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
          <div className="flex flex-col">
            <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Threshold settings</h2>
            <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>Applies to every endpoint</span>
          </div>
          {/* Save-gated: edits stay in a draft until committed. After save, a confirmation + Reset appears. */}
          <div className="flex items-center gap-2">
            {saving ? (
              <Button size="sm" loading>Saving…</Button>
            ) : dirty ? (
              <>
                <Button variant="ghost" size="sm" onClick={discardPolicy}>Discard</Button>
                <Button size="sm" onClick={savePolicy}>Save changes</Button>
              </>
            ) : (
              <>
                {justSaved && <span className="text-xs font-medium" style={{ color: "var(--fg-success-emphasis)" }}>Changes have been applied</span>}
                {isCustom ? (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={resetToDefaults}>
                    <RotateCcw className="size-3.5" /> Reset to defaults
                  </Button>
                ) : !justSaved ? (
                  <span className="text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>Using defaults</span>
                ) : null}
              </>
            )}
          </div>
        </div>

        {METRIC_CATEGORIES.map((cat, ci) => {
          const metrics = METRICS.filter((m) => m.category === cat)
          if (!metrics.length) return null
          return (
            <div key={cat}>
              <div className="px-5 pb-2 pt-4 text-xs font-medium uppercase tracking-wide"
                style={{ color: "var(--fg-neutral-subtle)", borderTop: ci ? "1px solid var(--border-neutral-muted)" : "1px solid var(--border-neutral-subtle)" }}>
                {cat}
              </div>
              {metrics.map((m) => (
                <div key={m.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6" style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}>
                  <div className="flex items-start gap-2.5 sm:w-64 sm:shrink-0">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}>
                      <m.icon className="size-4" />
                    </span>
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
                        {m.name}
                        {m.tooltip && <InfoTip text={m.tooltip} />}
                      </span>
                      <span className="text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{m.direction === "higher" ? "Higher is worse" : "Lower is worse"}</span>
                    </div>
                  </div>
                  <div className="min-w-px flex-1">
                    <ThresholdSlider metric={m} warn={policy[m.id].warn} crit={policy[m.id].crit} onChange={(w, c) => setBand(m.id, w, c)} />
                  </div>
                  <div className="flex sm:w-8 sm:shrink-0 sm:justify-end">
                    {(policy[m.id].warn !== m.defaultWarn || policy[m.id].crit !== m.defaultCrit) && (
                      <button type="button" aria-label={`Set ${m.name} to default`} title="Set to default" onClick={() => resetMetric(m.id)}
                        className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]" style={{ color: "var(--fg-neutral-muted)" }}>
                        <RotateCcw className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </Card>

      {/* Section 2 — Alert routing */}
      <AlertRouting />
    </div>
  )
}
