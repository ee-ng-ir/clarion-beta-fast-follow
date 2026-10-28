// Vantage: the second Iris product in the dummy tenant. Placeholder data, there to
// show how RBAC, locations and SSO scale past one product.
//
// Vantage monitors high-value payments, in the spirit of Prognosis Transact: the
// SWIFT and RTGS gateways, the payments hub and what it depends on (message queues,
// HSMs, HPE NonStop, sanctions screening), so payments operations see a stuck or
// late payment before cut-off. Its records are "systems". Like a Clarion widget
// user, each system sits in at most one Iris location, and a role limited to
// locations only sees systems in them.
//
// Systems live in the same shared location list as Clarion, which is the point:
// most sit in data centres and a cloud region that Clarion never uses, and a few in
// the offices both products share (London, Chicago).

import { useSyncExternalStore } from "react"

export type SystemKind =
  | "SWIFT gateway" | "RTGS interface" | "Payments hub" | "Message queue"
  | "HSM" | "HPE NonStop" | "Sanctions screening" | "Payments API"
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
const LDN = "loc-ldn", CHI = "loc-chi"
const SYDC = "loc-sydc", MELDC = "loc-meldc", AWS = "loc-aws"

const seed: VantageSystem[] = [
  // Primary data centre: the payments core.
  { id: "vs-01", name: "SY3-SWIFT-AA-01", kind: "SWIFT gateway", locationId: SYDC, status: "healthy" },
  { id: "vs-02", name: "SY3-SWIFT-AA-02", kind: "SWIFT gateway", locationId: SYDC, status: "warning" },
  { id: "vs-03", name: "SY3-RITS-IF", kind: "RTGS interface", locationId: SYDC, status: "healthy" },
  { id: "vs-04", name: "SY3-PAYHUB-PRD", kind: "Payments hub", locationId: SYDC, status: "critical" },
  { id: "vs-05", name: "SY3-MQ-QM01", kind: "Message queue", locationId: SYDC, status: "warning" },
  { id: "vs-06", name: "SY3-HSM-01", kind: "HSM", locationId: SYDC, status: "healthy" },
  { id: "vs-07", name: "SY3-NSK-PRD", kind: "HPE NonStop", locationId: SYDC, status: "healthy" },
  // Secondary data centre: disaster recovery.
  { id: "vs-08", name: "ME2-SWIFT-AA-DR", kind: "SWIFT gateway", locationId: MELDC, status: "healthy" },
  { id: "vs-09", name: "ME2-PAYHUB-DR", kind: "Payments hub", locationId: MELDC, status: "healthy" },
  { id: "vs-10", name: "ME2-MQ-QM02", kind: "Message queue", locationId: MELDC, status: "healthy" },
  { id: "vs-11", name: "ME2-HSM-02", kind: "HSM", locationId: MELDC, status: "warning" },
  { id: "vs-12", name: "ME2-NSK-DR", kind: "HPE NonStop", locationId: MELDC, status: "healthy" },
  // Cloud region.
  { id: "vs-13", name: "Sanctions screening (APSE2)", kind: "Sanctions screening", locationId: AWS, status: "healthy" },
  { id: "vs-14", name: "Corporate payments API", kind: "Payments API", locationId: AWS, status: "warning" },
  { id: "vs-15", name: "AWS-MQ-BRIDGE", kind: "Message queue", locationId: AWS, status: "healthy" },
  // Offices both products use: overseas branches with their own rails.
  { id: "vs-16", name: "LDN-SWIFT-AA-01", kind: "SWIFT gateway", locationId: LDN, status: "healthy" },
  { id: "vs-17", name: "LDN-CHAPS-IF", kind: "RTGS interface", locationId: LDN, status: "critical" },
  { id: "vs-18", name: "LDN-HSM-01", kind: "HSM", locationId: LDN, status: "healthy" },
  { id: "vs-19", name: "CHI-FEDWIRE-IF", kind: "RTGS interface", locationId: CHI, status: "healthy" },
  { id: "vs-20", name: "CHI-SWIFT-AA-01", kind: "SWIFT gateway", locationId: CHI, status: "healthy" },
  // Discovered, not yet placed.
  { id: "vs-21", name: "MQ-10.20.4.11", kind: "Message queue", locationId: null, status: "warning" },
  { id: "vs-22", name: "HSM-10.31.0.7", kind: "HSM", locationId: null, status: "healthy" },
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
