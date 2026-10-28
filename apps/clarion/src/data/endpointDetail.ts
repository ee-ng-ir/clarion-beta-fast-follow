// Deterministically derived drill-down detail for a single endpoint.
// Seeded by the endpoint id so the same endpoint always shows the same detail.

import type { Endpoint, Platform } from "./endpoints"

export type MetricStatus = "good" | "warn" | "crit" | "none"
export type PlatformStatus = "ok" | "degraded" | "disconnected"

export interface Metric {
  label: string
  value: string
  unit: string
  /** 0..1 fill for the segmented bar */
  fill: number
  status: MetricStatus
  threshold: string
}
export interface PlatformRow {
  name: Platform
  key: string
  color: string
  latency: number | null
  loss: number | null
  jitter: number | null
  mos: number | null
  status: PlatformStatus
}
export interface DeviceRow {
  name: string
  meta: string
  state: string
  stateTone: "good" | "muted" | "warn" | "bad"
  kind: "audio-out" | "audio-in" | "video" | "bt" | "usb"
}
export interface SysMetric { label: string; value: string; unit: string; fill: number; meta: string }

export interface EndpointDetail {
  locationDetail: string
  network: {
    health: Metric[]
    // Network MOS: 1–5 score derived from latency / jitter / packet loss (thresholds: warn < 4, crit < 3)
    mos: { value: string; status: MetricStatus; fill: number }
    interface: { name: string; detail: string }
  }
  platforms: { rows: PlatformRow[]; why: string }
  devices: { audio: DeviceRow[]; video: DeviceRow[] }
  system: { cpu: SysMetric; memory: SysMetric; disk: SysMetric; os: { name: string; detail: string }; agent: { name: string; detail: string } }
}

function seedFrom(id: string) {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619) }
  let s = h >>> 0
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

const platformMeta: Record<Platform, { key: string; color: string }> = {
  "Genesys Cloud": { key: "G", color: "#FF4F1F" },
  "Microsoft Teams": { key: "T", color: "#5059C9" },
  "Zoom": { key: "Z", color: "#2D8CFF" },
  "Webex": { key: "W", color: "#15B8A6" },
  "Nice CXone": { key: "N", color: "#0B6BCB" },
}

function metricStatus(value: number, warn: number, crit: number, lowerIsWorse = false): MetricStatus {
  if (lowerIsWorse) return value < crit ? "crit" : value < warn ? "warn" : "good"
  return value >= crit ? "crit" : value >= warn ? "warn" : "good"
}

export function getEndpointDetail(e: Endpoint): EndpointDetail {
  const rand = seedFrom(e.id)
  const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)]
  const r = (min: number, max: number, d = 0) => { const v = min + rand() * (max - min); return Math.round(v * 10 ** d) / 10 ** d }

  const health: Metric[] = [
    { label: "Latency", value: String(e.latency), unit: "ms", fill: Math.min(1, e.latency / 200), status: metricStatus(e.latency, 80, 150), threshold: "warn ≥ 80ms · crit ≥ 150ms" },
    { label: "Packet loss", value: String(e.packetLoss), unit: "%", fill: Math.min(1, e.packetLoss / 6), status: metricStatus(e.packetLoss, 1, 3), threshold: "warn ≥ 1% · crit ≥ 3%" },
    { label: "Jitter", value: String(e.jitter), unit: "ms", fill: Math.min(1, e.jitter / 70), status: metricStatus(e.jitter, 30, 50), threshold: "warn ≥ 30ms · crit ≥ 50ms" },
  ]
  // Network MOS — a combined quality score (1–5) derived from the network values.
  const mosVal = Math.max(1, Math.min(5, 5 - e.latency / 120 - e.jitter / 40 - e.packetLoss / 2))
  const networkMos = { value: mosVal.toFixed(1), status: metricStatus(mosVal, 4, 3, true), fill: (mosVal - 1) / 4 }

  // Platform status rules:
  //  · Disconnected — not connected to the platform
  //  · OK           — connected AND platform MOS is good (≥ 4)
  //  · Degraded     — connected AND platform MOS is not good (< 4)
  const PLATFORM_MOS_GOOD = 4
  const all: Platform[] = ["Genesys Cloud", "Microsoft Teams", "Zoom", "Webex", "Nice CXone"]
  const downName = e.primaryIssue?.endsWith("down") ? e.primaryPlatform : null
  const rows: PlatformRow[] = all.map((name) => {
    const m = platformMeta[name]
    // disconnected from the platform → no live media metrics
    if (name === downName) return { name, ...m, latency: null, loss: null, jitter: null, mos: null, status: "disconnected" }
    // shape realistic media metrics; the endpoint's primary platform runs hot
    const strained = e.status !== "healthy" && name === e.primaryPlatform && !downName
    const lat = strained ? r(55, 75) : r(20, 40)
    const jit = strained ? r(18, 26) : r(6, 14)
    const loss = strained ? r(0.3, 0.6, 1) : r(0, 0.2, 1)
    const mos = strained ? r(3.6, 3.9, 1) : r(4.2, 4.6, 1)
    // status is derived from the platform MOS (connected either way)
    const status: PlatformStatus = mos >= PLATFORM_MOS_GOOD ? "ok" : "degraded"
    return { name, ...m, latency: lat, loss, jitter: jit, mos, status }
  })
  const okPlatforms = rows.filter((p) => p.status === "ok").map((p) => p.name)
  const why = downName
    ? `${downName} is unreachable from this endpoint, but ${okPlatforms.slice(0, 2).join(" and ")} are healthy. That points to a platform-side problem, not an endpoint issue — correlate against other ${e.locationName} endpoints to confirm scope.`
    : e.status === "healthy"
      ? `All platforms are responding normally from this endpoint.`
      : `${e.primaryPlatform} is degraded while the others are healthy, which suggests the issue is specific to that platform's media path.`

  const headsets = ["Jabra Evolve2 75", "Poly Voyager 4320", "Logitech Zone Vibe 100", "Jabra Evolve2 65"]
  const cams = ["Logitech C920 HD Pro", "Logitech Brio 4K", "Poly Studio P5", "Dell UltraSharp WB7022"]

  // Reflect the endpoint's actual alerts in the drilldown so the list and the
  // drilldown agree: device alerts mark the matching device, memory/Wi-Fi/CPU
  // alerts push the corresponding reading into the bad range.
  const audioOut: DeviceRow = { name: pick(headsets), meta: `Bluetooth · Driver v2.${r(10, 20)}.${r(1, 9)} · Default speaker & mic`, state: "In-use", stateTone: "good", kind: "audio-out" }
  const audioIn: DeviceRow = { name: "Realtek HD Audio (built-in)", meta: `Driver v6.0.${r(9000, 9300)}.1 · Fallback device`, state: "Active", stateTone: "muted", kind: "audio-in" }
  const camera: DeviceRow = { name: pick(cams), meta: "USB · 1080p · Driver up-to-date", state: "In-use", stateTone: "good", kind: "video" }
  for (const ev of e.events) {
    const l = ev.label.toLowerCase()
    if (/camera/.test(l)) { camera.state = "Not detected"; camera.stateTone = "bad"; camera.meta = "USB · No signal" }
    else if (/battery/.test(l)) { audioOut.state = "Battery low"; audioOut.stateTone = "warn" }
    else if (/headset|audio|usb|mic|speaker|driver/.test(l)) {
      const crit = ev.severity === "critical"
      audioOut.state = crit ? "Disconnected" : "Degraded"
      audioOut.stateTone = crit ? "bad" : "warn"
      audioOut.meta = "Bluetooth · Not responding"
    }
  }
  const memHigh = e.events.some((ev) => /memory/.test(ev.label.toLowerCase()))
  const wifiWeak = e.events.some((ev) => /wi-?fi|signal/.test(ev.label.toLowerCase()))
  const cpuUsed = e.events.some((ev) => /\bcpu\b/.test(ev.label.toLowerCase())) ? r(88, 96) : r(8, 70)
  const memUsed = memHigh ? r(14.6, 15.6, 1) : r(5, 14, 1)

  return {
    locationDetail: e.locationName,
    network: {
      health,
      mos: networkMos,
      interface: e.connection === "Ethernet"
        ? { name: "Ethernet", detail: "Wired · 1Gbps · MTU 1500" }
        : { name: "Wi-Fi", detail: `802.11ax · ${wifiWeak ? r(18, 38) : r(55, 95)}% signal · 5GHz` },
    },
    platforms: { rows, why },
    devices: {
      audio: [audioOut, audioIn],
      video: [camera],
    },
    system: {
      cpu: { label: "CPU utilisation", value: String(cpuUsed), unit: "%", fill: 0, meta: "Intel Core i7-1265U · 12 cores · 4.8 GHz" },
      memory: { label: "Memory", value: String(memUsed), unit: "/ 16 GB", fill: memUsed / 16, meta: `${Math.round((memUsed / 16) * 100)}% utilised` },
      disk: (() => { const used = r(180, 420); return { label: "Disk", value: String(used), unit: "/ 512 GB", fill: used / 512, meta: `${Math.round((used / 512) * 100)}% used · NVMe SSD` } })(),
      os: { name: "Windows 11 Pro", detail: "Build 23H2 · Patch 2026.04" },
      agent: { name: "v2.4.1", detail: `Last heartbeat ${r(1, 9)}s ago · Up-to-date` },
    },
  }
}
