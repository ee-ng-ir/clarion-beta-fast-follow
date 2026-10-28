// The feed: what each agent's widget is reporting right now.
//
// Same-browser only, no backend: the widget publishes, the dashboard listens.
// They sync because Clarion serves the widget under its own URL (/widget), so
// both share an origin — BroadcastChannel carries live changes between tabs and
// windows, localStorage lets a page opened later pick up the current state.

/** Component health, as the widget reports it. */
export type Health = "healthy" | "warning" | "critical" | "syncing" | "unknown"
export type ComponentId = "wifi" | "headphones" | "microphone" | "camera" | "cpu" | "memory" | "disk" | "platform"

export interface AgentReading {
  /** The widget scenario the agent is in (for the widget's own UI). */
  scenarioId: string
  scenarioLabel: string
  components: Record<ComponentId, Health>
  /** Widget lost its connection to Clarion (last-known data only). */
  reconnecting?: boolean
  /** Widget is tray-only: not started, verifying, or not licensed. */
  notReporting?: "cold" | "verifying" | "notLicensed"
  /** epoch ms */
  at: number
}

export type FeedState = Record<string, AgentReading>

const KEY = "ir-telemetry:v1"
const CHANNEL = "ir-telemetry"

let state: FeedState = read()
const listeners = new Set<() => void>()
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL) : null

function read(): FeedState {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}") as FeedState } catch { return {} }
}
function emit() { listeners.forEach((l) => l()) }

channel?.addEventListener("message", (e: MessageEvent<FeedState>) => { state = e.data; emit() })
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => { if (e.key === KEY) { state = read(); emit() } })
}

export const feed = {
  get: () => state,
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
  publish(agentId: string, reading: AgentReading) {
    state = { ...state, [agentId]: reading }
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* private mode: live sync still works */ }
    channel?.postMessage(state)
    emit()
  },
  /** Everyone back to healthy (clears the feed). */
  reset() {
    state = {}
    try { localStorage.removeItem(KEY) } catch { /* ignore */ }
    channel?.postMessage(state)
    emit()
  },
}
