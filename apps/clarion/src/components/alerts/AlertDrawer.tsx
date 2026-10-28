import { useEffect, useState } from "react"
import { useIsMobile } from "@/components/dashboard/MobileNav"
import * as Dialog from "@radix-ui/react-dialog"
import { X, MapPin, Clock, Users, Siren, Wifi, Activity, Gauge, ChevronRight, ChevronUp, ChevronDown, Maximize2, Minimize2, type LucideIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Status } from "@/data/dashboard"
import type { Rollup, RollupCause, Endpoint, EndpointStatus } from "@/data/endpoints"

const causeIcon: Record<RollupCause, LucideIcon> = {
  platform: Siren, loss: Activity, latency: Gauge, jitter: Wifi, other: Activity,
}
const sevTone: Record<Exclude<Status, "healthy">, { bg: string; fg: string }> = {
  critical: { bg: "var(--bg-danger-subtle)", fg: "var(--fg-on-danger-subtle)" },
  warning: { bg: "var(--bg-warning-subtle)", fg: "var(--fg-on-warning-subtle)" },
}
const statusVar: Record<EndpointStatus, string> = {
  healthy: "var(--status-healthy)", warning: "var(--status-warning)", critical: "var(--status-critical)", offline: "var(--status-unknown)",
}
const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

function Meta({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap" style={{ color: "var(--fg-neutral-muted)" }}>
      <Icon className="size-3.5" style={{ color: "var(--fg-neutral-subtle)" }} />{children}
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

export function AlertDrawer({
  rows, index, onIndexChange, open, onOpenChange, onOpenEndpoint, defaultExpanded = false,
}: {
  rows: Rollup[]
  index: number
  onIndexChange: (i: number) => void
  open: boolean
  onOpenChange: (o: boolean) => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
  /** open centered/expanded (used by the alert → issue flow) */
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  // phones: always the full-screen panel — the centred 'expanded' layout is a desktop idea
  const isMobile = useIsMobile()
  // reset the view mode each time the drawer opens
  useEffect(() => { if (open) setExpanded(defaultExpanded) }, [open, defaultExpanded])

  const go = (delta: number) => {
    const next = index + delta
    if (next >= 0 && next < rows.length) onIndexChange(next)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "ArrowDown") { ev.preventDefault(); go(1) }
      if (ev.key === "ArrowUp") { ev.preventDefault(); go(-1) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, index, rows.length])

  const rollup = rows[index]
  if (!rollup) return null
  const Icon = causeIcon[rollup.cause]
  const tone = sevTone[rollup.severity]

  const contentClass = expanded && !isMobile
    ? "fixed left-1/2 top-1/2 z-50 flex h-[92vh] w-[920px] max-w-[96vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
    : "fixed right-0 top-0 z-50 flex h-full w-full flex-col overflow-hidden shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:w-[600px] sm:max-w-[95vw]"

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0" style={{ background: "var(--bg-scrim)" }} />
        <Dialog.Content
          className={contentClass}
          style={{ background: "var(--bg-card)", border: expanded && !isMobile ? "1px solid var(--border-neutral-muted)" : undefined, borderLeft: expanded && !isMobile ? undefined : "1px solid var(--border-neutral-muted)" }}
        >
          {/* utility bar */}
          <div className="flex shrink-0 items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
            <div className="flex items-center gap-1">
              <IconBtn label="Previous alert" onClick={() => go(-1)} disabled={index === 0}><ChevronUp className="size-4" /></IconBtn>
              <IconBtn label="Next alert" onClick={() => go(1)} disabled={index === rows.length - 1}><ChevronDown className="size-4" /></IconBtn>
              <span className="ml-1 inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--fg-neutral-subtle)" }}>
                <Siren className="size-3.5" /> Alert {index + 1} <span style={{ color: "var(--fg-neutral-subtle)" }}>of {rows.length}</span>
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

          {/* header */}
          <div className="shrink-0 px-5 pt-4" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: tone.bg, color: tone.fg }}><Icon className="size-5" /></span>
              <div className="flex min-w-px flex-col">
                <div className="flex items-center gap-2">
                  <Dialog.Title className="truncate text-lg font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{rollup.title}</Dialog.Title>
                  <Badge variant={rollup.severity === "critical" ? "danger" : "warning"}>{cap(rollup.severity)}</Badge>
                </div>
                <Dialog.Description className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>Alert · {rollup.affected} endpoints affected</Dialog.Description>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 pb-4 text-sm">
              <Meta icon={MapPin}>{rollup.locationName}</Meta>
              <Meta icon={Users}>{rollup.affected} impacted</Meta>
              <Meta icon={Clock}>Started {rollup.startedMinAgo}m ago</Meta>
            </div>
          </div>

          {/* impacted endpoints */}
          <div className="min-h-px flex-1 overflow-y-auto" style={{ background: "var(--bg-app)" }}>
            <div className="px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>Impacted endpoints</div>
            <div className="flex flex-col px-2 pb-4">
              {rollup.endpoints.map((e, i) => (
                <button key={e.id} type="button" onClick={() => onOpenEndpoint(rollup.endpoints, i)}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
                  onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}>
                  <Avatar className="size-8"><AvatarFallback>{initials(e.user)}</AvatarFallback></Avatar>
                  <div className="flex min-w-px flex-1 flex-col">
                    <span className="truncate text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{e.user}</span>
                    <span className="truncate font-mono text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{e.machine}</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
                    <span className="size-1.5 rounded-full" style={{ background: statusVar[e.status] }} />
                    {e.primaryIssue ?? "—"}
                  </span>
                  <ChevronRight className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--fg-neutral-subtle)" }} />
                </button>
              ))}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
