import { useSyncExternalStore } from "react"
import type { AlertCategory } from "../alerts/catalogue"
import { applyThresholds, IR_THRESHOLDS, type Policy } from "./thresholds"

// Tenancy-wide alert settings for the Fast Follow demo (Settings › Alerts,
// Thresholds, Notifications, Alert stability). Saved values only: each section keeps its own
// draft until Save. Turning an alert type off stops the alert, its group, the
// Send to IT prompt and notifications — not the data (epic rules 4 and 5).

export type Stability = "sensitive" | "balanced" | "calm"
export interface NotifySettings {
  /** opt-in: nothing is emailed until at least one recipient is added (epic rule 6) */
  enabled: boolean
  recipients: string[]
  minEndpoints: number
  minMinutes: number
  cooldownMin: number
}
export interface Saved { by: string; at: Date }

export const IR_DEFAULT_NOTIFY: NotifySettings = { enabled: true, recipients: ["servicedesk@acme.com"], minEndpoints: 20, minMinutes: 15, cooldownMin: 60 }
export const IR_DEFAULT_STABILITY: Record<AlertCategory, Stability> = { network: "balanced", system: "balanced", platform: "balanced", devices: "balanced" }

interface State {
  disabledTypes: string[]
  notify: NotifySettings
  itReports: string
  stability: Record<AlertCategory, Stability>
  thresholds: Policy
  saved: Partial<Record<"types" | "thresholds" | "notify" | "stability" | "headsets", Saved>>
  version: number
}

let state: State = {
  disabledTypes: [],
  notify: IR_DEFAULT_NOTIFY,
  itReports: "it-reports@acme.com",
  stability: IR_DEFAULT_STABILITY,
  thresholds: IR_THRESHOLDS,
  saved: { notify: { by: "Marcus Reyes", at: new Date(Date.now() - 3 * 86400000) }, headsets: { by: "Alex Kim", at: new Date(Date.now() - 19 * 86400000) } },
  version: 0,
}
const subs = new Set<() => void>()
const set = (patch: Partial<State>) => { state = { ...state, ...patch, version: state.version + 1 }; subs.forEach((f) => f()) }

export const useSettings = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f) } }, () => state)
export const getSettings = () => state

export const saveTypes = (disabledTypes: string[], by: string) => set({ disabledTypes, saved: { ...state.saved, types: { by, at: new Date() } } })
export const saveNotify = (notify: NotifySettings, itReports: string, by: string) => set({ notify, itReports, saved: { ...state.saved, notify: { by, at: new Date() } } })
export const saveStability = (stability: Record<AlertCategory, Stability>, by: string) => set({ stability, saved: { ...state.saved, stability: { by, at: new Date() } } })

export const saveThresholds = (thresholds: Policy, by: string) => { applyThresholds(thresholds); set({ thresholds, saved: { ...state.saved, thresholds: { by, at: new Date() } } }) }

export const markHeadsetsSaved = (by: string) => set({ saved: { ...state.saved, headsets: { by, at: new Date() } } })

export const isTypeOn = (typeId: string) => !state.disabledTypes.includes(typeId)

export function savedLine(s?: Saved) {
  if (!s) return "Using IR defaults"
  const when = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(s.at)
  return `Last saved by ${s.by} · ${when}`
}
