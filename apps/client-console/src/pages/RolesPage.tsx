import { useState } from "react"
import { Check, Eye, MapPin, X } from "lucide-react"
import {
  Alert, AlertDescription, AlertTitle, Badge, Card, CardDescription, CardHeader, CardHeaderText, CardTitle,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsList, TabsTrigger,
} from "@ir/ui"
import { access, productName, productRoleIds, roles, scopes, type ProductId, type RoleDef, type Scope } from "@ir/mock-data/access"
import { useAccess } from "@/components/admin/access/AccessBits"

/**
 * Roles (Iris platform, Client Admin) — read-only. IR owns a fixed catalogue; tenants
 * can't create roles. One tab per area — Tenant, then each product — matching the
 * tabs on Users and Groups. Each tab: the roles, who holds them, and what they allow.
 */
let rememberedTab: Scope = "tenant"

export function RolesPage() {
  useAccess()
  const [tab, setTabState] = useState<Scope>(rememberedTab)
  const setTab = (t: Scope) => { rememberedTab = t; setTabState(t) }

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as Scope)}>
        <TabsList>{scopes.map((x) => <TabsTrigger key={x.id} value={x.id}>{x.name}</TabsTrigger>)}</TabsList>
      </Tabs>

      {tab === "tenant" ? <TenantRoles /> : <ProductRoles product={tab} />}
    </div>
  )
}

const holders = (r: RoleDef, product?: ProductId) => {
  const match = (x: { role: string; product?: ProductId }) => x.role === r.id && (!product || x.product === product)
  const groups = access.groups().filter((g) => g.assignments.some(match)).length
  const direct = access.people().filter((p) => p.direct.some(match)).length
  return [groups && `${groups} ${groups === 1 ? "group" : "groups"}`, direct && `${direct} direct`].filter(Boolean).join(" · ") || "Nobody"
}

// ---------------------------------------------------------------- tenant ----

function TenantRoles() {
  return (
    <>
      <Alert variant="info">
        <AlertTitle>Running Iris itself</AlertTitle>
        <AlertDescription>Tenant roles cover users, groups, locations, sign-in and the audit log. They can&apos;t be limited to a location. Only Tenant Admin also includes every product.</AlertDescription>
      </Alert>
      <RoleTable rows={roles.filter((r) => r.level === "tenant")}
        third={(r) => (r.id === "tenant_admin" ? "Product Admin in every product, every location" : "None, unless also given a product role")} thirdLabel="Products" />
      <Matrix
        title="Permission details"
        cols={["Tenant Admin", "User Admin", "Auditor"]}
        rows={[
          { area: "Users and groups", rows: [
            ["See users, groups and roles", "full", "full", "view"],
            ["Invite and deactivate users", "full", "full", "none"],
            ["Create groups and change members", "full", "full", "none"],
            ["Give roles (up to their own)", "full", "full", "none"],
          ] },
          { area: "Locations", rows: [
            ["See locations", "full", "view", "view"],
            ["Create, rename and delete locations", "full", "none", "none"],
          ] },
          { area: "Sign-in", rows: [["SSO, SCIM and break-glass settings", "full", "none", "view"]] },
          { area: "Audit", rows: [
            ["Audit log", "full", "none", "view"],
            ["Export who has access", "full", "none", "full"],
          ] },
        ]}
      />
    </>
  )
}

// --------------------------------------------------------------- product ----

function ProductRoles({ product }: { product: ProductId }) {
  const name = productName(product)
  const clarion = product === "clarion"
  return (
    <>
      <Alert variant="info">
        <AlertTitle>Using {name}</AlertTitle>
        <AlertDescription>
          {name} roles cover {name} only. Each can be given for all locations or limited to some. Tenant Admins have Product Admin here automatically.
          {!clarion && " Vantage is placeholder data: these meanings are assumed until its team defines them."}
        </AlertDescription>
      </Alert>
      <RoleTable rows={roles.filter((r) => productRoleIds[product].includes(r.id))} product={product}
        third={(r) => (clarion ? <>{r.clarion}{r.open && <div className="mt-1"><Badge color="warning">To decide</Badge> <span className="text-body-xs text-content-neutral-muted">{r.open}</span></div>}</> : r.vantage)}
        thirdLabel={`In ${name}`} />
      {clarion && (
        <Matrix
          title="Permission details"
          description="Proposed mapping, to agree with the Clarion team."
          cols={["Product Admin", "Viewer"]}
          rows={[
            { area: "Clarion", rows: [
              ["Overview and Endpoints", "loc", "loc"],
              ["Search and export endpoints", "loc", "loc"],
              ["Thresholds", "full", "none"],
              ["Add, edit and remove widget users", "loc", "none"],
              ["Set a widget user's location", "loc", "none"],
            ] },
          ]}
          foot="“Their locations” means everywhere unless the role is limited to some — in lists, search, the map, drill-downs and exports."
        />
      )}
      {!clarion && (
        <Matrix
          title="Permission details"
          description="Assumed for the placeholder. Unlike Clarion, Editor means something here."
          cols={["Product Admin", "Editor", "Viewer"]}
          rows={[
            { area: "Vantage", rows: [
              ["See systems, their health and payment flow", "loc", "loc", "loc"],
              ["Acknowledge payment alerts and add notes", "loc", "loc", "none"],
              ["Add systems and set their location", "loc", "none", "none"],
              ["Alert rules and cut-off times", "full", "none", "none"],
            ] },
          ]}
          foot="Alert rules and cut-off times are tenant-wide, like Clarion's thresholds: the same open question applies to a location-limited Product Admin."
        />
      )}
    </>
  )
}

// ----------------------------------------------------------------- shared ---

function RoleTable({ rows, product, third, thirdLabel }: { rows: RoleDef[]; product?: ProductId; third: (r: RoleDef) => React.ReactNode; thirdLabel: string }) {
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-4">
        <CardHeaderText><CardTitle>Roles</CardTitle><CardDescription>IR maintains these. Give them to groups.</CardDescription></CardHeaderText>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead align="start" className="w-40">Role</TableHead>
            <TableHead align="start">What it allows</TableHead>
            <TableHead align="start">{thirdLabel}</TableHead>
            <TableHead align="start" className="w-36">Given to</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="align-top text-label-md text-content-neutral-emphasis">{r.name}</TableCell>
              <TableCell className="align-top whitespace-normal text-body-sm text-content-neutral-muted">{r.summary}</TableCell>
              <TableCell className="align-top whitespace-normal text-body-sm">{third(r)}</TableCell>
              <TableCell className="align-top text-body-sm text-content-neutral-muted">{holders(r, product)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

type P = "full" | "loc" | "view" | "none"

function Perm({ v }: { v: P }) {
  if (v === "full") return <span className="inline-flex items-center gap-1 text-body-sm text-content-success-emphasis"><Check className="size-4" aria-hidden /> Full</span>
  if (v === "loc") return <span className="inline-flex items-center gap-1 text-body-sm text-content-neutral-emphasis"><MapPin className="size-4" aria-hidden /> Their locations</span>
  if (v === "view") return <span className="inline-flex items-center gap-1 text-body-sm text-content-neutral-muted"><Eye className="size-4" aria-hidden /> View only</span>
  return <span className="inline-flex items-center gap-1 text-body-sm text-content-neutral-subtle"><X className="size-4" aria-hidden /> No access</span>
}

function Matrix({ title, description, cols, rows, foot }: { title: string; description?: string; cols: string[]; rows: { area: string; rows: string[][] }[]; foot?: string }) {
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-4">
        <CardHeaderText><CardTitle>{title}</CardTitle>{description && <CardDescription>{description}</CardDescription>}</CardHeaderText>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead align="start" className="min-w-56">Permission</TableHead>
              {cols.map((c) => <TableHead key={c} align="start">{c}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((d) => [
              <TableRow key={d.area} className="bg-surface-neutral-subtle hover:bg-surface-neutral-subtle">
                <TableCell colSpan={cols.length + 1} className="text-label-sm text-content-neutral-muted">{d.area}</TableCell>
              </TableRow>,
              ...d.rows.map(([cap, ...cells]) => (
                <TableRow key={d.area + cap}>
                  <TableCell className="text-content-neutral-emphasis">{cap}</TableCell>
                  {cells.map((c, i) => <TableCell key={i}><Perm v={c as P} /></TableCell>)}
                </TableRow>
              )),
            ])}
          </TableBody>
        </Table>
      </div>
      {foot && <p className="border-t border-line-neutral-muted px-6 py-3 text-body-sm text-content-neutral-muted">{foot}</p>}
    </Card>
  )
}
