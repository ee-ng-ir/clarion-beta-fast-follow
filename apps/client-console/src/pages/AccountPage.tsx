import { Card, CardContent, CardHeader, CardTitle } from "@ir/ui"
import { tenant } from "@ir/mock-data/tenant"
import { Detail, TenantSummary } from "@/components/admin/portal/parts"

export function AccountPage() {
  return (
    <div className="flex flex-col gap-gutter">
      <TenantSummary />
      <Card className="max-w-sm">
        <CardHeader><CardTitle>Account contact</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Detail label="Name">{tenant.contact.name}</Detail>
          <Detail label="Email">{tenant.contact.email}</Detail>
        </CardContent>
      </Card>
    </div>
  )
}
