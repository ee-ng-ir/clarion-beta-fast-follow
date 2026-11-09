// Which headset each endpoint is using, and whether it's approved.
// Demo agents (the live widget) use the headset chosen in the widget demo;
// everyone else gets a stable, realistic mix seeded from the endpoint id.

import { agentByEndpoint, agentHeadsets, approvedHeadsets, complianceOf, headsetById, HEADSET_CATALOGUE, useAgentHeadsets, useApprovedHeadsets, type Compliance, type HeadsetModel } from "@ir/telemetry"
import type { Endpoint } from "@/data/endpoints"

const MIX: [string | null, number][] = [
  ["jabra-evolve2-75", 38], ["poly-voyager-focus-2", 24], ["jabra-evolve2-65", 20], ["logitech-zone-vibe-125", 8],
  ["epos-adapt-660", 4], ["usb-generic", 2], ["airpods-pro", 2], [null, 2],
]
function hash(s: string) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }

const idForModel = (model: string) => HEADSET_CATALOGUE.find((h) => h.model === model)?.id ?? null

export function headsetFor(e: Endpoint): HeadsetModel | null {
  const agent = agentByEndpoint(e.id)
  if (agent) return headsetById(agentHeadsets.get()[agent.id] ?? idForModel(agent.headset))
  if (e.status === "offline") return headsetById(MIX[hash(e.id) % 3][0])
  let n = hash(e.id + "headset") % 100
  for (const [id, w] of MIX) { if (n < w) return headsetById(id); n -= w }
  return null
}

export const complianceFor = (e: Endpoint, approved = approvedHeadsets.get()): Compliance => complianceOf(headsetFor(e), approved)

/** Re-render when the approved list or a demo agent's headset changes. */
export function useHeadsetsVersion() {
  const approved = useApprovedHeadsets()
  const agents = useAgentHeadsets()
  return { approved, version: `${approved.join(",")}|${Object.values(agents).join(",")}` }
}

export const complianceBadge: Record<Compliance, "success" | "warning" | "neutral"> = {
  approved: "success", "not-approved": "warning", "not-checked": "neutral", none: "neutral", "no-list": "neutral",
}
