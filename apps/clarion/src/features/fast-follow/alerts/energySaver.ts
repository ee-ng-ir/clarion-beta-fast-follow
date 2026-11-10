// Energy saver is context, never an alert (epic "Smarter and actionable alerts", requirement 9).
// Windows energy saver throttles the CPU and cuts power to the Wi-Fi adapter, so it shows on
// the alerts it can cause: CPU, and the network alerts on endpoints that use Wi-Fi.
// Seeded per endpoint, so the group count, the endpoint's evidence and its snapshot always agree.
import { agentByEndpoint } from "@ir/telemetry"
import type { Endpoint } from "@/data/endpoints"

const AFFECTS: Record<string, { share: number; wifiOnly: boolean; effect: string }> = {
  cpu: { share: 0.8, wifiOnly: false, effect: "throttles the CPU" },
  wifi: { share: 0.45, wifiOnly: true, effect: "cuts power to the Wi-Fi adapter" },
  "call-quality": { share: 0.3, wifiOnly: true, effect: "cuts power to the Wi-Fi adapter" },
}

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967296
}

/** Whether energy saver was on for this endpoint when an alert of this type was raised. */
export function energySaverOn(typeId: string, e: Endpoint): boolean {
  const a = AFFECTS[typeId]
  if (!a || (a.wifiOnly && e.connection !== "Wi-Fi")) return false
  // demo agents only get a CPU alert from the widget's "Computer busy" scenario, which has energy saver on
  if (typeId === "cpu" && agentByEndpoint(e.id)) return true
  return hash(e.id + "es") < a.share
}

/** What energy saver does to this alert type, for evidence copy ("throttles the CPU"). */
export const energySaverEffect = (typeId: string) => AFFECTS[typeId]?.effect ?? ""
