// How a widget reading shows up on the agent's endpoint in the Clarion dashboard.
// One table, so the two products describe the same problem the same way.

import type { AgentReading, ComponentId, Health } from "./feed"

export type EndpointHealth = "healthy" | "warning" | "critical" | "offline"

export interface EndpointView {
  status: EndpointHealth
  /** IT-facing events, newest first (dashboard "Event" column, drawer). */
  events: { severity: "warning" | "critical"; label: string; minutesAgo: number }[]
  /** Drives the dashboard's issue grouping ("Genesys Cloud down" → platform). */
  primaryIssue: string | null
  score: number | null
  latency: number
  jitter: number
  packetLoss: number
  lastSeenMinAgo: number
}

/** IT wording for each component going warning / critical. */
const labels: Record<ComponentId, { warning: string; critical: string }> = {
  wifi: { warning: "Wi-Fi signal weak", critical: "Network connection lost" },
  headphones: { warning: "Headset battery low", critical: "Headset disconnected mid-call" },
  microphone: { warning: "Microphone fell back to laptop mic", critical: "Microphone not detected" },
  camera: { warning: "Camera quality reduced", critical: "Camera not detected" },
  cpu: { warning: "High CPU usage", critical: "CPU saturated" },
  memory: { warning: "High memory usage", critical: "Memory exhausted" },
  disk: { warning: "Disk almost full", critical: "Disk full" },
  platform: { warning: "Genesys Cloud degraded", critical: "Genesys Cloud unreachable" },
}

const order: ComponentId[] = ["platform", "wifi", "headphones", "microphone", "camera", "cpu", "memory", "disk"]
const bad = (h: Health): h is "warning" | "critical" => h === "warning" || h === "critical"

export function endpointView(r: AgentReading): EndpointView {
  const healthyMetrics = { latency: 18, jitter: 6, packetLoss: 0.1 }

  // Not reporting: the dashboard can't hear from the machine.
  if (r.notReporting || r.reconnecting || r.components.wifi === "critical") {
    return { status: "offline", events: [], primaryIssue: "Offline", score: null, latency: 0, jitter: 0, packetLoss: 0, lastSeenMinAgo: r.reconnecting ? 7 : 12 }
  }

  const events = order
    .filter((c) => bad(r.components[c]))
    .map((c, i) => ({ severity: r.components[c] as "warning" | "critical", label: labels[c][r.components[c] as "warning" | "critical"], minutesAgo: 1 + i * 2 }))
  const status: EndpointHealth = events.some((e) => e.severity === "critical") ? "critical" : events.length ? "warning" : "healthy"

  if (r.components.platform === "critical") {
    return { status, events, primaryIssue: "Genesys Cloud down", score: null, ...healthyMetrics, lastSeenMinAgo: 0 }
  }
  if (r.components.wifi === "warning") {
    // Inside Clarion's warning band (latency 80–149 ms, loss 1–2.9%).
    return { status, events, primaryIssue: "Wi-Fi · weak signal", score: 62, latency: 124, jitter: 32, packetLoss: 1.8, lastSeenMinAgo: 0 }
  }
  const top = events.find((e) => e.severity === "critical") ?? events[0]
  return {
    status, events, primaryIssue: top?.label ?? null,
    score: status === "critical" ? 41 : status === "warning" ? 66 : 92,
    ...healthyMetrics, lastSeenMinAgo: 0,
  }
}
