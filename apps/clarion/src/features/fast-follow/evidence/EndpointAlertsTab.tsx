import { useMemo, useState } from "react"
import { ArrowLeft, ChevronRight, CloudOff, Lock, Sparkles, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Endpoint } from "@/data/endpoints"
import { ExploringTag } from "../ExploringTag"
import { openGroup } from "../alerts/store"
import { activeGroups } from "../alerts/groups"
import { goTo } from "../navigator"
import { openIris } from "../iris/store"
import { RETENTION_DAYS } from "../iris/answers"
import { clockTime, evidenceFor, type EndpointAlert, type Likelihood } from "./evidence"
import { TrendChart } from "./TrendChart"

type Filter = "all" | "active" | "cleared"

/** Endpoint › Alerts: active and recently cleared alerts, each opening its evidence. */
export function EndpointAlertsTab({ endpoint, onCloseDrawer }: { endpoint: Endpoint; onCloseDrawer: () => void }) {
  const ev = useMemo(() => evidenceFor(endpoint), [endpoint])
  const [filter, setFilter] = useState<Filter>("all")
  const [openId, setOpenId] = useState<string | null>(null)
  const all = [...ev.active, ...ev.cleared]
  const current = all.find((a) => a.id === openId)

  if (current) return <AlertDetail a={current} endpoint={endpoint} offlineSinceMin={ev.offlineSinceMin} onBack={() => setOpenId(null)} onCloseDrawer={onCloseDrawer} />

  const shown = filter === "active" ? ev.active : filter === "cleared" ? ev.cleared : all
  return (
    <div className="flex flex-col gap-3">
      {ev.offlineSinceMin !== null && <OfflineNote mins={ev.offlineSinceMin} />}
      <div role="tablist" aria-label="Filter alerts" className="flex w-fit rounded-lg p-0.5" style={{ background: "var(--bg-neutral-subtle)" }}>
        {([["all", "All"], ["active", `Active · ${ev.active.length}`], ["cleared", `Cleared · ${ev.cleared.length}`]] as [Filter, string][]).map(([f, l]) => (
          <button key={f} role="tab" type="button" aria-selected={filter === f} onClick={() => setFilter(f)}
            className="h-7 rounded-md px-2.5 text-xs font-medium"
            style={filter === f ? { background: "var(--bg-card)", color: "var(--fg-neutral-emphasis)", boxShadow: "0 1px 2px rgb(0 0 0 / 0.06)" } : { color: "var(--fg-neutral-muted)" }}>
            {l}
          </button>
        ))}
      </div>
      {ev.active.length > 0 && filter !== "cleared" && <ListHeading>Active</ListHeading>}
      {shown.filter((a) => a.active).map((a) => <AlertCard key={a.id} a={a} onOpen={() => setOpenId(a.id)} />)}
      {ev.cleared.length > 0 && filter !== "active" && <ListHeading>Cleared · last 7 days</ListHeading>}
      {shown.filter((a) => !a.active).map((a) => <AlertCard key={a.id} a={a} onOpen={() => setOpenId(a.id)} />)}
      {shown.length === 0 && <p className="py-10 text-center text-sm" style={{ color: "var(--fg-neutral-muted)" }}>No alerts on this endpoint in the last 7 days.</p>}
      <p className="pt-1 text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>
        Evidence is kept for {RETENTION_DAYS} days (to confirm). Each alert shows what tripped it, the threshold in force at the time, and how long it lasted.
      </p>
    </div>
  )
}

function ListHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>{children}</h3>
}

function SevBadge({ a }: { a: EndpointAlert }) {
  return <Badge variant={a.severity === "critical" ? "danger" : "warning"}>{a.severity === "critical" ? "Critical" : "Warning"}</Badge>
}

function AlertCard({ a, onOpen }: { a: EndpointAlert; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen}
      className="group flex w-full flex-col gap-1.5 rounded-xl p-4 text-left transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)", opacity: a.active ? 1 : 0.92 }}>
      <span className="flex items-center gap-2">
        <SevBadge a={a} />
        <span className="font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{a.title}</span>
        {!a.active && <Badge variant="secondary">Cleared</Badge>}
        <ChevronRight className="ml-auto size-4 opacity-40 transition-opacity group-hover:opacity-100" aria-hidden style={{ color: "var(--fg-neutral-muted)" }} />
      </span>
      <span className="text-sm leading-relaxed" style={{ color: "var(--fg-neutral-emphasis)" }}>{a.summary}</span>
      <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
        {a.active
          ? <>Started {clockTime(a.startedMinAgo)} · ongoing for {a.startedMinAgo} min{a.likelyCauseShort && <> · Likely cause: {a.likelyCauseShort}</>}</>
          : <>{clockTime(a.startedMinAgo)} · lasted {a.lastedMin} min</>}
      </span>
    </button>
  )
}

function OfflineNote({ mins }: { mins: number }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl p-3 text-sm" style={{ background: "var(--bg-warning-subtle)", border: "1px solid var(--border-warning-muted)", color: "var(--fg-on-warning-subtle)" }}>
      <CloudOff className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>This endpoint stopped reporting {clockTime(mins).replace(" today", "")}. Evidence from before then is below. Nothing after it was captured.</span>
    </div>
  )
}

const likelihoodTone: Record<Likelihood, "danger" | "warning" | "secondary"> = { "Most likely": "danger", Possible: "warning", "Less likely": "secondary" }

function AlertDetail({ a, endpoint, offlineSinceMin, onBack, onCloseDrawer }: {
  a: EndpointAlert; endpoint: Endpoint; offlineSinceMin: number | null; onBack: () => void; onCloseDrawer: () => void
}) {
  const group = a.groupId ? activeGroups().find((g) => g.id === a.groupId) : null
  const raisedAt = -a.startedMinAgo
  const investigate = () => {
    onCloseDrawer()
    openIris({ kind: "alert", endpointId: endpoint.id, alertId: a.id, label: `${a.title} · ${endpoint.user}` }, { id: "summary", label: "What happened?", auto: true })
  }
  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="inline-flex w-fit items-center gap-1 text-sm font-medium hover:underline" style={{ color: "var(--fg-link-default)" }}>
        <ArrowLeft className="size-4" aria-hidden /> All alerts
      </button>

      {/* header */}
      <Card>
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <SevBadge a={a} />
              <h3 className="text-lg font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{a.title}</h3>
              {!a.active && <Badge variant="secondary">Cleared</Badge>}
            </div>
            <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
              {a.active ? `Started ${clockTime(a.startedMinAgo)} · ongoing for ${a.startedMinAgo} min` : `${clockTime(a.startedMinAgo)} · lasted ${a.lastedMin} min`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={investigate}><Sparkles className="size-4" aria-hidden /> Investigate with Iris</Button>
            <ExploringTag />
          </div>
        </div>
        <div className="flex flex-col gap-1 rounded-lg p-3" style={{ background: "var(--bg-neutral-subtle)" }}>
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>What happened</span>
          <p className="text-sm leading-relaxed" style={{ color: "var(--fg-neutral-emphasis)" }}>{a.whatHappened}</p>
        </div>
        {group && (
          <button type="button" onClick={() => { onCloseDrawer(); openGroup(group.id); goTo("alerts") }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
            style={{ border: "1px solid var(--border-neutral-muted)" }}>
            <Users className="size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} aria-hidden />
            <span style={{ color: "var(--fg-neutral-muted)" }}>Part of</span>
            <span className="font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{group.title}</span>
            <span style={{ color: "var(--fg-neutral-muted)" }}>· {group.endpoints.length} endpoints</span>
            <span className="ml-auto font-medium" style={{ color: "var(--fg-link-default)" }}>View group</span>
          </button>
        )}
      </Card>

      {/* how it developed */}
      {a.main && (
        <Card title="How it developed">
          <TrendChart s={a.main} raisedAt={Math.max(raisedAt, a.main.points[0].t)} />
          {a.contributor && (
            <>
              <TrendChart s={a.contributor} raisedAt={Math.max(raisedAt, a.contributor.points[0].t)} tone="var(--fg-primary-emphasis)" />
              <p className="text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>{a.contributor.sentence}</p>
            </>
          )}
        </Card>
      )}

      {/* what drove the score */}
      {(a.drivers.length > 0 || a.where) && (
        <Card title={a.drivers.length ? "What drove the score" : "Where the problem is"}>
          {a.drivers.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {a.drivers.map((d) => (
                <div key={d.label} className="flex flex-col gap-0.5 rounded-lg p-3" style={{ background: "var(--bg-neutral-subtle)" }}>
                  <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>{d.label}</span>
                  <span className="font-mono text-lg tabular-nums" style={{ color: "var(--fg-neutral-emphasis)" }}>{d.value}</span>
                  <span className="text-xs" style={{ color: d.role === "Main factor" ? "var(--fg-danger-emphasis)" : d.role === "Contributing" ? "var(--fg-warning-emphasis)" : "var(--fg-neutral-muted)" }}>{d.role}</span>
                </div>
              ))}
            </div>
          )}
          {a.where && <p className="text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}><span className="font-medium">Where: {a.where.label}.</span> {a.where.detail}</p>}
        </Card>
      )}

      {/* reading vs threshold in force (record of the moment) */}
      {a.reading && (
        <Card title="Threshold in force">
          <p className="text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>
            {a.reading.name} was {a.reading.value} against a {a.reading.threshold} {a.severity} threshold when the alert was raised.
            {a.reading.changedSince
              ? ` The threshold has since changed to ${a.reading.thresholdNow}; this record keeps the one in force at the time.`
              : " The threshold hasn't changed since."}
          </p>
        </Card>
      )}

      {/* snapshot */}
      <Card title="At the time of the alert" right={<span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--fg-neutral-muted)" }}><Lock className="size-3" aria-hidden />Captured {clockTime(a.snapshot.capturedMinAgo)} · doesn't change</span>}>
        <dl className="grid gap-3 sm:grid-cols-2">
          {a.snapshot.sections.map((s) => (
            <div key={s.title} className="flex flex-col gap-1">
              <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>{s.title}</dt>
              {s.rows
                ? s.rows.map((r) => <dd key={r} className="text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>{r}</dd>)
                : <dd className="text-sm italic" style={{ color: "var(--fg-neutral-muted)" }}>Not captured: the endpoint {offlineSinceMin !== null ? "went offline" : "stopped reporting"} before this was read.</dd>}
            </div>
          ))}
        </dl>
      </Card>

      {/* likely causes + next steps */}
      <Card title="Likely causes">
        <ol className="flex flex-col gap-2.5">
          {a.causes.map((c, i) => (
            <li key={c.title} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium" style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}>{i + 1}</span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{c.title}<Badge variant={likelihoodTone[c.likelihood]}>{c.likelihood}</Badge></span>
                <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{c.why}</span>
              </div>
            </li>
          ))}
        </ol>
      </Card>
      <Card title="Next steps" right={<span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>From the Clarion alert catalogue</span>}>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>
          {a.steps.map((s) => <li key={s}>{s}</li>)}
        </ol>
        <p className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>Guidance only. Clarion doesn't change anything on the endpoint.</p>
      </Card>
    </div>
  )
}

function Card({ title, right, children }: { title?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)" }}>
      {title && (
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{title}</h4>
          {right && <span className="ml-auto">{right}</span>}
        </div>
      )}
      {children}
    </section>
  )
}
