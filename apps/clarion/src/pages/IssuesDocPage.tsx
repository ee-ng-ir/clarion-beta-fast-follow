import { Siren, Activity, Gauge, Wifi, Cpu, Bell, ArrowRight, Info, type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      <div className="px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ borderBottom: "1px solid var(--border-neutral-subtle)", color: "var(--fg-neutral-subtle)" }}>
        {title}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  )
}

const sevPill = (label: string, bg: string, fg: string) => (
  <span className="rounded-md px-1.5 py-0.5 text-xs font-semibold uppercase" style={{ background: bg, color: fg }}>{label}</span>
)

interface IssueType { icon: LucideIcon; name: string; tone: string; detect: string; sev: string; eg: string }
const issueTypes: IssueType[] = [
  { icon: Siren, name: "Platform outage", tone: "var(--status-critical)", detect: "A UC/CC platform (Genesys, Teams, Zoom, Webex) unreachable from affected users.", sev: "Always critical", eg: "Genesys Cloud unreachable · Manila CC" },
  { icon: Activity, name: "Elevated packet loss", tone: "var(--status-warning)", detect: "Packet loss over threshold — warn ≥ 1%, crit ≥ 3%.", sev: "Warning or critical", eg: "Packet loss 7.2%" },
  { icon: Gauge, name: "High latency", tone: "var(--status-warning)", detect: "Round-trip latency over threshold — warn ≥ 80ms, crit ≥ 150ms.", sev: "Warning or critical", eg: "Latency 212ms" },
  { icon: Wifi, name: "Network jitter", tone: "var(--status-warning)", detect: "Latency variation over threshold — warn ≥ 30ms, crit ≥ 50ms.", sev: "Warning or critical", eg: "Wi-Fi · jitter 81ms" },
  { icon: Cpu, name: "Isolated endpoint alert", tone: "var(--status-unknown)", detect: "A problem specific to one endpoint that doesn't pertain to others. Affects 1 endpoint.", sev: "Per endpoint", eg: "High CPU · Headset disconnected · Agent app crash" },
]

interface AlertType { label: string; bg: string; fg: string; desc: string }
const alertTypes: AlertType[] = [
  { label: "Critical", bg: "var(--bg-danger-subtle)", fg: "var(--fg-on-danger-subtle)", desc: "A severe, real-time event — opens or escalates a critical Alert." },
  { label: "Warning", bg: "var(--bg-warning-subtle)", fg: "var(--fg-on-warning-subtle)", desc: "A degradation crossing a warning threshold — opens or updates a warning Alert." },
  { label: "Info", bg: "var(--bg-info-subtle)", fg: "var(--fg-on-info-subtle)", desc: "An informational event, e.g. recovery (“endpoint back online”) — can resolve an Alert." },
]

function FlowBox({ icon: Icon, title, sub }: { icon: LucideIcon; title: string; sub: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-4 text-center" style={{ background: "var(--bg-neutral-subtle)", border: "1px solid var(--border-neutral-subtle)" }}>
      <Icon className="size-5" style={{ color: "var(--fg-neutral-muted)" }} />
      <span className="text-sm font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{title}</span>
      <span className="text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{sub}</span>
    </div>
  )
}

export function IssuesDocPage() {
  return (
    <div className="flex flex-col gap-4">
      <Card className="w-full rounded-xl p-5">
        <div className="flex items-center gap-2">
          <Badge variant="info" className="uppercase tracking-wide">Internal</Badge>
          <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>Product development · not shipped in the built product</span>
        </div>
        <h2 className="mt-3 text-heading-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>Alerts model</h2>
        <p className="mt-1 text-body-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          How real-time notifications become alerts, the types of each, and how an alert's severity is calculated from the endpoints it rolls up.
        </p>
      </Card>

      {/* Flow */}
      <SectionCard title="How it fits together">
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <FlowBox icon={Bell} title="Notification" sub="real-time event (bell)" />
          <ArrowRight className="mx-auto size-4 rotate-90 sm:rotate-0" style={{ color: "var(--fg-neutral-subtle)" }} />
          <FlowBox icon={Siren} title="Alert" sub="persistent rollup" />
          <ArrowRight className="mx-auto size-4 rotate-90 sm:rotate-0" style={{ color: "var(--fg-neutral-subtle)" }} />
          <FlowBox icon={Activity} title="Endpoints" sub="affected, each w/ an event" />
          <ArrowRight className="mx-auto size-4 rotate-90 sm:rotate-0" style={{ color: "var(--fg-neutral-subtle)" }} />
          <FlowBox icon={Info} title="Ticket" sub="ITSM (future)" />
        </div>
        <p className="mt-4 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          A <strong style={{ color: "var(--fg-neutral-emphasis)" }}>notification</strong> is an ephemeral, real-time signal on the bell. It <strong style={{ color: "var(--fg-neutral-emphasis)" }}>raises or updates an alert</strong> — the persistent record. Many notifications over time can map to one alert; the alert lives until resolved and can later escalate to a ticket.
        </p>
      </SectionCard>

      {/* Alert types */}
      <SectionCard title="Types of alert">
        <div className="flex flex-col gap-3">
          {issueTypes.map((t) => (
            <div key={t.name} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--bg-neutral-subtle)", color: t.tone }}><t.icon className="size-4" /></span>
              <div className="flex min-w-px flex-1 flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{t.name}</span>
                  <span className="text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>· {t.sev}</span>
                </div>
                <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{t.detect}</span>
                <span className="text-xs italic" style={{ color: "var(--fg-neutral-subtle)" }}>e.g. {t.eg}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Notification types */}
      <SectionCard title="Types of notification (and how they link to alerts)">
        <div className="flex flex-col gap-3">
          {alertTypes.map((a) => (
            <div key={a.label} className="flex items-center gap-3">
              {sevPill(a.label, a.bg, a.fg)}
              <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{a.desc}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          A notification of a given type at a location feeds the alert that groups that <strong style={{ color: "var(--fg-neutral-emphasis)" }}>cause + location</strong>. The first notification opens the alert; later notifications update its affected count; an info/recovery notification can resolve it.
        </p>
      </SectionCard>

      {/* Status & rollup */}
      <SectionCard title="Status & rollup calculation">
        <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          Every endpoint has a <strong style={{ color: "var(--fg-neutral-emphasis)" }}>status</strong> — {sevPill("Critical", "var(--bg-danger-subtle)", "var(--fg-on-danger-subtle)")} {sevPill("Warning", "var(--bg-warning-subtle)", "var(--fg-on-warning-subtle)")} <span className="rounded-md px-1.5 py-0.5 text-xs font-semibold uppercase" style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}>Offline</span> Healthy — set by its worst metric vs. thresholds.
        </p>
        <p className="mt-3 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          Unhealthy endpoints (warning + critical) sharing the same <strong style={{ color: "var(--fg-neutral-emphasis)" }}>cause</strong> at the same <strong style={{ color: "var(--fg-neutral-emphasis)" }}>location</strong> are grouped into one alert — a <strong style={{ color: "var(--fg-neutral-emphasis)" }}>rollup</strong> with an affected-endpoint count. Offline endpoints are excluded from rollups.
        </p>

        <div className="mt-4 rounded-xl p-4 font-mono text-sm" style={{ background: "var(--bg-neutral-subtle)", border: "1px solid var(--border-neutral-subtle)", color: "var(--fg-neutral-emphasis)" }}>
          alert.severity = <span style={{ color: "var(--fg-danger)" }}>CRITICAL</span> if (platform outage) OR (critical endpoints ≥ 50% of affected)<br />
          <span className="pl-[7.2em]" />else <span style={{ color: "var(--fg-warning)" }}>WARNING</span>
        </div>

        <div className="mt-3 flex flex-col gap-2 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          <div>
            <strong style={{ color: "var(--fg-neutral-emphasis)" }}>Example A —</strong> Manila CC · Packet loss · 42 affected, 24 critical → 24 / 42 = 57% ≥ 50% → {sevPill("Critical", "var(--bg-danger-subtle)", "var(--fg-on-danger-subtle)")}
          </div>
          <div>
            <strong style={{ color: "var(--fg-neutral-emphasis)" }}>Example B —</strong> Cebu · Network jitter · 23 affected, 6 critical → 6 / 23 = 26% &lt; 50% → {sevPill("Warning", "var(--bg-warning-subtle)", "var(--fg-on-warning-subtle)")}
          </div>
        </div>

        <p className="mt-4 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          Alerts are ordered <strong style={{ color: "var(--fg-neutral-emphasis)" }}>worst-first</strong> (critical → warning), then by most endpoints affected.
        </p>
      </SectionCard>
    </div>
  )
}
