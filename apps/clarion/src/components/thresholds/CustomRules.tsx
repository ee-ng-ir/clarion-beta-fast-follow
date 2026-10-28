import { Lock, Pencil, Plus, Trash2 } from "lucide-react"
import { locationName } from "@ir/mock-data/access"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { METRICS, fmtRange } from "@/data/thresholds"
import { ruleVisibility, type LocationRule, type ThresholdAccess } from "@/data/thresholdRules"

const muted = { color: "var(--fg-neutral-muted)" }
const subtle = { color: "var(--fg-neutral-subtle)" }

/** Custom rules list. Shows each rule as this person is allowed to see it. */
export function CustomRules({
  rules, acc, onNew, onEdit, onDelete,
}: {
  rules: LocationRule[]
  acc: ThresholdAccess
  onNew: () => void
  onEdit: (r: LocationRule) => void
  onDelete: (r: LocationRule) => void
}) {
  const shown = rules.map((r) => ({ r, v: ruleVisibility(r, acc) })).filter((x) => x.v.show)
  const outside = rules.length - shown.length
  const canCreate = acc.mode === "edit"

  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      <div className="flex flex-col px-5 py-4" style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
        <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Custom thresholds by location</h2>
        <span className="text-sm" style={muted}>
          Override the defaults for endpoints in specific locations. A location can only take each metric from one rule.
          Widget users with no location always use the defaults.
        </span>
      </div>

      {shown.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>No custom thresholds yet</p>
          <p className="mt-1 text-sm" style={muted}>Every endpoint you can see uses the defaults.</p>
        </div>
      ) : (
        shown.map(({ r, v }, i) => {
          const overridden = METRICS.filter((m) => m.id in r.overrides)
          return (
            <div key={r.id} className="flex items-start justify-between gap-3 px-5 py-4" style={{ borderTop: i ? "1px solid var(--border-neutral-subtle)" : undefined }}>
              <div className="flex min-w-px flex-col gap-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{r.name}</span>
                  {v.visible.map((id) => <Badge key={id} variant="secondary">{locationName(id)}</Badge>)}
                  {/* never name locations the viewer has no access to */}
                  {v.hidden > 0 && <Badge variant="outline">+{v.hidden} other location{v.hidden > 1 ? "s" : ""}</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {overridden.map((m) => (
                    <Badge key={m.id} variant="secondary" className="gap-1.5">
                      <span style={muted}>{m.name}</span>
                      <span className="font-mono font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{fmtRange(m, r.overrides[m.id].warn, r.overrides[m.id].crit)}</span>
                    </Badge>
                  ))}
                </div>
                <span className="text-xs" style={subtle}>
                  Edited by {r.updatedBy} · {r.updatedAgo}
                  {acc.mode === "edit" && !v.canEdit && " · Read-only: reaches locations outside your access"}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {v.canEdit ? (
                  <>
                    <IconButton label={`Edit ${r.name}`} onClick={() => onEdit(r)}><Pencil className="size-4" /></IconButton>
                    <IconButton label={`Delete ${r.name}`} onClick={() => onDelete(r)}><Trash2 className="size-4" /></IconButton>
                  </>
                ) : (
                  <span className="flex size-8 items-center justify-center" title="You can't change this rule" style={subtle}><Lock className="size-4" /></span>
                )}
              </div>
            </div>
          )
        })
      )}

      {outside > 0 && acc.seeScope !== null && (
        <div className="px-5 py-3 text-xs" style={{ ...subtle, borderTop: "1px solid var(--border-neutral-subtle)" }}>
          {outside} more rule{outside > 1 ? "s apply" : " applies"} only to locations outside your access.
        </div>
      )}

      {canCreate && (
        <button type="button" onClick={onNew}
          className="flex w-full items-center justify-center gap-1.5 px-5 py-3 text-sm font-medium transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
          style={{ borderTop: "1px solid var(--border-neutral-subtle)", color: "var(--fg-link-default)" }}>
          <Plus className="size-4" /> New custom threshold
        </button>
      )}
    </Card>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick}
      className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]" style={muted}>
      {children}
    </button>
  )
}
