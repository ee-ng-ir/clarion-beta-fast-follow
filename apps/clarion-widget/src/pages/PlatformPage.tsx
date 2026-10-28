import { Fragment, useRef, useState } from "react"
import { Construction } from "lucide-react"
import { FixCard } from "@/components/widget/FixCard"
import { Skeleton } from "@/components/ui/skeleton"
import { animatedComponentIcon, type AnimatedIconHandle } from "@/components/icons"
import { scenarios, sectionMeta, platforms, type Scenario, type Status } from "@/data/widget"

const PlatformIcon = animatedComponentIcon.platform

const dotColor: Record<Status, string> = {
  healthy: "var(--status-healthy)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
  syncing: "var(--status-unknown)",
  unknown: "var(--status-unknown)",
}

/** Version C icon tile — tinted by status (IR brand teal when healthy). */
function tileStyle(status: Status, brand: boolean) {
  if (!brand) return { bg: "var(--bg-neutral-subtle)", fg: "var(--fg-neutral-muted)" }
  if (status === "critical") return { bg: "var(--bg-danger-subtle)", fg: "var(--fg-danger-emphasis)" }
  if (status === "warning") return { bg: "var(--bg-warning-subtle)", fg: "var(--fg-warning-emphasis)" }
  return { bg: "var(--bg-primary-subtle)", fg: "var(--fg-primary-muted)" }
}

/**
 * Platform section — the agent may run several UC/CC platforms, so a horizontal
 * segmented switcher moves between them. Genesys carries live telemetry from the
 * scenario; the others are placeholders until their metrics are defined.
 */
export function PlatformPage({ scenario = scenarios.healthy, stacked = false, heading, brand = false, onSendToIt, dense = false }: { scenario?: Scenario; stacked?: boolean; heading?: string; brand?: boolean; onSendToIt?: () => void; dense?: boolean }) {
  const [selected, setSelected] = useState("genesys")
  const selectedIconRef = useRef<AnimatedIconHandle>(null)

  // Only Genesys is wired to scenario telemetry for now.
  // While the whole widget is syncing, every platform row shows the skeleton too.
  const syncing = scenario.components.platform.status === "syncing"
  const statusFor = (id: string): Status => (id === "genesys" ? scenario.components.platform.status : syncing ? "syncing" : "healthy")
  const detailFor = (id: string): string => (id === "genesys" ? scenario.components.platform.detail : syncing ? "Checking…" : "Connected")

  // Version B — every platform stacked as a vertical list, no tabs, no blurb.
  if (stacked) {
    return (
      <div className={`mx-auto flex w-full max-w-3xl flex-col gap-5 px-6 ${dense ? "py-2" : "py-6"}`}>
        {heading && <h2 className="text-base font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{heading}</h2>}
        <div className="flex flex-col rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)", boxShadow: "var(--shadow-xs)" }}>
          {platforms.map((p, i) => (
            <PlatformRow
              key={p.id}
              name={p.name}
              detail={detailFor(p.id)}
              status={statusFor(p.id)}
              fix={p.id === "genesys" ? scenario.fixes.platform : undefined}
              onSendToIt={p.id === "genesys" ? onSendToIt : undefined}
              brand={brand}
              first={i === 0}
            />
          ))}
        </div>
      </div>
    )
  }

  const current = platforms.find((p) => p.id === selected) ?? platforms[0]

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-6">
      <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{sectionMeta.platform.blurb}</p>

      {/* Horizontal platform switcher */}
      <div
        className="flex gap-1 rounded-lg p-1"
        style={{ background: "var(--bg-neutral-subtle)", border: "1px solid var(--border-neutral-muted)" }}
      >
        {platforms.map((p) => {
          const active = p.id === selected
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              className="flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              style={active
                ? { background: "var(--bg-card)", color: "var(--fg-neutral-emphasis)", boxShadow: "var(--shadow-xs)" }
                : { background: "transparent", color: "var(--fg-neutral-muted)" }}
            >
              <span className="size-2 shrink-0 rounded-full" style={{ background: dotColor[statusFor(p.id)] }} />
              {p.name}
            </button>
          )
        })}
      </div>

      {/* Selected platform — status row (detail TBD) */}
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3.5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)", boxShadow: "var(--shadow-xs)" }}
        onMouseEnter={() => selectedIconRef.current?.startAnimation()}
        onMouseLeave={() => selectedIconRef.current?.stopAnimation()}
      >
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--bg-neutral-subtle)", border: "1px solid var(--border-neutral-subtle)" }}
        >
          <PlatformIcon ref={selectedIconRef} size={16} className="flex" style={{ color: "var(--fg-neutral-muted)" }} />
        </span>
        <div className="flex min-w-px flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{current.name}</span>
          {statusFor(current.id) === "syncing"
            ? <Skeleton className="mt-1 h-2.5 w-40" />
            : <span className="truncate text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{detailFor(current.id)}</span>}
        </div>
        {statusFor(current.id) === "syncing"
          ? <Skeleton className="size-2.5 shrink-0 rounded-full" />
          : <span className="size-2.5 shrink-0 rounded-full" style={{ background: dotColor[statusFor(current.id)], boxShadow: "0 0 0 3px var(--bg-card)" }} />}
      </div>

      <div className="flex items-center gap-2.5 rounded-lg px-4 py-3" style={{ background: "var(--bg-info-subtle)", color: "var(--fg-info-emphasis)" }}>
        <Construction className="size-4 shrink-0" />
        <span className="text-xs">Detailed <strong>{current.name}</strong> metrics will appear here once defined.</span>
      </div>
    </div>
  )
}

/** A stacked platform row (Version C). Its icon animates while the row is hovered. */
function PlatformRow({
  name,
  detail,
  status,
  fix,
  onSendToIt,
  brand,
  first,
}: {
  name: string
  detail: string
  status: Status
  fix?: { title: string; description: string }
  onSendToIt?: () => void
  brand: boolean
  first: boolean
}) {
  const iconRef = useRef<AnimatedIconHandle>(null)
  const tile = tileStyle(status, brand)
  const showFix = !!fix && status !== "healthy"
  return (
    <Fragment>
      <div
        className="flex items-center gap-3 px-4 py-3.5"
        style={!first ? { borderTop: "1px solid var(--border-neutral-subtle)" } : undefined}
        onMouseEnter={() => iconRef.current?.startAnimation()}
        onMouseLeave={() => iconRef.current?.stopAnimation()}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ background: tile.bg, border: brand ? "1px solid transparent" : "1px solid var(--border-neutral-subtle)" }}>
          <PlatformIcon ref={iconRef} size={16} className="flex" style={{ color: tile.fg }} />
        </span>
        <div className="flex min-w-px flex-1 flex-col gap-0.5">
          <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{name}</span>
          {status === "syncing"
            ? <Skeleton className="mt-1 h-2.5 w-40" />
            : <span className="truncate text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{detail}</span>}
        </div>
        {status === "syncing"
          ? <Skeleton className="size-2.5 shrink-0 rounded-full" />
          : <span className="size-2.5 shrink-0 rounded-full" style={{ background: dotColor[status], boxShadow: "0 0 0 3px var(--bg-card)" }} />}
      </div>
      {showFix && fix && (
        <div className="px-4 pb-3">
          <FixCard status={status} title={fix.title} description={fix.description} onSendToIt={onSendToIt} />
        </div>
      )}
    </Fragment>
  )
}
