import { RotateCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle, Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@ir/ui"
import { PageTop } from "@/components/PageTop"
import { CopyButton, Mono, StatusBadge } from "@/components/ui"
import { toast } from "@/lib/toast"
import { navigate } from "@/lib/router"
import { retryProvisioning, useOps } from "@/data/store"
import { tenantUrl } from "@/data/tenants"
import { NotFoundPage } from "./NotFoundPage"
import { OverviewTab } from "./tenant/OverviewTab"
import { AdminsTab } from "./tenant/AdminsTab"
import { AuditTab } from "./tenant/AuditTab"
import { TenantFlagsTab } from "./tenant/TenantFlagsTab"
import { ProductsTab } from "./tenant/ProductsTab"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "admins", label: "Client admins" },
  { id: "audit", label: "Audit log" },
  { id: "feature-flags", label: "Feature flags" },
  { id: "products", label: "Products" },
] as const
type TabId = (typeof TABS)[number]["id"]

export function TenantPage({ id, tab }: { id: string; tab: string | null }) {
  const tenant = useOps((s) => s.tenants.find((t) => t.id === id))
  if (!tenant) return <NotFoundPage what="tenant" />

  const current: TabId = (TABS.find((t) => t.id === tab)?.id ?? "overview")
  const go = (t: string) => navigate(t === "overview" ? `/tenants/${id}` : `/tenants/${id}?tab=${t}`, { replace: true })

  return (
    <div className="flex flex-col gap-gutter">
      <PageTop
        title={tenant.name}
        meta={
          <>
            <StatusBadge status={tenant.status} />
            <span>{tenant.accountCode}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1"><Mono>{tenantUrl(tenant.id)}</Mono><CopyButton value={`https://${tenantUrl(tenant.id)}`} label="tenant URL" /></span>
          </>
        }
      />

      {tenant.status === "failed" ? (
        <Alert
          variant="destructive"
          action={
            <Button size="xs" variant="outline" onClick={() => { retryProvisioning(tenant.id); toast({ title: "Provisioning succeeded", description: `${tenant.name} is active. Invite the first client admin on Client admins.` }) }}>
              <RotateCw aria-hidden /> Retry provisioning
            </Button>
          }
        >
          <AlertTitle>Provisioning failed</AlertTitle>
          <AlertDescription>{tenant.failure}</AlertDescription>
        </Alert>
      ) : tenant.status === "cancelled" ? (
        <Alert variant="warning">
          <AlertTitle>This tenancy is cancelled</AlertTitle>
          <AlertDescription>Its subscriptions have ended and its client admins can't sign in. Everything here is read-only.</AlertDescription>
        </Alert>
      ) : null}

      <Tabs value={current} onValueChange={go}>
        <TabsList aria-label="Tenant sections" className="overflow-x-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview"><OverviewTab tenant={tenant} onTab={go} /></TabsContent>
        <TabsContent value="admins"><AdminsTab tenant={tenant} /></TabsContent>
        <TabsContent value="audit"><AuditTab tenant={tenant} /></TabsContent>
        <TabsContent value="feature-flags"><TenantFlagsTab tenant={tenant} onTab={go} /></TabsContent>
        <TabsContent value="products"><ProductsTab tenant={tenant} /></TabsContent>
      </Tabs>
    </div>
  )
}
