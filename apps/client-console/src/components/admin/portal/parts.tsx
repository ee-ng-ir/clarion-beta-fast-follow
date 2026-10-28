import type * as React from "react"
import { Avatar, AvatarFallback, AvatarImage, Card, CardContent, Meter } from "@ir/ui"
import { tenant } from "@ir/mock-data/tenant"
import { clarionBrand } from "@/lib/brand"

/** A label over a value — the live portal's read-only field. */
export function Detail({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-label-sm text-content-neutral-muted">{label}</span>
      <span className={mono ? "truncate font-mono text-body-md text-content-neutral-emphasis" : "truncate text-body-md text-content-neutral-emphasis"}>
        {children}
      </span>
    </div>
  )
}

/** Tenant · Tenant ID · Data region, across the top of Home and Account. */
export function TenantSummary() {
  return (
    <Card size="sm">
      <CardContent className="grid grid-cols-1 gap-4 @2xl:grid-cols-3">
        <Detail label="Tenant">{tenant.name}</Detail>
        <Detail label="Tenant ID" mono>{tenant.id}</Detail>
        <Detail label="Data region">{tenant.region}</Detail>
      </CardContent>
    </Card>
  )
}

const productArt: Record<string, string> = { clarion: clarionBrand }

/** A product's round mark, cut from its brand artwork. */
export function ProductMark({ product, name, size = "sm" }: { product: string; name: string; size?: "xs" | "sm" | "md" }) {
  return (
    <Avatar size={size}>
      {productArt[product] && <AvatarImage src={productArt[product]} alt="" />}
      <AvatarFallback>{name[0]}</AvatarFallback>
    </Avatar>
  )
}

const count = new Intl.NumberFormat()

/**
 * Licenses in use against the contract. A Meter, not a Progress: it is a
 * reading against a real ceiling and it can go back down.
 */
export function LicenseUsage({ label, used, limit }: { label: string; used: number; limit: number }) {
  const full = used >= limit
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="text-label-md text-content-neutral-emphasis">{label}</span>
      <span className="ltr-island text-metric-md text-content-neutral-emphasis">
        {count.format(used)} <span className="text-body-md text-content-neutral-muted">/ {count.format(limit)}</span>
      </span>
      <Meter className="w-40" value={used} max={limit} status={full ? "warning" : "neutral"} />
    </div>
  )
}

const dateFmt = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" })
/** Relative under an hour, absolute after (Picasso: numbers, units and time). */
export function formatSignIn(iso: string | null) {
  if (!iso) return "Not yet"
  const t = new Date(iso).getTime()
  const mins = Math.round((Date.now() - t) / 60000)
  if (mins >= 0 && mins < 60) return mins < 1 ? "Just now" : `${mins} min ago`
  return dateFmt.format(t)
}
