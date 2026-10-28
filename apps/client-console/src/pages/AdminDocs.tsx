import { ShieldCheck, UserCog, ReceiptText, KeyRound, Network, Users, Boxes, Check, AlertTriangle, MapPin, type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Internal documentation for the Administration domain — RBAC, Groups, billing.
// Mirrors the Fleet "Product development" docs, but scoped to admin concepts.
// See ADMIN-TICKETS.md for the source decisions.

function DocHeader({ title, blurb }: { title: string; blurb: string }) {
  return (
    <Card className="w-full rounded-xl p-5">
      <div className="flex items-center gap-2">
        <Badge variant="info" className="uppercase tracking-wide">Internal</Badge>
        <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>Product development · Administration · not shipped in the built product</span>
      </div>
      <h2 className="mt-3 text-heading-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>{title}</h2>
      <p className="mt-1 text-body-sm" style={{ color: "var(--fg-neutral-muted)" }}>{blurb}</p>

      <div
        className="mt-4 flex items-start gap-2 rounded-lg p-3"
        style={{ background: "var(--bg-warning-subtle)", border: "1px solid var(--border-warning-muted)", color: "var(--fg-on-warning-subtle)" }}
      >
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p className="text-sm">
          <strong>Working draft.</strong> Everything in Product development is exploratory and not finalised —
          roles, permissions, and flows here are for discussion and may change.
        </p>
      </div>
    </Card>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      <div className="px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ borderBottom: "1px solid var(--border-neutral-subtle)", color: "var(--fg-neutral-subtle)" }}>
        {title}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  )
}

function ConceptRow({ icon: Icon, title, children }: { icon: LucideIcon; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}><Icon className="size-4" /></span>
      <div className="flex min-w-px flex-1 flex-col">
        <span className="text-sm font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{title}</span>
        <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{children}</span>
      </div>
    </div>
  )
}

const em = (t: string) => <strong style={{ color: "var(--fg-neutral-emphasis)" }}>{t}</strong>

const phaseVariant = { MVP: "success", "1.0": "info", Later: "secondary" } as const

const tag = (label: string, phase: "MVP" | "1.0" | "Later") => (
  <Badge variant={phaseVariant[phase]} className="ml-2 uppercase tracking-wide">{label}</Badge>
)

/* ------------------------------------------------------ Permissions matrix -- */

type Access = "full" | "scoped" | "view" | "none"

// Iris platform roles (Ben Webb, "Iris Platform: RBAC, Groups and Locations", draft).
const roleCols: { name: string; phase: "MVP" | "Later" }[] = [
  { name: "Tenant Admin", phase: "MVP" },
  { name: "User Admin", phase: "MVP" },
  { name: "Auditor", phase: "MVP" },
  { name: "Clarion Admin", phase: "MVP" },
  { name: "Clarion Viewer", phase: "MVP" },
]

// Order matches roleCols. "Scoped" = within the locations the role is limited to.
const matrix: { domain: string; rows: { cap: string; access: [Access, Access, Access, Access, Access] }[] }[] = [
  { domain: "Users, groups and locations", rows: [
    { cap: "View users, groups, locations and roles", access: ["full", "full", "view", "none", "none"] },
    { cap: "Invite, deactivate, manage groups", access: ["full", "full", "none", "none", "none"] },
    { cap: "Give roles (up to your own level)", access: ["full", "full", "none", "none", "none"] },
    { cap: "Create, rename and delete locations", access: ["full", "none", "none", "none", "none"] },
  ] },
  { domain: "Sign-in", rows: [
    { cap: "SSO, SCIM and break-glass settings", access: ["full", "none", "view", "none", "none"] },
  ] },
  { domain: "Clarion", rows: [
    { cap: "Overview and Endpoints", access: ["full", "none", "none", "scoped", "scoped"] },
    { cap: "Thresholds", access: ["full", "none", "none", "full", "none"] },
    { cap: "Widget users (add, edit, set location)", access: ["full", "none", "none", "scoped", "none"] },
  ] },
  { domain: "Audit", rows: [
    { cap: "Audit log and access export", access: ["full", "none", "full", "none", "none"] },
  ] },
]

function Cell({ access }: { access: Access }) {
  if (access === "full") return <Check className="mx-auto size-4" style={{ color: "var(--fg-success-emphasis)" }} aria-label="Full" />
  if (access === "scoped") return <span className="text-xs font-medium" style={{ color: "var(--fg-warning-emphasis)" }}>Scoped</span>
  if (access === "view") return <span className="text-xs font-medium" style={{ color: "var(--fg-neutral-muted)" }}>View</span>
  return <span style={{ color: "var(--fg-neutral-subtle)" }} aria-label="No access">–</span>
}

function PermissionsMatrix() {
  return (
    <SectionCard title="Permissions matrix">
      <p className="mb-4 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
        A strawman. {em("Clarion Admin")} is Product Admin for Clarion; {em("Clarion Viewer")} is the PO&apos;s CC Manager. Both can be limited to locations ({em("scoped")}).
      </p>
      <div className="overflow-x-auto" style={{ border: "1px solid var(--border-neutral-subtle)", borderRadius: "10px" }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr style={{ background: "var(--bg-neutral-subtle)", borderBottom: "1px solid var(--border-neutral-muted)" }}>
              <th className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: "var(--fg-neutral-muted)" }}>Capability</th>
              {roleCols.map((r) => (
                <th key={r.name} className="px-3 py-2.5 text-center">
                  <span className="text-xs font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>{r.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          {matrix.map((group) => (
            <tbody key={group.domain}>
              <tr style={{ background: "var(--bg-neutral-subtle)" }}>
                <td colSpan={6} className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>{group.domain}</td>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.cap} style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
                  <td className="px-4 py-2.5" style={{ color: "var(--fg-neutral-emphasis)" }}>{row.cap}</td>
                  {row.access.map((a, i) => <td key={i} className="px-3 py-2.5 text-center"><Cell access={a} /></td>)}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </SectionCard>
  )
}

/* ------------------------------------------------------------------ RBAC -- */

export function RbacDocPage() {
  return (
    <div className="flex flex-col gap-4">
      <DocHeader
        title="Roles & permissions (RBAC)"
        blurb="Iris platform access, shared by every Iris product. IR owns a fixed set of roles; customers give them to groups, for the whole tenant or for one product, limited to locations if they need to."
      />

      <SectionCard title="The model">
        <div className="flex flex-col gap-4">
          <ConceptRow icon={ShieldCheck} title={<>Roles, owned by IR <span>{tag("MVP", "MVP")}</span></>}>
            Tenant roles: Tenant Admin, User Admin, Auditor. Product roles: Product Admin, Editor, Viewer. No custom roles.
          </ConceptRow>
          <ConceptRow icon={Users} title={<>Groups, flat <span>{tag("MVP", "MVP")}</span></>}>
            Roles go to groups and members inherit them. Groups can&apos;t contain groups, because identity providers flatten groups before sharing them over SCIM.
          </ConceptRow>
          <ConceptRow icon={MapPin} title={<>Locations, flat <span>{tag("MVP", "MVP")}</span></>}>
            Named by the customer (Sydney, London). A product role can be limited to locations. In Clarion, each widget user sits in at most one location.
          </ConceptRow>
          <ConceptRow icon={UserCog} title="Direct roles are exceptions">
            A role can be given straight to a person, but it&apos;s flagged as direct in the UI and in access exports.
          </ConceptRow>
        </div>
      </SectionCard>

      <SectionCard title="How access is decided">
        <div className="flex flex-col gap-3 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          <p>{em("Everything all your roles allow")}, from groups and direct roles together. No deny rules.</p>
          <p>The PO&apos;s {em("CC Manager")} isn&apos;t a role: it&apos;s a group such as &ldquo;Sydney CC managers&rdquo; with {em("Clarion Viewer, limited to Sydney")}. They see Overview and Endpoints for Sydney only; Thresholds and Administration don&apos;t appear.</p>
          <p>Enforced on the server by a central authorisation service, including lists, search, the map, drill-downs and exports. Hiding UI is for usability only.</p>
          <p>Safeguards: always at least one Tenant Admin; you can&apos;t give more access than you hold; you can&apos;t remove your own admin access; break-glass accounts are always Tenant Admin.</p>
        </div>
      </SectionCard>

      <PermissionsMatrix />

      <SectionCard title="Open questions">
        <div className="flex flex-col gap-2 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          <p>{em("Reporting line vs locations.")} The PO asked for a manager to see their reporting line, all levels down. The platform model scopes by location instead. Does location cover the CC Manager need, or is a reporting line still needed later?</p>
          <p>{em("Editor in Clarion.")} Clarion has little to edit yet, so Editor behaves like Viewer. Is there a Clarion action that belongs here?</p>
          <p>{em("Site vs Location.")} Widget users have a free-text site today. Proposal: Location replaces it, and the CSV takes a location name.</p>
        </div>
      </SectionCard>
    </div>
  )
}

/* ---------------------------------------------------------------- Groups -- */

export function GroupsDocPage() {
  return (
    <div className="flex flex-col gap-4">
      <DocHeader
        title="Groups & locations"
        blurb="Two flat lists. Groups say who gets a role; locations say which data a product role covers."
      />

      <SectionCard title="Worked example">
        <div className="flex flex-col gap-3 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
          <span className="block rounded-lg p-3 font-mono text-xs leading-6" style={{ background: "var(--bg-neutral-subtle)" }}>
            Locations: Sydney, Melbourne, Manila, London<br />
            Group &ldquo;Sydney CC managers&rdquo; → Clarion Viewer · Sydney<br />
            Group &ldquo;APAC operations leads&rdquo; → Clarion Viewer · Sydney, Melbourne, Auckland<br />
            Group &ldquo;Contact centre leadership&rdquo; → Clarion Viewer · All locations
          </span>
          <p>A head of APAC sees three sites because their group lists three, not because of where they sit in a tree. Someone in two groups gets both.</p>
        </div>
      </SectionCard>

      <SectionCard title="Why flat">
        <div className="flex flex-col gap-3">
          <ConceptRow icon={Network} title="Ready for SSO and SCIM">
            Identity providers send direct members only, so a nested group would silently lose people. One Iris group links to one IdP group.
          </ConceptRow>
          <ConceptRow icon={MapPin} title="Locations replace the hierarchy">
            Instead of Country → Area → Office, give a group the set of locations it covers.
          </ConceptRow>
        </div>
      </SectionCard>

      <SectionCard title="Putting widget users in locations">
        <div className="flex flex-col gap-3">
          <ConceptRow icon={Boxes} title={<>Bulk-set location <span>{tag("MVP", "MVP")}</span></>}>
            Select widget users and set their location. Users with no location are seen only by people with access to all locations.
          </ConceptRow>
        </div>
      </SectionCard>
    </div>
  )
}

/* --------------------------------------------------------------- Billing -- */

export function BillingDocPage() {
  return (
    <div className="flex flex-col gap-4">
      <DocHeader
        title="Subscription & billing"
        blurb="Plan entitlements, seat usage, overage and payment. Only the plan breakdown is in scope for trial/MVP; plan changes, add-ons, invoices and payment arrive for 1.0."
      />

      <SectionCard title="What's in scope when">
        <div className="flex flex-col gap-3">
          <ConceptRow icon={ReceiptText} title={<>Current tier breakdown <span>{tag("MVP", "MVP")}</span></>}>
            A clear, read-only view of the current plan: included entitlements (seats, Widget capacity, features) and what&apos;s not included. The one billing surface genuinely useful during trial.
          </ConceptRow>
          <ConceptRow icon={Users} title={<>Seat usage & warnings <span>{tag("1.0", "1.0")}</span></>}>
            A usage meter (seats used / included) with an in-app warning before the cap (e.g. ≥80%), so an upgrade can be planned rather than triggering surprise overage. Email warnings are 1.0.
          </ConceptRow>
          <ConceptRow icon={Boxes} title={<>Upgrade & add-ons (e.g. SSO) <span>{tag("1.0", "1.0")}</span></>}>
            Change plan, add seats, and opt into add-ons like SSO without a new contract. Entry points show as &ldquo;coming soon&rdquo; in MVP.
          </ConceptRow>
        </div>
      </SectionCard>

      <SectionCard title="Billing & payment">
        <div className="flex flex-col gap-3">
          <ConceptRow icon={ReceiptText} title={<>Invoices & overage <span>{tag("1.0", "1.0")}</span></>}>
            Peak seat usage and any overage for the period, plus a history of past invoices and charges to reconcile and share with Finance.
          </ConceptRow>
          <ConceptRow icon={KeyRound} title={<>Payment method & failures <span>{tag("1.0", "1.0")}</span></>}>
            Update card / billing details, and clear in-app + email warnings on a failed payment with a grace period before the team loses access. Not collected during MVP.
          </ConceptRow>
        </div>
      </SectionCard>
    </div>
  )
}
