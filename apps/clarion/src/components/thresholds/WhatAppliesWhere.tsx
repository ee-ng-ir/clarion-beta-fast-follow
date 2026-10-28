import { Card } from "@/components/ui/card"
import { METRICS, fmtRange, type ThresholdPolicy } from "@/data/thresholds"
import { effectiveFor, inScope, ruleLocations, type LocationRule, type ThresholdAccess } from "@/data/thresholdRules"

/**
 * The resolved thresholds per location — the answer to "why is this endpoint amber?".
 * Highlighted cells come from a custom rule; the rest are the defaults.
 */
export function WhatAppliesWhere({ defaults, rules, acc }: { defaults: ThresholdPolicy; rules: LocationRule[]; acc: ThresholdAccess }) {
  const rows = [
    ...ruleLocations().filter((l) => inScope(acc.seeScope, l.id)).map((l) => ({ id: l.id as string | null, name: l.name, count: l.count })),
    // only people who see every location see widget users without one
    ...(acc.seeScope === null ? [{ id: null, name: "No location", count: undefined }] : []),
  ]
  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      <div className="flex flex-col px-5 py-4" style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
        <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>What applies where</h2>
        <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>Warning / critical per location, after custom thresholds. Highlighted values come from a rule.</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr style={{ color: "var(--fg-neutral-subtle)" }}>
              <th className="px-5 py-2 text-left text-xs font-medium">Location</th>
              {METRICS.map((m) => <th key={m.id} className="px-3 py-2 text-left text-xs font-medium">{m.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const eff = effectiveFor(row.id, defaults, rules)
              return (
                <tr key={row.id ?? "none"} style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}>
                  <td className="whitespace-nowrap px-5 py-2.5">
                    <span className="font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{row.name}</span>
                    {row.count !== undefined && <span className="ml-1.5 font-mono text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{row.count}</span>}
                  </td>
                  {METRICS.map((m) => {
                    const e = eff[m.id]
                    return (
                      <td key={m.id} className="whitespace-nowrap px-3 py-2.5">
                        <span title={e.rule ? `From “${e.rule.name}”` : "Default"}
                          className="rounded px-1.5 py-0.5 font-mono text-xs"
                          style={e.rule
                            ? { background: "var(--bg-info-subtle)", color: "var(--fg-on-info-subtle)", fontWeight: 600 }
                            : { color: "var(--fg-neutral-muted)" }}>
                          {fmtRange(m, e.band.warn, e.band.crit)}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
