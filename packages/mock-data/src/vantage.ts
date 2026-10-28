// Vantage: the second Iris product in the dummy tenant. Placeholder data, there to
// show how RBAC, locations and SSO scale past one product.
//
// Assumed (not from a Vantage spec): Vantage monitors the UC & CC infrastructure
// behind the contact centre: session border controllers, call managers, gateways,
// the contact-centre platform and recording. Its records are "systems". Like a
// Clarion widget user, each system sits in at most one Iris location, and a role
// limited to locations only sees systems in them.
//
// Systems live in the same shared location list as Clarion, which is the point:
// some sit in contact-centre sites (Sydney, Manila), some in places Clarion never
// uses (data centres, a cloud region).

import { useSyncExternalStore } from "react"

export type SystemKind = "SBC" | "Call manager" | "Voice gateway" | "CC platform" | "Recording" | "WAN link"
export type SystemStatus = "healthy" | "warning" | "critical"

export interface VantageSystem {
  id: string
  name: string
  kind: SystemKind
  /** Iris location id. Null = no location: only people with all-location access see it. */
  locationId: string | null
  status: SystemStatus
  /** Set when an Editor (or above) acknowledges the alert. */
  acknowledgedBy?: string
}

// Location ids are @ir/mock-data/access's, kept as strings so this file doesn't import it.
const SYD = "loc-syd", MEL = "loc-mel", MNL = "loc-mnl", LDN = "loc-ldn", CHI = "loc-chi"
const SYDC = "loc-sydc", MELDC = "loc-meldc", AWS = "loc-aws"

const seed: VantageSystem[] = [
  // Data centres: the core of the voice network.
  { id: "vs-01", name: "SY3-SBC-01", kind: "SBC", locationId: SYDC, status: "healthy" },
  { id: "vs-02", name: "SY3-SBC-02", kind: "SBC", locationId: SYDC, status: "warning" },
  { id: "vs-03", name: "SY3-CUCM-PUB", kind: "Call manager", locationId: SYDC, status: "healthy" },
  { id: "vs-04", name: "SY3-CUCM-SUB1", kind: "Call manager", locationId: SYDC, status: "healthy" },
  { id: "vs-05", name: "SY3-REC-01", kind: "Recording", locationId: SYDC, status: "critical" },
  { id: "vs-06", name: "ME2-SBC-01", kind: "SBC", locationId: MELDC, status: "healthy" },
  { id: "vs-07", name: "ME2-CUCM-SUB2", kind: "Call manager", locationId: MELDC, status: "healthy" },
  { id: "vs-08", name: "ME2-WAN-TELSTRA", kind: "WAN link", locationId: MELDC, status: "warning" },
  { id: "vs-09", name: "Genesys Cloud (APSE2)", kind: "CC platform", locationId: AWS, status: "healthy" },
  { id: "vs-10", name: "AWS-SBC-EDGE", kind: "SBC", locationId: AWS, status: "healthy" },
  { id: "vs-11", name: "AWS-REC-ARCHIVE", kind: "Recording", locationId: AWS, status: "healthy" },
  // Contact-centre sites: the gateways and links on site.
  { id: "vs-12", name: "SYD-CHW-GW-01", kind: "Voice gateway", locationId: SYD, status: "healthy" },
  { id: "vs-13", name: "SYD-PAR-GW-01", kind: "Voice gateway", locationId: SYD, status: "warning" },
  { id: "vs-14", name: "SYD-WAN-OPTUS", kind: "WAN link", locationId: SYD, status: "healthy" },
  { id: "vs-15", name: "MEL-GW-01", kind: "Voice gateway", locationId: MEL, status: "healthy" },
  { id: "vs-16", name: "MNL-ORT-GW-01", kind: "Voice gateway", locationId: MNL, status: "critical" },
  { id: "vs-17", name: "MNL-WAN-PLDT", kind: "WAN link", locationId: MNL, status: "warning" },
  { id: "vs-18", name: "LDN-GW-01", kind: "Voice gateway", locationId: LDN, status: "healthy" },
  { id: "vs-19", name: "LDN-SBC-01", kind: "SBC", locationId: LDN, status: "healthy" },
  { id: "vs-20", name: "CHI-GW-01", kind: "Voice gateway", locationId: CHI, status: "healthy" },
  // Discovered, not yet placed.
  { id: "vs-21", name: "SBC-10.20.4.11", kind: "SBC", locationId: null, status: "warning" },
  { id: "vs-22", name: "GW-10.31.0.7", kind: "Voice gateway", locationId: null, status: "healthy" },
]

const clone = () => seed.map((x) => ({ ...x }))
let systems = clone()
let version = 0
const listeners = new Set<() => void>()
const bump = () => { version++; listeners.forEach((l) => l()) }

export const vantage = {
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
  version: () => version,
  all: () => systems,
  /** Systems someone may see. `scope` null = every system, including ones with no location. */
  visible(scope: string[] | null) {
    return scope === null ? systems : systems.filter((s) => s.locationId && scope.includes(s.locationId))
  },
  setLocation(ids: string[], locationId: string | null) {
    const set = new Set(ids)
    systems = systems.map((s) => (set.has(s.id) ? { ...s, locationId } : s))
    bump()
  },
  acknowledge(id: string, by: string) {
    systems = systems.map((s) => (s.id === id ? { ...s, acknowledgedBy: by } : s))
    bump()
  },
  /** Locations are deleted in Iris; their systems lose the location. */
  clearLocation(locationId: string) {
    systems = systems.map((s) => (s.locationId === locationId ? { ...s, locationId: null } : s))
    bump()
  },
  reset() { systems = clone(); bump() },
}

export const systemsIn = (locationId: string) => systems.filter((s) => s.locationId === locationId).length
export const unassignedSystems = () => systems.filter((s) => !s.locationId).length

export const useVantage = () => { useSyncExternalStore(vantage.subscribe, vantage.version); return vantage.all() }
