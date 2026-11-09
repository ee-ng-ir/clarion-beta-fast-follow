import { Fragment, useRef } from "react"
import { FixCard } from "@/components/widget/FixCard"
import { Skeleton } from "@/components/ui/skeleton"
import { animatedComponentIcon, type AnimatedIconHandle } from "@/components/icons"
import { scenarios, sectionMeta, componentsInSection, type SectionId, type Scenario, type Status } from "@/data/widget"
// Fast Follow: approved headsets
import { agentById, complianceOf, headsetById, HEADSET_CATALOGUE, useAgentHeadsets, useApprovedHeadsets } from "@ir/telemetry"
import { useWidgetAgent } from "@/lib/agent"
import { HeadsetNote } from "@/components/widget/HeadsetNote"

type Reading = ReturnType<typeof componentsInSection>[number]

const dotColor: Record<Status, string> = {
  healthy: "var(--status-healthy)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
  syncing: "var(--status-unknown)",
  unknown: "var(--status-unknown)",
}

/** Version C icon tile — tinted by status (IR brand teal when healthy). Plain neutral otherwise. */
function tileStyle(status: Status, brand: boolean) {
  if (!brand) return { bg: "var(--bg-neutral-subtle)", fg: "var(--fg-neutral-muted)" }
  if (status === "critical") return { bg: "var(--bg-danger-subtle)", fg: "var(--fg-danger-emphasis)" }
  if (status === "warning") return { bg: "var(--bg-warning-subtle)", fg: "var(--fg-warning-emphasis)" }
  return { bg: "var(--bg-primary-subtle)", fg: "var(--fg-primary-muted)" }
}

/**
 * A telemetry section pane — real component readings from `@/data/widget`,
 * plus an inline fix card under any degraded component. Reflects whichever
 * scenario the shell is showing.
 */
export function SectionPage({
  section,
  scenario = scenarios.healthy,
  hideBlurb = false,
  heading,
  brand = false,
  dense = false,
}: {
  section: SectionId
  scenario?: Scenario
  hideBlurb?: boolean
  heading?: string
  brand?: boolean
  /** Compact vertical padding (8px) so stacked sections sit 16px apart — used in the widget. */
  dense?: boolean
}) {
  const meta = sectionMeta[section]
  const components = componentsInSection(section, scenario)
  // Fast Follow: this agent's headset, and whether IT has approved it
  const agentId = useWidgetAgent()
  const approved = useApprovedHeadsets()
  const agentHeadsets = useAgentHeadsets()
  const agent = agentId ? agentById(agentId) : undefined
  const headset = agent ? headsetById(agentHeadsets[agent.id] ?? HEADSET_CATALOGUE.find((h) => h.model === agent.headset)?.id) : null

  return (
    <div className={`mx-auto flex w-full max-w-3xl flex-col gap-5 px-6 ${dense ? "py-2" : "py-6"}`}>
      {heading && <h2 className="text-base font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{heading}</h2>}
      {!hideBlurb && <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{meta.blurb}</p>}

      <div
        className="flex flex-col rounded-xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)", boxShadow: "var(--shadow-xs)" }}
      >
        {components.map((c, i) => {
          const isHeadphones = c.id === "headphones" && agent && c.status !== "syncing"
          const reading = isHeadphones && c.status === "healthy" ? { ...c, detail: headset ? `${headset.model} · ${headset.connection} · Connected` : "No headphones connected" } : c
          const note = isHeadphones && headset && complianceOf(headset, approved) === "not-approved"
            ? <HeadsetNote agentId={agent.id} headsetId={headset.id} /> : null
          return <SectionRow key={c.id} reading={reading} fix={scenario.fixes[c.id]} brand={brand} first={i === 0} note={note} />
        })}
      </div>
    </div>
  )
}

/** A single telemetry row. Its icon animates while the row is hovered. */
function SectionRow({
  reading,
  fix,
  brand,
  first,
  note,
}: {
  reading: Reading
  fix?: { title: string; description: string }
  brand: boolean
  first: boolean
  /** Fast Follow: an advisory note under the row (approved headsets) */
  note?: React.ReactNode
}) {
  const Icon = animatedComponentIcon[reading.id]
  const iconRef = useRef<AnimatedIconHandle>(null)
  const tile = tileStyle(reading.status, brand)
  const showFix = !!fix && reading.status !== "healthy"
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
          style={{ background: tile.bg, border: brand ? "1px solid transparent" : "1px solid var(--border-neutral-subtle)" }}
        >
          <Icon ref={iconRef} size={16} className="flex" style={{ color: tile.fg }} />
        </span>
        <div className="flex min-w-px flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{reading.name}</span>
          {reading.status === "syncing"
            ? <Skeleton className="mt-1 h-2.5 w-40" />
            : <span className="truncate text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{reading.detail}</span>}
        </div>
        {reading.status === "syncing"
          ? <Skeleton className="size-2.5 shrink-0 rounded-full" />
          : <span className="size-2.5 shrink-0 rounded-full" style={{ background: dotColor[reading.status], boxShadow: "0 0 0 3px var(--bg-card)" }} />}
      </div>
      {note && <div className="px-4 pb-3">{note}</div>}
      {showFix && fix && (
        <div className="px-4 pb-3">
          <FixCard status={reading.status} title={fix.title} description={fix.description} />
        </div>
      )}
    </Fragment>
  )
}
