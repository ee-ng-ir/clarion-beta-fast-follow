import { useMemo, useState } from "react"
import { Filter, RefreshCw, ScrollText, Tag } from "lucide-react"
import {
  Button, Card, Checkbox, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  EmptyState, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import { PageTop } from "@/components/PageTop"
import { ChoiceSelect, Link, Mono, SearchField, SortHead, StatusBadge, SyncBadge, TrialBadge } from "@/components/ui"
import { toast } from "@/lib/toast"
import { daysUntil, fmtDate } from "@/lib/format"
import { latestVersion, productDef, productName, type ProductId } from "@/data/catalog"
import { resync, setVersion, useOps } from "@/data/store"

/**
 * Product plans — every live subscription across tenants, for fleet-wide
 * version and sync work. Cancelled plans are left out, as on the live page.
 */
export function ProductPlansPage() {
  const tenants = useOps((s) => s.tenants)
  const [q, setQ] = useState("")
  const [products, setProducts] = useState<string[]>([])
  const [versions, setVersions] = useState<string[]>([])
  const [statuses, setStatuses] = useState<string[]>([])
  const [syncs, setSyncs] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<{ key: "tenant" | "updated" | "expiry"; dir: "asc" | "desc" }>({ key: "expiry", dir: "asc" })
  const [versionOpen, setVersionOpen] = useState(false)

  const all = useMemo(() => tenants.flatMap((t) => t.subscriptions.filter((s) => s.status !== "cancelled").map((s) => ({ key: `${t.id}:${s.product}`, t, s }))), [tenants])
  const opts = (vals: string[], label: (v: string) => string = (v) => v) =>
    [...new Set(vals)].sort().map((v) => ({ value: v, label: label(v), detail: String(vals.filter((x) => x === v).length) }))

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase()
    const list = all.filter(({ t, s }) =>
      (!products.length || products.includes(s.product)) && (!versions.length || versions.includes(s.version)) &&
      (!statuses.length || statuses.includes(s.trial ? "trial" : s.status)) && (!syncs.length || syncs.includes(s.sync)) &&
      (!n || `${t.name} ${t.id} ${t.accountCode}`.toLowerCase().includes(n)))
    const v = (r: (typeof list)[number]) => (sort.key === "tenant" ? r.t.name.toLowerCase() : sort.key === "updated" ? r.s.updated : r.s.expiry)
    return list.sort((a, b) => (v(a) < v(b) ? -1 : v(a) > v(b) ? 1 : 0) * (sort.dir === "asc" ? 1 : -1))
  }, [all, q, products, versions, statuses, syncs, sort])

  const visibleKeys = rows.map((r) => r.key)
  const picked = visibleKeys.filter((k) => selected.has(k))
  const allPicked = picked.length > 0 && picked.length === visibleKeys.length
  const toggle = (k: string) => setSelected((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n })
  const pickedProducts = [...new Set(picked.map((k) => k.split(":")[1] as ProductId))]
  const oneProduct = pickedProducts.length === 1 ? pickedProducts[0] : undefined
  const keys = () => picked.map((k) => { const [tenant, product] = k.split(":"); return { tenant, product: product as ProductId } })
  const sortBy = (key: typeof sort.key) => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))
  const filtered = !!(q || products.length || versions.length || statuses.length || syncs.length)

  return (
    <div className="flex flex-col gap-gutter">
      <PageTop title="Product plans" description="Every live subscription across tenants. Select plans to resync them or move them to another version. Cancelled plans aren't listed." />

      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={q} onChange={setQ} placeholder="Search tenant" size="sm" />
        <Select className="w-auto min-w-36" label="Product" icon={<Filter />} size="sm" options={opts(all.map((r) => r.s.product), (v) => productName(v as ProductId))} value={products} onValueChange={setProducts} showDetail />
        <Select className="w-auto min-w-36" label="Version" icon={<Filter />} size="sm" options={opts(all.map((r) => r.s.version))} value={versions} onValueChange={setVersions} showDetail />
        <Select className="w-auto min-w-36" label="Status" icon={<Filter />} size="sm" options={opts(all.map((r) => (r.s.trial ? "trial" : r.s.status)), (v) => v[0].toUpperCase() + v.slice(1))} value={statuses} onValueChange={setStatuses} showDetail />
        <Select className="w-auto min-w-36" label="Sync" icon={<Filter />} size="sm" options={opts(all.map((r) => r.s.sync), (v) => ({ "in-sync": "In sync", pending: "Syncing", failed: "Sync failed" })[v] ?? v)} value={syncs} onValueChange={setSyncs} showDetail />
        {filtered ? <Button variant="ghost" size="sm" onClick={() => { setQ(""); setProducts([]); setVersions([]); setStatuses([]); setSyncs([]) }}>Clear filters</Button> : null}
      </div>

      {picked.length ? (
        <div role="toolbar" aria-label="Bulk actions" className="flex flex-wrap items-center gap-2 rounded-lg border border-line-primary-muted bg-surface-primary-subtle px-4 py-2">
          <span className="text-label-md text-content-neutral-emphasis">{picked.length} selected</span>
          <Button size="sm" variant="outline" onClick={() => { resync(keys()); toast({ title: `Resynced ${picked.length} plan${picked.length === 1 ? "" : "s"}` }); setSelected(new Set()) }}>
            <RefreshCw aria-hidden /> Resync
          </Button>
          <Button size="sm" variant="outline" disabled={!oneProduct} onClick={() => setVersionOpen(true)}><Tag aria-hidden /> Update version</Button>
          {!oneProduct ? <span className="text-body-sm text-content-neutral-muted">Pick plans of one product to change their version.</span> : null}
          <Button size="sm" variant="ghost" className="ms-auto" onClick={() => setSelected(new Set())}>Clear selection</Button>
        </div>
      ) : null}

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState size="sm" icon={<ScrollText />} title="No plans match" description="Clear a filter to see more." className="py-12" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead align="start" className="w-10 border-t-0">
                  <Checkbox aria-label="Select all plans" checked={allPicked ? true : picked.length ? "indeterminate" : false} onCheckedChange={() => setSelected(allPicked ? new Set() : new Set(visibleKeys))} />
                </TableHead>
                <TableHead align="start" className="border-t-0"><SortHead label="Tenant" active={sort.key === "tenant"} dir={sort.dir} onClick={() => sortBy("tenant")} /></TableHead>
                <TableHead align="start" className="border-t-0">Product</TableHead>
                <TableHead align="start" className="border-t-0">Version</TableHead>
                <TableHead align="start" className="border-t-0">Licences used</TableHead>
                <TableHead align="start" className="border-t-0">Status</TableHead>
                <TableHead align="start" className="border-t-0">Sync</TableHead>
                <TableHead align="start" className="border-t-0"><SortHead label="Updated" active={sort.key === "updated"} dir={sort.dir} onClick={() => sortBy("updated")} /></TableHead>
                <TableHead align="start" className="border-t-0"><SortHead label="Expiry" active={sort.key === "expiry"} dir={sort.dir} onClick={() => sortBy("expiry")} /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ key, t, s }) => {
                const days = daysUntil(s.expiry)
                return (
                  <TableRow key={key} selected={selected.has(key)} className="last:border-b-0">
                    <TableCell><Checkbox aria-label={`Select ${t.name}`} checked={selected.has(key)} onCheckedChange={() => toggle(key)} /></TableCell>
                    <TableCell>
                      <Link to={`/tenants/${t.id}?tab=products`} className="text-label-md text-content-neutral-emphasis outline-none hover:underline focus-visible:ring-2 focus-visible:ring-line-focused">{t.name}</Link>
                      <div><Mono className="text-content-neutral-muted">{t.id}</Mono></div>
                    </TableCell>
                    <TableCell>{productName(s.product)}</TableCell>
                    <TableCell>
                      <Mono>{s.version}</Mono>
                      {s.version !== latestVersion(s.product) ? <div className="text-body-xs text-content-neutral-muted">Behind latest</div> : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {s.unitsUsed.toLocaleString()} <span className="text-content-neutral-muted">/ {s.units.toLocaleString()} {productDef(s.product).unit.plural}</span>
                      {s.unitsUsed / s.units >= 0.9 ? <div className="text-body-xs text-content-warning-emphasis">{s.unitsUsed >= s.units ? "At limit" : "Nearly full"}</div> : null}
                    </TableCell>
                    <TableCell><div className="flex flex-wrap gap-1"><StatusBadge status={s.status} />{s.trial ? <TrialBadge /> : null}</div></TableCell>
                    <TableCell><SyncBadge sync={s.sync} /></TableCell>
                    <TableCell className="whitespace-nowrap">{fmtDate(s.updated)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {fmtDate(s.expiry)}
                      {days >= 0 && days <= 30 ? <div className="text-body-xs text-content-warning-emphasis">In {days} days</div> : days < 0 ? <div className="text-body-xs text-content-danger-emphasis">Expired</div> : null}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
      <p className="text-body-sm text-content-neutral-muted">{rows.length} of {all.length} live plans.</p>

      <BulkVersionDialog key={oneProduct} product={oneProduct ?? "clarion"} open={versionOpen} count={picked.length} onClose={() => setVersionOpen(false)} onConfirm={(v) => {
        setVersion(keys(), v)
        toast({ title: `${picked.length} plan${picked.length === 1 ? "" : "s"} moving to ${v}` })
        setSelected(new Set())
        setVersionOpen(false)
      }} />
    </div>
  )
}

function BulkVersionDialog({ product, open, count, onClose, onConfirm }: { product: ProductId; open: boolean; count: number; onClose: () => void; onConfirm: (v: string) => void }) {
  const [v, setV] = useState(latestVersion(product))
  const versions = productDef(product).versions
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update {productName(product)} version</DialogTitle>
          <DialogDescription>Moves {count} selected plan{count === 1 ? "" : "s"} to a new version. Each one syncs on its own.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ChoiceSelect value={v} onChange={setV} aria-label="Version" options={versions.map((x) => ({ value: x, label: x, detail: x === versions[0] ? "Latest" : undefined }))} />
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(v)}>Update {count} plan{count === 1 ? "" : "s"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
