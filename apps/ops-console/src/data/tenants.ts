// IR's customer tenancies — the dummy book of business the Ops console manages.
// Acme Contact Centre is the one tenant the other prototypes are built on, so
// its client admins come from @ir/mock-data rather than being invented here.

import { tenantAdmins } from "@ir/mock-data/access"
import { defaultPlanFlags, type FlagValue, type ProductId } from "./catalog"

export type TenantStatus = "active" | "cancelled" | "failed"
export type SubStatus = "active" | "suspended" | "cancelled"
export type SyncState = "in-sync" | "pending" | "failed"
export type AdminStatus = "active" | "invited" | "inactive"

export interface Contact { firstName: string; lastName: string; email: string }

export interface ClientAdmin {
  id: string
  name: string
  email: string
  status: AdminStatus
  lastLogin: string | null
  invited: string
}

export interface Subscription {
  product: ProductId
  version: string
  plan: string
  status: SubStatus
  trial: boolean
  sync: SyncState
  provisioned: string
  updated: string
  expiry: string
  billing: "annual" | "monthly"
  adminLicenses: number
  widgetLicenses: number
  widgetsUsed: number
  /** clarion-widget-ui-enabled: interactive (on) or passive (off). */
  widgetExperience: "interactive" | "passive"
  /** The flags the plan writes (subscription-controlled). */
  flags: Record<string, FlagValue>
}

export interface Tenant {
  id: string
  name: string
  /** IR customer account code, from the sales contract. */
  accountCode: string
  contact?: Contact
  domains: string[]
  region: string
  created: string
  status: TenantStatus
  /** Why provisioning failed, when it did. */
  failure?: string
  subscriptions: Subscription[]
  admins: ClientAdmin[]
  /** targeting[tenantId] — per-tenant overrides, including on global flags. */
  overrides: Record<string, FlagValue>
}

export const tenantUrl = (id: string) => `admin.dev-abhra.ir.com/t_${id}`

const d = (s: string) => `${s}T09:00:00+11:00`

function sub(p: Partial<Subscription> & Pick<Subscription, "provisioned" | "expiry">): Subscription {
  return {
    product: "clarion",
    version: "v1.0.0-alpha.4",
    plan: "Clarion Enterprise",
    status: "active",
    trial: false,
    sync: "in-sync",
    updated: p.provisioned,
    billing: "annual",
    adminLicenses: 5,
    widgetLicenses: 500,
    widgetsUsed: 0,
    widgetExperience: "interactive",
    flags: defaultPlanFlags(),
    ...p,
  }
}

let n = 0
function admin(name: string, domain: string, status: AdminStatus, lastLogin: string | null, invited: string): ClientAdmin {
  const email = `${name.toLowerCase().replace(/[^a-z ]/g, "").split(" ").join(".")}@${domain}`
  return { id: `ca${++n}`, name, email, status, lastLogin, invited: d(invited) }
}

const acmeAdmins: ClientAdmin[] = tenantAdmins().map((p, i) => ({
  id: `acme-${p.id}`,
  name: p.name,
  email: p.email,
  status: p.status === "invited" ? "invited" : "active",
  lastLogin: p.status === "invited" ? null : `2026-10-${String(27 - i * 3).padStart(2, "0")}T10:15:00+11:00`,
  invited: d(`2026-08-${String(14 + i).padStart(2, "0")}`),
}))

export const seedTenants: Tenant[] = [
  {
    id: "Fp4gp7oL4zb", name: "Acme Contact Centre", accountCode: "IR-1042",
    contact: { firstName: "Ava", lastName: "Thornton", email: "ava.thornton@acme.com" },
    domains: ["acme.com"], region: "ap-southeast-2", created: d("2026-08-14"), status: "active",
    subscriptions: [sub({ provisioned: d("2026-08-14"), updated: d("2026-10-13"), expiry: d("2027-08-14"), adminLicenses: 6, widgetLicenses: 2000, widgetsUsed: 1284 })],
    admins: acmeAdmins,
    overrides: { "agentic-alerts": true },
  },
  {
    id: "5jjgAFEkycj", name: "Clarion Demo", accountCode: "IR-DEMO",
    contact: { firstName: "Clarion", lastName: "Demo", email: "clarion.demo@ir.com" },
    domains: ["clariondemo.com", "ir.com"], region: "ap-southeast-2", created: d("2026-09-03"), status: "active",
    subscriptions: [sub({ provisioned: d("2026-09-17"), updated: d("2026-10-22"), expiry: d("2027-09-18"), adminLicenses: 6, widgetLicenses: 500, widgetsUsed: 42 })],
    admins: [
      admin("Andra Bramanta", "ir.com", "active", "2026-10-07T11:00:00+11:00", "2026-10-06"),
      admin("Ben Webb", "ir.com", "active", "2026-10-26T09:30:00+11:00", "2026-10-07"),
      admin("Clarion Demo", "ir.com", "active", "2026-10-24T14:00:00+11:00", "2026-09-21"),
      admin("Ee Ng", "ir.com", "active", "2026-10-27T10:47:00+11:00", "2026-10-01"),
      admin("Rizky Jani", "ir.com", "active", "2026-10-22T16:20:00+11:00", "2026-10-22"),
      admin("Varun Khunger", "ir.com", "inactive", "2026-09-20T08:00:00+11:00", "2026-09-15"),
    ],
    overrides: { "clarion-demo-mode": true, "clarion-demo-use-payload-location": true, "export-format": "xlsx" },
  },
  {
    id: "UJ4sbVcenPd", name: "Northwind Health", accountCode: "IR-1107",
    contact: { firstName: "Hannah", lastName: "Kim", email: "hannah.kim@northwindhealth.org" },
    domains: ["northwindhealth.org", "nwh.org.au"], region: "ap-southeast-2", created: d("2026-09-21"), status: "active",
    subscriptions: [sub({ provisioned: d("2026-09-24"), updated: d("2026-10-12"), expiry: d("2028-09-24"), status: "suspended", adminLicenses: 4, widgetLicenses: 800, widgetsUsed: 611 })],
    admins: [
      admin("Hannah Kim", "northwindhealth.org", "active", "2026-10-12T09:00:00+11:00", "2026-09-21"),
      admin("Oliver Grant", "northwindhealth.org", "active", "2026-10-09T13:00:00+11:00", "2026-09-22"),
    ],
    overrides: {},
  },
  {
    id: "eBB5zg2eUSi", name: "Harbour Bank", accountCode: "IR-0988",
    contact: { firstName: "Arief", lastName: "Rohman", email: "arief.rohman@harbourbank.com.au" },
    domains: ["harbourbank.com.au"], region: "ap-southeast-2", created: d("2026-08-19"), status: "active",
    subscriptions: [sub({ provisioned: d("2026-08-19"), updated: d("2026-10-12"), expiry: d("2026-11-09"), adminLicenses: 10, widgetLicenses: 3500, widgetsUsed: 3412, sync: "pending", version: "v1.0.0-alpha.5" })],
    admins: [
      admin("Arief Rohman", "harbourbank.com.au", "active", "2026-10-28T08:40:00+11:00", "2026-08-19"),
      admin("Siti Nurhaliza", "harbourbank.com.au", "active", "2026-10-25T10:00:00+11:00", "2026-08-20"),
      admin("James Lawson", "harbourbank.com.au", "invited", null, "2026-10-21"),
    ],
    overrides: { "max-batch-size": 250 },
  },
  {
    id: "MusjxXpSNUd", name: "Coastline Energy", accountCode: "IR-1120",
    contact: { firstName: "Duy", lastName: "Tran", email: "duy.tran@coastline.energy" },
    domains: ["coastline.energy"], region: "ap-southeast-2", created: d("2026-09-17"), status: "active",
    subscriptions: [sub({ provisioned: d("2026-09-17"), expiry: d("2028-09-02"), adminLicenses: 3, widgetLicenses: 300, widgetsUsed: 118 })],
    admins: [admin("Duy Tran", "coastline.energy", "active", "2026-10-20T15:00:00+11:00", "2026-09-17")],
    overrides: {},
  },
  {
    id: "Q3FTwRBuXP4", name: "Meridian Insurance", accountCode: "IR-1131",
    contact: { firstName: "Laura", lastName: "Bennett", email: "laura.bennett@meridian.co.uk" },
    domains: ["meridian.co.uk"], region: "eu-west-2", created: d("2026-09-25"), status: "active",
    subscriptions: [sub({ provisioned: d("2026-09-25"), expiry: d("2026-11-01"), adminLicenses: 5, widgetLicenses: 1200, widgetsUsed: 954, sync: "failed" })],
    admins: [
      admin("Laura Bennett", "meridian.co.uk", "active", "2026-10-27T19:00:00+11:00", "2026-09-25"),
      admin("Tom Ashworth", "meridian.co.uk", "active", "2026-10-15T20:00:00+11:00", "2026-09-26"),
    ],
    overrides: { "max-batch-size": 50 },
  },
  {
    id: "EBXgPFxN5gV", name: "Southern Cross Telco", accountCode: "IR-1139",
    contact: { firstName: "James", lastName: "Liu", email: "james.liu@sxtelco.com.au" },
    domains: ["sxtelco.com.au"], region: "ap-southeast-2", created: d("2026-09-30"), status: "active",
    subscriptions: [sub({ provisioned: d("2026-09-30"), expiry: d("2026-12-01"), adminLicenses: 8, widgetLicenses: 5000, widgetsUsed: 2210 })],
    admins: [admin("James Liu", "sxtelco.com.au", "active", "2026-10-26T11:00:00+11:00", "2026-09-30")],
    overrides: { "use-databricks-pipeline": false },
  },
  {
    id: "cWPuJRiJbtZ", name: "Lumen Government Services", accountCode: "IR-1150",
    contact: { firstName: "Jay", lastName: "Verma", email: "jay.verma@lumen.gov.au" },
    domains: ["lumen.gov.au"], region: "ap-southeast-2", created: d("2026-09-28"), status: "active",
    subscriptions: [],
    admins: [admin("Jay Verma", "lumen.gov.au", "invited", null, "2026-09-28")],
    overrides: {},
  },
  {
    id: "ZBKL1ueuWhB", name: "Bluegum Utilities", accountCode: "IR-1124",
    contact: { firstName: "Rama", lastName: "Singh", email: "rama.singh@bluegum.com.au" },
    domains: ["bluegum.com.au"], region: "ap-southeast-2", created: d("2026-09-17"), status: "active",
    subscriptions: [sub({ provisioned: d("2026-09-30"), expiry: d("2027-01-01"), adminLicenses: 4, widgetLicenses: 400, widgetsUsed: 67, widgetExperience: "passive" })],
    admins: [admin("Rama Singh", "bluegum.com.au", "active", "2026-10-02T09:00:00+11:00", "2026-09-17")],
    overrides: {},
  },
  {
    id: "itWjCjSKuo2", name: "Pacific Freight", accountCode: "IR-1112",
    contact: { firstName: "Shilpa", lastName: "Bhat", email: "shilpa.bhat@pacificfreight.com" },
    domains: ["pacificfreight.com"], region: "ap-southeast-2", created: d("2026-09-11"), status: "active",
    subscriptions: [sub({ provisioned: d("2026-09-17"), expiry: d("2027-02-18"), adminLicenses: 5, widgetLicenses: 600, widgetsUsed: 389 })],
    admins: [
      admin("Shilpa Bhat", "pacificfreight.com", "active", "2026-10-27T07:00:00+11:00", "2026-09-11"),
      admin("Marco Rossi", "pacificfreight.com", "active", "2026-10-19T12:00:00+11:00", "2026-09-12"),
    ],
    overrides: {},
  },
  {
    id: "C5VoaBQFEPs", name: "Kestrel Airlines", accountCode: "IR-1166",
    contact: { firstName: "Louis", lastName: "Martin", email: "louis.martin@kestrelair.com" },
    domains: ["kestrelair.com"], region: "ap-southeast-2", created: d("2026-10-13"), status: "active",
    subscriptions: [sub({ provisioned: d("2026-10-13"), expiry: d("2026-11-12"), trial: true, plan: "Clarion Trial", billing: "monthly", adminLicenses: 2, widgetLicenses: 50, widgetsUsed: 31 })],
    admins: [admin("Louis Martin", "kestrelair.com", "active", "2026-10-27T17:00:00+11:00", "2026-10-13")],
    overrides: {},
  },
  {
    id: "KQDXW8s3a5f", name: "Summit Super", accountCode: "IR-1171",
    contact: { firstName: "Priya", lastName: "Raman", email: "priya.raman@summitsuper.com.au" },
    domains: ["summitsuper.com.au"], region: "ap-southeast-2", created: d("2026-10-22"), status: "failed",
    failure: "Cognito user pool creation timed out in iam (ap-southeast-2). No users were invited.",
    subscriptions: [],
    admins: [],
    overrides: {},
  },
  {
    id: "7p188fBmRjx", name: "Orbit Retail", accountCode: "IR-1018",
    domains: ["orbitretail.com"], region: "ap-southeast-2", created: d("2026-08-27"), status: "cancelled",
    subscriptions: [sub({ provisioned: d("2026-08-27"), expiry: d("2026-10-01"), status: "cancelled", adminLicenses: 3, widgetLicenses: 200, widgetsUsed: 0, version: "v1.0.0-alpha.3" })],
    admins: [admin("Grace Hill", "orbitretail.com", "inactive", "2026-09-29T10:00:00+11:00", "2026-08-27")],
    overrides: {},
  },
  {
    id: "MqxPvbZwojt", name: "Redgum Councils", accountCode: "IR-1095",
    domains: ["redgum.nsw.gov.au"], region: "ap-southeast-2", created: d("2026-09-18"), status: "cancelled",
    subscriptions: [],
    admins: [],
    overrides: {},
  },
  {
    id: "hPjkasqMyN1", name: "Tasman Water", accountCode: "IR-1033",
    domains: ["tasmanwater.co.nz"], region: "ap-southeast-2", created: d("2026-08-19"), status: "cancelled",
    subscriptions: [sub({ provisioned: d("2026-08-19"), expiry: d("2026-09-30"), status: "cancelled", trial: true, plan: "Clarion Trial", adminLicenses: 2, widgetLicenses: 50, version: "v1.0.0-alpha.3" })],
    admins: [],
    overrides: {},
  },
]

// --------------------------------------------------------------- audit log --

export interface AuditEvent {
  id: string
  ts: string
  action: string
  targetType: "user" | "tenant" | "subscription" | "flag" | "audit_log"
  target: string
  origin: "Client" | "Internal"
  actor: string
  details?: Record<string, unknown>
}

const ACTIONS_CLIENT = ["auth.login.succeeded", "auth.login.succeeded", "auth.login.succeeded", "auth.login.failed", "user.invited", "user.role.changed", "sso.config.updated", "auth.mfa.enrolled"]

/** A believable recent history for one tenant, newest first. Deterministic per tenant. */
export function seedAudit(t: Tenant): AuditEvent[] {
  if (t.status === "failed") {
    return [
      ev(t, 0, "2026-10-22T09:04:12+11:00", "tenant.provision.failed", "tenant", t.name, "Internal", "ops-ui", { reason: t.failure }),
      ev(t, 1, "2026-10-22T09:01:40+11:00", "tenant.provision.started", "tenant", t.name, "Internal", "ee.ng@ir.com", {}),
    ]
  }
  let seed = [...t.id].reduce((a, c) => a + c.charCodeAt(0), 0)
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  const people = t.admins.filter((a) => a.status !== "invited")
  const out: AuditEvent[] = []
  let ts = new Date("2026-10-28T11:40:00+11:00").getTime()
  for (let i = 0; i < 38 && people.length; i++) {
    ts -= Math.floor(rnd() * 9 + 1) * 3_600_000 * (rnd() < 0.3 ? 6 : 1)
    const p = people[Math.floor(rnd() * people.length)]
    const action = ACTIONS_CLIENT[Math.floor(rnd() * ACTIONS_CLIENT.length)]
    const target = action.startsWith("sso") ? t.name : p.name
    out.push(ev(t, i + 2, new Date(ts).toISOString(), action, action.startsWith("sso") ? "tenant" : "user", `${target}${action.startsWith("sso") ? "" : ` <${p.email}>`}`, "Client", p.email,
      action === "auth.login.failed" ? { reason: "IncorrectPassword", ip: "203.0.113." + Math.floor(rnd() * 200) } : { ip: "203.0.113." + Math.floor(rnd() * 200), userAgent: "Chrome 130 / macOS" }))
  }
  out.push(
    ev(t, 90, "2026-10-27T10:46:58+11:00", "tenant.tenant.viewed", "tenant", t.name, "Internal", "ee.ng@ir.com", {}),
    ev(t, 91, t.created, "tenant.provision.succeeded", "tenant", t.name, "Internal", "ops-ui", { region: t.region }),
  )
  return out.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
}

function ev(t: Tenant, i: number, ts: string, action: string, targetType: AuditEvent["targetType"], target: string, origin: AuditEvent["origin"], actor: string, details: Record<string, unknown>): AuditEvent {
  return { id: `${t.id}-${i}`, ts, action, targetType, target, origin, actor, details }
}
