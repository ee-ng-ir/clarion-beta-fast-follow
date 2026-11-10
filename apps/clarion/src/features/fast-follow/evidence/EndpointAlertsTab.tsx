import { useMemo, useState } from "react"
import { ArrowLeft, ChevronRight, Lock, Users } from "lucide-react"
import {
  Alert, AlertDescription, AlertTitle, Badge, Button, Card, CardAction, CardContent, CardHeader, CardTitle,
  EmptyState, SegmentedControl, SegmentedControlItem,
} from "@ir/ui"
import type { Endpoint } from "@/data/endpoints"
import { ExploringTag } from "../ExploringTag"
import { openGroup } from "../alerts/store"
import { activeGroups } from "../alerts/groups"
import { sevBadge, sevLabel } from "../alerts/tone"
import { goTo } from "../navigator"
import { IrisMark } from "../iris/IrisMark"
import { openIris } from "../iris/store"
import { RETENTION_DAYS } from "../iris/answers"
import { clockTime, evidenceFor, type EndpointAlert, type Likelihood } from "./evidence"
import { TrendChart } from "./TrendChart"
import { OffNotice } from "../OffNotice"

type Filter = "all" | "active" | "history"

/** Endpoint › Alerts: active alerts and the history of ones that have ended, each opening its evidence. */
export function EndpointAlertsTab({ endpoint, onCloseDrawer }: { endpoint: Endpoint; onCloseDrawer: () => void }) {
  const ev = useMemo(() => evidenceFor(endpoint), [endpoint])
  const [filter, setFilter] = useState<Filter>("all")
  const [openId, setOpenId] = useState<string | null>(null)
  const all = [...ev.active, ...ev.cleared]
  const current = all.find((a) => a.id === openId)

  if (current) return <AlertDetail a={current} endpoint={endpoint} offlineSinceMin={ev.offlineSinceMin} onBack={() => setOpenId(null)} onCloseDrawer={onCloseDrawer} />

  const active = filter !== "history" ? ev.active : []
  const cleared = filter !== "active" ? ev.cleared : []
  return (
    <div className="flex flex-col gap-3">
      {ev.offlineSinceMin !== null && (
        <Alert variant="warning">
          <AlertTitle>Not reporting</AlertTitle>
          <AlertDescription>This endpoint stopped reporting {clockTime(ev.offlineSinceMin).replace(" today", "")}. Evidence from before then is below. Nothing after it was captured.</AlertDescription>
        </Alert>
      )}
      <SegmentedControl aria-label="Filter alerts" size="sm" value={filter} onValueChange={(v) => v && setFilter(v as Filter)} className="self-start">
        <SegmentedControlItem value="all">All</SegmentedControlItem>
        <SegmentedControlItem value="active">Active · {ev.active.length}</SegmentedControlItem>
        <SegmentedControlItem value="history">History · {ev.cleared.length}</SegmentedControlItem>
      </SegmentedControl>

      {active.length > 0 && <ListHeading>Active</ListHeading>}
      {active.map((a) => <AlertCard key={a.id} a={a} onOpen={() => setOpenId(a.id)} />)}
      {filter !== "active" && <OffNotice />}
      {cleared.length > 0 && <ListHeading>History · last 7 days</ListHeading>}
      {cleared.map((a) => <AlertCard key={a.id} a={a} onOpen={() => setOpenId(a.id)} />)}
      {active.length + cleared.length === 0 && (
        <EmptyState size="sm" illustration="issue-alerts" title="No alerts" description={filter === "active" ? "Nothing is wrong on this endpoint right now." : "No alerts on this endpoint in the last 7 days."} />
      )}
      <p className="pt-1 text-body-xs text-content-neutral-subtle">
        Evidence is kept for {RETENTION_DAYS} days (to confirm). Each alert shows what tripped it, the threshold in force at the time, and how long it lasted.
      </p>
    </div>
  )
}

function ListHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-1 text-label-xs text-content-neutral-subtle">{children}</h3>
}

function AlertCard({ a, onOpen }: { a: EndpointAlert; onOpen: () => void }) {
  return (
    <Card size="sm" className="relative transition-colors hover:bg-surface-neutral-subtle-hovered">
      <CardContent className="flex flex-col gap-1.5">
        <span className="flex flex-wrap items-center gap-2">
          <Badge color={sevBadge[a.severity]}>{sevLabel[a.severity]}</Badge>
          {/* the card's one control; the whole card is its hit area via the stretched ::after */}
          <button type="button" onClick={onOpen}
            className="rounded-xs text-start text-label-lg text-content-neutral-emphasis outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-line-focused">
            {a.title}
          </button>
          {!a.active && <Badge>Ended</Badge>}
          <ChevronRight className="ms-auto size-4 text-content-neutral-muted" aria-hidden />
        </span>
        <span className="text-body-md text-content-neutral-emphasis">{a.summary}</span>
        <span className="text-body-sm text-content-neutral-muted">
          {a.active
            ? <>Started {clockTime(a.startedMinAgo)} · ongoing for {a.startedMinAgo} min{a.likelyCauseShort && <> · Likely cause: {a.likelyCauseShort}</>}</>
            : <>{clockTime(a.startedMinAgo)} · lasted {a.lastedMin} min</>}
        </span>
      </CardContent>
    </Card>
  )
}

const likelihoodColor: Record<Likelihood, "danger" | "warning" | "neutral"> = { "Most likely": "danger", Possible: "warning", "Less likely": "neutral" }
const roleClass = { "Main factor": "text-content-danger-emphasis", Contributing: "text-content-warning-emphasis", Normal: "text-content-neutral-muted" } as const

function AlertDetail({ a, endpoint, offlineSinceMin, onBack, onCloseDrawer }: {
  a: EndpointAlert; endpoint: Endpoint; offlineSinceMin: number | null; onBack: () => void; onCloseDrawer: () => void
}) {
  const group = a.groupId ? activeGroups().find((g) => g.id === a.groupId) : null
  const investigate = () => {
    onCloseDrawer()
    openIris({ kind: "alert", endpointId: endpoint.id, alertId: a.id, label: `${a.title} · ${endpoint.user}` }, { id: "summary", label: "What happened?", auto: true })
  }
  return (
    <div className="@container flex flex-col gap-4">
      <Button variant="link" className="self-start" onClick={onBack}><ArrowLeft aria-hidden /> All alerts</Button>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Badge color={sevBadge[a.severity]}>{sevLabel[a.severity]}</Badge>
            {a.title}
            {!a.active && <Badge>Ended</Badge>}
          </CardTitle>
          <CardAction className="flex items-center gap-2">
            <Button size="sm" onClick={investigate}><IrisMark tone="mono" /> Investigate with Iris</Button>
            <ExploringTag />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-body-sm text-content-neutral-muted">
            {a.active ? `Started ${clockTime(a.startedMinAgo)} · ongoing for ${a.startedMinAgo} min` : `${clockTime(a.startedMinAgo)} · lasted ${a.lastedMin} min`}
          </p>
          <div className="flex flex-col gap-1 rounded-md bg-surface-neutral-subtle p-3">
            <span className="text-label-xs text-content-neutral-subtle">What happened</span>
            <p className="text-body-md text-content-neutral-emphasis">{a.whatHappened}</p>
          </div>
          {group && (
            <Button variant="outline" className="justify-start" onClick={() => { onCloseDrawer(); openGroup(group.id); goTo("alerts") }}>
              <Users aria-hidden />
              <span className="text-content-neutral-muted">Part of</span> {group.title}
              <span className="text-content-neutral-muted">· {group.endpoints.length} endpoints</span>
              <span className="ms-auto text-content-link-default">View group</span>
            </Button>
          )}
        </CardContent>
      </Card>

      {a.main && (
        <Card size="sm">
          <CardHeader><CardTitle>How it developed</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <TrendChart s={a.main} severity={a.severity} raisedMinAgo={a.startedMinAgo} title={a.main.name.split(" (")[0]} />
            {a.contributor && (
              <>
                <TrendChart s={a.contributor} severity={a.severity} raisedMinAgo={a.startedMinAgo} title={`${a.contributor.name.split(" (")[0]} · the likely contributor`} />
                <p className="text-body-md text-content-neutral-emphasis">{a.contributor.sentence}</p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {(a.drivers.length > 0 || a.where) && (
        <Card size="sm">
          <CardHeader><CardTitle>{a.drivers.length ? "What drove the score" : "Where the problem is"}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {a.drivers.length > 0 && (
              <dl className="grid grid-cols-3 gap-2">
                {a.drivers.map((d) => (
                  <div key={d.label} className="flex flex-col gap-0.5 rounded-md bg-surface-neutral-subtle p-3">
                    <dt className="text-label-xs text-content-neutral-subtle">{d.label}</dt>
                    <dd className="text-metric-md tabular-nums text-content-neutral-emphasis">{d.value}</dd>
                    <dd className={`text-label-sm ${roleClass[d.role]}`}>{d.role}</dd>
                  </div>
                ))}
              </dl>
            )}
            {a.where && <p className="text-body-md text-content-neutral-emphasis"><span className="text-label-lg">Where: {a.where.label}.</span> {a.where.detail}</p>}
          </CardContent>
        </Card>
      )}

      {a.reading && (
        <Card size="sm">
          <CardHeader><CardTitle>Threshold in force</CardTitle></CardHeader>
          <CardContent className="text-body-md text-content-neutral-emphasis">
            {a.reading.name} was {a.reading.value} against a {a.reading.threshold} {a.severity} threshold when the alert was raised.
            {a.reading.changedSince ? ` The threshold has since changed to ${a.reading.thresholdNow}; this record keeps the one in force at the time.` : " The threshold hasn't changed since."}
          </CardContent>
        </Card>
      )}

      <Card size="sm">
        <CardHeader>
          <CardTitle>At the time of the alert</CardTitle>
          <CardAction><span className="inline-flex items-center gap-1 text-body-xs text-content-neutral-muted"><Lock className="size-3" aria-hidden />Captured {clockTime(a.snapshot.capturedMinAgo)} · doesn't change</span></CardAction>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 @lg:grid-cols-2">
            {a.snapshot.sections.map((s) => (
              <div key={s.title} className="flex flex-col gap-1">
                <dt className="text-label-xs text-content-neutral-subtle">{s.title}</dt>
                {s.rows
                  ? s.rows.map((r) => <dd key={r} className="text-body-md text-content-neutral-emphasis">{r}</dd>)
                  : <dd className="text-body-md italic text-content-neutral-muted">Not captured: the endpoint {offlineSinceMin !== null ? "went offline" : "stopped reporting"} before this was read.</dd>}
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader><CardTitle>Likely causes</CardTitle></CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-3">
            {a.causes.map((c, i) => (
              <li key={c.title} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-neutral-subtle text-label-sm text-content-neutral-muted">{i + 1}</span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2 text-label-lg text-content-neutral-emphasis">{c.title}<Badge color={likelihoodColor[c.likelihood]}>{c.likelihood}</Badge></span>
                  <span className="text-body-md text-content-neutral-muted">{c.why}</span>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Next steps</CardTitle>
          <CardAction><span className="text-body-xs text-content-neutral-muted">From the Clarion alert catalogue</span></CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <ol className="flex list-decimal flex-col gap-1.5 ps-5 text-body-md text-content-neutral-emphasis">
            {a.steps.map((s) => <li key={s}>{s}</li>)}
          </ol>
          <p className="text-body-xs text-content-neutral-muted">Guidance only. Clarion doesn't change anything on the endpoint.</p>
        </CardContent>
      </Card>
    </div>
  )
}
