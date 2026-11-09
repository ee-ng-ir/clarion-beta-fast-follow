import { Monitor, Siren, Tally5 } from "lucide-react"
import { KpiCard } from "./KpiCard"
import { SegmentedBar, LegendItem } from "./primitives"
import { activeGroups } from "@/features/fast-follow/alerts/groups"
import type { LiveFleet } from "@/hooks/useStreaming"

// Clarion Network Score (0–100) quality band.
function cnsBand(v: number) {
  if (v >= 80) return { label: "Excellent", range: "80–100", color: "var(--fg-success-emphasis)" }
  if (v >= 60) return { label: "Good", range: "60–79", color: "var(--fg-success-emphasis)" }
  if (v >= 40) return { label: "Fair", range: "40–59", color: "var(--fg-warning-emphasis)" }
  return { label: "Poor", range: "0–39", color: "var(--fg-danger-emphasis)" }
}

export function StatsStrip({ live }: { live: LiveFleet }) {
  // Fast Follow: count alert groups (one per alert type), matching the Alerts page
  const issues = activeGroups()
  const warnIssues = issues.filter((r) => r.severity === "warning").length
  const critIssues = issues.filter((r) => r.severity === "critical").length
  const issueSegments = [
    { status: "warning" as const, flex: warnIssues, count: warnIssues, label: "Warning" },
    { status: "critical" as const, flex: critIssues, count: critIssues, label: "Critical" },
  ].filter((s) => s.count > 0)

  return (
    <section className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-2.5">
        <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
          Entire fleet
        </span>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-stretch">
        <KpiCard
          title="Active endpoints"
          icon={Monitor}
          value={
            <>
              {live.online.toLocaleString()}
              <span style={{ color: "var(--fg-neutral-subtle)", margin: "0 0.08em" }}>/</span>
              {live.endpoints.toLocaleString()}
            </>
          }
        >
          <SegmentedBar
            segments={[
              { status: "healthy", flex: live.healthy, count: live.healthy },
              { status: "warning", flex: live.warning, count: live.warning },
              { status: "critical", flex: live.critical, count: live.critical },
            ]}
          />
          <div className="flex items-center gap-2">
            <LegendItem status="healthy" label="Healthy" />
            <LegendItem status="warning" label="Warning" />
            <LegendItem status="critical" label="Critical" />
          </div>
        </KpiCard>

        <KpiCard title="Open alerts" icon={Siren} value={String(issues.length)}>
          <SegmentedBar segments={issueSegments} />
          <div className="flex items-center gap-2">
            <LegendItem status="warning" label="Warning" />
            <LegendItem status="critical" label="Critical" />
          </div>
        </KpiCard>

        <KpiCard
          title={
            <>
              Clarion<sup className="top-[-0.4em] text-[0.6em]">™</sup> Network Score
            </>
          }
          icon={Tally5}
          value={String(live.score)}
          info="A composite of network health out of 100 combining Wi-Fi signal, latency, packet loss, jitter and the Network Quality Index. Excellent 80–100 · Good 60–79 · Fair 40–59 · Poor 0–39."
        >
          {(() => {
            const b = cnsBand(live.score)
            return (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium" style={{ color: b.color }}>{b.label}</span>
                <span className="text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>· {b.range}</span>
              </div>
            )
          })()}
        </KpiCard>
      </div>
    </section>
  )
}
