import { useEffect, useMemo, useState } from "react"
import { useFeedVersion } from "@/data/agentFeed"
import { Monitor, MapPin, CloudOff } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/endpoints/status"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { getEndpointDetail } from "@/data/endpointDetail"
import { formatLastSeen } from "@/lib/utils"
import type { Endpoint } from "@/data/endpoints"
import { NetworkTab, PlatformsTab, DevicesTab, SystemTab } from "./tabs"

const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

const TABS = [
  { id: "network", label: "Network" },
  { id: "platforms", label: "UC/CC platforms" },
  { id: "devices", label: "Devices" },
  { id: "system", label: "System" },
]

// Land on the tab that gives the endpoint's alert its context.
function eventTab(e: Endpoint): string {
  const s = (e.event ?? e.primaryIssue ?? "").toLowerCase()
  if (!s) return "network"
  if (/(unreachable|genesys|teams|zoom|webex|cxone|platform)/.test(s)) return "platforms"
  if (/(audio|headset|camera|usb|driver|bluetooth|mic|speaker|peripheral|device)/.test(s)) return "devices"
  if (/(cpu|memory|disk|battery)/.test(s)) return "system"
  return "network"
}

function MetaItem({ icon: Icon, children }: { icon: typeof Monitor; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap" style={{ color: "var(--fg-neutral-muted)" }}>
      <Icon className="size-3.5" style={{ color: "var(--fg-neutral-subtle)" }} />
      {children}
    </span>
  )
}

function StaleBanner({ mins }: { mins: number }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl px-6 py-12 text-center" style={{ background: "var(--bg-warning-subtle)", border: "1px solid var(--border-warning-muted)" }}>
      <CloudOff className="size-6" style={{ color: "var(--fg-warning-emphasis)" }} />
      <span className="text-sm font-semibold" style={{ color: "var(--fg-on-warning-subtle)" }}>No recent data from this endpoint</span>
      <span className="max-w-sm text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
        Last seen {formatLastSeen(mins)}. The endpoint may be powered off, disconnected, or the Clarion widget isn’t running. Live readings return as soon as it reconnects.
      </span>
    </div>
  )
}

/** Inline endpoint drilldown (same content as the drawer, no modal chrome). */
export function EndpointDetailPanel({ endpoint }: { endpoint: Endpoint }) {
  const feedVersion = useFeedVersion()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const detail = useMemo(() => getEndpointDetail(endpoint), [endpoint, feedVersion])
  const [tab, setTab] = useState(() => eventTab(endpoint))
  // re-land on the contextual tab whenever a different endpoint is selected
  useEffect(() => { setTab(eventTab(endpoint)) }, [endpoint.id])

  const stale = endpoint.lastSeenMinAgo > 5
  const offline = endpoint.status === "offline"

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* identity header */}
      <div className="shrink-0 px-5 pt-4" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-10"><AvatarFallback>{offline ? <Monitor className="size-5" /> : initials(endpoint.user)}</AvatarFallback></Avatar>
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-2.5">
                <span className={`truncate text-lg font-semibold ${offline ? "font-mono" : ""}`} style={{ color: "var(--fg-neutral-emphasis)" }}>{offline ? endpoint.machine : endpoint.user}</span>
                <StatusBadge status={endpoint.status} />
              </div>
              {!offline && <span className="truncate font-mono text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{endpoint.machine}</span>}
            </div>
          </div>
          {/* location + connection moved to the right of the identity to save a line */}
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm">
            <MetaItem icon={MapPin}>{detail.locationDetail}</MetaItem>
            <MetaItem icon={Monitor}>{endpoint.connection}</MetaItem>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-3">
          <TabsList className="h-auto gap-4 bg-transparent p-0">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.id} value={t.id}
                className="relative rounded-none border-b-2 border-transparent bg-transparent px-0.5 pb-2.5 text-sm font-medium data-[state=active]:border-[var(--border-focused)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--fg-neutral-emphasis)] data-[state=active]:shadow-none"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5" style={{ background: "var(--bg-app)" }}>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsContent value="network">{stale ? <StaleBanner mins={endpoint.lastSeenMinAgo} /> : <NetworkTab d={detail} />}</TabsContent>
          <TabsContent value="platforms">{stale ? <StaleBanner mins={endpoint.lastSeenMinAgo} /> : <PlatformsTab d={detail} />}</TabsContent>
          <TabsContent value="devices">{stale ? <StaleBanner mins={endpoint.lastSeenMinAgo} /> : <DevicesTab d={detail} />}</TabsContent>
          <TabsContent value="system">{stale ? <StaleBanner mins={endpoint.lastSeenMinAgo} /> : <SystemTab d={detail} />}</TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
