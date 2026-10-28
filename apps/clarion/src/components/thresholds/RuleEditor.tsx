import { useEffect, useRef, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X, Plus, Search, Trash2, Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Chip } from "@/components/ui/chip"
import { Popover, PopoverAnchor, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { ThresholdSlider } from "./ThresholdSlider"
import { locationName } from "@ir/mock-data/access"
import { METRICS, metricById, fmtRange, type ThresholdPolicy } from "@/data/thresholds"
import { inScope, ruleLocations, type LocationRule } from "@/data/thresholdRules"

// Location × metric → the rule that already sets it (one owner per pair).
type Claims = Record<string, Record<string, LocationRule>>
type LocationOption = { id: string; name: string; count: number }

// the baseline a custom rule inherits from = the saved tenant defaults
const bandOf = (baseline: ThresholdPolicy, id: string) => {
  const m = metricById(id)!
  return baseline[id] ?? { warn: m.defaultWarn, crit: m.defaultCrit }
}

type Draft = { name: string; scopes: string[]; overrides: ThresholdPolicy }
const emptyDraft = (): Draft => ({ name: "", scopes: [], overrides: {} })
const draftFromRule = (r: LocationRule): Draft => JSON.parse(JSON.stringify({ name: r.name, scopes: r.locations, overrides: r.overrides }))

/* ---------------- scope multi-select ---------------- */
function ScopePicker({ value, onChange, claims, selectedMetrics, editScope, container }: { value: string[]; onChange: (v: string[]) => void; claims: Claims; selectedMetrics: string[]; editScope: string[] | null; container?: HTMLElement | null }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  // only the locations this person administers are offered at all
  const options: LocationOption[] = ruleLocations().filter((l) => inScope(editScope, l.id))
  const selected = value.map((id) => options.find((o) => o.id === id) ?? { id, name: locationName(id), count: 0 })
  const filtered = options.filter((s) => s.name.toLowerCase().includes(q.trim().toLowerCase()))
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          role="combobox" aria-expanded={open} aria-haspopup="listbox" aria-label="Apply to locations" tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true) } }}
          className="flex min-h-9 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm shadow-xs transition-colors hover:border-[var(--border-input-hovered)]"
          style={{ border: "1px solid var(--border-input-default)", background: "var(--bg-input-default)" }}
        >
          {selected.length === 0 && <span className="px-1" style={{ color: "var(--fg-neutral-muted)" }}>Select locations…</span>}
          {selected.map((s) => (
            <Chip key={s.id} size="sm" onRemove={() => toggle(s.id)} removeLabel={`Remove ${s.name}`}>{s.name}</Chip>
          ))}
          <ChevronDown className="ml-auto size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} />
        </div>
      </PopoverAnchor>
      <PopoverContent container={container} align="start" className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
        <div className="flex items-center gap-1.5 border-b px-2.5 py-2" style={{ borderColor: "var(--border-neutral-subtle)" }}>
          <Search className="size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search locations…"
            className="min-w-px flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--fg-neutral-muted)]" style={{ color: "var(--fg-neutral-emphasis)" }} />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          <div className="px-2 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>Locations you manage</div>
          {filtered.map((s) => {
            const on = value.includes(s.id)
            // only a conflict if one of THIS rule's chosen metrics is already set for this location by another rule
            const regionClaims = claims[s.id]
            const conflictMetric = !on && regionClaims ? selectedMetrics.find((mid) => regionClaims[mid]) : undefined
            if (conflictMetric) {
              const ruleName = regionClaims![conflictMetric].name
              const metricName = metricById(conflictMetric)?.name ?? conflictMetric
              return (
                <div key={s.id} aria-disabled className="flex w-full cursor-not-allowed items-center gap-2 rounded-md px-2 py-1.5 text-sm opacity-60" title={`${metricName} is already set for ${s.name} by “${ruleName}”`}>
                  <span className="flex size-4 shrink-0 items-center justify-center rounded" style={{ background: "var(--bg-input-disabled)", border: "1px solid var(--border-input-default)" }} />
                  <span className="flex-1 truncate" style={{ color: "var(--fg-neutral-muted)" }}>{s.name}</span>
                  <span className="shrink-0 text-xs italic" style={{ color: "var(--fg-neutral-subtle)" }}>{metricName} · {ruleName}</span>
                </div>
              )
            }
            return (
              <button key={s.id} type="button" role="option" aria-selected={on} onClick={() => toggle(s.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]">
                <span className="flex size-4 shrink-0 items-center justify-center rounded" style={{ background: on ? "var(--bg-primary-emphasis)" : "var(--bg-input-default)", border: `1px solid ${on ? "var(--bg-primary-emphasis)" : "var(--border-input-default)"}` }}>
                  {on && <Check className="size-3" style={{ color: "var(--fg-on-primary-emphasis)" }} />}
                </span>
                <span className="flex-1" style={{ color: "var(--fg-neutral-emphasis)" }}>{s.name}</span>
                <span className="font-mono text-xs font-semibold" style={{ color: "var(--fg-neutral-muted)" }}>{s.count.toLocaleString()}</span>
              </button>
            )
          })}
          {filtered.length === 0 && <div className="px-2 py-3 text-center text-sm" style={{ color: "var(--fg-neutral-muted)" }}>No locations match.</div>}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ---------------- metric override picker (additive) ---------------- */
function MetricPicker({ taken, onAdd, baseline, claims, selectedScopes, container }: { taken: string[]; onAdd: (id: string) => void; baseline: ThresholdPolicy; claims: Claims; selectedScopes: string[]; container?: HTMLElement | null }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const available = METRICS.filter((m) => !taken.includes(m.id) && m.name.toLowerCase().includes(q.trim().toLowerCase()))
  const allTaken = taken.length === METRICS.length

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ("") }}>
      <PopoverTrigger asChild>
        <button type="button" disabled={allTaken}
          className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm shadow-xs transition-colors hover:border-[var(--border-input-hovered)] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ border: "1px solid var(--border-input-default)", background: "var(--bg-input-default)", color: "var(--fg-neutral-muted)" }}>
          <Plus className="size-4 shrink-0" />
          <span className="flex-1">{allTaken ? "All metrics overridden" : "Add a metric to override"}</span>
          <ChevronDown className="size-4 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent container={container} align="start" className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
        <div className="flex items-center gap-1.5 border-b px-2.5 py-2" style={{ borderColor: "var(--border-neutral-subtle)" }}>
          <Search className="size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search metrics…"
            className="min-w-px flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--fg-neutral-muted)]" style={{ color: "var(--fg-neutral-emphasis)" }} />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {available.map((m) => {
            // disable if this metric is already governed for one of the locations this rule targets
            let claimedBy: string | undefined, claimedRegion: string | undefined
            for (const sid of selectedScopes) { const c = claims[sid]?.[m.id]; if (c) { claimedBy = c.name; claimedRegion = sid; break } }
            if (claimedBy) {
              const regionName = locationName(claimedRegion!)
              return (
                <div key={m.id} aria-disabled className="flex w-full cursor-not-allowed items-center gap-2 rounded-md px-2 py-1.5 text-sm opacity-60" title={`${m.name} is already set for ${regionName} by “${claimedBy}”`}>
                  <m.icon className="size-4 shrink-0" style={{ color: "var(--fg-neutral-subtle)" }} />
                  <span className="flex-1" style={{ color: "var(--fg-neutral-muted)" }}>{m.name}</span>
                  <span className="shrink-0 text-xs italic" style={{ color: "var(--fg-neutral-subtle)" }}>In use · {claimedBy}</span>
                </div>
              )
            }
            return (
              <button key={m.id} type="button" role="option" onClick={() => { onAdd(m.id); setOpen(false); setQ("") }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]">
                <m.icon className="size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} />
                <span className="flex-1" style={{ color: "var(--fg-neutral-emphasis)" }}>{m.name}</span>
                <span className="font-mono text-xs font-semibold" style={{ color: "var(--fg-neutral-muted)" }}>{fmtRange(m, bandOf(baseline, m.id).warn, bandOf(baseline, m.id).crit)}</span>
              </button>
            )
          })}
          {available.length === 0 && <div className="px-2 py-3 text-center text-sm" style={{ color: "var(--fg-neutral-muted)" }}>No metrics match.</div>}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ---------------- panel ---------------- */
export function RuleEditor({
  open, rule, baseline, claims, editScope, author, onOpenChange, onSave,
}: {
  open: boolean
  rule: LocationRule | null
  baseline: ThresholdPolicy // saved tenant defaults the custom rule inherits from
  claims: Claims // location id → metric id → the rule that already governs it (excluding this one)
  editScope: string[] | null // locations this person may put in a rule; null = all
  author: string
  onOpenChange: (o: boolean) => void
  onSave: (rule: LocationRule) => void
}) {
  const [name, setName] = useState("")
  const [scopes, setScopes] = useState<string[]>([])
  const [overrides, setOverrides] = useState<ThresholdPolicy>({})
  const [panelEl, setPanelEl] = useState<HTMLDivElement | null>(null)
  const [nameTouched, setNameTouched] = useState(false)
  const initialRef = useRef("")

  useEffect(() => {
    if (!open) return
    const d = rule ? draftFromRule(rule) : emptyDraft()
    setName(d.name); setScopes(d.scopes); setOverrides(d.overrides)
    setNameTouched(false)
    initialRef.current = JSON.stringify(d)
  }, [open, rule])

  const dirty = JSON.stringify({ name, scopes, overrides }) !== initialRef.current
  // required to save: a name, at least one location, and at least one override
  const nameError = nameTouched && name.trim().length === 0
  const canSave = name.trim().length > 0 && scopes.length > 0 && Object.keys(overrides).length > 0

  const requestClose = (next: boolean) => {
    if (!next && dirty && !window.confirm("Discard unsaved changes to this rule?")) return
    onOpenChange(next)
  }

  const addMetric = (id: string) => {
    if (!metricById(id)) return
    const b = bandOf(baseline, id) // start from the inherited baseline, not engineering defaults
    setOverrides((o) => ({ ...o, [id]: { warn: b.warn, crit: b.crit } }))
  }
  const removeMetric = (id: string) => setOverrides((o) => { const { [id]: _drop, ...rest } = o; return rest })
  const updateMetric = (id: string, warn: number, crit: number) => setOverrides((o) => ({ ...o, [id]: { warn, crit } }))

  const save = () => {
    onSave({ id: rule?.id ?? `rule-${Date.now()}`, name: name.trim(), locations: scopes, overrides, updatedBy: author, updatedAgo: "just now" })
    onOpenChange(false)
  }

  const overriddenIds = METRICS.filter((m) => m.id in overrides).map((m) => m.id)
  const atDefault = (id: string) => {
    const o = overrides[id]; if (!o) return true
    const b = bandOf(baseline, id)
    return o.warn === b.warn && o.crit === b.crit
  }

  return (
    <Dialog.Root open={open} onOpenChange={requestClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" style={{ background: "var(--bg-scrim)" }} />
        <Dialog.Content
          ref={setPanelEl}
          className="fixed right-0 top-0 z-50 flex h-full w-full flex-col shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right sm:w-[580px] sm:max-w-[95vw]"
          style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border-neutral-muted)" }}
        >
          {/* header */}
          <div className="flex shrink-0 items-start justify-between gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
            <div className="flex min-w-px flex-col">
              <Dialog.Title className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{rule ? "Edit custom threshold" : "New custom threshold"}</Dialog.Title>
              <Dialog.Description className="truncate text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
                {name.trim() || "Override the default thresholds for specific locations."}
              </Dialog.Description>
            </div>
            <button type="button" aria-label="Close" onClick={() => requestClose(false)}
              className="flex size-8 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]" style={{ color: "var(--fg-neutral-muted)" }}>
              <X className="size-4" />
            </button>
          </div>

          {/* body */}
          <div className="flex min-h-px flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
            {/* name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rule-name" className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>
                Name<span aria-hidden style={{ color: "var(--fg-danger-emphasis)" }}> *</span>
              </label>
              <Input id="rule-name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setNameTouched(true)}
                placeholder="e.g. Manila outsourcer" required aria-required aria-invalid={nameError || undefined}
                aria-describedby={nameError ? "rule-name-error" : undefined} />
              {nameError && <span id="rule-name-error" className="text-xs" style={{ color: "var(--fg-danger-emphasis)" }}>Name is required.</span>}
            </div>

            {/* overrides — chosen first so the location picker can disable only the locations that conflict on these metrics */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>
                Threshold overrides<span aria-hidden style={{ color: "var(--fg-danger-emphasis)" }}> *</span>
              </span>
              <MetricPicker taken={overriddenIds} onAdd={addMetric} baseline={baseline} claims={claims} selectedScopes={scopes} container={panelEl} />

              {overriddenIds.length === 0 ? (
                <div className="flex flex-col items-center gap-1 rounded-xl px-6 py-10 text-center" style={{ border: "1px dashed var(--border-neutral-emphasis)" }}>
                  <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>No overrides yet</span>
                  <span className="max-w-xs text-sm" style={{ color: "var(--fg-neutral-muted)" }}>All metrics use the default thresholds until you add an override. Use the combobox above to start.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {overriddenIds.map((id) => {
                    const m = metricById(id)!
                    const band = overrides[id]
                    return (
                      <div key={id} className="rounded-xl p-4" style={{ background: "var(--bg-neutral-subtle)", border: "1px solid var(--border-neutral-subtle)" }}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <m.icon className="size-4" style={{ color: "var(--fg-neutral-muted)" }} />
                            <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{m.name}</span>
                            <span className="font-mono text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>Default {fmtRange(m, bandOf(baseline, id).warn, bandOf(baseline, id).crit)}</span>
                            {atDefault(id) && <span className="text-xs italic" style={{ color: "var(--fg-neutral-subtle)" }}>· matches default</span>}
                          </div>
                          <button type="button" aria-label={`Remove ${m.name} override`} onClick={() => removeMetric(id)}
                            className="flex size-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-neutral-subtle-pressed)]" style={{ color: "var(--fg-neutral-muted)" }}>
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <div className="mt-1 px-1">
                          <ThresholdSlider metric={m} warn={band.warn} crit={band.crit} onChange={(w, c) => updateMetric(id, w, c)} />
                        </div>
                      </div>
                    )
                  })}
                  <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
                    Any metric you don’t override inherits the default thresholds.
                  </p>
                </div>
              )}
            </div>

            {/* scope — a location is disabled only where one of the chosen metrics is already governed by another rule */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>
                Apply to<span aria-hidden style={{ color: "var(--fg-danger-emphasis)" }}> *</span>
              </span>
              <ScopePicker value={scopes} onChange={setScopes} claims={claims} selectedMetrics={overriddenIds} editScope={editScope} container={panelEl} />
              <span className="text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>
                Uses each widget user’s Iris location, set in Administration. The detected city on the map doesn’t count.
              </span>
            </div>
          </div>

          {/* footer */}
          <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-3" style={{ borderTop: "1px solid var(--border-neutral-muted)" }}>
            <Button variant="secondary" onClick={() => requestClose(false)}>Cancel</Button>
            <Button onClick={save} disabled={!canSave}>Save rule</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
