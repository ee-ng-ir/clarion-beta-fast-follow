import { Fragment, useEffect, useRef } from "react"
import { FixCard } from "@/components/widget/FixCard"
import { animatedComponentIcon, type AnimatedIcon, type AnimatedIconHandle } from "@/components/icons"
import {
  scenarios,
  componentsInSection,
  platforms,
  type ComponentId,
  type Scenario,
  type SectionId,
  type Status,
} from "@/data/widget"

const dotColor: Record<Status, string> = {
  healthy: "var(--status-healthy)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
  syncing: "var(--status-unknown)",
  unknown: "var(--status-unknown)",
}

interface RowData {
  key: string
  iconId: ComponentId
  name: string
  detail: string
  status: Status
  fix?: { title: string; description: string }
}

/**
 * Version B — a single, scrollable panel. No rail and no per-section navigation:
 * every telemetry signal the agent cares about (Devices, Network, Platform; no
 * System) is listed top-to-bottom on one page.
 */
export function SinglePanel({
  scenario = scenarios.healthy,
  focusSection,
}: {
  scenario?: Scenario
  focusSection?: SectionId
}) {
  const groups: { id: SectionId; label: string; rows: RowData[] }[] = [
    {
      id: "devices",
      label: "Devices",
      rows: componentsInSection("devices", scenario).map((c) => ({
        key: c.id,
        iconId: c.id,
        name: c.name,
        detail: c.detail,
        status: c.status,
        fix: scenario.fixes[c.id],
      })),
    },
    {
      id: "network",
      label: "Network",
      rows: componentsInSection("network", scenario).map((c) => ({
        key: c.id,
        iconId: c.id,
        name: c.name,
        detail: c.detail,
        status: c.status,
        fix: scenario.fixes[c.id],
      })),
    },
    {
      id: "platform",
      label: "Platform",
      rows: platforms.map((p) => ({
        key: p.id,
        iconId: "platform",
        name: p.name,
        detail: p.id === "genesys" ? scenario.components.platform.detail : "Connected",
        status: p.id === "genesys" ? scenario.components.platform.status : "healthy",
        fix: p.id === "genesys" ? scenario.fixes.platform : undefined,
      })),
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      {groups.map((g) => (
        <Group key={g.id} id={g.id} label={g.label} rows={g.rows} focus={focusSection === g.id} />
      ))}
    </div>
  )
}

function Group({
  id,
  label,
  rows,
  focus,
}: {
  id: SectionId
  label: string
  rows: RowData[]
  focus: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (focus) ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [focus])
  return (
    <div ref={ref} data-section={id} className="flex flex-col gap-2">
      <span className="px-1 text-xs font-medium" style={{ color: "var(--fg-neutral-subtle)" }}>{label}</span>
      <div
        className="flex flex-col rounded-xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)", boxShadow: "var(--shadow-xs)" }}
      >
        {rows.map((r, i) => (
          <Row key={r.key} data={r} first={i === 0} />
        ))}
      </div>
    </div>
  )
}

function Row({ data, first }: { data: RowData; first: boolean }) {
  const Icon: AnimatedIcon = animatedComponentIcon[data.iconId]
  const iconRef = useRef<AnimatedIconHandle>(null)
  const showFix = !!data.fix && data.status !== "healthy"
  return (
    <Fragment>
      <div
        className="flex items-center gap-3 px-4 py-3.5"
        style={!first ? { borderTop: "1px solid var(--border-neutral-subtle)" } : undefined}
        onMouseEnter={() => iconRef.current?.startAnimation()}
        onMouseLeave={() => iconRef.current?.stopAnimation()}
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--bg-neutral-subtle)", border: "1px solid var(--border-neutral-subtle)" }}
        >
          <Icon ref={iconRef} size={16} className="flex" style={{ color: "var(--fg-neutral-muted)" }} />
        </span>
        <div className="flex min-w-px flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{data.name}</span>
          <span className="truncate text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{data.detail}</span>
        </div>
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: dotColor[data.status], boxShadow: "0 0 0 3px var(--bg-card)" }} />
      </div>
      {showFix && data.fix && (
        <div className="px-4 pb-3">
          <FixCard status={data.status} title={data.fix.title} description={data.fix.description} />
        </div>
      )}
    </Fragment>
  )
}
