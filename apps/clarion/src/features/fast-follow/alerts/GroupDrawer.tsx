import { useState } from "react"
import { BellOff, BellRing, Lightbulb, Sparkles } from "lucide-react"
import {
  Avatar, AvatarFallback, Badge, Button, Card, CardContent, CardHeader, CardTitle,
  Drawer, DrawerActions, DrawerBody, DrawerCloseButton, DrawerContent, DrawerDescription, DrawerHeader,
  DrawerHeading, DrawerIcon, DrawerTitle, DrawerTitleGroup,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import type { Endpoint } from "@/data/endpoints"
import { ExploringTag } from "../ExploringTag"
import { openIris } from "../iris/store"
import { categoryLabel } from "./catalogue"
import { notifyRules, type AlertGroup } from "./groups"
import { ago, duration } from "./format"
import { AlertIcon, EnergySaverBadge, NotifiedBadge, SeveritySplit } from "./bits"
import { sevBadge, sevLabel } from "./tone"

const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
const ENDPOINTS_SHOWN = 8

/** Alert group detail: where it is, who's affected and what the evidence suggests. Picasso Drawer, wide. */
export function GroupDrawer({
  group, onClose, onOpenEndpoint,
}: {
  group: AlertGroup | null
  onClose: () => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
}) {
  const [showAll, setShowAll] = useState(false)
  return (
    <Drawer open={!!group} onOpenChange={(o) => { if (!o) { onClose(); setShowAll(false) } }}>
      <DrawerContent size="wide">
        {group && <Body g={group} showAll={showAll} setShowAll={setShowAll} onClose={onClose} onOpenEndpoint={onOpenEndpoint} />}
      </DrawerContent>
    </Drawer>
  )
}

function Body({ g, showAll, setShowAll, onClose, onOpenEndpoint }: {
  g: AlertGroup; showAll: boolean; setShowAll: (v: boolean) => void; onClose: () => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
}) {
  const closed = !!g.closed
  const shown = showAll ? g.endpoints : g.endpoints.slice(0, ENDPOINTS_SHOWN)

  return (
    <>
      <DrawerHeader type="title">
        <DrawerHeading>
          <DrawerIcon><AlertIcon icon={g.type.icon} severity={g.severity} closed={closed} size="lg" /></DrawerIcon>
          <DrawerTitleGroup>
            <DrawerTitle className="flex flex-wrap items-center gap-2">
              {g.title}
              {closed ? <Badge color="success">Closed</Badge> : <Badge color={sevBadge[g.severity]}>{sevLabel[g.severity]}</Badge>}
            </DrawerTitle>
            <DrawerDescription>
              {categoryLabel[g.type.category]} alert group · {closed ? `peaked at ${g.closed!.peak} endpoints` : `${g.endpoints.length} endpoints affected`}
            </DrawerDescription>
          </DrawerTitleGroup>
          <DrawerActions><DrawerCloseButton /></DrawerActions>
        </DrawerHeading>
      </DrawerHeader>

      <DrawerBody className="@container flex flex-col gap-4">
        {(g.notifiedMinAgo !== null && !closed) || g.energySaverOn > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {g.notifiedMinAgo !== null && !closed && <NotifiedBadge />}
            {g.energySaverOn > 0 && <EnergySaverBadge count={g.energySaverOn} of={g.endpoints.length} />}
          </div>
        ) : null}

        {closed ? (
          <Card size="sm">
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent className="text-body-md text-content-neutral-emphasis">
              All {g.closed!.peak} endpoints recovered {ago(g.closed!.minutesAgo)}. The issue lasted {duration(g.closed!.lastedMin)} and peaked at {g.closed!.peak} endpoints in {g.locations[0]?.name}.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card size="sm">
              <CardHeader><CardTitle>At a glance</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 @lg:grid-cols-3">
                  <Stat label="Endpoints"><span className="text-metric-md">{g.endpoints.length}</span></Stat>
                  <Stat label="Severity"><SeveritySplit critical={g.counts.critical} warning={g.counts.warning} /></Stat>
                  <Stat label="Recovered so far">{g.recoveredSoFar} endpoint{g.recoveredSoFar === 1 ? "" : "s"}</Stat>
                  <Stat label="First seen">{ago(g.firstSeenMinAgo)}</Stat>
                  <Stat label="Last seen">{ago(g.lastSeenMinAgo)}</Stat>
                  <Stat label="Recurrence">{g.recurrenceThisWeek === 1 ? "First time this week" : `${g.recurrenceThisWeek} times this week`}</Stat>
                </dl>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lightbulb className="size-4 text-content-primary-emphasis" aria-hidden />What the evidence suggests</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-body-md text-content-neutral-emphasis">{g.evidence}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    onClose()
                    openIris({ kind: "group", groupId: g.id, label: `${g.title} · ${g.endpoints.length} endpoints` }, { id: "summary", label: "What's happening?", auto: true })
                  }}>
                    <Sparkles aria-hidden /> Investigate with Iris
                  </Button>
                  <ExploringTag />
                </div>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader><CardTitle>Notification</CardTitle></CardHeader>
              <CardContent>
                {g.notifiedMinAgo !== null ? (
                  <p className="flex items-start gap-2 text-body-md text-content-neutral-emphasis">
                    <BellRing className="mt-0.5 size-4 shrink-0 text-content-info-emphasis" aria-hidden />
                    <span>Emailed the service desk {ago(g.notifiedMinAgo)} ({g.notifiedReason}). No more emails about this group for {notifyRules().cooldownMin} minutes, however much it grows.</span>
                  </p>
                ) : (
                  <p className="flex items-start gap-2 text-body-md text-content-neutral-muted">
                    <BellOff className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>Not emailed. {g.severity === "warning" ? "Only Critical groups send emails in this release." : !notifyRules().enabled || !notifyRules().recipients.length ? "Proactive notifications are off for this tenancy." : `It hasn't reached ${notifyRules().minEndpoints} endpoints or lasted ${notifyRules().minMinutes} minutes.`}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Card size="sm">
          <CardHeader>
            <CardTitle>By location</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-body-sm text-content-neutral-muted">Where Clarion places each endpoint by its network address, as on the map.</p>
            <Table size="sm">
              <TableHeader><TableRow><TableHead align="start">Location</TableHead><TableHead numeric>Endpoints</TableHead></TableRow></TableHeader>
              <TableBody>
                {g.locations.map((l) => (
                  <TableRow key={l.id}><TableCell align="start">{l.name}</TableCell><TableCell numeric>{l.count}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {!closed && (
          <Card size="sm">
            <CardHeader><CardTitle>Affected endpoints · {g.endpoints.length}</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Table size="sm">
                <TableHeader><TableRow><TableHead align="start">User / machine</TableHead><TableHead align="start">Location</TableHead><TableHead align="start">Severity</TableHead></TableRow></TableHeader>
                <TableBody>
                  {shown.map((e, i) => (
                    <TableRow key={e.id} className="cursor-pointer" onClick={() => { onClose(); onOpenEndpoint(g.endpoints, i) }}>
                      <TableCell align="start">
                        <div className="flex items-center gap-2">
                          <Avatar size="sm"><AvatarFallback>{initials(e.user)}</AvatarFallback></Avatar>
                          <div className="flex min-w-0 flex-col">
                            <button type="button" onClick={(ev) => { ev.stopPropagation(); onClose(); onOpenEndpoint(g.endpoints, i) }}
                              className="truncate rounded-xs text-start text-label-md text-content-neutral-emphasis outline-none hover:underline focus-visible:ring-2 focus-visible:ring-line-focused">
                              {e.user}
                            </button>
                            <span className="truncate font-mono text-body-xs text-content-neutral-muted">{e.machine}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell align="start" className="text-content-neutral-muted">{e.locationName} · {e.connection}</TableCell>
                      <TableCell align="start"><Badge color={e.status === "critical" ? "danger" : "warning"} dot>{e.status === "critical" ? "Critical" : "Warning"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {g.endpoints.length > ENDPOINTS_SHOWN && (
                <Button variant="ghost" size="sm" className="self-start" onClick={() => setShowAll(!showAll)}>
                  {showAll ? "Show fewer" : `Show all ${g.endpoints.length}`}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </DrawerBody>
    </>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-label-sm text-content-neutral-muted">{label}</dt>
      <dd className="text-body-md text-content-neutral-emphasis tabular-nums">{children}</dd>
    </div>
  )
}
