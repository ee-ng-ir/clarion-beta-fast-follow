import { useMemo, useState } from "react"
import { Building2, Copy, Eye, MoreHorizontal, Plus, XCircle } from "lucide-react"
import {
  Avatar, AvatarFallback, Badge, Button, Card, DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, EmptyState, SegmentedControl, SegmentedControlItem,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import { PageTop } from "@/components/PageTop"
import { Link, Mono, SearchField, SortHead, StatusBadge } from "@/components/ui"
import { CancelTenantDialog } from "@/components/CancelTenantDialog"
import { navigate } from "@/lib/router"
import { copy } from "@/lib/toast"
import { fmtDate, initials } from "@/lib/format"
import { productName } from "@/data/catalog"
import { useOps } from "@/data/store"
import { tenantUrl, type Tenant } from "@/data/tenants"

type Filter = "open" | "all" | "active" | "cancelled" | "failed"
type SortKey = "name" | "id" | "created" | "status"

const filters: { id: Filter; label: string }[] = [
  { id: "open", label: "Not cancelled" },
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "cancelled", label: "Cancelled" },
  { id: "failed", label: "Failed" },
]

export function TenantsPage() {
  const tenants = useOps((s) => s.tenants)
  const [filter, setFilter] = useState<Filter>("open")
  const [q, setQ] = useState("")
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "name", dir: "asc" })
  const [cancelling, setCancelling] = useState<Tenant | null>(null)

  const counts = useMemo(() => ({
    open: tenants.filter((t) => t.status !== "cancelled").length,
    all: tenants.length,
    active: tenants.filter((t) => t.status === "active").length,
    cancelled: tenants.filter((t) => t.status === "cancelled").length,
    failed: tenants.filter((t) => t.status === "failed").length,
  }), [tenants])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = tenants.filter((t) =>
      (filter === "all" || (filter === "open" ? t.status !== "cancelled" : t.status === filter)) &&
      (!needle || [t.name, t.id, t.accountCode, ...t.domains].some((v) => v.toLowerCase().includes(needle))))
    const val = (t: Tenant) => (sort.key === "name" ? t.name.toLowerCase() : sort.key === "id" ? t.id : sort.key === "created" ? t.created : t.status)
    return [...list].sort((a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0) * (sort.dir === "asc" ? 1 : -1))
  }, [tenants, filter, q, sort])

  const sortBy = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))

  return (
    <div className="flex flex-col gap-gutter">
      <PageTop
        title="Tenants"
        description="IR customers on the Iris platform. Provision a tenancy, then give it products on its Products tab."
        actions={<Button asChild><Link to="/tenants/new"><Plus aria-hidden /> Create tenant</Link></Button>}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchField value={q} onChange={setQ} placeholder="Search name, tenant ID, account code or domain" className="sm:w-96" />
        <div className="max-w-full overflow-x-auto">
        <SegmentedControl value={filter} onValueChange={(v) => setFilter(v as Filter)} aria-label="Filter tenants by status" size="sm">
          {filters.map((f) => (
            <SegmentedControlItem key={f.id} value={f.id}>
              {f.label}
              <span className="text-content-neutral-subtle">{counts[f.id]}</span>
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        </div>
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<Building2 />}
            title={q ? "No tenants match" : "No tenants here"}
            description={q ? `Nothing matches “${q}” in ${filters.find((f) => f.id === filter)?.label.toLowerCase()} tenants.` : "Change the status filter to see others."}
            action={q ? <Button variant="outline" size="sm" onClick={() => setQ("")}>Clear search</Button> : undefined}
            className="py-12"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead align="start" className="border-t-0"><SortHead label="Client" active={sort.key === "name"} dir={sort.dir} onClick={() => sortBy("name")} /></TableHead>
                <TableHead align="start" className="border-t-0"><SortHead label="Tenant ID" active={sort.key === "id"} dir={sort.dir} onClick={() => sortBy("id")} /></TableHead>
                <TableHead align="start" className="border-t-0">Email domains</TableHead>
                <TableHead align="start" className="border-t-0"><SortHead label="Created" active={sort.key === "created"} dir={sort.dir} onClick={() => sortBy("created")} /></TableHead>
                <TableHead align="start" className="border-t-0"><SortHead label="Status" active={sort.key === "status"} dir={sort.dir} onClick={() => sortBy("status")} /></TableHead>
                <TableHead align="start" className="border-t-0">Products</TableHead>
                <TableHead align="start" className="w-12 border-t-0"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => {
                const live = t.subscriptions.filter((s) => s.status !== "cancelled")
                return (
                  <TableRow key={t.id} className="cursor-pointer last:border-b-0" onClick={() => navigate(`/tenants/${t.id}`)}>
                    <TableCell>
                      <div className="flex min-w-56 items-center gap-3">
                        <Avatar size="sm"><AvatarFallback>{initials(t.name)}</AvatarFallback></Avatar>
                        <div className="min-w-0">
                          <Link to={`/tenants/${t.id}`} onClick={(e) => e.stopPropagation()} className="text-label-md text-content-neutral-emphasis outline-none hover:underline focus-visible:ring-2 focus-visible:ring-line-focused">
                            {t.name}
                          </Link>
                          <div className="text-body-xs text-content-neutral-muted">{t.accountCode}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Mono className="text-content-neutral-muted">{t.id}</Mono></TableCell>
                    <TableCell className="max-w-56">
                      <span className="block truncate" title={t.domains.join(", ")}>{t.domains.join(", ")}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{fmtDate(t.created)}</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell>
                      {live.length ? (
                        <div className="flex flex-wrap gap-1">
                          {live.map((s) => (
                            <Badge key={s.product} variant="outline" color={s.status === "suspended" ? "warning" : "neutral"}>
                              {productName(s.product)}{s.status === "suspended" ? " · suspended" : s.trial ? " · trial" : ""}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-content-neutral-subtle">None</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${t.name}`}><MoreHorizontal aria-hidden /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => navigate(`/tenants/${t.id}`)}><Eye aria-hidden /> View tenant</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => copy(`https://${tenantUrl(t.id)}`, "Tenant URL")}><Copy aria-hidden /> Copy tenant URL</DropdownMenuItem>
                          {t.status !== "cancelled" ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onSelect={() => setCancelling(t)}><XCircle aria-hidden /> Cancel tenancy</DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
      <p className="text-body-sm text-content-neutral-muted">
        Showing {rows.length} of {counts.all} tenancies.
      </p>

      <CancelTenantDialog tenant={cancelling} onClose={() => setCancelling(null)} />
    </div>
  )
}
