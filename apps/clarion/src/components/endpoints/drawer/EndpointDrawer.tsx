import { useEffect, useMemo, useState } from "react"
import { useFeedVersion } from "@/data/agentFeed"
import { useIsMobile } from "@/components/dashboard/MobileNav"
import * as Dialog from "@radix-ui/react-dialog"
import { Monitor, MapPin, ChevronUp, ChevronDown, Maximize2, Minimize2, X, ArrowLeft, CloudOff } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/endpoints/status"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { getEndpointDetail } from "@/data/endpointDetail"
import { formatLastSeen } from "@/lib/utils"
import type { Endpoint } from "@/data/endpoints"
import { NetworkTab, PlatformsTab, DevicesTab, SystemTab } from "./tabs"
import { EndpointAlertsTab } from "@/features/fast-follow/evidence/EndpointAlertsTab"
import { CountBadge } from "@/features/fast-follow/CountBadge"
import { HeadsetComplianceBadge } from "@/features/fast-follow/headsets/HeadsetBits"
import { useHeadsetsVersion } from "@/features/fast-follow/headsets/headsets"
import { activeAlertCount } from "@/features/fast-follow/evidence/evidence"

const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

function MetaItem({ icon: Icon, children }: { icon: typeof Monitor; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap" style={{ color: "var(--fg-neutral-muted)" }}>
      <Icon className="size-3.5" style={{ color: "var(--fg-neutral-subtle)" }} />
      {children}
    </span>
  )
}

function IconBtn({ children, label, onClick, disabled }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button" aria-label={label} onClick={onClick} disabled={disabled}
      className="flex size-8 items-center justify-center rounded-md transition-colors disabled:opacity-40"
      style={{ color: "var(--fg-neutral-muted)" }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)" }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
    >
      {children}
    </button>
  )
}

// Fast Follow: Alerts (with evidence) comes first
const TABS = [
  { id: "alerts", label: "Alerts" },
  { id: "network", label: "Network" },
  { id: "platforms", label: "UC/CC platforms" },
  { id: "devices", label: "Devices" },
  { id: "system", label: "System" },
]

// Open the drilldown on the tab that gives the device's event its context.
function eventTab(e?: Endpoint): string {
  if (e && e.status !== "healthy") return "alerts" // Fast Follow: land on the alert's evidence
  const s = (e?.event ?? e?.primaryIssue ?? "").toLowerCase()
  if (!s) return "network"
  if (/(unreachable|genesys|teams|zoom|webex|cxone|platform)/.test(s)) return "platforms"
  if (/(audio|headset|camera|usb|driver|bluetooth|mic|speaker|peripheral|device)/.test(s)) return "devices"
  if (/(cpu|memory|disk|battery)/.test(s)) return "system"
  return "network" // latency / packet loss / jitter / Wi-Fi
}

/* Shown in place of a tab's content when telemetry is older than 5 minutes,
   so we never present stale readings as if they were live. */
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

export function EndpointDrawer({
  rows, index, onIndexChange, open, onOpenChange, onBack, backLabel,
}: {
  rows: Endpoint[]
  index: number
  onIndexChange: (i: number) => void
  open: boolean
  onOpenChange: (o: boolean) => void
  onBack?: () => void
  backLabel?: string
}) {
  const [expanded, setExpanded] = useState(false)
  // phones: always the full-screen panel — the centred 'expanded' layout is a desktop idea
  const isMobile = useIsMobile()
  const [tab, setTab] = useState("network")
  const e = rows[index]
  const feedVersion = useFeedVersion()
  const { approved, version: headsetsVersion } = useHeadsetsVersion() // Fast Follow
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const detail = useMemo(() => (e ? getEndpointDetail(e) : null), [e, feedVersion, headsetsVersion])

  // on open: reset to the side drawer and land on the tab that explains the event
  useEffect(() => { if (open) { setExpanded(false); setTab(eventTab(rows[index])) } }, [open])

  const go = (delta: number) => {
    const next = index + delta
    if (next >= 0 && next < rows.length) onIndexChange(next)
  }
  const cycleTab = (delta: number) =>
    setTab((cur) => TABS[(TABS.findIndex((t) => t.id === cur) + delta + TABS.length) % TABS.length].id)

  useEffect(() => {
    if (!open) return
    const onKey = (ev: KeyboardEvent) => {
      // ↑/↓ flick between users; ←/→ move between the card's tabs. Tab is left to
      // the browser/focus-trap for accessibility.
      if (ev.key === "ArrowDown") { ev.preventDefault(); go(1) }
      else if (ev.key === "ArrowUp") { ev.preventDefault(); go(-1) }
      else if (ev.key === "ArrowRight") { ev.preventDefault(); cycleTab(1) }
      else if (ev.key === "ArrowLeft") { ev.preventDefault(); cycleTab(-1) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, index, rows.length])

  if (!e || !detail) return null
  const stale = e.lastSeenMinAgo > 5
  const offline = e.status === "offline"

  const contentClass = expanded && !isMobile
    ? "fixed left-1/2 top-1/2 z-50 flex h-[94vh] w-[1120px] max-w-[96vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
    : "fixed bottom-0 right-0 z-50 flex w-full flex-col overflow-hidden shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right sm:w-[640px] sm:max-w-[95vw]"

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          data-ff-offset="" className="fixed inset-x-0 bottom-0 z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          style={{ background: "var(--bg-scrim)" }}
        />
        <Dialog.Content
          className={contentClass}
          data-ff-offset={expanded && !isMobile ? undefined : ""}
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)" }}
        >
          {/* utility bar */}
          <div className="flex shrink-0 items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
            <div className="flex items-center gap-1">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="mr-1 flex h-8 items-center gap-1.5 rounded-md pl-1.5 pr-2.5 text-xs font-medium transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
                  style={{ color: "var(--fg-neutral-muted)" }}
                >
                  <ArrowLeft className="size-4" />
                  <span className="max-w-[160px] truncate">{backLabel ?? "Back"}</span>
                </button>
              )}
              <IconBtn label="Previous endpoint" onClick={() => go(-1)} disabled={index === 0}><ChevronUp className="size-4" /></IconBtn>
              <IconBtn label="Next endpoint" onClick={() => go(1)} disabled={index === rows.length - 1}><ChevronDown className="size-4" /></IconBtn>
              <span className="ml-1 text-xs font-medium tabular-nums" style={{ color: "var(--fg-neutral-muted)" }}>
                {index + 1} <span style={{ color: "var(--fg-neutral-subtle)" }}>of {rows.length.toLocaleString()}</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              {/* phones: the drawer is already full screen, so expand has nothing to do */}
              <span className="hidden md:contents">
                <IconBtn label={expanded ? "Collapse" : "Expand"} onClick={() => setExpanded((v) => !v)}>
                  {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                </IconBtn>
              </span>
              <IconBtn label="Close" onClick={() => onOpenChange(false)}><X className="size-4" /></IconBtn>
            </div>
          </div>

          {/* identity header */}
          <div className="shrink-0 px-5 pt-4" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
            {/* Desktop: badge beside the name, location + connection on the right.
                Phones: the name gets the width — badge pinned to the end of the row,
                location + connection drop to their own line under the machine. */}
            <div className="flex items-center justify-between gap-4 max-md:items-start max-md:gap-3">
              <div className="flex min-w-0 items-center gap-3 max-md:flex-1">
                <Avatar className="size-10 shrink-0"><AvatarFallback>{offline ? <Monitor className="size-5" /> : initials(e.user)}</AvatarFallback></Avatar>
                <div className="flex min-w-0 flex-col max-md:flex-1">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Dialog.Title className={`truncate text-lg font-semibold ${offline ? "font-mono" : ""}`} style={{ color: "var(--fg-neutral-emphasis)" }}>{offline ? e.machine : e.user}</Dialog.Title>
                    <StatusBadge status={e.status} className="max-md:hidden" />
                  </div>
                  {!offline && <span className="truncate font-mono text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{e.machine}</span>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:hidden">
                    <MetaItem icon={MapPin}>{detail.locationDetail}</MetaItem>
                    <MetaItem icon={Monitor}>{e.connection}</MetaItem>
                  </div>
                </div>
              </div>
              <StatusBadge status={e.status} className="mt-1 shrink-0 md:hidden" />
              {/* location + connection on the right of the identity to save a line (desktop) */}
              <div className="hidden shrink-0 flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm md:flex">
                <MetaItem icon={MapPin}>{detail.locationDetail}</MetaItem>
                <MetaItem icon={Monitor}>{e.connection}</MetaItem>
              </div>
            </div>
            <Dialog.Description className="sr-only">Endpoint details for {e.machine}</Dialog.Description>

            <Tabs value={tab} onValueChange={setTab} className="mt-3">
              <TabsList className="h-auto gap-4 bg-transparent p-0">
                {TABS.map((t) => (
                  <TabsTrigger
                    key={t.id} value={t.id}
                    className="relative rounded-none border-b-2 border-transparent bg-transparent px-0.5 pb-2.5 text-sm font-medium data-[state=active]:border-[var(--border-focused)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--fg-neutral-emphasis)] data-[state=active]:shadow-none"
                  >
                    {t.label}
                    {t.id === "alerts" && activeAlertCount(e) > 0 && (
                      <CountBadge count={activeAlertCount(e)} tone={e.status === "critical" ? "danger" : "warning"} label={`, ${activeAlertCount(e)} active alert`} className="ms-1.5" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* body */}
          <div className="min-h-px flex-1 overflow-y-auto px-5 py-5" style={{ background: "var(--bg-app)" }}>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsContent value="alerts"><EndpointAlertsTab key={e.id} endpoint={e} onCloseDrawer={() => onOpenChange(false)} /></TabsContent>
              <TabsContent value="network">{stale ? <StaleBanner mins={e.lastSeenMinAgo} /> : <NetworkTab d={detail} />}</TabsContent>
              <TabsContent value="platforms">{stale ? <StaleBanner mins={e.lastSeenMinAgo} /> : <PlatformsTab d={detail} />}</TabsContent>
              <TabsContent value="devices">{stale ? <StaleBanner mins={e.lastSeenMinAgo} /> : <DevicesTab d={detail} tagFor={(name) => <HeadsetComplianceBadge approved={approved} deviceName={name} />} />}</TabsContent>
              <TabsContent value="system">{stale ? <StaleBanner mins={e.lastSeenMinAgo} /> : <SystemTab d={detail} />}</TabsContent>
            </Tabs>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
