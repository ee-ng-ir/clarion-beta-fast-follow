import { Building2, KeyRound, LifeBuoy, RefreshCw, ShieldAlert } from "lucide-react"
import { Badge, Card, CardDescription, CardHeader, CardHeaderText, CardTitle } from "@ir/ui"
import { CLARION_URL, CLIENT_CONSOLE_URL } from "./lib/apps"

/**
 * IR Ops console — internal IR tooling (not customer-facing). Starter skeleton.
 * Areas come from the Iris platform pages (RBAC, SSO, SCIM) where they name
 * IR Support / DevSecOps work. Customer access is managed in the client console.
 */
const areas = [
  { icon: Building2, title: "Tenants and provisioning", body: "Create tenants, their email domains and first Tenant Admin (Tenant Provisioning SOP)." },
  { icon: KeyRound, title: "SSO support view", body: "Read-only view of a tenant's SSO configuration and recent SSO errors." },
  { icon: RefreshCw, title: "SCIM sync health", body: "Read-only SCIM status per tenant: last request, errors in the last 24 hours, token expiry." },
  { icon: ShieldAlert, title: "Break-glass MFA reset", body: "IR Support process, with identity verification, for a tenant's break-glass account." },
  { icon: LifeBuoy, title: "Access exports", body: "Who has access to what in a tenant, for support cases and audits." },
]

export function OpsApp() {
  return (
    <div className="min-h-screen bg-surface-app">
      <header className="flex h-14 items-center justify-between border-b border-line-neutral-muted px-6">
        <div className="flex items-center gap-3">
          <img src="/ir-logo.png" alt="Integrated Research" className="h-7 w-auto" />
          <span className="text-label-lg text-content-neutral-emphasis">Ops console</span>
          <Badge color="warning">Internal</Badge>
        </div>
        <nav className="flex gap-4 text-body-sm">
          <a className="text-content-link-default hover:underline" href={CLIENT_CONSOLE_URL}>Client console</a>
          <a className="text-content-link-default hover:underline" href={CLARION_URL}>Clarion</a>
        </nav>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        <div>
          <h1 className="text-heading-md text-content-neutral-emphasis">IR Ops console</h1>
          <p className="text-body-md text-content-neutral-muted">Internal tools for IR staff. Starter skeleton — nothing here is designed yet.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {areas.map((a) => (
            <Card key={a.title}>
              <CardHeader>
                <CardHeaderText>
                  <CardTitle className="flex items-center gap-2"><a.icon className="size-4 text-content-neutral-muted" aria-hidden /> {a.title} <Badge>Planned</Badge></CardTitle>
                  <CardDescription>{a.body}</CardDescription>
                </CardHeaderText>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
