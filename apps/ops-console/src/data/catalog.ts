// Platform catalogue for the IR Ops console: environments, feature flags,
// services and OpenTofu state. Mirrors the live console at
// console.dev-abhra.ir.com (Oct 2026), with the old product name replaced by
// Clarion and test-only flags left out.

// ------------------------------------------------------------------ stage --

/** Stage "dev". Services and Tofu modules list every environment with state in it. */
export const STAGE = "dev"
export const STATE_BUCKET = "abhra-dev-ap-southeast-2-opentofu-state"

export const regions = [
  { id: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
  { id: "eu-west-2", label: "Europe (London)" },
  { id: "us-east-1", label: "US East (N. Virginia)" },
]
export const regionLabel = (id: string) => {
  const r = regions.find((x) => x.id === id)
  return r ? `${r.label} (${r.id})` : id
}

// --------------------------------------------------------------- products --

export type ProductId = "clarion" | "vantage"

export interface ProductDef {
  id: ProductId
  name: string
  /** Newest first. */
  versions: string[]
  available: boolean
  /** What the plan's second licence counts, beside admin licences. */
  unit: { label: string; noun: string; plural: string }
  plans: { full: string; trial: string }
  /** Admin and unit licences a new plan starts with. */
  defaults: { admins: number; units: number; trialUnits: number; step: number }
}

export const productCatalog: ProductDef[] = [
  {
    id: "clarion", name: "Clarion", versions: ["v1.0.0-alpha.5", "v1.0.0-alpha.4", "v1.0.0-alpha.3"], available: true,
    unit: { label: "Widget licences", noun: "widget", plural: "widgets" },
    plans: { full: "Clarion Enterprise", trial: "Clarion Trial" },
    defaults: { admins: 5, units: 500, trialUnits: 50, step: 50 },
  },
  // Vantage — the second Iris product, as in the client console (@ir/mock-data/vantage).
  // Assumed, not from a spec: it monitors the UC and contact-centre infrastructure
  // (SBCs, call managers, gateways, the CC platform, recording), and is licensed
  // per monitored system.
  {
    id: "vantage", name: "Vantage", versions: ["v0.9.0-beta.3", "v0.9.0-beta.2", "v0.9.0-beta.1"], available: true,
    unit: { label: "System licences", noun: "system", plural: "systems" },
    plans: { full: "Vantage Professional", trial: "Vantage Trial" },
    defaults: { admins: 3, units: 100, trialUnits: 25, step: 10 },
  },
]
export const productDef = (id: ProductId) => productCatalog.find((p) => p.id === id)!
export const latestVersion = (id: ProductId) => productDef(id).versions[0]
export const productName = (id: ProductId) => productCatalog.find((p) => p.id === id)?.name ?? id

// ---------------------------------------------------------- feature flags --

export type FlagType = "boolean" | "integer" | "string"
export type FlagValue = boolean | number | string

export interface FlagDef {
  key: string
  type: FlagType
  description: string
  /** Set by a product subscription. Read-only on the tenant's Feature flags tab; edited on Products. */
  subscription?: ProductId
  /** Registered for tenant overrides only (no global default). */
  tenantOnly?: boolean
}

export const flagDefs: FlagDef[] = [
  { key: "agentic-alerts", type: "boolean", description: "Agentic alert triage in the Clarion dashboard." },
  { key: "clarion-admin-user-max", type: "integer", subscription: "clarion", description: "Admin licences on the Clarion plan." },
  { key: "clarion-widget-user-max", type: "integer", subscription: "clarion", description: "Widget licences on the Clarion plan." },
  { key: "clarion-widget-ui-enabled", type: "boolean", subscription: "clarion", description: "Interactive widget. Off runs the widget passive: telemetry only, no UI on the endpoint." },
  { key: "clarion-fleet-config-enabled", type: "boolean", subscription: "clarion", description: "Fleet configuration service for this tenant." },
  { key: "clarion-fleet-enrol-enabled", type: "boolean", subscription: "clarion", description: "Widgets can enrol endpoints." },
  { key: "clarion-fleet-ui-enabled", type: "boolean", subscription: "clarion", description: "The Clarion fleet dashboard." },
  { key: "clarion-fleet-enrol-cleanup", type: "boolean", subscription: "clarion", description: "Deletes enrolment records when the plan ends." },
  { key: "clarion-fleet-config-cleanup", type: "boolean", subscription: "clarion", description: "Deletes fleet configuration when the plan ends." },
  { key: "ingestion-api", type: "boolean", subscription: "clarion", description: "Telemetry ingestion API. The widget cannot report without it." },
  { key: "clarion-ingest-retention-days", type: "integer", subscription: "clarion", description: "Days raw telemetry is kept." },
  { key: "clarion-ingest-cleanup", type: "boolean", subscription: "clarion", description: "Deletes ingested telemetry when the plan ends." },
  { key: "clarion-model", type: "boolean", subscription: "clarion", description: "Scores endpoint health with the Clarion model." },
  { key: "clarion-model-cleanup", type: "boolean", subscription: "clarion", description: "Deletes model outputs when the plan ends." },
  { key: "clarion-transform", type: "boolean", subscription: "clarion", description: "Transforms raw telemetry into endpoint state." },
  { key: "vantage-admin-user-max", type: "integer", subscription: "vantage", description: "Admin licences on the Vantage plan." },
  { key: "vantage-system-max", type: "integer", subscription: "vantage", description: "Monitored systems on the Vantage plan." },
  { key: "vantage-ui-enabled", type: "boolean", subscription: "vantage", description: "The Vantage dashboard." },
  { key: "vantage-discovery-enabled", type: "boolean", subscription: "vantage", description: "Finds SBCs, gateways and call managers on the customer's network and lists them for placing in a location." },
  { key: "vantage-onprem-collector", type: "boolean", subscription: "vantage", description: "Collects through a collector on the customer's network instead of cloud APIs only." },
  { key: "vantage-alerting-enabled", type: "boolean", subscription: "vantage", description: "Raises alerts when a system breaches its thresholds." },
  { key: "vantage-metrics-retention-days", type: "integer", subscription: "vantage", description: "Days system metrics are kept." },
  { key: "vantage-metrics-cleanup", type: "boolean", subscription: "vantage", description: "Deletes metrics when the plan ends." },
  { key: "clarion-model-update", type: "string", description: "Model version tenants pull. \"latest\" follows each release." },
  { key: "clarion-demo-mode", type: "boolean", tenantOnly: true, description: "Generates demo endpoints and alerts. For sales and onboarding tenants only." },
  { key: "clarion-demo-use-payload-location", type: "boolean", tenantOnly: true, description: "Demo endpoints take their location from the payload instead of the widget user." },
  { key: "export-format", type: "string", description: "Default format for exports (csv or xlsx)." },
  { key: "jira-feedback", type: "boolean", description: "Feedback button that raises a Jira ticket." },
  { key: "max-batch-size", type: "integer", description: "Largest telemetry batch the ingest service accepts." },
  { key: "use-databricks-pipeline", type: "boolean", description: "Routes telemetry through the Databricks pipeline." },
]
export const flagDef = (key: string) => flagDefs.find((f) => f.key === key)

/** targeting["*"] — the global defaults that ship in the dev stage. */
export const seedGlobalFlags: Record<string, FlagValue> = {
  "agentic-alerts": false,
  "clarion-model-update": "latest",
  "clarion-ingest-retention-days": 180,
  "export-format": "csv",
  "ingestion-api": true,
  "jira-feedback": true,
  "max-batch-size": 100,
  "use-databricks-pipeline": true,
}

/** The flags each product's plan writes, in the order the Products tab lists them. */
export const planFlags: Record<ProductId, readonly string[]> = {
  clarion: [
    "clarion-fleet-config-enabled",
    "clarion-fleet-enrol-enabled",
    "clarion-fleet-ui-enabled",
    "clarion-fleet-enrol-cleanup",
    "clarion-fleet-config-cleanup",
    "ingestion-api",
    "clarion-ingest-retention-days",
    "clarion-ingest-cleanup",
    "clarion-model",
    "clarion-model-cleanup",
    "clarion-transform",
  ],
  vantage: [
    "vantage-ui-enabled",
    "vantage-discovery-enabled",
    "vantage-onprem-collector",
    "vantage-alerting-enabled",
    "vantage-metrics-retention-days",
    "vantage-metrics-cleanup",
  ],
}

const planDefaults: Record<ProductId, Record<string, FlagValue>> = {
  clarion: {
    "clarion-fleet-config-enabled": true,
    "clarion-fleet-enrol-enabled": true,
    "clarion-fleet-ui-enabled": true,
    "clarion-fleet-enrol-cleanup": false,
    "clarion-fleet-config-cleanup": false,
    "ingestion-api": true,
    "clarion-ingest-retention-days": 183,
    "clarion-ingest-cleanup": false,
    "clarion-model": true,
    "clarion-model-cleanup": false,
    "clarion-transform": true,
  },
  vantage: {
    "vantage-ui-enabled": true,
    "vantage-discovery-enabled": true,
    "vantage-onprem-collector": false,
    "vantage-alerting-enabled": true,
    "vantage-metrics-retention-days": 90,
    "vantage-metrics-cleanup": false,
  },
}
export const defaultPlanFlags = (product: ProductId = "clarion"): Record<string, FlagValue> => ({ ...planDefaults[product] })

// ---------------------------------------------------------------- services --

export interface ServiceDef {
  id: string
  /** Column in the dependency map: callers on the left, foundations on the right. */
  col: number
  lattice?: boolean
  description: string
}

export const services: ServiceDef[] = [
  { id: "ui", col: 0, description: "Clarion web app and the client console." },
  { id: "ops-ui", col: 0, description: "This console." },
  { id: "ingest", col: 0, description: "Receives widget telemetry." },
  { id: "agentic-alerts", col: 1, description: "Agentic alert triage." },
  { id: "subscription-management", col: 1, lattice: true, description: "Plans, licences and the flags a plan writes." },
  { id: "fleet-enrolment", col: 1, description: "Enrols widgets and their endpoints." },
  { id: "data-access", col: 2, description: "Query API over endpoint state." },
  { id: "fleet-config", col: 2, description: "Per-tenant fleet configuration." },
  { id: "usage-metrics", col: 2, lattice: true, description: "Licence and usage counts." },
  { id: "payment-anomaly-detector", col: 2, description: "Experimental. No state in this stage." },
  { id: "iam", col: 3, lattice: true, description: "Tenants, users, Cognito and sign-in." },
  { id: "feature-flag", col: 3, lattice: true, description: "Flag registry and targeting." },
  { id: "data", col: 3, description: "Telemetry store and pipelines." },
  { id: "audit", col: 4, description: "Audit log for every tenant." },
  { id: "notification", col: 4, description: "Email through SendGrid." },
  { id: "data-model", col: 4, description: "Health model and its outputs." },
]

/** [from, to]: from calls to. */
export const dependencies: [string, string][] = [
  ["ui", "iam"], ["ui", "feature-flag"], ["ui", "subscription-management"], ["ui", "fleet-config"],
  ["ui", "fleet-enrolment"], ["ui", "data-access"], ["ui", "notification"], ["ui", "usage-metrics"], ["ui", "agentic-alerts"],
  ["ops-ui", "iam"], ["ops-ui", "subscription-management"], ["ops-ui", "feature-flag"], ["ops-ui", "audit"],
  ["ops-ui", "notification"], ["ops-ui", "usage-metrics"],
  ["ingest", "data"], ["ingest", "feature-flag"], ["ingest", "fleet-enrolment"],
  ["agentic-alerts", "data-access"], ["agentic-alerts", "notification"],
  ["subscription-management", "iam"], ["subscription-management", "feature-flag"], ["subscription-management", "audit"],
  ["subscription-management", "usage-metrics"],
  ["fleet-enrolment", "iam"], ["fleet-enrolment", "fleet-config"], ["fleet-enrolment", "audit"],
  ["fleet-config", "feature-flag"], ["fleet-config", "audit"],
  ["data-access", "data"], ["data-access", "iam"],
  ["usage-metrics", "data"],
  ["iam", "audit"], ["iam", "notification"],
  ["data", "data-model"],
]

// ----------------------------------------------------------- tofu modules --

export interface TofuEnv {
  env: string
  kind: "shared" | "ephemeral" | "global"
  /** When the shared infra module last changed (UTC). */
  infraAt?: string
  /** Service modules with state, and when each last changed (UTC). Missing = no state. */
  modules: Record<string, string>
}

const at = (day: string, hm: string) => `2026-${day}T${hm}:00Z`
const svcIds = services.filter((s) => s.id !== "payment-anomaly-detector").map((s) => s.id)
const stamp = (ids: string[], day: string, from: number) =>
  Object.fromEntries(ids.map((id, i) => [id, at(day, `04:${String(from + (i % 3)).padStart(2, "0")}`)]))

export const tofuEnvs: TofuEnv[] = [
  { env: "dev", kind: "shared", infraAt: at("10-21", "04:33"), modules: stamp(svcIds, "10-21", 33) },
  { env: "dnui", kind: "ephemeral", infraAt: at("10-19", "00:58"), modules: stamp(svcIds, "10-19", 10) },
  { env: "jani-dev", kind: "ephemeral", infraAt: at("10-13", "06:19"), modules: stamp(svcIds, "10-13", 20) },
  { env: "mar", kind: "ephemeral", infraAt: at("10-12", "04:59"), modules: stamp(svcIds, "10-12", 50) },
  {
    env: "danielm", kind: "ephemeral", infraAt: at("10-07", "05:36"),
    modules: stamp(svcIds.filter((s) => !["agentic-alerts", "data-model", "ops-ui", "usage-metrics", "data"].includes(s)), "10-07", 36),
  },
  {
    env: "global", kind: "global",
    modules: {
      "dns": at("09-02", "01:12"), "ecr": at("09-02", "01:14"), "github-oidc": at("08-20", "23:41"),
      "lattice-network": at("10-01", "03:05"), "opentofu-state": at("08-14", "22:10"), "sendgrid": at("09-18", "05:27"),
    },
  },
]
