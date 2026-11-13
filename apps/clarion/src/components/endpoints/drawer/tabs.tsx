import type { ReactNode } from "react"
import { Headphones, Mic, Video, Bluetooth, Usb } from "lucide-react"
import type { Endpoint } from "@/data/endpoints"
import type { EndpointDetail, PlatformStatus } from "@/data/endpointDetail"
import { SegBar, Panel, SectionLabel, MetricBlock } from "./bits"
import { Badge } from "@/components/ui/badge"
import { InfoTip } from "@/components/ui/info-tip"

/* ---------------- Network ---------------- */
export function NetworkTab({ d }: { d: EndpointDetail }) {
  const mos = d.network.mos
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionLabel>Internet health</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Network Quality Index — combined 1–5 quality score; the one tile that keeps a level badge */}
          <MetricBlock label="Quality Index" info="Predicted call quality score for this network, based on latency, jitter and packet loss." value={mos.value} unit="/ 5" status={mos.status === "crit" ? "critical" : mos.status === "warn" ? "warning" : undefined}>
            <SegBar fill={mos.fill} status={mos.status} />
          </MetricBlock>
          {d.network.health.map((m) => (
            // raw network values are informational — no threshold text, no badge.
            // bar length reflects the metric; bar colour reflects the Network MOS status.
            <MetricBlock key={m.label} label={m.label} value={m.value} unit={m.unit}>
              <SegBar fill={m.fill} status={mos.status} />
            </MetricBlock>
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>Connection</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Panel>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>Interface</div>
            <div className="text-lg font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{d.network.interface.name}</div>
            <div className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{d.network.interface.detail}</div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

/* ---------------- UC/CC platforms ---------------- */
const platBadge: Record<PlatformStatus, { variant: "success" | "warning" | "danger"; label: string }> = {
  ok: { variant: "success", label: "OK" },
  degraded: { variant: "warning", label: "Degraded" },
  disconnected: { variant: "danger", label: "Disconnected" },
}
const fmt = (v: number | null, u: string) => (v === null ? "—" : `${v}${u}`)

export function PlatformsTab({ d }: { d: EndpointDetail }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionLabel>UC/CC platforms in use</SectionLabel>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ color: "var(--fg-neutral-subtle)" }}>
              <th className="px-3 pb-2 text-left text-xs font-medium uppercase tracking-wide">Platform</th>
              <th className="px-3 pb-2 text-right text-xs font-medium uppercase tracking-wide">Latency</th>
              <th className="px-3 pb-2 text-right text-xs font-medium uppercase tracking-wide">Loss</th>
              <th className="px-3 pb-2 text-right text-xs font-medium uppercase tracking-wide">Jitter</th>
              <th className="px-3 pb-2 text-right text-xs font-medium uppercase tracking-wide">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">Quality Index<InfoTip text="Predicted call quality score for the platform, based on latency, jitter and packet loss." side="bottom" align="end" /></span>
              </th>
              <th className="px-3 pb-2 text-right text-xs font-medium uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {d.platforms.rows.map((p) => {
              const badge = platBadge[p.status]
              const dim = p.status === "disconnected"
              const col = dim ? "var(--fg-neutral-subtle)" : p.status === "degraded" ? "var(--fg-warning-emphasis)" : "var(--fg-neutral-emphasis)"
              return (
                <tr key={p.name} style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 items-center justify-center rounded-md text-xs font-bold text-white" style={{ background: p.color }}>{p.key}</span>
                      <span className="font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono" style={{ color: col }}>{fmt(p.latency, "ms")}</td>
                  <td className="px-3 py-3 text-right font-mono" style={{ color: col }}>{fmt(p.loss, "%")}</td>
                  <td className="px-3 py-3 text-right font-mono" style={{ color: col }}>{fmt(p.jitter, "ms")}</td>
                  <td className="px-3 py-3 text-right font-mono" style={{ color: col }}>{p.mos === null ? "—" : p.mos.toFixed(1)}</td>
                  <td className="px-3 py-3 text-right">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ---------------- Devices ---------------- */
const deviceIcon = { "audio-out": Headphones, "audio-in": Mic, video: Video, bt: Bluetooth, usb: Usb }
const deviceStateColor: Record<string, string> = {
  good: "var(--fg-success-emphasis)",
  warn: "var(--fg-warning-emphasis)",
  bad: "var(--fg-danger-emphasis)",
  muted: "var(--fg-neutral-muted)",
}

/** `tagFor` adds a tag beside a device's name (Fast Follow: headset approval). */
export function DevicesTab({ d, tagFor }: { d: EndpointDetail; tagFor?: (name: string) => ReactNode }) {
  const Row = ({ r }: { r: EndpointDetail["devices"]["audio"][number] }) => {
    const Icon = deviceIcon[r.kind]
    return (
      <Panel className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg" style={{ background: "var(--bg-neutral-muted)", color: "var(--fg-neutral-muted)" }}><Icon className="size-4" /></span>
        <div className="flex min-w-px flex-1 flex-col">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{r.name}</span>
            {tagFor?.(r.name)}
          </span>
          <span className="truncate text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{r.meta}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium" style={{ color: deviceStateColor[r.stateTone] }}>
          {(r.stateTone === "bad" || r.stateTone === "warn") && <span className="size-1.5 shrink-0 rounded-full" style={{ background: deviceStateColor[r.stateTone] }} />}
          {r.state}
        </span>
      </Panel>
    )
  }
  return (
    <div className="flex flex-col gap-6">
      <div><SectionLabel>Audio devices</SectionLabel><div className="flex flex-col gap-2">{d.devices.audio.map((r) => <Row key={r.name} r={r} />)}</div></div>
      <div><SectionLabel>Video devices</SectionLabel><div className="flex flex-col gap-2">{d.devices.video.map((r) => <Row key={r.name} r={r} />)}</div></div>
    </div>
  )
}

/* ---------------- System ---------------- */
export function SystemTab({ d }: { d: EndpointDetail }) {
  const { system: s } = d
  const Bar = ({ fill }: { fill: number }) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} className="h-2 flex-1 rounded-sm" style={{ background: i < Math.round(fill * 10) ? "var(--bg-primary-emphasis)" : "var(--bg-neutral-subtle-pressed)" }} />
      ))}
    </div>
  )
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionLabel>Compute &amp; storage</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetricBlock label={s.cpu.label} value={s.cpu.value} unit={s.cpu.unit}><Bar fill={Number(s.cpu.value) / 100} /><div className="mt-2 text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{s.cpu.meta}</div></MetricBlock>
          <MetricBlock label={s.memory.label} value={s.memory.value} unit={s.memory.unit}><Bar fill={s.memory.fill} /><div className="mt-2 text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{s.memory.meta}</div></MetricBlock>
          <MetricBlock label={s.disk.label} value={s.disk.value} unit={s.disk.unit}><Bar fill={s.disk.fill} /><div className="mt-2 text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{s.disk.meta}</div></MetricBlock>
        </div>
      </div>
      <div>
        <SectionLabel>OS &amp; Clarion Widget</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Panel>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>Operating system</div>
            <div className="text-lg font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{s.os.name}</div>
            <div className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{s.os.detail}</div>
          </Panel>
          <Panel>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>Clarion Widget</div>
            <div className="text-lg font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{s.agent.name}</div>
            <div className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{s.agent.detail}</div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

export type { Endpoint }
