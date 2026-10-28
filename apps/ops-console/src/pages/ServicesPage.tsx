import { useMemo, useState, type ReactNode } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import {
  Alert, AlertDescription, Badge, Card, CardContent, CardDescription, CardHeader, CardHeaderText, CardTitle,
  Field, FieldLabel, SegmentedControl, SegmentedControlItem, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import { PageTop } from "@/components/PageTop"
import { ChoiceSelect, Mono, StatusBadge } from "@/components/ui"
import { cx, fmtDate } from "@/lib/format"
import { dependencies, services, tofuEnvs, type ServiceDef } from "@/data/catalog"

const NODE_W = 184
const NODE_H = 60
const COL_W = 228
const ROW_H = 92
const PAD = 16

/**
 * Services — the live dependency map for the stage, overlaid with OpenTofu
 * state (is it deployed in this env?) and Lattice reachability. The live page
 * draws it on a dark nebula; here it is Picasso surfaces and lines, so it
 * reads the same in both themes and passes contrast.
 */
export function ServicesPage() {
  const envs = tofuEnvs.filter((e) => e.kind !== "global")
  const [env, setEnv] = useState("dev")
  const [view, setView] = useState<"map" | "list">("map")
  const [selected, setSelected] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const state = envs.find((e) => e.env === env)!
  const deployed = (id: string) => id in state.modules
  const focus = hover ?? selected

  const pos = useMemo(() => {
    const byCol = new Map<number, ServiceDef[]>()
    services.forEach((s) => byCol.set(s.col, [...(byCol.get(s.col) ?? []), s]))
    const maxRows = Math.max(...[...byCol.values()].map((c) => c.length))
    const out: Record<string, { x: number; y: number }> = {}
    byCol.forEach((list, col) => {
      const offset = ((maxRows - list.length) * ROW_H) / 2
      list.forEach((s, i) => (out[s.id] = { x: PAD + col * COL_W, y: PAD + offset + i * ROW_H }))
    })
    return { out, w: PAD * 2 + 4 * COL_W + NODE_W, h: PAD * 2 + (maxRows - 1) * ROW_H + NODE_H }
  }, [])

  const related = (id: string) => new Set([id, ...dependencies.filter(([a, b]) => a === id || b === id).flat()])
  const lit = focus ? related(focus) : null
  const sel = services.find((s) => s.id === selected)

  return (
    <div className="flex flex-col gap-gutter">
      <PageTop
        title="Services"
        description="Which services call which in this stage, whether each one has OpenTofu state in the chosen environment, and which are reachable on Lattice."
        actions={
          <SegmentedControl value={view} onValueChange={(v) => setView(v as "map" | "list")} aria-label="View" size="sm">
            <SegmentedControlItem value="map">Map</SegmentedControlItem>
            <SegmentedControlItem value="list">List</SegmentedControlItem>
          </SegmentedControl>
        }
      />
      <Alert variant="info">
        <AlertDescription>This page has its own environment picker. The one in the top bar only lists environments with IAM on Lattice; this one lists every environment with state. For the raw state, see Tofu modules.</AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-end gap-4">
        <Field className="w-72">
          <FieldLabel>Environment</FieldLabel>
          <ChoiceSelect value={env} onChange={setEnv} aria-label="Environment" options={envs.map((e) => ({ value: e.env, label: e.env, detail: `${e.kind} · ${Object.keys(e.modules).length} svc` }))} />
        </Field>
        <div className="flex gap-4 pb-2 text-body-sm text-content-neutral-muted">
          <span><span className="text-label-md text-content-neutral-emphasis">{services.length}</span> services</span>
          <span><span className="text-label-md text-content-neutral-emphasis">{dependencies.length}</span> dependencies</span>
          <span><span className="text-label-md text-content-neutral-emphasis">{services.filter((s) => deployed(s.id)).length}</span> deployed in {env}</span>
        </div>
      </div>

      <div className={cx("grid gap-gutter", sel && "@7xl:grid-cols-[minmax(0,1fr)_20rem]")}>
        {view === "map" ? (
          <Card className="overflow-hidden">
            <div className="overflow-auto bg-surface-canvas" role="group" aria-label={`Service dependency map for ${env}`}>
              <div className="relative" style={{ width: pos.w, height: pos.h }}>
                <svg className="absolute inset-0" width={pos.w} height={pos.h} aria-hidden>
                  <defs>
                    <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M0,0 L8,4 L0,8 z" className="fill-line-neutral-emphasis" />
                    </marker>
                    <marker id="arrow-on" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M0,0 L8,4 L0,8 z" className="fill-line-primary-emphasis" />
                    </marker>
                  </defs>
                  {dependencies.map(([a, b]) => {
                    const p = pos.out[a], q = pos.out[b]
                    const x1 = p.x + NODE_W, y1 = p.y + NODE_H / 2, x2 = q.x - 2, y2 = q.y + NODE_H / 2
                    const mid = (x1 + x2) / 2
                    const on = !!focus && (a === focus || b === focus)
                    return (
                      <path
                        key={a + b}
                        d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`}
                        fill="none"
                        markerEnd={on ? "url(#arrow-on)" : "url(#arrow)"}
                        className={cx("transition-opacity motion-reduce:transition-none", on ? "stroke-line-primary-emphasis" : "stroke-line-neutral-emphasis", focus && !on && "opacity-15")}
                        strokeWidth={on ? 2 : 1}
                      />
                    )
                  })}
                </svg>
                {services.map((s) => {
                  const p = pos.out[s.id]
                  const dim = lit && !lit.has(s.id)
                  const up = deployed(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={selected === s.id}
                      onClick={() => setSelected(selected === s.id ? null : s.id)}
                      onMouseEnter={() => setHover(s.id)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(s.id)}
                      onBlur={() => setHover(null)}
                      style={{ left: p.x, top: p.y, width: NODE_W, height: NODE_H }}
                      className={cx(
                        "absolute flex cursor-pointer flex-col justify-center gap-1 rounded-lg border bg-surface-card px-3 text-start shadow-xs outline-none transition-[opacity,border-color] motion-reduce:transition-none",
                        "focus-visible:ring-2 focus-visible:ring-line-focused",
                        selected === s.id ? "border-line-primary-emphasis ring-1 ring-line-primary-emphasis" : "border-line-neutral-muted hover:border-line-neutral-emphasis",
                        !up && "border-dashed",
                        dim && "opacity-40",
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <Mono className="truncate text-content-neutral-emphasis">{s.id}</Mono>
                        {s.lattice ? <Badge color="info" variant="subtle">Lattice</Badge> : null}
                      </span>
                      <span className="flex items-center gap-1.5 text-body-xs text-content-neutral-muted">
                        <span aria-hidden className={cx("size-2 rounded-full", up ? "bg-status-healthy" : "bg-status-unknown")} />
                        {up ? `Deployed · ${fmtDate(state.modules[s.id])}` : "No state"}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-line-neutral-muted px-4 py-2 text-body-xs text-content-neutral-muted">
              <span className="inline-flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-full bg-status-healthy" /> Has state</span>
              <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-3 w-5 rounded-sm border border-dashed border-line-neutral-emphasis" /> No state in {env}</span>
              <span>Arrows point from caller to dependency. Select a service to see its connections.</span>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <Table size="sm">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead align="start" className="border-t-0">Service</TableHead>
                  <TableHead align="start" className="border-t-0">State in {env}</TableHead>
                  <TableHead align="start" className="border-t-0">Lattice</TableHead>
                  <TableHead className="border-t-0" numeric>Calls</TableHead>
                  <TableHead className="border-t-0" numeric>Called by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer last:border-b-0" selected={selected === s.id} onClick={() => setSelected(s.id)}>
                    <TableCell><Mono>{s.id}</Mono><div className="text-body-xs text-content-neutral-muted">{s.description}</div></TableCell>
                    <TableCell>{deployed(s.id) ? <StatusBadge status="deployed" /> : <StatusBadge status="no-state" />}</TableCell>
                    <TableCell>{s.lattice ? <Badge color="info">Reachable</Badge> : <span className="text-content-neutral-subtle">—</span>}</TableCell>
                    <TableCell numeric>{dependencies.filter(([a]) => a === s.id).length}</TableCell>
                    <TableCell numeric>{dependencies.filter(([, b]) => b === s.id).length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {sel ? (
        <Card size="sm" className="self-start" ref={(n: HTMLDivElement | null) => n?.scrollIntoView({ block: "nearest", behavior: "smooth" })}>
            <>
              <CardHeader>
                <CardHeaderText>
                  <CardTitle><Mono className="text-heading-sm">{sel.id}</Mono></CardTitle>
                  <CardDescription>{sel.description}</CardDescription>
                </CardHeaderText>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {deployed(sel.id) ? <StatusBadge status="deployed" /> : <StatusBadge status="no-state" />}
                  {sel.lattice ? <Badge color="info">Lattice</Badge> : null}
                </div>
                <Deps title="Calls" icon={<ArrowRight aria-hidden />} ids={dependencies.filter(([a]) => a === sel.id).map(([, b]) => b)} onPick={setSelected} />
                <Deps title="Called by" icon={<ArrowLeft aria-hidden />} ids={dependencies.filter(([, b]) => b === sel.id).map(([a]) => a)} onPick={setSelected} />
                <div className="flex flex-col gap-2">
                  <h3 className="text-label-md text-content-neutral-emphasis">State by environment</h3>
                  <ul className="flex flex-col gap-1 text-body-sm">
                    {envs.map((e) => (
                      <li key={e.env} className="flex items-center justify-between gap-2">
                        <Mono>{e.env}</Mono>
                        <span className={sel.id in e.modules ? "text-content-neutral-emphasis" : "text-content-neutral-subtle"}>{sel.id in e.modules ? fmtDate(e.modules[sel.id]) : "No state"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </>
        </Card>
        ) : null}
      </div>
    </div>
  )
}

function Deps({ title, icon, ids, onPick }: { title: string; icon: ReactNode; ids: string[]; onPick: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-center gap-1.5 text-label-md text-content-neutral-emphasis [&_svg]:size-4">{icon}{title} <span className="text-content-neutral-muted">{ids.length}</span></h3>
      {ids.length ? (
        <div className="flex flex-wrap gap-1">
          {ids.map((id) => (
            <button key={id} type="button" onClick={() => onPick(id)} className="cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-line-focused">
              <Badge variant="outline" className="font-mono hover:bg-surface-neutral-subtle-hovered">{id}</Badge>
            </button>
          ))}
        </div>
      ) : <span className="text-body-sm text-content-neutral-subtle">None</span>}
    </div>
  )
}
