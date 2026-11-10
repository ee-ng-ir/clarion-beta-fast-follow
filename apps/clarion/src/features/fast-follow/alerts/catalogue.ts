// The alert catalogue: every alert type Clarion raises, in the plain words agents
// and IT see. Warning and Critical of the same type share one group (epic rule 1).
// Platform alerts group per platform (Teams and Zoom are separate groups).
// Source: "Smarter and actionable alerts" epic + the PO's Smart Alerts prototype.

import { Activity, BatteryLow, Cpu, Gauge, HardDrive, Headphones, MemoryStick, Siren, Wifi, type LucideIcon } from "lucide-react"

export type AlertCategory = "network" | "system" | "platform" | "devices"

export interface AlertType {
  id: string
  category: AlertCategory
  /** name at Warning level */
  warning: string
  /** name at Critical level */
  critical: string
  icon: LucideIcon
  /** the reading behind it, for evidence lines (null = no threshold, e.g. "can't reach") */
  metric: { name: string; unit: string; warn: number; crit: number; lowerIsWorse: boolean } | null
  /** where IT should look first, from the alert catalogue (E1: owner TBC) */
  lookFirst: string
}

export const categoryLabel: Record<AlertCategory, string> = {
  network: "Network", system: "System", platform: "UC & CC platforms", devices: "Devices",
}

const base: AlertType[] = [
  { id: "call-quality", category: "network", warning: "Call quality may drop", critical: "Poor call quality", icon: Gauge,
    metric: { name: "Network quality index", unit: "", warn: 3.3, crit: 2.3, lowerIsWorse: true },
    lookFirst: "the local network at the affected locations, not individual PCs" },
  { id: "wifi", category: "network", warning: "Weak Wi-Fi", critical: "Very weak Wi-Fi", icon: Wifi,
    metric: { name: "Wi-Fi signal", unit: "%", warn: 50, crit: 25, lowerIsWorse: true },
    lookFirst: "Wi-Fi coverage where these agents sit; ask home workers to move closer to the router or plug in" },
  { id: "cpu", category: "system", warning: "Your computer is busy", critical: "Your computer is overloaded", icon: Cpu,
    metric: { name: "CPU", unit: "%", warn: 85, crit: 95, lowerIsWorse: false },
    lookFirst: "power settings and background apps on the affected PCs" },
  { id: "memory", category: "system", warning: "Running low on memory", critical: "Very low on memory", icon: MemoryStick,
    metric: { name: "Memory used", unit: "%", warn: 90, crit: 97, lowerIsWorse: false },
    lookFirst: "apps left open on the affected PCs, and their RAM" },
  { id: "storage", category: "system", warning: "Low storage space", critical: "Very low storage space", icon: HardDrive,
    metric: { name: "Disk free space", unit: "%", warn: 5, crit: 2, lowerIsWorse: true },
    lookFirst: "temp files and downloads on the affected PCs" },
  { id: "battery", category: "system", warning: "Battery low", critical: "Battery very low", icon: BatteryLow,
    metric: { name: "Battery", unit: "%", warn: 20, crit: 10, lowerIsWorse: true },
    lookFirst: "whether these agents are working unplugged" },
  { id: "audio-device", category: "devices", warning: "Headset problem", critical: "No headphones or speaker connected", icon: Headphones,
    metric: null, lookFirst: "the headset or its USB connection on each endpoint" },
]

const platformNames = ["Genesys Cloud", "Microsoft Teams", "Zoom", "Webex", "Nice CXone"] as const
const platformTypes: AlertType[] = platformNames.map((p) => ({
  id: `platform:${p}`, category: "platform", warning: `${p} call quality may be reduced`, critical: `Can't reach ${p}`, icon: Siren,
  metric: null, lookFirst: `${p}'s service status, then the network path from the affected locations`,
}))

export const ALERT_TYPES: AlertType[] = [...base, ...platformTypes]
export const alertType = (id: string) => ALERT_TYPES.find((t) => t.id === id) ?? { ...base[0], id, icon: Activity }
