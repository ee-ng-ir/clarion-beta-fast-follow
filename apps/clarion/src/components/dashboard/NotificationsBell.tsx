import { useEffect, useRef, useState } from "react"
import { Bell, BellOff, X, Check, ArrowRight } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { initialAlerts, incomingAlerts, MUTE_DURATIONS, type AlertNotification, type AlertSeverity } from "@/data/alerts"

const sevDot: Record<AlertSeverity, string> = {
  critical: "var(--status-critical)",
  warning: "var(--status-warning)",
  info: "var(--status-info)",
}
const ago = (m: number) => (m <= 0 ? "just now" : `${m}m ago`)

export function NotificationsBell({
  onNavigate,
  onViewIssues,
}: {
  onNavigate: (a: AlertNotification) => void
  onViewIssues: () => void
}) {
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState<AlertNotification[]>(initialAlerts)
  const [muted, setMuted] = useState<Record<string, string>>({})
  const incomingIdx = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // simulate real-time arrivals: first after 10s, then one every 60s
  useEffect(() => {
    const push = () => {
      const tmpl = incomingAlerts[incomingIdx.current % incomingAlerts.length]
      incomingIdx.current += 1
      setAlerts((prev) => [{ ...tmpl, id: `live-${Date.now()}`, read: false, minutesAgo: 0 }, ...prev])
    }
    const t = setTimeout(() => {
      push()
      intervalRef.current = setInterval(push, 60000)
    }, 10000)
    return () => { clearTimeout(t); if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const visible = alerts.filter((a) => !muted[a.type])
  const unread = visible.some((a) => !a.read)

  const markRead = (id: string) => setAlerts((p) => p.map((a) => (a.id === id ? { ...a, read: true } : a)))
  const markAllRead = () => setAlerts((p) => p.map((a) => ({ ...a, read: true })))
  const dismiss = (id: string) => setAlerts((p) => p.filter((a) => a.id !== id))
  const mute = (type: string, label: string) => setMuted((m) => ({ ...m, [type]: label }))

  const choose = (a: AlertNotification) => {
    markRead(a.id)
    setOpen(false)
    onNavigate(a)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Alerts"
          className="relative flex size-8 shrink-0 items-center justify-center rounded-full transition-colors"
          style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle)")}
        >
          <Bell className="size-4" />
          {unread && (
            <span
              className="absolute right-1.5 top-1.5 size-2 rounded-full"
              style={{ background: "var(--status-critical)", border: "1.5px solid var(--bg-card)" }}
            />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[380px] overflow-hidden p-0">
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>Alerts</span>
          {unread && (
            <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "var(--fg-link-default)" }}>
              <Check className="size-3.5" /> Mark all read
            </button>
          )}
        </div>

        <div className="flex max-h-[360px] flex-col overflow-y-auto py-1">
          {visible.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm" style={{ color: "var(--fg-neutral-muted)" }}>You're all caught up.</div>
          ) : (
            visible.map((a) => (
              <div key={a.id} className="group relative flex items-start gap-3 px-4 py-3 transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: sevDot[a.severity] }} />
                <button type="button" onClick={() => choose(a)} className="flex min-w-px flex-1 flex-col text-left">
                  <span className="truncate text-sm" style={{ color: "var(--fg-neutral-emphasis)", fontWeight: a.read ? 400 : 600 }}>{a.title}</span>
                  <span className="truncate text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{a.detail} · {ago(a.minutesAgo)}</span>
                </button>
                {!a.read && <span className="mt-2 size-1.5 shrink-0 rounded-full" style={{ background: "var(--bg-primary-emphasis)" }} />}
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" aria-label="Mute this type" className="flex size-6 items-center justify-center rounded-md hover:bg-[var(--bg-neutral-subtle-pressed)]" style={{ color: "var(--fg-neutral-muted)" }}>
                        <BellOff className="size-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Mute "{a.type}"</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {MUTE_DURATIONS.map((d) => (
                        <DropdownMenuItem key={d.value} onSelect={() => mute(a.type, d.label)}>For {d.label}</DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <button type="button" aria-label="Dismiss" onClick={() => dismiss(a.id)} className="flex size-6 items-center justify-center rounded-md hover:bg-[var(--bg-neutral-subtle-pressed)]" style={{ color: "var(--fg-neutral-muted)" }}>
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {Object.keys(muted).length > 0 && (
          <div className="px-4 py-2 text-xs" style={{ borderTop: "1px solid var(--border-neutral-subtle)", color: "var(--fg-neutral-subtle)" }}>
            Muted: {Object.entries(muted).map(([t, l]) => `${t} (${l})`).join(", ")}
          </div>
        )}

        <button type="button" onClick={() => { setOpen(false); onViewIssues() }}
          className="flex w-full items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
          style={{ borderTop: "1px solid var(--border-neutral-muted)", color: "var(--fg-neutral-emphasis)" }}>
          View all issues <ArrowRight className="size-4" />
        </button>
      </PopoverContent>
    </Popover>
  )
}
