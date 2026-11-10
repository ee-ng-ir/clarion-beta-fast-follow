import { useMemo, useRef, useState } from "react"
import { ArrowLeft, BarChart3, Boxes, Plus, Sparkles, TrendingUp, Trash2 } from "lucide-react"
import { Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardHeaderText, CardTitle, Chip, InputGroup, InputGroupAddon, InputGroupInput, Sparkline } from "@ir/ui"
import type { Endpoint } from "@/data/endpoints"
import { ExploringTag } from "./ExploringTag"
import { ask, openIris } from "./iris/store"
import { BUILD_SUGGESTIONS as SUGGESTIONS } from "./iris/build"
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
  if (view === "home") return <DashboardsHome />
  return (
    <div className="flex w-full flex-col gap-3">
      <BackToDashboards />
      {view === "inventory" && <InventoryDashboard onOpenEndpoint={onOpenEndpoint} />}
      {view === "alerts" && <CommonAlertsDashboard onOpenEndpoint={onOpenEndpoint} />}
      {view === "trends" && <TrendsDashboard />}
    </div>
  )
}

/**
 * The way back to the library from any one dashboard, ready-made or saved. Sits
 * where the eye lands, not only in the top-bar breadcrumb, which is easy to miss.
 * Filters are kept, so coming back to the same dashboard picks up where you left.
 */
function BackToDashboards() {
  return (
    <Button variant="link" className="self-start" onClick={() => showDashboard("home")}>
      <ArrowLeft aria-hidden /> All dashboards
    </Button>
  )
}

interface Preview { metric: string; label: string; spark?: number[]; bars?: number[]; share?: number }

/**
 * One consistent preview per dashboard: a small picture of what's inside (bars,
 * a trend line, a share), then the number and what it means.
 */
function usePreviews(): Record<DashId, Preview> {
  const { approved } = useHeadsetsVersion()
  return useMemo(() => {
    const eps = endpointsIn([])
    const ok = eps.filter((e) => complianceFor(e, approved) === "approved").length
    const ranked = commonAlerts(filtered({ days: 30 })).sort((a, b) => b.times - a.times)
    const top = ranked[0]
    const wifi = weekly(filtered({ days: 90, types: ["wifi"], locations: ["manilla"] }), 90, "times")
    const ch = Math.round((((wifi.at(-1) ?? 0) + (wifi.at(-2) ?? 0)) / Math.max(1, wifi[0] + wifi[1]) - 1) * 100)
    return {
      inventory: approved.length
        ? { metric: `${Math.round((ok / eps.length) * 100)}%`, label: `of headsets approved, across ${eps.length.toLocaleString()} endpoints`, share: ok / Math.max(1, eps.length) }
        : { metric: eps.length.toLocaleString(), label: "endpoints reporting devices" },
      alerts: top
        ? { metric: top.times.toLocaleString(), label: `Raised most in the last 30 days: ${top.name}`, bars: ranked.slice(0, 6).map((a) => a.times) }
        : { metric: "0", label: "alerts in the last 30 days" },
      trends: { metric: `${ch >= 0 ? "+" : "−"}${Math.abs(ch)}%`, label: "Weak Wi-Fi in Manila over 90 days", spark: wifi },
    }
  }, [approved])
}

const hasArt = (p?: Preview): p is Preview => !!p && (!!p.bars || !!p.spark || p.share !== undefined)

/** The picture at the top of a card. Decorative: the number and label below say the same thing. */
function PreviewArt({ preview }: { preview: Preview }) {
  const max = Math.max(1, ...(preview.bars ?? []))
  return (
    <div aria-hidden className="flex h-32 items-end border-b border-line-neutral-subtle bg-surface-layer-subtle px-6 pt-5">
      {preview.bars && (
        <div className="flex h-24 w-full items-end gap-2">
          {preview.bars.map((v, i) => (
            <span key={i} className="flex-1 rounded-t-xs bg-chart-1" style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
          ))}
        </div>
      )}
      {preview.spark && <Sparkline values={preview.spark} label={null} variant="area" className="mb-5 h-20 w-full" />}
      {preview.share !== undefined && (
        <div className="mb-5 flex h-full w-full items-center justify-center">
          <svg viewBox="0 0 92 92" className="size-22">
            <circle cx="46" cy="46" r="36" fill="none" strokeWidth="10" className="stroke-surface-layer-emphasis" />
            <circle cx="46" cy="46" r="36" fill="none" strokeWidth="10" strokeLinecap="round" className="stroke-chart-1"
              strokeDasharray={`${preview.share * 226.2} 226.2`} transform="rotate(-90 46 46)" />
          </svg>
        </div>
      )}
    </div>
  )
}

/** The whole card opens the dashboard: the title is the one control, stretched over the card. */
function LibraryCard({ title, icon: Icon, meta, onOpen, preview, action, footer }: {
  title: string; icon: typeof BarChart3; meta: string; onOpen: () => void; preview?: Preview; action?: React.ReactNode
  /** who made it and when, for saved and (later) Iris-built dashboards */
  footer?: string
}) {
  return (
    <Card className="relative overflow-hidden transition-colors hover:border-line-neutral-emphasis">
      {hasArt(preview) && <PreviewArt preview={preview} />}
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
        <CardContent className="mt-auto flex flex-col gap-1">
          <span className="text-metric-lg text-content-neutral-emphasis">{preview.metric}</span>
          <span className="text-body-sm text-content-neutral-muted">{preview.label}</span>
        </CardContent>
      )}
      {footer && <CardContent className="mt-auto pt-4 text-body-xs text-content-neutral-muted">{footer}</CardContent>}
    </Card>
  )
}

const IRIS_CONTEXT = { kind: "page", page: "dashboards", label: "Dashboards" } as const

/** Hand a request to Iris: open the panel on Dashboards and ask it there. */
function buildWithIris(text: string) {
  openIris(IRIS_CONTEXT)
  ask({ text })
}

/** The way in to an Iris-built dashboard, first on the page: say what you want to keep an eye on. */
function IrisPrompt({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  const [text, setText] = useState("")
  return (
    <section aria-labelledby="lib-iris" className="flex flex-col gap-4 rounded-xl border border-line-primary-muted bg-surface-primary-subtle p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="size-5 shrink-0 text-content-primary-emphasis" aria-hidden />
        <h2 id="lib-iris" className="text-heading-sm text-content-neutral-emphasis">What do you want to keep an eye on?</h2>
        <ExploringTag />
      </div>
      <form className="flex flex-wrap gap-2"
        onSubmit={(e) => { e.preventDefault(); if (text.trim()) { buildWithIris(text.trim()); setText("") } }}>
        <label htmlFor="iris-build" className="sr-only">Describe the dashboard you want</label>
        <InputGroup className="min-w-0 flex-[999_1_24rem] bg-surface-card">
          <InputGroupAddon><Sparkles /></InputGroupAddon>
          <InputGroupInput id="iris-build" ref={inputRef} value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Describe it and Iris will build it, e.g. call quality in Manila this month" />
        </InputGroup>
        <Button type="submit" disabled={!text.trim()}>Build dashboard</Button>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-body-sm text-content-neutral-muted">Try:</span>
        {SUGGESTIONS.map((s) => <Chip key={s} onClick={() => buildWithIris(s)}>{s}</Chip>)}
      </div>
    </section>
  )
}

/**
 * The dashboard library: the Iris prompt first, then IR's ready-made dashboards,
 * then the ones you've saved (and, later, ones Iris builds). One shape for all
 * of them: a card that opens.
 */
function DashboardsHome() {
  const { saved } = useDashboards()
  const preview = usePreviews()
  const irisInput = useRef<HTMLInputElement>(null)
  const focusIris = () => { irisInput.current?.scrollIntoView({ block: "center" }); irisInput.current?.focus() }
  return (
    <div className="@container flex w-full flex-col gap-8">
      <IrisPrompt inputRef={irisInput} />

      <section aria-labelledby="lib-ready" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id="lib-ready" className="text-heading-xs text-content-neutral-emphasis">Ready to use</h2>
          <span className="text-body-sm text-content-neutral-muted">Made by IR. They show your fleet's data with no set-up.</span>
        </div>
        <div className="grid gap-4 @3xl:grid-cols-3">
          {(["alerts", "trends", "inventory"] as DashId[]).map((id) => (
            <LibraryCard key={id} title={DASH_TITLE[id]} icon={ICON[id]} meta={DASH_BLURB[id]} preview={preview[id]} onOpen={() => showDashboard(id)} />
          ))}
        </div>
      </section>

      <section aria-labelledby="lib-saved" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id="lib-saved" className="text-heading-xs text-content-neutral-emphasis">Saved</h2>
          {saved.length > 0 && <span className="text-body-sm text-content-neutral-muted">{saved.length} {saved.length === 1 ? "dashboard" : "dashboards"}</span>}
        </div>
        <div className="grid gap-4 @3xl:grid-cols-3">
          {saved.map((s) => (
            <LibraryCard key={s.id} title={s.name} icon={ICON[s.view]}
              meta={describeSaved(s)}
              footer={`${DASH_TITLE[s.view]} · saved by ${s.by === "You" ? "you" : s.by} ${savedAgo(s.savedAt)}`}
              onOpen={() => openSaved(s)}
              action={<Button variant="ghost" size="icon-sm" aria-label={`Delete ${s.name}`} onClick={() => deleteSaved(s.id)}><Trash2 /></Button>} />
          ))}
          <button type="button" onClick={focusIris}
            className="flex min-h-44 flex-col justify-center gap-2 rounded-xl border border-dashed border-line-neutral-emphasis p-6 text-start outline-none transition-colors hover:bg-surface-layer-subtle focus-visible:ring-2 focus-visible:ring-line-focused">
            <span aria-hidden className="flex size-10 items-center justify-center rounded-lg bg-surface-primary-subtle">
              <Plus className="size-5 text-content-primary-emphasis" />
            </span>
            <span className="text-label-lg text-content-neutral-emphasis">{saved.length ? "New dashboard" : "Nothing saved yet"}</span>
            <span className="text-body-md text-content-neutral-muted">
              {saved.length ? "Ask Iris to build one, or start from a ready-to-use dashboard." : "Filter any dashboard and save it, or ask Iris to build one for you."}
            </span>
          </button>
        </div>
      </section>
    </div>
  )
}
