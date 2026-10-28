// Threshold policy model for the Thresholds page.
// A "default policy" sets warn/crit boundaries per metric for every device.
// Rules override the default for specific scopes (regions/locations).
//
// TODO(product): "Default as a rule" — is the default a special always-on rule
// (rules[0], lowest priority) or a separate object? Modelled separately here as
// `defaultPolicy` for now.
// TODO(eng): real engineering defaults (upper/lower/average per metric) needed;
// the values below are placeholders driving "Reset to engineering defaults".

import { Cpu, MemoryStick, AudioLines, Wifi, HardDrive, Phone, type LucideIcon } from "lucide-react"
import { locations } from "./dashboard"

export type Direction = "higher" | "lower"
export type MetricCategory = "Network" | "System" | "Platform"
export const METRIC_CATEGORIES: MetricCategory[] = ["Network", "System", "Platform"]

export interface MetricDef {
  id: string
  category: MetricCategory
  name: string
  icon: LucideIcon
  min: number
  max: number
  step: number
  unit: string
  decimals: number
  direction: Direction // "higher" = higher is worse; "lower" = lower is worse (inverted)
  defaultWarn: number
  defaultCrit: number
  /** optional explanatory tooltip shown via an (i) icon next to the metric name */
  tooltip?: string
}

export const METRICS: MetricDef[] = [
  // Network
  { id: "networkmos", category: "Network", name: "Network Quality Index", icon: AudioLines, min: 1, max: 5, step: 0.1, unit: "", decimals: 1, direction: "lower", defaultWarn: 4.0, defaultCrit: 3.0, tooltip: "Predicted call quality score for this network, based on latency, jitter and packet loss." },
  { id: "wifi", category: "Network", name: "Wi-Fi signal", icon: Wifi, min: 0, max: 100, step: 1, unit: "%", decimals: 0, direction: "lower", defaultWarn: 50, defaultCrit: 25 },
  // System
  { id: "cpu", category: "System", name: "CPU utilisation", icon: Cpu, min: 0, max: 100, step: 1, unit: "%", decimals: 0, direction: "higher", defaultWarn: 70, defaultCrit: 85 },
  { id: "memory", category: "System", name: "Memory utilisation", icon: MemoryStick, min: 0, max: 100, step: 1, unit: "%", decimals: 0, direction: "higher", defaultWarn: 75, defaultCrit: 90 },
  { id: "disk", category: "System", name: "Disk free space", icon: HardDrive, min: 0, max: 100, step: 1, unit: "%", decimals: 0, direction: "lower", defaultWarn: 15, defaultCrit: 5 },
  // Platform
  { id: "platformmos", category: "Platform", name: "Platform Quality Index", icon: Phone, min: 1, max: 5, step: 0.1, unit: "", decimals: 1, direction: "lower", defaultWarn: 4.0, defaultCrit: 3.0, tooltip: "Predicted call quality score for the platform, based on latency, jitter and packet loss." },
]

export const metricById = (id: string) => METRICS.find((m) => m.id === id)

export const fmtValue = (m: MetricDef, v: number) => `${v.toFixed(m.decimals)}${m.unit}`
export const fmtRange = (m: MetricDef, warn: number, crit: number) => `${fmtValue(m, warn)} / ${fmtValue(m, crit)}`
export const fmtDefaults = (m: MetricDef) => fmtRange(m, m.defaultWarn, m.defaultCrit)

export interface Band { warn: number; crit: number }

export type ThresholdPolicy = Record<string, Band>

export const defaultPolicy: ThresholdPolicy = Object.fromEntries(
  METRICS.map((m) => [m.id, { warn: m.defaultWarn, crit: m.defaultCrit }])
)

export interface ThresholdRule {
  id: string
  name: string
  scopes: string[] // location ids
  overrides: ThresholdPolicy // only the metrics that differ from the default
}

// Scope options for the picker. "By region" = locations (cities) with their
// device counts. Call-centre / agent scopes are future (stubbed in the UI).
// TODO(product): scope structure — call centre & agent may nest inside region
// (region → call centre → agent) rather than being sibling sections.
export interface ScopeOption { id: string; name: string; count: number }
export const regionScopes: ScopeOption[] = locations.map((l) => ({ id: l.id, name: l.name, count: l.endpoints }))
export const scopeById = (id: string) => regionScopes.find((s) => s.id === id)

export const initialRules: ThresholdRule[] = [
  {
    id: "rule-mnl-remote",
    name: "Manila remote workers",
    scopes: ["manilla"],
    overrides: { cpu: { warn: 60, crit: 80 }, wifi: { warn: 55, crit: 35 } },
  },
  {
    id: "rule-india",
    name: "India centres",
    scopes: ["bangalore", "hyderabad"],
    overrides: { networkmos: { warn: 4.1, crit: 3.2 } },
  },
]

export const overrideCount = (r: ThresholdRule) => Object.keys(r.overrides).length
