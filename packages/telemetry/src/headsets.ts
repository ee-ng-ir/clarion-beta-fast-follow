// Approved headsets (Fast Follow): the contract between the Clarion dashboard,
// where IT picks the approved models, and the widget, which tells the agent.
//
// - IR's headset catalogue: the models IT can choose from. Being on it doesn't
//   approve a model; IT does that. Matching is by USB VID/PID, so the device
//   name Windows reports never decides it (questions log H3).
// - The tenancy's approved list: saved in the dashboard, synced to every widget
//   (same-browser here: localStorage + BroadcastChannel, like the feed).
// - Each demo agent's current headset, so the presenter can change it live.
// Advisory only: compliance never changes an endpoint's status or readiness (D4).

import { useSyncExternalStore } from "react"

export type HeadsetConnection = "USB" | "USB dongle" | "Bluetooth"
export interface HeadsetModel {
  id: string
  model: string
  vendor: string
  connection: HeadsetConnection
  /** USB vendor and product IDs; null where Clarion can't read them (Bluetooth) */
  vidPid: string | null
  /** on IR's headset list (the catalogue IT chooses from) */
  onIrList: boolean
  /** dropped from IR's list; stays approved until IT removes it */
  retired?: boolean
}

export const HEADSET_CATALOGUE: HeadsetModel[] = [
  { id: "jabra-evolve2-75", model: "Jabra Evolve2 75", vendor: "Jabra", connection: "USB dongle", vidPid: "0B0E:24F1", onIrList: true },
  { id: "jabra-evolve2-65", model: "Jabra Evolve2 65", vendor: "Jabra", connection: "USB dongle", vidPid: "0B0E:245E", onIrList: true },
  { id: "jabra-evolve2-85", model: "Jabra Evolve2 85", vendor: "Jabra", connection: "USB dongle", vidPid: "0B0E:24F3", onIrList: true },
  { id: "jabra-engage-55", model: "Jabra Engage 55", vendor: "Jabra", connection: "USB dongle", vidPid: "0B0E:2470", onIrList: true },
  { id: "poly-voyager-focus-2", model: "Poly Voyager Focus 2", vendor: "Poly", connection: "USB dongle", vidPid: "047F:0218", onIrList: true },
  { id: "poly-voyager-4320", model: "Poly Voyager 4320", vendor: "Poly", connection: "USB dongle", vidPid: "047F:02EE", onIrList: true },
  { id: "poly-blackwire-5220", model: "Poly Blackwire 5220", vendor: "Poly", connection: "USB", vidPid: "047F:C053", onIrList: false, retired: true },
  { id: "logitech-zone-vibe-125", model: "Logitech Zone Vibe 125", vendor: "Logitech", connection: "USB dongle", vidPid: "046D:0AFC", onIrList: true },
  { id: "logitech-zone-vibe-100", model: "Logitech Zone Vibe 100", vendor: "Logitech", connection: "Bluetooth", vidPid: null, onIrList: true },
  { id: "logitech-zone-wired", model: "Logitech Zone Wired", vendor: "Logitech", connection: "USB", vidPid: "046D:0ADD", onIrList: true },
  { id: "epos-adapt-660", model: "EPOS ADAPT 660", vendor: "EPOS", connection: "USB dongle", vidPid: "1395:0300", onIrList: true },
  { id: "yealink-uh37", model: "Yealink UH37", vendor: "Yealink", connection: "USB", vidPid: "6993:B0A5", onIrList: true },
]
/** Headsets that turn up on endpoints but aren't on IR's list. */
export const UNLISTED_HEADSETS: HeadsetModel[] = [
  { id: "usb-generic", model: "USB Headset (unbranded)", vendor: "Unknown", connection: "USB", vidPid: "1B3F:2008", onIrList: false },
  { id: "airpods-pro", model: "AirPods Pro", vendor: "Apple", connection: "Bluetooth", vidPid: null, onIrList: false },
]
export const headsetById = (id: string | null | undefined) =>
  [...HEADSET_CATALOGUE, ...UNLISTED_HEADSETS].find((h) => h.id === id) ?? null

export type Compliance = "approved" | "not-approved" | "not-checked" | "none" | "no-list"

/** Approved / not approved / can't be checked (no VID/PID) / no headset / no list set (nothing enforced). */
export function complianceOf(headset: HeadsetModel | null, approved: string[]): Compliance {
  if (approved.length === 0) return "no-list"
  if (!headset) return "none"
  if (!headset.vidPid) return "not-checked"
  return approved.includes(headset.id) ? "approved" : "not-approved"
}

export const complianceLabel: Record<Compliance, string> = {
  approved: "Approved", "not-approved": "Not approved", "not-checked": "Not checked", none: "No headset", "no-list": "No list set",
}

// ---- synced stores (same-browser: dashboard ↔ widget) -------------------------

function syncedStore<T>(key: string, fallback: T) {
  const read = (): T => { try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback } catch { return fallback } }
  let value: T = typeof localStorage === "undefined" ? fallback : read()
  const listeners = new Set<() => void>()
  const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(key) : null
  const emit = () => listeners.forEach((l) => l())
  channel?.addEventListener("message", (e: MessageEvent<T>) => { value = e.data; emit() })
  if (typeof window !== "undefined") window.addEventListener("storage", (e) => { if (e.key === key) { value = read(); emit() } })
  return {
    get: () => value,
    set(v: T) { value = v; try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* private mode: live sync still works */ } channel?.postMessage(v); emit() },
    subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
  }
}

/** The tenancy's approved models (ids). PO prototype's starting list, incl. one IR has since retired. */
export const DEFAULT_APPROVED = ["jabra-evolve2-65", "jabra-evolve2-75", "logitech-zone-vibe-125", "poly-blackwire-5220", "poly-voyager-focus-2"]
export const approvedHeadsets = syncedStore<string[]>("ir-approved-headsets:v1", DEFAULT_APPROVED)
export const useApprovedHeadsets = () => useSyncExternalStore(approvedHeadsets.subscribe, approvedHeadsets.get)

/** Each demo agent's headset, keyed by agent id. Defaults from agents.ts by model name. */
export const agentHeadsets = syncedStore<Record<string, string>>("ir-agent-headsets:v1", {})
export const useAgentHeadsets = () => useSyncExternalStore(agentHeadsets.subscribe, agentHeadsets.get)
