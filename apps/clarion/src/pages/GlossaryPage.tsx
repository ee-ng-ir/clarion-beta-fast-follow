import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Term { term: string; def: string; eg?: string }
interface Group { title: string; terms: Term[] }

const groups: Group[] = [
  {
    title: "Core objects",
    terms: [
      { term: "Endpoint", def: "A single monitored machine/agent. An endpoint can be shared by several users (hot-desking); identified by its machine name.", eg: "DESKTOP-MNL-0428 · Anna Reyes" },
      { term: "User", def: "A person who signs in to an endpoint. One endpoint can have multiple users.", eg: "Anna Reyes, Luis Mendoza" },
      { term: "Device", def: "Hardware attached to an endpoint — audio / video / Bluetooth / USB — shown in the drilldown's Devices tab. A device belongs to an endpoint; it is not an endpoint itself.", eg: "Jabra Evolve2 75 · Logitech Brio" },
      { term: "Location", def: "A centre / city where endpoints are based.", eg: "Manila CC, Cebu, New York" },
      { term: "Country (cluster)", def: "A grouping of one or more locations. The Overview map clusters endpoints by country, then drills down to its cities.", eg: "Philippines → Manila CC, Cebu" },
      { term: "Alert", def: "A persistent, trackable problem the system has identified, affecting one or more endpoints. Has a severity, affected endpoints, and (later) a lifecycle and ticket.", eg: "Elevated packet loss · 52 endpoints · Manila CC" },
      { term: "Notification", def: "An ephemeral, real-time event that raises or updates an Alert. Surfaces on the bell. NOT the same as an Alert.", eg: "“Latency spike detected — New York” on the bell" },
      { term: "Ticket (future / ITSM)", def: "An Alert handed off to an external ITSM system (ServiceNow, Jira) for resolution. Alert → Ticket is the escalation bridge.", eg: "Not built yet" },
    ],
  },
  {
    title: "Status & health",
    terms: [
      { term: "Status", def: "The health of a single endpoint.", eg: "Healthy · Warning · Critical · Offline" },
      { term: "Healthy", def: "Reporting normally, all metrics within threshold." },
      { term: "Warning", def: "At least one metric in the warning band (e.g. latency ≥ 80ms)." },
      { term: "Critical", def: "At least one metric in the critical band, or a platform unreachable (e.g. latency ≥ 150ms, packet loss ≥ 3%)." },
      { term: "Offline", def: "Not reporting / unreachable. No live metrics. Lowest priority in sorts and filters; excluded from the online count and from Alert rollups." },
      { term: "Active endpoints", def: "Endpoints currently reporting (active) = total − offline. Can never exceed total endpoints." },
    ],
  },
  {
    title: "Metrics",
    terms: [
      { term: "Clarion™ Network Score", def: "The headline 0–100 network-quality score for an endpoint or aggregate (formerly 'MOS / Average MOS score'). Banded Excellent 80–100 · Good 60–79 · Fair 40–59 · Poor 0–39.", eg: "79 · Good" },
      { term: "Latency", def: "Round-trip time in ms. Threshold: warn ≥ 80ms · crit ≥ 150ms." },
      { term: "Jitter", def: "Variation in latency in ms. Threshold: warn ≥ 30ms · crit ≥ 50ms." },
      { term: "Packet loss", def: "% of packets lost. Threshold: warn ≥ 1% · crit ≥ 3%." },
    ],
  },
  {
    title: "Concepts & behaviours",
    terms: [
      { term: "Event", def: "A discrete condition observed on an endpoint — the 'why' shown in the Endpoints table (formerly 'Symptom' / 'Primary issue'). The table shows the highest-priority event (critical before warning); when an endpoint has several critical events, the most recent is shown. Events roll up into an Alert.", eg: "Genesys Cloud unreachable · Packet loss 7.2% · Audio device driver failed" },
      { term: "Rollup", def: "How an Alert groups many affected endpoints by shared cause, shown as one row with an affected-endpoint count instead of one row per endpoint.", eg: "High latency · 38 endpoints" },
      { term: "Affected endpoints", def: "The set of endpoints an Alert covers." },
      { term: "Alerts only", def: "Endpoints-table toggle (default on) that hides healthy endpoints to focus on what needs attention." },
      { term: "Mute (notification type)", def: "Silences a type of real-time notification for a chosen period (1 / 8 / 24 hours) from the bell." },
      { term: "Streaming", def: "The 'live' feel — fleet figures refresh on an interval and the sidebar shows 'Streaming Xs ago'." },
    ],
  },
]

export function GlossaryPage() {
  return (
    <div className="flex flex-col gap-4">
      <Card className="w-full rounded-xl p-5">
        <div className="flex items-center gap-2">
          <Badge variant="info" className="uppercase tracking-wide">Internal</Badge>
          <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>Product development · not shipped in the built product</span>
        </div>
        <h2 className="mt-3 text-heading-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>Glossary</h2>
        <p className="mt-1 text-body-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          Shared definitions for the key concepts in Clarion, so design, product and engineering use the same words.
        </p>
      </Card>

      {groups.map((g) => (
        <Card key={g.title} className="w-full gap-0 overflow-hidden rounded-xl p-0">
          <div className="px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ borderBottom: "1px solid var(--border-neutral-subtle)", color: "var(--fg-neutral-subtle)" }}>
            {g.title}
          </div>
          <dl className="flex flex-col">
            {g.terms.map((t, i) => (
              <div key={t.term} className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-[200px_1fr] sm:gap-6" style={{ borderTop: i ? "1px solid var(--border-neutral-subtle)" : undefined }}>
                <dt className="text-sm font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{t.term}</dt>
                <dd className="flex flex-col gap-1">
                  <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{t.def}</span>
                  {t.eg && <span className="text-xs italic" style={{ color: "var(--fg-neutral-subtle)" }}>e.g. {t.eg}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      ))}
    </div>
  )
}
