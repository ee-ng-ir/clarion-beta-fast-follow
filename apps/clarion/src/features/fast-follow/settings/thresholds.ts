// Tenancy-wide default thresholds (Settings › Alerts & thresholds): the original Clarion
// Thresholds page minus custom thresholds by location. One source: saving here
// moves the thresholds the alerts and their evidence use.

import { METRICS, METRIC_CATEGORIES, type MetricCategory, type MetricDef } from "@/data/thresholds"
import { ALERT_TYPES } from "../alerts/catalogue"

export type Band = { warn: number; crit: number }
export type Policy = Record<string, Band>

/** Each slider on the page, and the alert type its numbers drive (null = no Fast Follow alert reads it yet). */
const DRIVES: Record<string, string | null> = {
  networkmos: "call-quality", wifi: "wifi", cpu: "cpu", memory: "memory", disk: "storage", platformmos: null,
}
export const THRESHOLD_METRICS: MetricDef[] = METRICS
export const THRESHOLD_CATEGORIES: MetricCategory[] = METRIC_CATEGORIES

const typeMetric = (metricId: string) => {
  const id = DRIVES[metricId]
  return id ? ALERT_TYPES.find((t) => t.id === id)?.metric ?? null : null
}

/** IR's defaults: the values the alerts were designed with, so nothing moves until someone saves. */
export const IR_THRESHOLDS: Policy = Object.fromEntries(METRICS.map((m) => {
  const t = typeMetric(m.id)
  return [m.id, t ? { warn: t.warn, crit: t.crit } : { warn: m.defaultWarn, crit: m.defaultCrit }]
}))

/** Push saved thresholds into the alert catalogue, so alerts and evidence use them. */
export function applyThresholds(p: Policy) {
  for (const m of METRICS) {
    const t = typeMetric(m.id)
    if (t && p[m.id]) { t.warn = p[m.id].warn; t.crit = p[m.id].crit }
  }
}

export const samePolicy = (a: Policy, b: Policy) => METRICS.every((m) => a[m.id].warn === b[m.id].warn && a[m.id].crit === b[m.id].crit)

/** The threshold behind an alert type, as a metric id ("platformmos" for every platform), or null when it has none. */
export function metricForType(typeId: string): string | null {
  if (typeId.startsWith("platform:")) return "platformmos"
  return Object.keys(DRIVES).find((m) => DRIVES[m] === typeId) ?? null
}
