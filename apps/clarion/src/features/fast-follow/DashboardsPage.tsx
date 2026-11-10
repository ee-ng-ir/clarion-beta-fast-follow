import { useMemo } from "react"
import { BarChart3, Boxes, Sparkles, TrendingUp, Trash2 } from "lucide-react"
import { Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardHeaderText, CardTitle, Chip, Sparkline } from "@ir/ui"
import type { Endpoint } from "@/data/endpoints"
import { ExploringTag } from "./ExploringTag"
import { openIris } from "./iris/store"
import { complianceFor, useHeadsetsVersion } from "./headsets/headsets"
import { CommonAlertsDashboard } from "./dashboards/CommonAlertsDashboard"
import { InventoryDashboard } from "./dashboards/InventoryDashboard"
import { TrendsDashboard } from "./dashboards/TrendsDashboard"
import { commonAlerts, endpointsIn, filtered, weekly } from "./dashboards/data"
import { describeSaved, savedAgo } from "./dashboards/describe"
import { DASH_BLURB, DASH_TITLE, deleteSaved, openSaved, showDashboard, useDashboards, type DashId } from "./dashboards/store"

const ICON: Record<DashId, typeof BarChart3> = { inventory: Boxes, alerts: BarChart3, trends: TrendingUp }

/**
 * Dashboards: three fixed dashboards over recent history (R1: name to confirm),
 * plus the ones you've saved. Each dashboard is its own page under Dashboards,
 * with the breadcrumb following the hierarchy (D8).
 */
export function DashboardsPage({ onOpenEndpoint }: { onOpenEndpoint: (rows: Endpoint[], index: number) => void }) {
  const { view } = useDashboards()
  if (view === "inventory") return <InventoryDashboard onOpenEndpoint={onOpenEndpoint} />
  if (view === "alerts") return <CommonAlertsDashboard onOpenEndpoint={onOpenEndpoint} />
  if (view === "trends") return <TrendsDashboard />
  return <DashboardsHome />
}

interface Preview { metric: string; label: string; spark?: number[] }

/** One consistent preview per dashboard: a number, what it is, and a sparkline where the point is a trend. */
function usePreviews(): Record<DashId, Preview> {
  const { approved } = useHeadsetsVersion()
  return useMemo(() => {
    const eps = endpointsIn([])
    const ok = eps.filter((e) => complianceFor(e, approved) === "approved").length
    const top = commonAlerts(filtered({ days: 30 })).sort((a, b) => b.times - a.times)[0]
    const wifi = weekly(filtered({ days: 90, types: ["wifi"], locations: ["manilla"] }), 90, "times")
    const ch = Math.round((((wifi.at(-1) ?? 0) + (wifi.at(-2) ?? 0)) / Math.max(1, wifi[0] + wifi[1]) - 1) * 100)
    return {
      inventory: approved.length
        ? { metric: `${Math.round((ok / eps.length) * 100)}%`, label: `of headsets approved, across ${eps.length.toLocaleString()} endpoints` }
        : { metric: eps.length.toLocaleString(), label: "endpoints reporting devices" },
      alerts: top ? { metric: top.times.toLocaleString(), label: `${top.name}, the most raised alert in the last 30 days` } : { metric: "0", label: "alerts in the last 30 days" },
      trends: { metric: `${ch >= 0 ? "+" : "−"}${Math.abs(ch)}%`, label: "Weak Wi-Fi in Manila over 90 days", spark: wifi },
    }
  }, [approved])
}

/** The whole card opens the dashboard: the title is the one control, stretched over the card. */
function LibraryCard({ title, icon: Icon, meta, onOpen, preview, action, footer }: {
  title: string; icon: typeof BarChart3; meta: string; onOpen: () => void; preview?: Preview; action?: React.ReactNode
  /** who made it and when, for saved and (later) Iris-built dashboards */
  footer?: string
}) {
  return (
    <Card className="relative transition-colors hover:border-line-neutral-emphasis">
      <CardHeader>
        <CardHeaderText>
          <CardTitle className="flex items-center gap-2">
            <Icon className="size-4 shrink-0 text-content-neutral-muted" aria-hidden />
            <button type="button" onClick={onOpen}
              className="rounded-xs text-start outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:ring-2 focus-visible:ring-line-focused">
              {title}
            </button>
          </CardTitle>
          <CardDescription>{meta}</CardDescription>
        </CardHeaderText>
        {action && <CardAction className="relative z-10">{action}</CardAction>}
      </CardHeader>
      {preview && (
        <CardContent className="mt-auto flex-row items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-metric-lg text-content-neutral-emphasis">{preview.metric}</span>
            <span className="text-body-sm text-content-neutral-muted">{preview.label}</span>
          </div>
          {preview.spark && <Sparkline values={preview.spark} label={null} className="h-10 w-28 shrink-0" />}
        </CardContent>
      )}
      {footer && <CardContent className="mt-auto pt-4 text-body-xs text-content-neutral-muted">{footer}</CardContent>}
    </Card>
  )
}

/**
 * The dashboard library: IR's fixed dashboards and the ones you've saved (and,
 * later, ones Iris builds). One shape for all of them: a card that opens.
 */
function DashboardsHome() {
  const { saved } = useDashboards()
  const preview = usePreviews()
  return (
    <div className="@container flex w-full flex-col gap-6">
      <section aria-labelledby="lib-ir" className="flex flex-col gap-3">
        <h2 id="lib-ir" className="text-heading-xs text-content-neutral-emphasis">From IR</h2>
        <div className="grid gap-4 @3xl:grid-cols-3">
          {(["alerts", "trends", "inventory"] as DashId[]).map((id) => (
            <LibraryCard key={id} title={DASH_TITLE[id]} icon={ICON[id]} meta={DASH_BLURB[id]} preview={preview[id]} onOpen={() => showDashboard(id)} />
          ))}
        </div>
      </section>

      <section aria-labelledby="lib-yours" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="lib-yours" className="text-heading-xs text-content-neutral-emphasis">Yours{saved.length ? ` · ${saved.length}` : ""}</h2>
          <span className="ms-auto flex items-center gap-2">
            <Chip onClick={() => openIris({ kind: "page", page: "dashboards", label: "Dashboards" })}>
              <Sparkles aria-hidden /> Build a dashboard with Iris
            </Chip>
            <ExploringTag />
          </span>
        </div>
        {saved.length === 0 ? (
          <p className="text-body-md text-content-neutral-muted">Nothing here yet. Save a dashboard with its filters, or ask Iris to build one.</p>
        ) : (
          <div className="grid gap-4 @3xl:grid-cols-3">
            {saved.map((s) => (
              <LibraryCard key={s.id} title={s.name} icon={ICON[s.view]}
                meta={describeSaved(s)}
                footer={`${DASH_TITLE[s.view]} · saved by ${s.by === "You" ? "you" : s.by} ${savedAgo(s.savedAt)}`}
                onOpen={() => openSaved(s)}
                action={<Button variant="ghost" size="icon-sm" aria-label={`Delete ${s.name}`} onClick={() => deleteSaved(s.id)}><Trash2 /></Button>} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
