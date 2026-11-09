import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { BellOff, BellRing, ChevronRight, Lightbulb, Sparkles, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import type { Endpoint, EndpointStatus } from "@/data/endpoints"
import { ExploringTag } from "../ExploringTag"
import { categoryLabel } from "./catalogue"
import { NOTIFY_RULES, type AlertGroup } from "./groups"
import { ago, duration } from "./format"
import { EnergySaverChip, NotifiedChip, SeveritySplit } from "./bits"
import { sevTone } from "./tone"

const statusVar: Record<EndpointStatus, string> = {
  healthy: "var(--status-healthy)", warning: "var(--status-warning)", critical: "var(--status-critical)", offline: "var(--status-unknown)",
}
const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
const ENDPOINTS_SHOWN = 8

/** Alert group detail: where it is, who's affected and what the evidence suggests. */
export function GroupDrawer({
  group, onClose, onOpenEndpoint,
}: {
  group: AlertGroup | null
  onClose: () => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
}) {
  const [showAll, setShowAll] = useState(false)
  return (
    <Dialog.Root open={!!group} onOpenChange={(o) => { if (!o) { onClose(); setShowAll(false) } }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0" style={{ background: "var(--bg-scrim)" }} />
        <Dialog.Content
          className="fixed right-0 top-0 z-50 flex h-full w-full flex-col overflow-hidden shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:w-[640px] sm:max-w-[95vw]"
          style={{ background: "var(--bg-card)", borderLeft: "1px solid var(--border-neutral-muted)" }}
        >
          {group && <Body g={group} showAll={showAll} setShowAll={setShowAll} onClose={onClose} onOpenEndpoint={onOpenEndpoint} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Body({ g, showAll, setShowAll, onClose, onOpenEndpoint }: {
  g: AlertGroup; showAll: boolean; setShowAll: (v: boolean) => void; onClose: () => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
}) {
  const Icon = g.type.icon
  const tone = sevTone[g.severity]
  const closed = !!g.closed
  const shown = showAll ? g.endpoints : g.endpoints.slice(0, ENDPOINTS_SHOWN)
  const maxLoc = g.locations[0]?.count ?? 1

  return (
    <>
      <div className="flex shrink-0 items-start gap-3 px-5 pb-4 pt-5" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={closed ? { background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" } : { background: tone.bg, color: tone.fg }}>
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Dialog.Title className="text-lg font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{g.title}</Dialog.Title>
            {closed
              ? <Badge variant="success">Closed</Badge>
              : <Badge variant={g.severity === "critical" ? "danger" : "warning"}>{g.severity === "critical" ? "Critical" : "Warning"}</Badge>}
          </div>
          <Dialog.Description className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
            {categoryLabel[g.type.category]} alert group · {closed ? `peaked at ${g.closed!.peak} endpoints` : `${g.endpoints.length} endpoints affected`}
          </Dialog.Description>
          {(g.notifiedMinAgo !== null && !closed) || g.energySaverOn > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {g.notifiedMinAgo !== null && !closed && <NotifiedChip />}
              {g.energySaverOn > 0 && <EnergySaverChip count={g.energySaverOn} of={g.endpoints.length} />}
            </div>
          ) : null}
        </div>
        <button type="button" aria-label="Close" onClick={onClose} className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-[var(--bg-neutral-subtle-hovered)]" style={{ color: "var(--fg-neutral-muted)" }}>
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto" style={{ background: "var(--bg-app)" }}>
        <div className="flex flex-col gap-4 p-5">
          {closed ? (
            <Section title="Summary">
              <p className="text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>
                All {g.closed!.peak} endpoints recovered {ago(g.closed!.minutesAgo)}. The issue lasted {duration(g.closed!.lastedMin)} and peaked at {g.closed!.peak} endpoints in {g.locations[0]?.name}.
              </p>
            </Section>
          ) : (
            <>
              <Section title="At a glance">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                  <Stat label="Endpoints">{g.endpoints.length}</Stat>
                  <Stat label="Severity"><SeveritySplit critical={g.counts.critical} warning={g.counts.warning} /></Stat>
                  <Stat label="Recovered so far">{g.recoveredSoFar} endpoint{g.recoveredSoFar === 1 ? "" : "s"}</Stat>
                  <Stat label="First seen">{ago(g.firstSeenMinAgo)}</Stat>
                  <Stat label="Last seen">{ago(g.lastSeenMinAgo)}</Stat>
                  <Stat label="Recurrence">{g.recurrenceThisWeek === 1 ? "First time this week" : `${g.recurrenceThisWeek} times this week`}</Stat>
                </dl>
              </Section>

              <section className="flex flex-col gap-3 rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)" }}>
                <div className="flex items-center gap-2">
                  <Lightbulb className="size-4" style={{ color: "var(--fg-primary-emphasis)" }} aria-hidden />
                  <h3 className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>What the evidence suggests</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--fg-neutral-emphasis)" }}>{g.evidence}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => toast({ variant: "info", title: "Iris investigation is next in the demo", description: "It will open with this group's evidence already loaded." })}>
                    <Sparkles className="size-4" aria-hidden /> Investigate with Iris
                  </Button>
                  <ExploringTag />
                </div>
              </section>

              <Section title="Notification">
                {g.notifiedMinAgo !== null ? (
                  <p className="flex items-start gap-2 text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>
                    <BellRing className="mt-0.5 size-4 shrink-0" style={{ color: "var(--fg-info-emphasis)" }} aria-hidden />
                    <span>Emailed the service desk {ago(g.notifiedMinAgo)} ({g.notifiedReason}). No more emails about this group for {NOTIFY_RULES.cooldownMin} minutes, however much it grows.</span>
                  </p>
                ) : (
                  <p className="flex items-start gap-2 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
                    <BellOff className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>Not emailed. {g.severity === "warning" ? "Only Critical groups send emails in this release." : `It hasn't reached ${NOTIFY_RULES.minEndpoints} endpoints or lasted ${NOTIFY_RULES.minMinutes} minutes.`}</span>
                  </p>
                )}
              </Section>
            </>
          )}

          <Section title="By location" hint="Where Clarion places each endpoint by its network address, as on the map.">
            <ul className="flex flex-col gap-2">
              {g.locations.slice(0, 8).map((l) => (
                <li key={l.id} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm">
                  <span className="truncate" style={{ color: "var(--fg-neutral-emphasis)" }}>{l.name}</span>
                  <span className="h-2 overflow-hidden rounded-full" style={{ background: "var(--bg-neutral-muted)" }} aria-hidden>
                    <span className="block h-full rounded-full" style={{ width: `${(l.count / maxLoc) * 100}%`, background: closed ? "var(--fg-neutral-subtle)" : tone.bar }} />
                  </span>
                  <span className="font-mono text-xs tabular-nums" style={{ color: "var(--fg-neutral-muted)" }}>{l.count}</span>
                </li>
              ))}
              {g.locations.length > 8 && <li className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>+{g.locations.length - 8} more locations</li>}
            </ul>
          </Section>

          {!closed && (
            <Section title={`Affected endpoints · ${g.endpoints.length}`}>
              <ul className="-mx-2 flex flex-col">
                {shown.map((e, i) => (
                  <li key={e.id}>
                    <button type="button" onClick={() => { onClose(); onOpenEndpoint(g.endpoints, i) }}
                      className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]">
                      <Avatar className="size-8"><AvatarFallback>{initials(e.user)}</AvatarFallback></Avatar>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{e.user}</span>
                        <span className="truncate font-mono text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{e.machine} · {e.locationName} · {e.connection}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
                        <span className="size-1.5 rounded-full" style={{ background: statusVar[e.status] }} aria-hidden />
                        {e.status === "critical" ? "Critical" : "Warning"}
                      </span>
                      <ChevronRight className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--fg-neutral-subtle)" }} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
              {g.endpoints.length > ENDPOINTS_SHOWN && (
                <Button variant="ghost" size="sm" className="self-start" onClick={() => setShowAll(!showAll)}>
                  {showAll ? "Show fewer" : `Show all ${g.endpoints.length}`}
                </Button>
              )}
            </Section>
          )}
        </div>
      </div>
    </>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)" }}>
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{title}</h3>
        {hint && <p className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{label}</dt>
      <dd className="text-sm font-medium tabular-nums" style={{ color: "var(--fg-neutral-emphasis)" }}>{children}</dd>
    </div>
  )
}
