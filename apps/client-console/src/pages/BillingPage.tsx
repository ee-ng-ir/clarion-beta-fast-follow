import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ir/ui"
import { plans } from "@ir/mock-data/tenant"

const count = new Intl.NumberFormat()

export function BillingPage() {
  return (
    <section className="flex flex-col gap-4" aria-labelledby="plans-heading">
      <h2 id="plans-heading" className="text-heading-lg text-content-neutral-emphasis">Plans by product</h2>
      <Card className="gap-0 overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">Product</TableHead>
              <TableHead className="text-start">Plan</TableHead>
              <TableHead className="text-start">Billing cycle</TableHead>
              <TableHead numeric>Licenses</TableHead>
              <TableHead className="text-start">Expiry date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((p) => (
              <TableRow key={p.product}>
                <TableCell>{p.productName}</TableCell>
                <TableCell>{p.plan}</TableCell>
                <TableCell>{p.cycle}</TableCell>
                <TableCell numeric>{count.format(p.licenses)}</TableCell>
                <TableCell>{p.expires}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </section>
  )
}
