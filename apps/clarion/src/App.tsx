import { useEffect, useMemo, useRef, useState } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { Topbar } from "@/components/dashboard/Topbar"
import { MobileNav, useIsMobile } from "@/components/dashboard/MobileNav"
import { OverviewPage } from "@/pages/OverviewPage"
import { EndpointsPage } from "@/pages/EndpointsPage"
import { ThresholdsPage } from "@/pages/ThresholdsPage"
import { GlossaryPage } from "@/pages/GlossaryPage"
import { IssuesDocPage } from "@/pages/IssuesDocPage"
import { DevicesModelPage } from "@/pages/DevicesModelPage"
import { ScopePage } from "@/pages/ScopePage"
import { ComponentsPage } from "@/pages/ComponentsPage"
import { SettingsPage } from "@/features/fast-follow/SettingsPage"
import { DashboardsPage } from "@/features/fast-follow/DashboardsPage"
import { AlertGroupsPage } from "@/features/fast-follow/alerts/AlertGroupsPage"
import { openGroup } from "@/features/fast-follow/alerts/store"
import { IrisPanel } from "@/features/fast-follow/iris/IrisPanel"
import { PreviewMarker } from "@/features/fast-follow/PreviewMarker"
import { CLIENT_CONSOLE_URL } from "@/lib/apps"
import { EndpointDrawer } from "@/components/endpoints/drawer/EndpointDrawer"
import { AlertDrawer } from "@/components/alerts/AlertDrawer"
import { Toaster, toast } from "@/components/ui/toast"
import { applyFeed, FeedVersion } from "@/data/agentFeed"
import { agents, endpointView, useFeed } from "@ir/telemetry"
import { useStreaming } from "@/hooks/useStreaming"
import { DEFAULT_LOCATION, locationById } from "@/data/dashboard"
import type { Endpoint, Rollup } from "@/data/endpoints"
import { rollupsAll, queryEndpoints, endpointById } from "@/data/endpoints"
import { canOpen, useViewer } from "@/lib/viewer"
import { pageLabel, pageSubtitle, pageFromPath, buildPath, readDrawerParams, experienceOf, defaultPageFor, type PageId, type Experience } from "@/nav"

type DeviceDrawer = { rows: Endpoint[]; index: number }
let feedApplies = 0
type IssueDrawer = { rows: Rollup[]; index: number; expanded?: boolean }

// Rebuild the drawers from the URL (deep-link or browser back/forward). The URL
// only carries the id, so we reconstruct a sensible row context for prev/next:
// for a device, its location's list; for an issue, the full issue list.
function deviceDrawerFromUrl(): DeviceDrawer | null {
  const { device } = readDrawerParams(window.location.search)
  if (!device) return null
  const e = endpointById(device)
  if (!e) return null
  const rows = queryEndpoints({ locationIds: [e.locationId] })
  const index = rows.findIndex((r) => r.id === device)
  return index >= 0 ? { rows, index } : { rows: [e], index: 0 }
}

function issueDrawerFromUrl(): IssueDrawer | null {
  const { issue } = readDrawerParams(window.location.search)
  if (!issue) return null
  const rows = rollupsAll()
  const index = rows.findIndex((r) => r.id === issue)
  return index >= 0 ? { rows, index } : null
}

export default function App() {
  const [dark, setDark] = useState(false)
  const [page, setPage] = useState<PageId>(() => pageFromPath(window.location.pathname))
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_LOCATION)
  const [endpointFilters, setEndpointFilters] = useState<string[]>([])
  // Desktop/tablet: the rail sits inline and the toggle collapses it.
  // Phones (< md): the rail becomes an off-canvas drawer over the page (MobileNav).
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const isMobile = useIsMobile()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  useEffect(() => { if (!isMobile) setMobileNavOpen(false) }, [isMobile])
  const toggleSidebar = () => (isMobile ? setMobileNavOpen((v) => !v) : setSidebarOpen((v) => !v))
  const [drawer, setDrawer] = useState<DeviceDrawer | null>(() => deviceDrawerFromUrl())
  const [alertDrawer, setAlertDrawer] = useState<IssueDrawer | null>(() => issueDrawerFromUrl())
  const [backAlert, setBackAlert] = useState<IssueDrawer | null>(null)
  // Live demo agents: the widget prototype (served at /widget) feeds their machines.
  const feedState = useFeed()
  const feedVersion = useMemo(() => { applyFeed(feedState); return ++feedApplies }, [feedState])
  const lastFeed = useRef(feedState)
  useEffect(() => {
    const prev = lastFeed.current
    lastFeed.current = feedState
    for (const a of agents) {
      const before = prev[a.id] ? endpointView(prev[a.id]).status : "healthy"
      const now = feedState[a.id] ? endpointView(feedState[a.id]).status : "healthy"
      if (before === now) continue
      const v = feedState[a.id] ? endpointView(feedState[a.id]) : null
      toast({
        title: `${a.name} (${a.locationName}) is ${now}`,
        description: now === "healthy" ? "Back to normal." : now === "offline" ? "Not reporting to Clarion." : v?.events[0]?.label,
        variant: now === "critical" ? "danger" : now === "healthy" ? "success" : "info",
      })
    }
  }, [feedState])
  const live = useStreaming()
  // remembers the last synced page + open-drawer flags, to decide push vs replace
  const histPrev = useRef({ page, device: drawer !== null, issue: alertDrawer !== null })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  // keep the URL in sync with page + open drawer (shareable, deep-linkable).
  // push on page change / drawer open (so Back closes the drawer); replace on
  // in-drawer prev-next and on close (so Back doesn't step through each row).
  useEffect(() => {
    const device = drawer ? drawer.rows[drawer.index]?.id : undefined
    const issue = alertDrawer ? alertDrawer.rows[alertDrawer.index]?.id : undefined
    const url = buildPath(page, { device, issue })
    const current = window.location.pathname + window.location.search
    if (current !== url) {
      const opened = (!histPrev.current.device && drawer !== null) || (!histPrev.current.issue && alertDrawer !== null)
      const pageChanged = histPrev.current.page !== page
      if (opened || pageChanged) window.history.pushState(null, "", url)
      else window.history.replaceState(null, "", url)
    }
    histPrev.current = { page, device: drawer !== null, issue: alertDrawer !== null }
  }, [page, drawer, alertDrawer])

  // back/forward buttons → rebuild page + drawers from the URL
  useEffect(() => {
    const onPop = () => {
      setPage(pageFromPath(window.location.pathname))
      setDrawer(deviceDrawerFromUrl())
      setAlertDrawer(issueDrawerFromUrl())
    }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  // Navigating to another page closes any open drawer (a drilldown belongs to
  // the page it was opened from).
  const navigate = (p: PageId) => { setDrawer(null); setAlertDrawer(null); setPage(p) }

  const handleViewEndpoints = (loc?: string | string[]) => {
    if (Array.isArray(loc)) setEndpointFilters(loc)
    else {
      const id = loc ?? selectedId
      setEndpointFilters(id === "all" ? [] : [id])
    }
    navigate("endpoints")
  }

  const openEndpointId = drawer ? drawer.rows[drawer.index]?.id ?? null : null

  // Administration lives in the Iris client console now (its own app and Vercel
  // project). The account menu and any old /admin/* link go there.
  const switchExperience = (e: Experience) =>
    e === "admin" ? window.location.assign(`${CLIENT_CONSOLE_URL}/`) : navigate(defaultPageFor[e])

  // After "View as" switches person, leave any page they can't open (same as the client console).
  const viewer = useViewer()
  const allowed = canOpen(page, viewer)
  useEffect(() => { if (!allowed) navigate("overview") }, [allowed, viewer.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (experienceOf(page) === "admin") {
    window.location.replace(`${CLIENT_CONSOLE_URL}${window.location.pathname}${window.location.search}`)
    return null
  }

  return (
    <FeedVersion.Provider value={feedVersion}>
    <div className="flex h-screen w-full items-start overflow-hidden" style={{ background: "var(--bg-app)" }}>
      {!isMobile && sidebarOpen && (
        <Sidebar active={page} onNavigate={navigate} lastRefreshAt={live.lastRefreshAt} />
      )}
      {isMobile && (
        <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          {/* picking a page closes the drawer */}
          <Sidebar
            active={page}
            onNavigate={(id) => { navigate(id); setMobileNavOpen(false) }}
            lastRefreshAt={live.lastRefreshAt}
            onClose={() => setMobileNavOpen(false)}
            dark={dark}
            onToggleTheme={() => setDark((v) => !v)}
          />
        </MobileNav>
      )}

      <div
        className="flex h-full min-w-px flex-1 flex-col overflow-hidden"
        style={{
          borderLeft: "1px solid var(--border-neutral-muted)",
          borderRight: "1px solid var(--border-neutral-muted)",
        }}
      >
        <PreviewMarker />
        <Topbar
          page={page}
          dark={dark}
          onToggleTheme={() => setDark((v) => !v)}
          onToggleSidebar={toggleSidebar}
          sidebarExpanded={isMobile ? mobileNavOpen : sidebarOpen}
          onSwitchExperience={switchExperience}
        />

        <div className="shrink-0 p-5" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
          <h1 className="text-xl font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
            {page === "endpoints" && endpointFilters.length > 0 ? (
              <>
                Endpoints{" "}
                <span style={{ color: "var(--fg-neutral-subtle)" }}>
                  — {endpointFilters.length === 1 ? locationById(endpointFilters[0])?.name : `${endpointFilters.length} locations`}
                </span>
              </>
            ) : (
              pageLabel(page)
            )}
          </h1>
          {pageSubtitle[page] && (
            <p className="mt-1 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{pageSubtitle[page]}</p>
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          {page === "overview" && (
            <OverviewPage
              live={live}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onViewEndpoints={handleViewEndpoints}
              onOpenEndpoint={(rows, index) => setDrawer({ rows, index })}
              openEndpointId={openEndpointId}
              onOpenAlertGroup={(id) => { openGroup(id); navigate("alerts") }}
              onViewAlerts={() => navigate("alerts")}
            />
          )}
          {page === "endpoints" && (
            <EndpointsPage
              locationIds={endpointFilters}
              onLocationsChange={setEndpointFilters}
              onOpenEndpoint={(rows, index) => setDrawer({ rows, index })}
              openEndpointId={openEndpointId}
            />
          )}
          {/* Fast Follow: alert groups replace the per-location rollups (old AlertsPage kept for upstream merges) */}
          {page === "alerts" && <AlertGroupsPage onOpenEndpoint={(rows, index) => setDrawer({ rows, index })} />}
          {page === "thresholds" && allowed && <ThresholdsPage />}
          {page === "settings" && allowed && <SettingsPage />}
          {page === "dashboards" && <DashboardsPage />}
          {page === "glossary" && <GlossaryPage />}
          {page === "devicesdoc" && <DevicesModelPage />}
          {page === "issuesdoc" && <IssuesDocPage />}
          {page === "scopedoc" && <ScopePage />}
          {page === "components" && <ComponentsPage />}
        </div>
      </div>

      {/* Fast Follow: Iris side panel, docked beside the page */}
      <IrisPanel page={page} onNavigate={navigate} onOpenEndpoint={(rows, index) => setDrawer({ rows, index })} />

      {/* global endpoint drilldown */}
      <EndpointDrawer
        rows={drawer?.rows ?? []}
        index={drawer?.index ?? 0}
        open={drawer !== null}
        onIndexChange={(i) => setDrawer((d) => (d ? { ...d, index: i } : d))}
        onOpenChange={(o) => { if (!o) { setDrawer(null); setBackAlert(null) } }}
        backLabel={backAlert ? backAlert.rows[backAlert.index]?.title : undefined}
        onBack={backAlert ? () => { setDrawer(null); setAlertDrawer(backAlert); setBackAlert(null) } : undefined}
      />

      {/* alert rollup drilldown */}
      <AlertDrawer
        rows={alertDrawer?.rows ?? []}
        index={alertDrawer?.index ?? 0}
        defaultExpanded={alertDrawer?.expanded ?? false}
        open={alertDrawer !== null}
        onIndexChange={(i) => setAlertDrawer((d) => (d ? { ...d, index: i } : d))}
        onOpenChange={(o) => { if (!o) setAlertDrawer(null) }}
        onOpenEndpoint={(rows, index) => { setBackAlert(alertDrawer); setAlertDrawer(null); setDrawer({ rows, index }) }}
      />

      {/* transient toasts (save confirmations, etc.) */}
      <Toaster />
    </div>
    </FeedVersion.Provider>
  )
}
