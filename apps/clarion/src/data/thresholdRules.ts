// Custom threshold rules, scoped to Iris Locations and gated by Iris RBAC.
// Strawman — see apps/clarion/CUSTOM-THRESHOLDS.md for the reasoning and open questions.
//
// How it fits together:
// - Tenant defaults (data/thresholds.ts → defaultPolicy) apply to every endpoint.
// - A rule overrides some metrics for one or more *Iris Locations* (the flat,
//   customer-named list shared by every Iris product — not the detected city on the map).
// - One owner per (location × metric): a location can be in several rules, but only
//   one rule may set a given metric there. So the effective value is always
//   "the rule that claims it, else the default" — no priorities to reason about.
// - Widget users with no location always get the defaults.
// - Who can do what comes from the caller's Clarion roles (see thresholdAccess).
//   The server must enforce the same check on every write.

import {
  access, clarionAccess, grantsOf, locationName, tenantRolesOf, widgetUsersIn,
} from "@ir/mock-data/access"
import { METRICS, metricById, type Band, type ThresholdPolicy } from "./thresholds"

export interface LocationRule {
  id: string
  name: string
  /** Iris Location ids. */
  locations: string[]
  /** Only the metrics that differ from the default. */
  overrides: ThresholdPolicy
  updatedBy: string
  updatedAgo: string
}

const L = { syd: "loc-syd", mel: "loc-mel", akl: "loc-akl", mnl: "loc-mnl", ldn: "loc-ldn", chi: "loc-chi" }

export const seedRules: LocationRule[] = [
  { id: "rule-mnl", name: "Manila outsourcer", locations: [L.mnl], overrides: { cpu: { warn: 60, crit: 80 }, wifi: { warn: 55, crit: 35 } }, updatedBy: "Marcus Reyes", updatedAgo: "3 days ago" },
  { id: "rule-anz-voice", name: "ANZ voice quality", locations: [L.syd, L.mel, L.akl], overrides: { networkmos: { warn: 4.1, crit: 3.3 } }, updatedBy: "Marcus Reyes", updatedAgo: "2 weeks ago" },
  { id: "rule-syd-hotdesk", name: "Sydney hot desks", locations: [L.syd], overrides: { wifi: { warn: 60, crit: 40 }, disk: { warn: 20, crit: 10 } }, updatedBy: "Mei Lin", updatedAgo: "yesterday" },
  { id: "rule-ldn-vdi", name: "London VDI", locations: [L.ldn], overrides: { memory: { warn: 80, crit: 92 } }, updatedBy: "Marcus Reyes", updatedAgo: "1 month ago" },
]

// ------------------------------------------------------------------- access --

export type ThresholdMode = "none" | "read" | "edit"

export interface ThresholdAccess {
  mode: ThresholdMode
  /** Can change the tenant defaults and alert routing (affects every location). */
  editDefaults: boolean
  /** Locations this person may put in a rule. null = every location. */
  editScope: string[] | null
  /** Locations whose rules this person can see. null = every location. */
  seeScope: string[] | null
  /** One line for the "viewing as" bar. */
  summary: string
}

/**
 * Thresholds permission, derived from Iris roles. Strawman:
 * - Tenant Admin, or Clarion Product Admin for every location → edit everything.
 * - Clarion Product Admin limited to locations → read the defaults, and create or edit
 *   rules that only touch their locations. Rules that reach other locations are read-only.
 * - Auditor → read-only, everything (thresholds are settings, not endpoint data). Open question.
 * - Viewer / Editor / User Admin → no Thresholds page.
 *
 * Note: the edit scope uses *only* Product Admin grants. productAccess() unions the locations
 * of every Clarion role, so Viewer-everywhere + Product Admin-Sydney would wrongly read as
 * "admin everywhere".
 */
export function thresholdAccess(personId: string): ThresholdAccess {
  const c = clarionAccess(personId)
  const auditor = tenantRolesOf(personId).includes("auditor")
  if (c.role === "tenant_admin") return { mode: "edit", editDefaults: true, editScope: null, seeScope: null, summary: "Tenant Admin · edits everything" }

  const adminGrants = grantsOf(personId).map((g) => g.assignment).filter((x) => x.role === "product_admin" && x.product === "clarion")
  if (adminGrants.length) {
    const everywhere = adminGrants.some((x) => x.locations.length === 0)
    if (everywhere) return { mode: "edit", editDefaults: true, editScope: null, seeScope: null, summary: "Clarion Product Admin · every location" }
    const locs = [...new Set(adminGrants.flatMap((x) => x.locations))]
    return { mode: "edit", editDefaults: false, editScope: locs, seeScope: locs, summary: `Clarion Product Admin · ${locs.map(locationName).join(", ")}` }
  }
  if (auditor) return { mode: "read", editDefaults: false, editScope: [], seeScope: null, summary: "Auditor · read-only" }
  return { mode: "none", editDefaults: false, editScope: [], seeScope: [], summary: c.role ? `Clarion ${c.role === "viewer" ? "Viewer" : "Editor"} · no Thresholds` : "No Clarion access" }
}

export const inScope = (scope: string[] | null, id: string) => scope === null || scope.includes(id)

/** How a rule looks to this person. */
export function ruleVisibility(rule: LocationRule, acc: ThresholdAccess) {
  const visible = rule.locations.filter((id) => inScope(acc.seeScope, id))
  const hidden = rule.locations.length - visible.length
  const canEdit = acc.mode === "edit" && rule.locations.every((id) => inScope(acc.editScope, id))
  return { show: visible.length > 0, visible, hidden, canEdit }
}

// ------------------------------------------------------------------ resolve --

/** locationId → metricId → rule that owns it. */
export function claimsOf(rules: LocationRule[], exceptRuleId?: string) {
  const out: Record<string, Record<string, LocationRule>> = {}
  for (const r of rules) {
    if (r.id === exceptRuleId) continue
    for (const loc of r.locations) {
      out[loc] = out[loc] ?? {}
      for (const mid of Object.keys(r.overrides)) out[loc][mid] = r
    }
  }
  return out
}

export interface Effective { band: Band; rule: LocationRule | null }

/** What an endpoint in this location is measured against. null location → defaults only. */
export function effectiveFor(locationId: string | null, defaults: ThresholdPolicy, rules: LocationRule[]): Record<string, Effective> {
  const claims = locationId ? claimsOf(rules)[locationId] ?? {} : {}
  return Object.fromEntries(METRICS.map((m) => {
    const r = claims[m.id]
    return [m.id, { band: r ? r.overrides[m.id] : defaults[m.id] ?? { warn: m.defaultWarn, crit: m.defaultCrit }, rule: r ?? null }]
  }))
}

export const ruleLocations = () => access.locations().map((l) => ({ id: l.id, name: l.name, count: widgetUsersIn(l.id) }))
export const metricName = (id: string) => metricById(id)?.name ?? id
