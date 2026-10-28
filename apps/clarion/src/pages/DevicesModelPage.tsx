import { Laptop, Users, Cable } from "lucide-react"
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

const pill = (label: string, bg: string, fg: string) => (
  <span className="rounded-md px-1.5 py-0.5 text-xs font-semibold uppercase" style={{ background: bg, color: fg }}>{label}</span>
)

function ConceptRow({ icon: Icon, title, children }: { icon: typeof Laptop; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}><Icon className="size-4" /></span>
      <div className="flex min-w-px flex-1 flex-col">
        <span className="text-sm font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{title}</span>
        <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{children}</span>
      </div>
    </div>
  )
}

export function DevicesModelPage() {
  return (
    <div className="flex flex-col gap-4">
      <Card className="w-full rounded-xl p-5">
        <div className="flex items-center gap-2">
          <Badge variant="info" className="uppercase tracking-wide">Internal</Badge>
          <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>Product development · not shipped in the built product</span>
        </div>
        <h2 className="mt-3 text-heading-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>Endpoints model</h2>
        <p className="mt-1 text-body-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          What an endpoint is, how users and devices relate to it, and how we decide whether an endpoint is offline, active, or has no signed-in user.
        </p>
      </Card>

      {/* What an endpoint is */}
      <SectionCard title="What an endpoint is">
        <div className="flex flex-col gap-4">
          <ConceptRow icon={Laptop} title="Endpoint">
            A single monitored machine running the Clarion Widget. Identified by its machine name, e.g. <span className="font-mono text-xs">DESKTOP-MNL-0428</span>. The endpoint is the unit the fleet counts, statuses, and rolls up into alerts.
          </ConceptRow>
          <ConceptRow icon={Users} title="Users on an endpoint">
            An endpoint can be shared by several users (hot-desking). The Endpoints table shows the current / primary user; the drilldown header lists everyone who uses the endpoint. Search matches any user on the endpoint.
          </ConceptRow>
          <ConceptRow icon={Cable} title="Devices">
            The hardware attached to an endpoint — audio, video, Bluetooth and USB — shown in the drilldown’s <strong style={{ color: "var(--fg-neutral-emphasis)" }}>Devices</strong> tab. Devices belong to an endpoint; they are not endpoints themselves.
          </ConceptRow>
        </div>
      </SectionCard>

      {/* Endpoint states */}
      <SectionCard title="Endpoint states — offline, active & “no user”">
        <div className="flex flex-col gap-3 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold uppercase" style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}>Offline</span>
            <p><strong style={{ color: "var(--fg-neutral-emphasis)" }}>Offline</strong> means the widget / endpoint is sending <strong style={{ color: "var(--fg-neutral-emphasis)" }}>no data at all</strong>.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0">{pill("Unknown?", "var(--bg-info-subtle)", "var(--fg-on-info-subtle)")}</span>
            <p>
              If data arrives <strong style={{ color: "var(--fg-neutral-emphasis)" }}>without a logged-in user</strong>, the endpoint is <strong style={{ color: "var(--fg-neutral-emphasis)" }}>not</strong> offline — it should still be shown, potentially as “Unknown”.
              <span className="italic" style={{ color: "var(--fg-neutral-subtle)" }}> (label not finalised)</span>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0">{pill("Active", "var(--bg-success-subtle)", "var(--fg-on-success-subtle)")}</span>
            <p>If a user is <strong style={{ color: "var(--fg-neutral-emphasis)" }}>locked or sleeping</strong> but still logged in and data is still being sent, the endpoint is treated as <strong style={{ color: "var(--fg-neutral-emphasis)" }}>active</strong> (Healthy / Warning / Critical as usual) — not offline.</p>
          </div>
        </div>
        <p className="mt-4 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          In short: <strong style={{ color: "var(--fg-neutral-emphasis)" }}>offline is about data, not about the user</strong>. No data → offline. Data but no user → shown (term TBC). Data with an idle/locked user → active.
        </p>
      </SectionCard>
    </div>
  )
}
