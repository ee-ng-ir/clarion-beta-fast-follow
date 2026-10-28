import { useSyncExternalStore } from "react"
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardHeaderText, CardTitle, KpiRow, KpiTile } from "@ir/ui"
import { ACCOUNT_ADMIN_LIMIT, accountAdmins, plans, useAccountAdmins } from "@ir/mock-data/tenant"
import { stats, store } from "@ir/mock-data/widget-users"
import { ProductMark, TenantSummary } from "@/components/admin/portal/parts"
import { CLARION_URL } from "@/lib/apps"
import { useViewer } from "@/lib/viewer"
import type { PageId, UserTab } from "@/nav"

const count = new Intl.NumberFormat()

export function HomePage({ onNavigate }: { onNavigate: (id: PageId, tab?: UserTab) => void }) {
  useSyncExternalStore(store.subscribe, store.version)
  useAccountAdmins()
  const { perm } = useViewer()
  const s = stats()
  const admins = accountAdmins.seatsUsed()
  const adminsFull = admins >= ACCOUNT_ADMIN_LIMIT

  return (
    <div className="flex flex-col gap-gutter">
      <TenantSummary />

      {perm.admin && <KpiRow>
        <KpiTile label="Products" value={plans.length} footer={<Note>{plans.map((p) => p.productName).join(", ")}</Note>} />
        <KpiTile
          label="Clarion users"
          value={count.format(s.active)}
          unit={`/ ${count.format(s.limit)}`}
          meter={{ value: s.active, max: s.limit }}
          footer={<Note>{count.format(Math.max(0, s.limit - s.active))} licenses left</Note>}
        />
        <KpiTile
          label="Account admins"
          value={admins}
          unit={`/ ${ACCOUNT_ADMIN_LIMIT}`}
          meter={{ value: admins, max: ACCOUNT_ADMIN_LIMIT }}
          status={adminsFull ? "warning" : "none"}
          statusLabel="No licenses left"
          footer={adminsFull
            ? <Button variant="link" size="sm" onClick={() => onNavigate("usermgmt", "admins")}>Manage admins</Button>
            : <Note>{ACCOUNT_ADMIN_LIMIT - admins} licenses left</Note>}
        />
      </KpiRow>}

      <section className="flex flex-col gap-4" aria-labelledby="products-heading">
        <h2 id="products-heading" className="text-heading-lg text-content-neutral-emphasis">Your products</h2>
        {plans.map((p) => (
          <Card key={p.product}>
            <CardHeader>
              <ProductMark product={p.product} name={p.productName} />
              <CardHeaderText>
                <CardTitle><h3>{p.productName}</h3></CardTitle>
                <CardDescription>{p.plan} · {count.format(p.licenses)} licenses</CardDescription>
              </CardHeaderText>
            </CardHeader>
            <CardContent>
              <p className="max-w-content-reading text-body-md text-content-neutral-muted">{p.blurb}</p>
            </CardContent>
            {perm.seeClarion && <CardFooter className="justify-end gap-2">
              <Button variant="outline" asChild><a href={CLARION_URL} target="_blank" rel="noopener">Open Fleet dashboard</a></Button>
              <Button onClick={() => onNavigate("clarion")}>Go to {p.productName}</Button>
            </CardFooter>}
          </Card>
        ))}
      </section>
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return <span className="text-body-sm text-content-neutral-muted">{children}</span>
}
