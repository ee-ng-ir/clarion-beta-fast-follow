import { useEffect, useRef, useState } from "react"
import { CheckCheck, Check, AlertTriangle, CircleAlert, Info, PhoneCall, ArrowLeftRight, Clock, Minus, X } from "lucide-react"
import { Sidebar } from "@/components/app/Sidebar"
import { SectionPage } from "@/pages/SectionPage"
import { PlatformPage } from "@/pages/PlatformPage"
import { pageLabel, type PageId } from "@/nav"
import { scenarios, componentsInSection, worstStatus, type Scenario, type SectionId, type Status } from "@/data/widget"

const SECTIONS: SectionId[] = ["devices", "network", "system", "platform"]
const SEV: Record<Status, number> = { healthy: 0, warning: 1, critical: 2, syncing: 0, unknown: 0 }

// Header banner per state (Figma node 1128:53): CLARION in Oswald + a status
// tagline in Poppins, over a state gradient (or flat --bg-app), with a solid status badge.
type BannerState = "success" | "warning" | "critical" | "info" | "syncing" | "collectfail" | "reconnecting"
type BannerDef = { bg: string; tagline: string; badgeBg: string; badgeBorder: string; icon: typeof CheckCheck }
const BANNERS: Record<BannerState, BannerDef> = {
  success: {
    bg: "radial-gradient(120% 140% at 80% 20%, rgba(20,160,120,0.55), transparent 55%), radial-gradient(110% 130% at 8% 95%, rgba(8,54,39,0.8), transparent 60%), linear-gradient(119deg, #0C3527 0%, #14624A 55%, #0E9488 100%)",
    tagline: "You're ready for calls",
    badgeBg: "var(--status-healthy)", badgeBorder: "var(--palette-success-300)", icon: Check,
  },
  warning: {
    bg: "radial-gradient(120% 140% at 80% 20%, rgba(217,131,36,0.5), transparent 55%), radial-gradient(110% 130% at 5% 100%, rgba(60,28,6,0.8), transparent 60%), linear-gradient(119deg, #422008 0%, #9A5C17 55%, #C9791B 100%)",
    tagline: "An issue on your end needs attention",
    badgeBg: "var(--status-warning)", badgeBorder: "var(--palette-warning-300)", icon: CircleAlert,
  },
  critical: {
    bg: "radial-gradient(120% 140% at 78% 22%, rgba(221,81,59,0.5), transparent 55%), radial-gradient(110% 130% at 8% 95%, rgba(60,14,14,0.8), transparent 60%), linear-gradient(119deg, #521717 0%, #9C2B2B 52%, #DD513B 100%)",
    tagline: "Not your machine. A platform issue.",
    badgeBg: "var(--status-critical)", badgeBorder: "var(--palette-danger-300)", icon: AlertTriangle,
  },
  info: {
    bg: "linear-gradient(119deg, #2A1A4D 0%, #661AFF 100%)",
    tagline: "Currently in a call",
    badgeBg: "var(--palette-info-600)", badgeBorder: "var(--palette-info-300)", icon: PhoneCall,
  },
  syncing: {
    bg: "radial-gradient(120% 140% at 80% 20%, rgba(148,164,178,0.35), transparent 55%), linear-gradient(119deg, #2A313C 0%, #47505E 55%, #6B7688 100%)",
    tagline: "Checking your setup…",
    badgeBg: "var(--status-unknown)", badgeBorder: "var(--palette-neutral-200)", icon: ArrowLeftRight,
  },
  collectfail: {
    bg: "radial-gradient(120% 140% at 80% 20%, rgba(148,164,178,0.35), transparent 55%), linear-gradient(119deg, #2A313C 0%, #47505E 55%, #6B7688 100%)",
    tagline: "Some data couldn't be collected",
    badgeBg: "var(--status-unknown)", badgeBorder: "var(--palette-neutral-200)", icon: Info,
  },
  reconnecting: {
    bg: "radial-gradient(120% 140% at 80% 20%, rgba(148,164,178,0.35), transparent 55%), linear-gradient(119deg, #2A313C 0%, #47505E 55%, #6B7688 100%)",
    tagline: "Reconnecting…",
    badgeBg: "var(--status-unknown)", badgeBorder: "var(--palette-neutral-200)", icon: ArrowLeftRight,
  },
}

/**
 * A single window-chrome control (minimize / close) in the banner.
 * Muted neutral on the flat (E) header, white on the gradient header.
 */
function WinBtn({
  flat,
  label,
  onClick,
  children,
}: {
  flat: boolean
  label: string
  onClick?: () => void
  children: React.ReactNode
}) {
  const fg = flat ? "var(--fg-neutral-muted)" : "rgba(255,255,255,0.88)"
  const hoverBg = flat ? "var(--bg-neutral-subtle-hovered)" : "rgba(255,255,255,0.16)"
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-5 items-center justify-center rounded-md transition-colors"
      style={{ color: fg }}
      onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </button>
  )
}

/**
 * The Clarion widget (MVP) — a collapsed icon rail alongside one scrolling
 * content page. The rail icons navigate between sections (scroll-to), and a
 * scrollspy keeps the active icon in sync. There is no rail-only / collapsed
 * view — the content is always shown.
 */
export function AnchoredPanel({
  scenario = scenarios.healthy,
  focusSection,
  flatHeader = false,
  onMinimize,
  onClose,
  onSendToIt,
  height = 480,
  contentWidth = 360,
}: {
  scenario?: Scenario
  /** Section to scroll to on open (e.g. from a notification). */
  focusSection?: SectionId
  /** Flat header on --bg-app (no gradient) with dark text — the shipping look. */
  flatHeader?: boolean
  /** Minimize (_) — sends the widget to the Windows taskbar (hybrid-app model). */
  onMinimize?: () => void
  /** Close (×) — closes the UI back to the system tray; services keep running. */
  onClose?: () => void
  /** Platform alert "Send to IT" — opens the email compose flow in the demo harness. */
  onSendToIt?: () => void
  /** Widget height in logical px (demo size control). */
  height?: number
  /** Content column width in logical px; total widget width = 64px rail + this (demo size control). */
  contentWidth?: number
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const refs = useRef<Partial<Record<SectionId, HTMLDivElement | null>>>({})
  const rafScroll = useRef(0)
  const [active, setActive] = useState<SectionId>(focusSection ?? "devices")

  // Per-section status for the rail dots + hover detail.
  const sectionStatus: Partial<Record<PageId, { status: Status; detail: string }>> = {}
  for (const s of SECTIONS) {
    const comps = componentsInSection(s, scenario)
    const worst = [...comps].sort((a, b) => SEV[b.status] - SEV[a.status])[0]
    sectionStatus[s] = { status: worstStatus(comps.map((c) => c.status)), detail: worst?.detail ?? "" }
  }

  // Banner reflects the overall experience.
  const platformDegraded = scenario.components.platform.status !== "healthy"
  const bannerState: BannerState =
    scenario.connection === "reconnecting" ? "reconnecting"
      : scenario.overallStatus === "syncing" ? "syncing"
        : scenario.overallStatus === "unknown" ? "collectfail"
          : scenario.overallStatus === "healthy" ? "success"
            : platformDegraded ? "critical" : "warning"
  const banner = BANNERS[bannerState]
  const BadgeIcon = banner.icon

  const setRef = (s: SectionId) => (el: HTMLDivElement | null) => { refs.current[s] = el }

  // Eased scroll between sections (easeOutCubic).
  const scrollTo = (s: SectionId, smooth = true) => {
    const el = refs.current[s]
    const c = scrollRef.current
    if (!el || !c) return
    const target = el.offsetTop - 8
    if (!smooth) { cancelAnimationFrame(rafScroll.current); c.scrollTop = target; return }
    cancelAnimationFrame(rafScroll.current)
    const start = c.scrollTop
    const dist = target - start
    if (Math.abs(dist) < 1) return
    const t0 = performance.now()
    const dur = 420
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      c.scrollTop = start + dist * ease(p)
      if (p < 1) rafScroll.current = requestAnimationFrame(step)
    }
    rafScroll.current = requestAnimationFrame(step)
  }

  // Rail icons navigate between sections (no collapse-to-rail).
  const onIcon = (id: PageId) => {
    const s = id as SectionId
    setActive(s)
    scrollTo(s)
  }

  // Scrollspy — active icon = the last section whose top has passed the fold.
  useEffect(() => {
    const c = scrollRef.current
    if (!c) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const top = c.scrollTop + 24
        let cur: SectionId = SECTIONS[0]
        for (const s of SECTIONS) {
          const el = refs.current[s]
          if (el && el.offsetTop <= top) cur = s
        }
        setActive(cur)
      })
    }
    c.addEventListener("scroll", onScroll, { passive: true })
    return () => { c.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf) }
  }, [])

  // Opened to a specific section (e.g. from a notification) — jump there.
  useEffect(() => {
    if (!focusSection) return
    setActive(focusSection)
    scrollTo(focusSection, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSection])

  // Cancel any in-flight scroll tween on unmount.
  useEffect(() => () => cancelAnimationFrame(rafScroll.current), [])

  return (
    <div
      className="flex items-stretch overflow-hidden"
      style={{
        height,
        background: "var(--bg-card)",
        border: "1px solid var(--border-neutral-muted)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-xl)",
      }}
    >
      <Sidebar
        active={active}
        onNavigate={onIcon}
        collapsed
        onToggleCollapsed={() => {}}
        showDevNav={false}
        hideCollapseToggle
        hideOverview
        sectionStatus={sectionStatus}
        neutral
        logoStatus={flatHeader ? (scenario.connection === "reconnecting" ? "syncing" : scenario.overallStatus) : undefined}
      />
      <div className="flex h-full flex-col" style={{ width: contentWidth, borderLeft: "1px solid var(--border-neutral-muted)" }}>
        {/* State banner — CLARION (Oswald) + tagline; status badge + window controls on the right. */}
        <div
          className="relative flex h-[88px] shrink-0 items-center justify-between gap-3 overflow-hidden px-4"
          style={{
            background: flatHeader ? "var(--bg-app)" : banner.bg,
            borderBottom: flatHeader ? "1px solid var(--border-neutral-muted)" : undefined,
          }}
        >
          <span className="flex min-w-px flex-col gap-1">
            <span
              className="uppercase leading-none"
              style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 500, fontSize: 20, letterSpacing: "0", color: flatHeader ? "var(--fg-neutral-emphasis)" : "#fff" }}
            >
              Clarion
            </span>
            <span
              className="text-[14px] font-medium leading-tight"
              style={{ color: flatHeader ? "var(--fg-neutral-muted)" : "#fff" }}
            >
              {banner.tagline}
            </span>
          </span>
          {/* Status badge — vertically centred, in line with the CLARION title (DS 1128:53). */}
          <span
            className="mr-10 flex size-9 shrink-0 items-center justify-center rounded-full text-white"
            style={{ background: banner.badgeBg, border: `1px solid ${banner.badgeBorder}` }}
          >
            <BadgeIcon className="size-4" />
          </span>
          {/* Window controls — minimise / close in the top-right corner, above the badge. */}
          <div className="absolute right-2.5 top-2 flex items-center gap-0.5">
            <WinBtn flat={flatHeader} label="Minimize to taskbar" onClick={onMinimize}><Minus className="size-3.5" /></WinBtn>
            <WinBtn flat={flatHeader} label="Close to tray (keeps running)" onClick={onClose}><X className="size-3.5" /></WinBtn>
          </div>
        </div>

        {/* One scrolling list of all sections. */}
        <div ref={scrollRef} className="relative min-h-px flex-1 overflow-y-auto">
          {scenario.connection === "reconnecting" && scenario.staleAsOf && (
            <div style={{ padding: "12px 24px 0" }}>
              <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--bg-neutral-subtle)", border: "1px solid var(--border-neutral-muted)" }}>
                <Clock className="size-3.5 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} />
                <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>Last updated {scenario.staleAsOf}</span>
              </div>
            </div>
          )}
          <div ref={setRef("devices")}><SectionPage section="devices" scenario={scenario} heading={pageLabel("devices")} hideBlurb dense /></div>
          <div ref={setRef("network")}><SectionPage section="network" scenario={scenario} heading={pageLabel("network")} hideBlurb dense /></div>
          <div ref={setRef("system")}><SectionPage section="system" scenario={scenario} heading={pageLabel("system")} hideBlurb dense /></div>
          <div ref={setRef("platform")}><PlatformPage scenario={scenario} stacked heading={pageLabel("platform")} onSendToIt={onSendToIt} dense /></div>
          {/* Footer attached directly beneath the last section. */}
          <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 14, borderTop: "1px solid var(--border-neutral-subtle)" }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--fg-neutral-muted)" }}>Clarion · Version 1</span>
              <span style={{ fontSize: 11, color: "var(--fg-neutral-subtle)" }}>© 2026 Integrated Research Ltd.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
