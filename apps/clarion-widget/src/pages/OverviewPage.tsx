import { Headphones, Wifi, Cpu, AppWindow, CheckCircle2, AlertTriangle, ArrowRight, type LucideIcon } from "lucide-react"
import { scenarios, sectionMeta, componentsInSection, worstStatus, type Scenario, type SectionId, type Status } from "@/data/widget"
import type { PageId } from "@/nav"

const severityRank: Record<Status, number> = { healthy: 0, warning: 1, critical: 2, syncing: 0, unknown: 0 }

const statusVar: Record<Status, string> = {
  healthy: "var(--status-healthy)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
  syncing: "var(--status-unknown)",
  unknown: "var(--status-unknown)",
}

const heroBg: Record<Status, string> = {
  healthy: "var(--bg-success-subtle)",
  warning: "var(--bg-warning-subtle)",
  critical: "var(--bg-danger-subtle)",
  syncing: "var(--bg-neutral-subtle)",
  unknown: "var(--bg-neutral-subtle)",
}
const heroBorder: Record<Status, string> = {
  healthy: "var(--border-success-muted)",
  warning: "var(--border-warning-muted)",
  critical: "var(--border-danger-muted)",
  syncing: "var(--border-neutral-muted)",
  unknown: "var(--border-neutral-muted)",
}
const heroFg: Record<Status, string> = {
  healthy: "var(--fg-on-success-subtle)",
  warning: "var(--fg-on-warning-subtle)",
  critical: "var(--fg-on-danger-subtle)",
  syncing: "var(--fg-neutral-emphasis)",
  unknown: "var(--fg-neutral-emphasis)",
}

const sectionIcon: Record<SectionId, LucideIcon> = {
  devices: Headphones,
  network: Wifi,
  system: Cpu,
  platform: AppWindow,
}

const tiles: SectionId[] = ["devices", "network", "system", "platform"]

// Call-blocking impact — the tie-break that decides which issue the banner
// headlines (and points to) when sections share a severity.
const sectionPriority: Record<SectionId, number> = { platform: 0, network: 1, devices: 2, system: 3 }

export function OverviewPage({
  onNavigate,
  scenario = scenarios.healthy,
}: {
  onNavigate: (id: PageId) => void
  scenario?: Scenario
}) {
  const overall = scenario.overallStatus
  const healthy = overall === "healthy"

  // The banner points to the same section it headlines: worst severity first,
  // then call-blocking impact (Platform → Network → Devices → System).
  const affected = tiles
    .map((s) => ({ s, status: worstStatus(componentsInSection(s, scenario).map((c) => c.status)) }))
    .filter((x) => x.status !== "healthy")
    .sort((a, b) => severityRank[b.status] - severityRank[a.status] || sectionPriority[a.s] - sectionPriority[b.s])[0]?.s

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-6">
      {/* Status hero — the one glanceable answer, straight from the data */}
      <div
        className="flex items-center gap-3 rounded-xl p-3.5"
        style={{ background: heroBg[overall], border: `1px solid ${heroBorder[overall]}` }}
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: statusVar[overall], color: "var(--fg-on-success-emphasis)" }}
        >
          {healthy ? <CheckCircle2 className="size-5" /> : <AlertTriangle className="size-5" />}
        </span>
        <div className="flex min-w-px flex-col gap-0.5">
          <span className="text-sm font-semibold leading-tight" style={{ color: heroFg[overall] }}>
            {scenario.banner.main}
          </span>
          <span className="text-xs leading-snug" style={{ color: heroFg[overall], opacity: 0.85 }}>
            {scenario.banner.sub}
          </span>
        </div>

        {!healthy && affected && (
          <button
            type="button"
            onClick={() => onNavigate(affected as PageId)}
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)", color: "var(--fg-neutral-emphasis)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-card)")}
          >
            View {sectionMeta[affected].label}
            <ArrowRight className="size-3.5" />
          </button>
        )}
      </div>

      {/* Category summary — each tile rolls up its section's signals */}
      <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {tiles.map((section) => {
          const comps = componentsInSection(section, scenario)
          const status = worstStatus(comps.map((c) => c.status))
          // Show the detail of the signal driving the dot (the worst one).
          const worst = [...comps].sort((a, b) => severityRank[b.status] - severityRank[a.status])[0]
          const Icon = sectionIcon[section]
          const summary = worst?.detail ?? ""
          return (
            <button
              key={section}
              type="button"
              onClick={() => onNavigate(section as PageId)}
              className="flex flex-col gap-3 rounded-xl p-4 text-left transition-colors"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)", boxShadow: "var(--shadow-xs)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-card)")}
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "var(--bg-neutral-subtle)", border: "1px solid var(--border-neutral-subtle)" }}
                >
                  <Icon className="size-4" style={{ color: "var(--fg-neutral-muted)" }} />
                </span>
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: statusVar[status] }} />
              </div>
              <div className="flex min-w-px flex-col gap-0.5">
                <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{sectionMeta[section].label}</span>
                <span className="truncate text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{summary}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
