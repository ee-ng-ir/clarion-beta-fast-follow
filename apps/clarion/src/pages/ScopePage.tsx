import { Check, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type ScopeItem = { title: string; detail: string }

// What ships in the MVP build.
const inScope: ScopeItem[] = [
  { title: "Overview dashboard", detail: "World map with country → city drill-down, the KPI strip (Active endpoints, Open alerts, Clarion Network Score) and the “Endpoints needing attention” table." },
  { title: "Endpoints", detail: "Searchable, filterable, lazy-loaded endpoint table with the endpoint drilldown (Network, Platforms, Devices and System tabs)." },
  { title: "Thresholds — default thresholds", detail: "Fleet-wide warning / critical bands per metric, with save-gated editing and reset to defaults." },
  { title: "Alert routing", detail: "Route alerts to the right people and channels. The section is in place on the Thresholds page; detailed requirements are still being defined." },
  { title: "Product branding", detail: "“Clarion powered by IRIS” with the Integrated Research logo (per-client white-label is a Day-2 feature — see below)." },
]

// Deferred to Day 2 — kept in the codebase but not shipped / not reachable in MVP.
const descoped: ScopeItem[] = [
  { title: "Client white-labelling", detail: "Per-client label and logo. For MVP the sidebar shows the Clarion product brand instead of the customer’s." },
  { title: "Alerts page", detail: "The dedicated Alerts list and its sidebar tab. Alerts still surface via the Overview “Endpoints needing attention” view." },
  { title: "Notifications bell", detail: "Real-time notifications in the top bar." },
  { title: "Custom threshold rules", detail: "Per-scope threshold overrides. Replaced for MVP by the Alert routing section." },
]

function ScopeRow({ item, kind }: { item: ScopeItem; kind: "in" | "out"; }) {
  return (
    <div className="flex items-start gap-3 px-5 py-4" style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}>
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full"
        style={kind === "in"
          ? { background: "var(--bg-success-subtle)", color: "var(--fg-on-success-subtle)" }
          : { background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}>
        {kind === "in" ? <Check className="size-3" /> : <Clock className="size-3" />}
      </span>
      <div className="flex min-w-px flex-col gap-0.5">
        <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{item.title}</span>
        <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{item.detail}</span>
      </div>
    </div>
  )
}

export function ScopePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Card className="w-full gap-0 rounded-xl px-5 py-4">
        <div className="flex items-center gap-2">
          <Badge variant="info" className="uppercase tracking-wide">Internal</Badge>
          <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>Product development · not shipped in the built product</span>
        </div>
        <h2 className="mt-3 text-heading-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>Scope</h2>
        <p className="mt-1 text-body-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          What’s in for the MVP and what’s been descoped to Day 2. Use this as the running source of truth as scope shifts.
        </p>
      </Card>

      <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
        <div className="flex items-center justify-between gap-2 px-5 py-4">
          <h3 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>In scope — MVP</h3>
          <Badge variant="success">{inScope.length}</Badge>
        </div>
        {inScope.map((item) => <ScopeRow key={item.title} item={item} kind="in" />)}
      </Card>

      <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
        <div className="flex items-center justify-between gap-2 px-5 py-4">
          <h3 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Descoped — Day 2</h3>
          <Badge variant="secondary">{descoped.length}</Badge>
        </div>
        {descoped.map((item) => <ScopeRow key={item.title} item={item} kind="out" />)}
      </Card>
    </div>
  )
}
