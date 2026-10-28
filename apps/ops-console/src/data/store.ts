// In-memory store for the prototype. Everything an operator does (create a
// tenant, change a plan, flip a flag) sticks for the session and lands in the
// tenant's audit log, so a walkthrough hangs together. Reload to reset.

import { useSyncExternalStore } from "react"
import { flagDef, flagDefs, seedGlobalFlags, type FlagValue, type ProductId } from "./catalog"
import { seedAudit, seedTenants, type AuditEvent, type ClientAdmin, type Subscription, type Tenant } from "./tenants"
import { NOW } from "@/lib/format"

export const OPERATOR = { name: "Ee Ng", email: "ee.ng@ir.com" }

interface State {
  env: string
  tenants: Tenant[]
  globalFlags: Record<string, FlagValue>
  audit: Record<string, AuditEvent[]>
}

let state: State = {
  env: "dev",
  tenants: seedTenants,
  globalFlags: { ...seedGlobalFlags },
  audit: Object.fromEntries(seedTenants.map((t) => [t.id, seedAudit(t)])),
}

const listeners = new Set<() => void>()
const set = (next: Partial<State>) => {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useOps<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state))
}

export const getTenant = (id: string) => state.tenants.find((t) => t.id === id)

const NO_EVENTS: AuditEvent[] = []
export const auditFor = (id: string): AuditEvent[] => state.audit[id] ?? NO_EVENTS

function log(tenantId: string, action: string, targetType: AuditEvent["targetType"], target: string, details: Record<string, unknown> = {}) {
  const list = auditFor(tenantId)
  const e: AuditEvent = {
    id: `${tenantId}-live-${list.length}-${Date.now()}`,
    ts: new Date(Math.max(Date.now(), NOW.getTime())).toISOString(),
    action, targetType, target, origin: "Internal", actor: OPERATOR.email, details,
  }
  return { ...state.audit, [tenantId]: [e, ...list] }
}

function patchTenant(id: string, fn: (t: Tenant) => Tenant, audit?: Parameters<typeof log>) {
  const tenants = state.tenants.map((t) => (t.id === id ? fn(t) : t))
  set({ tenants, ...(audit ? { audit: log(...audit) } : {}) })
}

// ------------------------------------------------------------------- env --

export const setEnv = (env: string) => set({ env })

// --------------------------------------------------------------- tenants --

export function createTenant(t: Tenant) {
  set({ tenants: [t, ...state.tenants] })
  set({ audit: { ...state.audit, [t.id]: [] } })
  set({ audit: log(t.id, "tenant.provision.succeeded", "tenant", t.name, { region: t.region, domains: t.domains }) })
  if (t.admins[0]) set({ audit: log(t.id, "user.invited", "user", `${t.admins[0].name} <${t.admins[0].email}>`, { role: "tenant_admin" }) })
}

export function updateTenant(id: string, patch: Partial<Pick<Tenant, "name" | "contact" | "domains" | "accountCode">>) {
  patchTenant(id, (t) => ({ ...t, ...patch }), [id, "tenant.details.updated", "tenant", getTenant(id)?.name ?? id, patch])
}

export function cancelTenant(id: string) {
  patchTenant(id, (t) => ({
    ...t,
    status: "cancelled",
    subscriptions: t.subscriptions.map((s) => ({ ...s, status: "cancelled" })),
    admins: t.admins.map((a) => ({ ...a, status: "inactive" })),
  }), [id, "tenant.cancelled", "tenant", getTenant(id)?.name ?? id])
}

export function retryProvisioning(id: string) {
  patchTenant(id, (t) => ({ ...t, status: "active", failure: undefined }), [id, "tenant.provision.succeeded", "tenant", getTenant(id)?.name ?? id, { retried: true }])
}

// ---------------------------------------------------------------- admins --

export function addAdmin(id: string, a: ClientAdmin) {
  patchTenant(id, (t) => ({ ...t, admins: [...t.admins, a] }), [id, "user.invited", "user", `${a.name} <${a.email}>`, { role: "tenant_admin" }])
}

export function setAdminStatus(id: string, adminId: string, status: ClientAdmin["status"]) {
  const a = getTenant(id)?.admins.find((x) => x.id === adminId)
  patchTenant(id, (t) => ({ ...t, admins: t.admins.map((x) => (x.id === adminId ? { ...x, status } : x)) }),
    [id, status === "inactive" ? "user.deactivated" : "user.reactivated", "user", `${a?.name} <${a?.email}>`])
}

export function resendInvite(id: string, adminId: string) {
  const a = getTenant(id)?.admins.find((x) => x.id === adminId)
  patchTenant(id, (t) => ({ ...t, admins: t.admins.map((x) => (x.id === adminId ? { ...x, invited: new Date().toISOString() } : x)) }),
    [id, "user.invite.resent", "user", `${a?.name} <${a?.email}>`])
}

// --------------------------------------------------------- subscriptions --

export function updateSubscription(id: string, product: ProductId, patch: Partial<Subscription>, action = "subscription.updated") {
  patchTenant(id, (t) => ({
    ...t,
    subscriptions: t.subscriptions.map((s) => (s.product === product && s.status !== "cancelled" ? { ...s, ...patch, updated: new Date().toISOString() } : s)),
  }), [id, action, "subscription", product, patch as Record<string, unknown>])
}

export function provisionProduct(id: string, sub: Subscription) {
  patchTenant(id, (t) => ({ ...t, subscriptions: [...t.subscriptions.filter((s) => !(s.product === sub.product && s.status === "cancelled")), sub] }),
    [id, "subscription.provisioned", "subscription", sub.product, { plan: sub.plan, version: sub.version, trial: sub.trial }])
}

/** Bulk actions on Product plans. */
export function resync(keys: { tenant: string; product: ProductId }[]) {
  keys.forEach((k) => updateSubscription(k.tenant, k.product, { sync: "in-sync" }, "subscription.resynced"))
}
export function setVersion(keys: { tenant: string; product: ProductId }[], version: string) {
  keys.forEach((k) => updateSubscription(k.tenant, k.product, { version, sync: "pending" }, "subscription.version.updated"))
}

// ----------------------------------------------------------------- flags --

export function setOverride(id: string, key: string, value: FlagValue | undefined) {
  patchTenant(id, (t) => {
    const overrides = { ...t.overrides }
    if (value === undefined) delete overrides[key]
    else overrides[key] = value
    return { ...t, overrides }
  }, [id, value === undefined ? "flag.override.removed" : "flag.override.set", "flag", key, value === undefined ? {} : { value }])
}

export function setGlobal(key: string, value: FlagValue | undefined) {
  const globalFlags = { ...state.globalFlags }
  if (value === undefined) delete globalFlags[key]
  else globalFlags[key] = value
  set({ globalFlags })
}

export const overrideCount = (key: string) => state.tenants.filter((t) => t.status !== "cancelled" && key in t.overrides).length
export const useOverrideCounts = () =>
  useOps((s) => s.tenants).reduce<Record<string, number>>((acc, t) => {
    if (t.status === "cancelled") return acc
    Object.keys(t.overrides).forEach((k) => (acc[k] = (acc[k] ?? 0) + 1))
    return acc
  }, {})

export type FlagSource = "global" | "subscription" | "tenant"

export interface EffectiveFlag {
  key: string
  type: FlagDef["type"]
  description: string
  sources: FlagSource[]
  value: FlagValue
  /** Who decides the value right now. */
  decidedBy: FlagSource
  global?: FlagValue
  override?: FlagValue
  subscription?: ProductId
}
type FlagDef = (typeof flagDefs)[number]

/**
 * What applies to one tenant, and why: a tenant override beats a subscription
 * value beats the global default. Subscription-controlled values are edited on
 * Products, so they never take a tenant override here.
 */
export function effectiveFlags(t: Tenant, globals: Record<string, FlagValue>): EffectiveFlag[] {
  const live = t.subscriptions.filter((s) => s.status !== "cancelled")
  const subValue = (key: string) => {
    for (const s of live) {
      if (key in s.flags) return { value: s.flags[key], product: s.product }
      if (key === "clarion-admin-user-max") return { value: s.adminLicenses, product: s.product }
      if (key === "clarion-widget-user-max") return { value: s.widgetLicenses, product: s.product }
      if (key === "clarion-widget-ui-enabled") return { value: s.widgetExperience === "interactive", product: s.product }
    }
    return undefined
  }
  const out: EffectiveFlag[] = []
  for (const def of flagDefs) {
    const g = globals[def.key]
    const sv = subValue(def.key)
    const o = t.overrides[def.key]
    if (g === undefined && !sv && o === undefined) continue
    const sources: FlagSource[] = []
    if (g !== undefined) sources.push("global")
    if (sv) sources.push("subscription")
    if (o !== undefined && !sv) sources.push("tenant")
    const decidedBy: FlagSource = sv ? "subscription" : o !== undefined ? "tenant" : "global"
    out.push({
      key: def.key, type: def.type, description: def.description, sources, decidedBy,
      value: sv ? sv.value : o !== undefined ? o : (g as FlagValue),
      global: g, override: sv ? undefined : o, subscription: sv?.product,
    })
  }
  return out.sort((a, b) => a.key.localeCompare(b.key))
}

/** Flags that can be added to a tenant: registered, and not already applied. */
export const addableFlags = (t: Tenant, globals: Record<string, FlagValue>) => {
  const applied = new Set(effectiveFlags(t, globals).map((f) => f.key))
  return flagDefs.filter((f) => !f.subscription && !applied.has(f.key))
}

export const defaultFor = (key: string): FlagValue => {
  const d = flagDef(key)
  return d?.type === "boolean" ? false : d?.type === "integer" ? 0 : ""
}
