import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, MonitorPlay, Check, AlertTriangle } from "lucide-react"
import { Sidebar } from "@/components/app/Sidebar"
import { Topbar } from "@/components/app/Topbar"
import { OverviewPage } from "@/pages/OverviewPage"
import { SectionPage } from "@/pages/SectionPage"
import { PlatformPage } from "@/pages/PlatformPage"
import { SinglePanel } from "@/pages/SinglePanel"
import { AnchoredPanel } from "@/pages/AnchoredPanel"
import { DemoPage } from "@/pages/DemoPage"
import { isPageId, navItems, pageLabel, type PageId } from "@/nav"
import { scenarios, componentsInSection, worstStatus, type ScenarioId, type SectionId, type Status } from "@/data/widget"

/** Read the current section from the URL hash, e.g. "#/devices" or "#/demo/b". */
function hashPage(): PageId | null {
  const seg = window.location.hash.replace(/^#\/?/, "").split("/")[0]
  return isPageId(seg) ? seg : null
}

/** Version C — the IR-2026 brand gradient. Dark in both themes, so white text stays legible. */
const BRAND_GRADIENT =
  "linear-gradient(135deg, var(--palette-brand-950) 0%, var(--palette-brand-700) 52%, var(--palette-vis-teal-500) 116%)"

const SECTION_IDS: SectionId[] = ["devices", "network", "system", "platform"]
const SEV: Record<Status, number> = { healthy: 0, warning: 1, critical: 2, syncing: 0, unknown: 0 }
const STATUS_COLOR: Record<Status, string> = {
  healthy: "var(--status-healthy)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
  syncing: "var(--status-unknown)",
  unknown: "var(--status-unknown)",
}

/**
 * The Clarion product, as one reusable shell.
 *
 * Rendered full-screen by App, and rendered *again* — at window size — inside
 * DemoPage's desktop frame. Because both use this exact component, any change
 * to the shell or its pages shows up in the Demo automatically; there is no
 * separate mockup to keep in sync.
 */
export function AppShell({
  showDevNav = true,
  onClose,
  onMinimize,
  scenarioId = "healthy",
  routed = false,
  lockSidebar = false,
  singlePage = false,
  anchored = false,
  brand = false,
  flatHeader = false,
  initialPage,
  onSendToIt,
  widgetHeight,
  widgetContentWidth,
}: {
  /** Show the internal "Product development" group (Demo). Off inside the Demo to avoid nesting. */
  showDevNav?: boolean
  /** Called by the Close (×) control — sends the widget back to the tray (services keep running). */
  onClose?: () => void
  /** Called by the Minimize (_) control — sends the widget to the Windows taskbar (hybrid-app model). */
  onMinimize?: () => void
  /** Which widget scenario the shell reflects. Default — and the product default — is healthy. */
  scenarioId?: ScenarioId
  /** Sync the active section to the URL hash (#/devices, …). Top-level only — off inside the Demo. */
  routed?: boolean
  /** Lock the sidebar to an icons-only rail (no expand) — Version C's compact panel. */
  lockSidebar?: boolean
  /** Single scrolling panel, no rail — Version B (all telemetry on one page). */
  singlePage?: boolean
  /** Anchored one-page — Version D (sidebar anchors + scrollspy over one scrolling page). */
  anchored?: boolean
  /** Apply the IR 2026 brand chrome — gradient headline, gradient logomark, coloured icons (Version C). */
  brand?: boolean
  /** Flat header on --bg-app instead of the gradient banner — Version E. */
  flatHeader?: boolean
  /** Section to open on mount (e.g. from a notification). Version B opens rail-only without it. */
  initialPage?: PageId | null
  /** Platform alert "Send to IT" — opens the email compose flow in the demo harness. */
  onSendToIt?: () => void
  /** Anchored widget size (demo size control). */
  widgetHeight?: number
  widgetContentWidth?: number
}) {
  const [page, setPage] = useState<PageId | null>(() => {
    if (routed) return hashPage() ?? "overview"
    if (lockSidebar) return initialPage ?? null // Version B opens rail-only unless given a section
    return initialPage ?? "overview"
  })
  const [collapsed, setCollapsed] = useState(true)

  const scenario = scenarios[scenarioId]
  const sidebarCollapsed = lockSidebar || collapsed

  // Per-section status for the sidebar (icon indicator + hover tooltip line 2).
  const sectionStatus: Partial<Record<PageId, { status: Status; detail: string }>> = {
    overview: { status: scenario.overallStatus, detail: scenario.banner.sub },
  }
  for (const s of SECTION_IDS) {
    const comps = componentsInSection(s, scenario)
    const worst = [...comps].sort((a, b) => SEV[b.status] - SEV[a.status])[0]
    sectionStatus[s] = { status: worstStatus(comps.map((c) => c.status)), detail: worst?.detail ?? "" }
  }

  // The three end-user experiences, surfaced in the Version B headline.
  const overall = scenario.overallStatus
  const platformDegraded = scenario.components.platform.status !== "healthy"
  const headlineSub =
    overall === "healthy"
      ? "You're ready for calls"
      : platformDegraded
        ? "Not your machine — a platform issue was detected"
        : "An issue on your end needs attention"

  // Theme follows the OS colour scheme — no in-app toggle.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const apply = () => document.documentElement.classList.toggle("dark", mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  // Keep section ↔ URL hash in sync when routed.
  useEffect(() => {
    if (!routed) return
    if (!hashPage()) window.location.hash = "/overview"
    const sync = () => {
      setPage(hashPage() ?? "overview")
    }
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
  }, [routed])

  const navigate = useCallback(
    (id: PageId) => {
      if (routed) window.location.hash = `/${id}`
      else setPage(id)
    },
    [routed],
  )

  // Keyboard shortcuts:
  //   Escape   → close the widget back to the tray
  //   Alt+S    → collapse / expand the sidebar
  //   Alt+1…N  → jump to a primary sidebar section
  // Uses e.code so it's keyboard-layout independent.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (onClose) { e.preventDefault(); onClose() }
        return
      }
      if (e.ctrlKey || !(e.altKey || e.metaKey)) return
      if (page === "demo") return
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return
      if (e.code === "KeyS") {
        e.preventDefault()
        if (!lockSidebar) setCollapsed((v) => !v)
        return
      }
      const match = /^Digit([1-9])$/.exec(e.code)
      if (!match) return
      const navList = lockSidebar ? navItems.filter((n) => n.id !== "overview") : navItems
      const idx = Number(match[1]) - 1
      if (idx < navList.length) {
        e.preventDefault()
        navigate(navList[idx].id)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [page, navigate, onClose, lockSidebar])

  // Demo mode is a full-bleed preview surface: no outer product chrome, so the
  // only sidebar on screen is the one inside the simulated app window. A slim
  // bar lets you theme the desktop and exit back to the product.
  if (page === "demo") {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: "var(--bg-app)" }}>
        <header
          className="flex h-12 shrink-0 items-center gap-3 px-3"
          style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}
        >
          <button
            type="button"
            onClick={() => navigate("overview")}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors"
            style={{ color: "var(--fg-neutral-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <ChevronLeft className="size-4" /> Exit demo
          </button>
          <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
            <MonitorPlay className="size-4" style={{ color: "var(--fg-neutral-muted)" }} /> Demo preview
          </span>
        </header>
        <div className="min-h-px flex-1 overflow-hidden">
          <DemoPage version="E" />
        </div>
      </div>
    )
  }

  // Version B — one scrolling page, no rail. All telemetry stacked; tapping the
  // tray opens it directly, and a notification scrolls to the affected group.
  if (singlePage) {
    const focus: SectionId | undefined =
      initialPage && initialPage !== "overview" && initialPage !== "demo" ? initialPage : undefined
    return (
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: 360,
          height: 520,
          background: "var(--bg-card)",
          border: "1px solid var(--border-neutral-muted)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-xl)",
        }}
      >
        <div className="flex h-16 shrink-0 items-center px-4" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping" style={{ background: STATUS_COLOR[overall] }} />
              <span className="relative inline-flex size-2.5 rounded-full" style={{ background: STATUS_COLOR[overall] }} />
            </span>
            <span className="flex min-w-px flex-col">
              <span className="text-sm font-semibold leading-tight" style={{ color: "var(--fg-neutral-emphasis)" }}>Clarion</span>
              <span className="truncate text-xs leading-tight" style={{ color: "var(--fg-neutral-subtle)" }}>{headlineSub}</span>
            </span>
          </div>
        </div>
        <div className="min-h-px flex-1 overflow-y-auto">
          <SinglePanel scenario={scenario} focusSection={focus} />
        </div>
      </div>
    )
  }

  // Anchored one-page (scrollspy) — Version D (neutral rail) and Version C (brand rail).
  if (anchored) {
    const focus: SectionId | undefined =
      initialPage && initialPage !== "overview" && initialPage !== "demo" ? initialPage : undefined
    return <AnchoredPanel scenario={scenario} focusSection={focus} flatHeader={flatHeader} onMinimize={onMinimize} onClose={onClose} onSendToIt={onSendToIt} height={widgetHeight} contentWidth={widgetContentWidth} />
  }

  // Version C shows the section name as a heading inside the content.
  const sectionHeading = lockSidebar && page ? pageLabel(page) : undefined
  const content = (
    <>
      {page === "overview" && <OverviewPage onNavigate={navigate} scenario={scenario} />}
      {page === "devices" && <SectionPage section="devices" scenario={scenario} hideBlurb={lockSidebar} heading={sectionHeading} brand={brand} />}
      {page === "network" && <SectionPage section="network" scenario={scenario} hideBlurb={lockSidebar} heading={sectionHeading} brand={brand} />}
      {page === "system" && <SectionPage section="system" scenario={scenario} hideBlurb={lockSidebar} heading={sectionHeading} brand={brand} />}
      {page === "platform" && <PlatformPage scenario={scenario} stacked={lockSidebar} heading={sectionHeading} brand={brand} />}
    </>
  )

  // Version B — tapping the tray shows only the icon rail; clicking an icon
  // reveals that section's pane (clicking it again collapses back to the rail).
  // The panel sizes itself to its content.
  if (lockSidebar) {
    return (
      <div
        className="flex items-stretch overflow-hidden"
        style={{
          height: 520,
          background: "var(--bg-card)",
          border: "1px solid var(--border-neutral-muted)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-xl)",
        }}
      >
        <Sidebar
          active={page}
          onNavigate={(id) => setPage((p) => (p === id ? null : id))}
          collapsed
          onToggleCollapsed={() => {}}
          showDevNav={false}
          hideCollapseToggle
          hideOverview
          sectionStatus={sectionStatus}
          brand={brand}
        />
        {page && (
          <div className="flex w-[360px] min-w-px flex-col" style={{ borderLeft: "1px solid var(--border-neutral-muted)" }}>
            {brand ? (
              <div className="relative h-[88px] shrink-0 overflow-hidden px-4" style={{ background: BRAND_GRADIENT }}>
                <svg viewBox="0 0 360 96" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity: 0.18 }}>
                  <path d="M-10,96 C110,96 150,8 380,-12" fill="none" stroke="#fff" strokeWidth="2" />
                  <path d="M-40,96 C80,86 130,28 380,18" fill="none" stroke="#fff" strokeWidth="1.5" />
                </svg>
                <div className="relative flex h-full items-center justify-between gap-3">
                  <span className="flex min-w-px flex-col gap-1">
                    <span className="text-[11px] font-medium uppercase leading-none tracking-[0.14em]" style={{ color: "var(--palette-brand-200)" }}>Clarion</span>
                    <span className="truncate text-[15px] font-semibold leading-tight text-white">{headlineSub}</span>
                    <span className="truncate text-xs leading-tight" style={{ color: "var(--palette-brand-100)" }}>{scenario.banner.sub}</span>
                  </span>
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.32)" }}
                  >
                    {overall === "healthy" ? <Check className="size-5" /> : <AlertTriangle className="size-5" />}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex h-16 shrink-0 items-center justify-between px-4" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
                <div className="flex items-center gap-2.5">
                  <span className="relative flex size-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping" style={{ background: STATUS_COLOR[overall] }} />
                    <span className="relative inline-flex size-2.5 rounded-full" style={{ background: STATUS_COLOR[overall] }} />
                  </span>
                  <span className="flex min-w-px flex-col">
                    <span className="text-sm font-semibold leading-tight" style={{ color: "var(--fg-neutral-emphasis)" }}>Clarion</span>
                    <span className="truncate text-xs leading-tight" style={{ color: "var(--fg-neutral-subtle)" }}>{headlineSub}</span>
                  </span>
                </div>
              </div>
            )}
            <div className="min-h-px flex-1 overflow-y-auto">{content}</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full w-full items-stretch overflow-hidden" style={{ background: "var(--bg-app)" }}>
      <Sidebar
        active={page}
        onNavigate={navigate}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        showDevNav={showDevNav}
        hideCollapseToggle={lockSidebar}
        hideOverview={lockSidebar}
        sectionStatus={sectionStatus}
      />

      <div
        className="flex h-full min-w-px flex-1 flex-col overflow-hidden"
        style={{ borderLeft: "1px solid var(--border-neutral-muted)" }}
      >
        <Topbar page={page ?? "overview"} onClose={onClose} />
        <div className="flex flex-1 flex-col overflow-y-auto">{content}</div>
      </div>
    </div>
  )
}
