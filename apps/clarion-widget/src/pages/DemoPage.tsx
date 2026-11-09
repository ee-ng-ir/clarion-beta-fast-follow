import { useEffect, useRef, useState } from "react"
import {
  LayoutGrid,
  Search,
  Phone,
  Mail,
  Users,
  Globe,
  Wifi,
  Volume2,
  ArrowDownRight,
  X,
  Check,
  Paperclip,
  Send,
  Monitor,
  ChevronDown,
} from "lucide-react"
import { AppShell } from "@/components/app/AppShell"
import { ClarionMark } from "@/components/widget/ClarionMark"
import { StatusBadge } from "@/components/widget/StatusBadge"
import { Button } from "@/components/ui/button"
import { scenarios, componentOrder, type ScenarioId, type SectionId, type Status } from "@/data/widget"
import { agentById, agents, endpointView, feed, useFeed, type AgentReading, type ComponentId as FeedComponent } from "@ir/telemetry"
// Fast Follow: approved headsets
import { agentHeadsets, complianceOf, headsetById, HEADSET_CATALOGUE, useAgentHeadsets, useApprovedHeadsets } from "@ir/telemetry"
import { WidgetAgent } from "@/lib/agent"

// Where the Clarion dashboard is. Empty = same origin (the widget is served
// under Clarion at /widget), which is what makes the shared feed work.
const CLARION_URL = (import.meta.env.VITE_CLARION_URL ?? "").replace(/\/$/, "")

/** What this widget tells Clarion for a scenario. */
function readingFor(id: ScenarioId): AgentReading {
  const s = scenarios[id]
  const components = Object.fromEntries(componentOrder.map((c) => [c, s.components[c].status])) as Record<FeedComponent, AgentReading["components"]["wifi"]>
  return {
    scenarioId: id, scenarioLabel: s.label, components, at: Date.now(),
    reconnecting: s.connection === "reconnecting" && !s.trayOnly,
    notReporting: id === "reconnectCold" ? "cold" : id === "verifying" ? "verifying" : id === "notVerified" ? "notLicensed" : undefined,
  }
}

const dotColor: Record<string, string> = {
  healthy: "var(--status-healthy)", warning: "var(--status-warning)", critical: "var(--status-critical)", offline: "var(--status-unknown)",
}

const trayColor: Record<Status, string> = {
  healthy: "var(--status-healthy)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
  syncing: "var(--status-unknown)",
  unknown: "var(--status-unknown)",
}


/** Clarion brand mark gradient — new Brand logo (Figma 1386:73651): cyan → purple, no red stop. */
const CLARION_GRADIENT = "linear-gradient(135deg, #3CC9F3 0%, #852CAA 100%)"

// Mock call participants — photos live in public/call/.
const CALL_PEOPLE = [
  { img: `${import.meta.env.BASE_URL}call/swathi.png`, n: "Jess (You)" },
  { img: `${import.meta.env.BASE_URL}call/priya.png`, n: "Priya M." },
  { img: `${import.meta.env.BASE_URL}call/james.png`, n: "James D." },
  { img: `${import.meta.env.BASE_URL}call/alex.png`, n: "Alex L." },
]

// Send-to-IT email — sample/generic values for the prototype.
const IT_SUPPORT_EMAIL = "support@acme.com"
const WIDGET_VERSION = "1.0.0"
const ALERT_TIMESTAMP = "3 August 2026, 2:47 PM"
const ALERT_TZ = "AEST"

// The desktop is drawn at a fixed "screen" size and scaled to fit, so the
// widget always stays the same proportion of the desktop (tray-sized),
// regardless of the browser window.
// The virtual desktop the widget sits on. Larger than the widget by a realistic
// margin, so the tray widget reads as a small overlay (not a giant panel) — the
// whole scene scales to fit the available area.

/** Simulate-issue triggers, grouped, each with a WHEN / WHAT explainer. */
type Trigger = { id: ScenarioId; label: string; when: string; what: string }
const triggerGroups: { label: string; items: Trigger[] }[] = [
  {
    label: "Ready",
    items: [
      { id: "healthy", label: "All healthy", when: "Your devices, network and platform are all reporting normally.", what: "You're ready for calls; Clarion monitors quietly in the background." },
    ],
  },
  {
    label: "Licence · startup",
    items: [
      { id: "verifying", label: "Verifying licence", when: "Clarion is starting and checking that you're licensed to use it.", what: "The window stays closed until verification passes; on hover the tray reads “Verifying license…”." },
      { id: "notVerified", label: "Not licensed", when: "Your account isn't licensed for Clarion.", what: "The window won't open — the tray logo greys out and the hover reads “Not licensed”. Contact your IT team." },
    ],
  },
  {
    label: "Issues · device / network / platform",
    items: [
      { id: "device", label: "Headset", when: "A headset, mic or camera disconnects or degrades mid-session.", what: "The affected device turns red or amber with a plain-language reason — here, the headphones dropped and audio fell back to speakers." },
      { id: "network", label: "Wi-Fi", when: "Your connection weakens — low signal, high latency or packet loss.", what: "The network tile turns amber and warns that call audio may be affected." },
      { id: "platform", label: "Platform", when: "The calling platform (e.g. Genesys Cloud) has an outage.", what: "The platform tile turns red and the banner makes clear it's not your machine — a platform issue." },
      { id: "multi", label: "Multiple", when: "Several problems happen at once across devices, network and system.", what: "The widget surfaces the most call-blocking issue first, then lists the rest." },
    ],
  },
  {
    label: "Fast Follow · smarter alerts",
    items: [
      { id: "busy", label: "Computer busy", when: "Sam's laptop is unplugged and Windows energy saver is on. His CPU climbs to 91%.", what: "The usual “Your computer is busy” card, plus one line naming the likely cause: energy saver. Cause only, no steps. In Clarion the alert's evidence says energy saver was on; energy saver is never an alert of its own." },
      { id: "hovering", label: "Wi-Fi hovering", when: "The agent sits at the edge of the office Wi-Fi. The signal hovers around the 50% warning line all morning.", what: "Nothing changes, and that's the point. Alert stability (Balanced, IR's default) waits 3 minutes before raising and needs a 5-point recovery before clearing, so the flicker never becomes an alert, here or in Clarion. Without it, this morning would be 14 alerts." },
    ],
  },
  {
    label: "Clarion states · data & connection",
    items: [
      { id: "syncing", label: "Waiting for data", when: "Clarion has just started and telemetry hasn't arrived yet.", what: "The widget opens, but each tile shows a loading skeleton until its reading lands." },
      { id: "collectFail", label: "Data collection failed", when: "Clarion tried to read a signal but couldn't collect it.", what: "That tile drops to unknown, the banner says “Some data couldn't be collected”, and it keeps retrying." },
      { id: "reconnecting", label: "Reconnecting", when: "The widget was running and lost its connection to the Clarion backend.", what: "Your last-known readings stay on screen with a “last updated…” timestamp while it reconnects — status may be out of date." },
      { id: "reconnectCold", label: "Reconnecting · cold", when: "The widget hadn't started yet and can't reach the backend.", what: "There's no data to show, so the window won't open — just the tray icon (unknown) and a “Reconnecting…” tooltip." },
    ],
  },
]
const allTriggers: Trigger[] = triggerGroups.flatMap((g) => g.items)

/**
 * Internal preview of the live end-user experience. The shell *is* the widget,
 * so opening the tray renders the same <AppShell> the product ships — here
 * driven by a scenario so we can simulate breaches. Default stays healthy;
 * triggering an error recolours the tray, fires a toast, and (if open) updates
 * the shell live.
 */
export function DemoPage({ version = "A" }: { version?: "A" | "B" | "C" | "D" | "E" }) {
  // Several agents, one widget each. The picker chooses whose machine this is;
  // every agent's scenario lives in the shared feed, so Clarion sees them all.
  const [agentId, setAgentId] = useState(agents[0].id)
  const agent = agentById(agentId)!
  const feedState = useFeed()
  const scenarioId = ((feedState[agentId]?.scenarioId as ScenarioId | undefined) ?? "healthy")
  const setScenarioId = (id: ScenarioId) => feed.publish(agentId, readingFor(id))
  const EMAIL_SENDER = { name: agent.name, email: agent.email, login: agent.loginId.split("\\").pop()! }
  const MACHINE_NAME = agent.machine
  const [open, setOpen] = useState(false)
  // Minimised to the taskbar — hidden, but the taskbar button stays.
  const [minimized, setMinimized] = useState(false)
  // Send-to-IT email compose window (prototype of the email application).
  const [emailOpen, setEmailOpen] = useState(false)
  // Widget uses the default size; the demo simulates screen resolution + scaling.
  const widgetHeight = 480
  const widgetWidth = 424 // total width (64px rail + content)
  // Simulated Windows display scaling (DPI). At 150% a logical-sized widget renders
  // 1.5x bigger, so it covers proportionally more of a fixed-resolution screen.
  const [dpiScale, setDpiScale] = useState(1)
  // Simulated screen resolution (the mock desktop renders at this size).
  const [screenW, setScreenW] = useState(1920)
  const [screenH, setScreenH] = useState(1080)
  // The section to open the widget scrolled to (when opened from a section link).
  const [openSection, setOpenSection] = useState<SectionId | null>(null)
  const [exited, setExited] = useState(false)
  // Demo-only "Simulate display" panel — collapsed to a corner chip by default.
  const [displayOpen, setDisplayOpen] = useState(false)

  const scenario = scenarios[scenarioId]
  const overall = scenario.overallStatus
  // Reconnecting overlays the grey sync (unknown) badge on top of last-known data.
  const displayStatus: Status = scenario.connection === "reconnecting" ? "syncing" : overall
  // Tray-only scenarios (cold reconnect, verifying, not verified) don't open the panel.
  const trayOnly = !!scenario.trayOnly
  // Not licensed — the tray logo greys out (disabled), no readiness badge.
  const notLicensed = scenario.id === "notVerified"
  // Count of active alerts (degraded signals) — drives the tray count badge.
  const alertCount = Object.values(scenario.components).filter((c) => c.status === "warning" || c.status === "critical").length
  // Tray tooltip — a single "Clarion — {tipMsg}" line.
  const tipMsg =
    scenario.id === "verifying" ? "Verifying license…"
      : scenario.id === "notVerified" ? "Not licensed"
        : scenario.id === "syncing" ? "Waiting for data…"
          : scenario.id === "collectFail" ? "Some data couldn't be collected"
            : scenario.connection === "reconnecting" ? "Reconnecting…"
              : overall === "healthy" ? "You're ready for calls"
                : scenario.banner.main

  // Tray-only scenarios (cold reconnect, verifying, not verified) can't be
  // opened — close the panel if we switch into one.
  useEffect(() => {
    if (scenario.trayOnly) { setOpen(false); setMinimized(false) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId])

  // Window transitions (MVP: single full-panel view — pinning and the collapsed
  // rail view are out of scope). A taskbar button is present while open or minimised.
  const hasTaskbarIcon = open || minimized
  const toTray = () => { setOpen(false); setMinimized(false) }
  const toTaskbar = () => { setOpen(false); setMinimized(true) }
  const openWidget = (section: SectionId | null = null) => { setExited(false); setMinimized(false); setOpenSection(section); setOpen(true) }

  // Send-to-IT email, composed from the current platform issue. Attaches a
  // diagnostics log built from every component reading + a recent platform trend.
  const platFix = scenario.fixes.platform
  const emailReason = platFix?.title ?? scenario.banner.main
  const emailAttachment = "clarion-diagnostics-20260803-1447.log"
  const emailSubject = `Clarion alert: ${emailReason} – ${MACHINE_NAME} (${EMAIL_SENDER.name})`
  const emailBody = [
    "Hi IT team,",
    "",
    "Clarion detected an issue on this machine and here are the details.",
    "",
    `  What happened:  ${platFix?.description ?? emailReason}`,
    `  When:           ${ALERT_TIMESTAMP} ${ALERT_TZ}`,
    "",
    "Endpoint",
    `  User:            ${EMAIL_SENDER.name} (${EMAIL_SENDER.login})`,
    `  Machine:         ${MACHINE_NAME}`,
    `  Clarion version: ${WIDGET_VERSION}`,
    "",
    `A diagnostic log with the full readings and the recent trend is attached (${emailAttachment}).`,
    "",
    "This report was generated automatically by Clarion. Reply to this email if you need anything further from me.",
  ].join("\n")
  const emailLog = [
    `Clarion diagnostics — ${ALERT_TIMESTAMP} ${ALERT_TZ}`,
    `Machine: ${MACHINE_NAME}   User: ${EMAIL_SENDER.name} (${EMAIL_SENDER.email})   Widget: ${WIDGET_VERSION}`,
    "",
    "Readings",
    ...componentOrder.map((id) => {
      const c = scenario.components[id]
      return `  ${(c.name + ":").padEnd(26)}[${c.status}] ${c.detail}`
    }),
    "",
    "Recent trend — Platform (Genesys Cloud)",
    "  14:41  reachable       · HTTP 200",
    "  14:44  intermittent    · HTTP 503",
    "  14:47  unreachable     · HTTP 503",
  ].join("\n")

  // Scale the fixed-size desktop to fit the available area (contain).
  const screenRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  // Click-away to minimise (system-tray behaviour). Clicking the desktop closes
  // the widget; the tray shield and the demo trigger panel are excluded.
  const widgetRef = useRef<HTMLDivElement>(null)
  const trayRef = useRef<HTMLButtonElement>(null)
  const triggersRef = useRef<HTMLDivElement>(null)
  const taskbarRef = useRef<HTMLSpanElement>(null)
  const onDesktopMouseDown = (e: React.MouseEvent) => {
    if (!open) return
    const t = e.target as Node
    // The widget, tray shield, demo triggers, and the Clarion taskbar button all
    // manage their own open/minimise state — don't let click-away pre-empt them.
    if (
      widgetRef.current?.contains(t) ||
      trayRef.current?.contains(t) ||
      triggersRef.current?.contains(t) ||
      taskbarRef.current?.contains(t)
    )
      return
    // Click-away returns the widget to the tray.
    toTray()
  }
  useEffect(() => {
    const el = screenRef.current
    if (!el) return
    const update = () => {
      const { width, height } = el.getBoundingClientRect()
      setScale(Math.min(width / screenW, height / screenH))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [screenW, screenH])

  // Height ceiling — the widget is capped at 60% of the work area (screen minus the
  // ~48px taskbar), up to the design max, so it stays lightweight even on small screens
  // at high scaling. Anything above the ceiling is clamped and the content scrolls.
  const heightCeiling = Math.floor(0.6 * (screenH / dpiScale - 48))
  const renderedHeight = Math.min(widgetHeight, heightCeiling)
  const heightClamped = renderedHeight < widgetHeight

  // Background call window — 50% of the screen width, kept at a 3:2 proportion.
  const callWidth = Math.round(screenW * 0.5)
  const callHeight = Math.round((callWidth * 2) / 3)

  return (
    <WidgetAgent.Provider value={agentId}>
    <div
      ref={screenRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{ background: "var(--bg-canvas)" }}
    >
      <div
        onMouseDown={onDesktopMouseDown}
        className="relative shrink-0 overflow-hidden"
        style={{
          width: screenW,
          height: screenH,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          background:
            "radial-gradient(circle at 18% 22%, var(--bg-primary-subtle), transparent 45%), radial-gradient(circle at 82% 78%, var(--bg-selected-subtle-hovered), transparent 50%), var(--bg-canvas)",
        }}
      >
      {/* Background app — a call in progress. Scales with the simulated DPI, like every window does. */}
      <div
        className="absolute left-10 top-10 flex flex-col overflow-hidden rounded-xl"
        style={{ width: callWidth, height: callHeight, transform: `scale(${dpiScale})`, transformOrigin: "top left", background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)", boxShadow: "var(--shadow-lg)" }}
      >
        <div className="flex h-10 items-center gap-2 px-3.5" style={{ background: "var(--bg-neutral-subtle)", borderBottom: "1px solid var(--border-neutral-subtle)" }}>
          <span className="size-2.5 rounded-full" style={{ background: "var(--status-critical)" }} />
          <span className="size-2.5 rounded-full" style={{ background: "var(--status-warning)" }} />
          <span className="size-2.5 rounded-full" style={{ background: "var(--status-healthy)" }} />
          <span className="ml-2 text-xs" style={{ color: "var(--fg-neutral-muted)" }}>Customer support call · Acme Corp</span>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 p-2.5">
          {CALL_PEOPLE.map((t) => (
            <div key={t.n} className="relative overflow-hidden rounded-lg" style={{ background: "var(--bg-neutral-subtle)", border: "1px solid var(--border-neutral-subtle)" }}>
              <img src={t.img} alt={t.n} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "center 30%" }} />
              <span className="absolute bottom-1.5 left-2 rounded px-1.5 py-0.5 text-[11px] font-medium" style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}>{t.n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Demo control: simulate issue — grouped tab header + WHEN/WHAT explainer body */}
      <div
        ref={triggersRef}
        className="absolute right-4 top-4 flex w-[320px] flex-col rounded-xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)", boxShadow: "var(--shadow-md)" }}
      >
        {/* Header — grouped tab navigation */}
        <div className="flex flex-col gap-2.5 p-3" style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
          <span className="text-[11px] font-semibold uppercase" style={{ color: "var(--fg-neutral-subtle)", letterSpacing: "0.06em" }}>Agent</span>
          <div className="flex flex-wrap gap-1.5">
            {agents.map((a) => {
              const r = feedState[a.id]
              const st = r ? endpointView(r).status : "healthy"
              const active = a.id === agentId
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => { setAgentId(a.id); setExited(false) }}
                  title={`${a.name} · ${a.locationName} · ${a.machine}`}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors"
                  style={active
                    ? { background: "var(--fg-neutral-emphasis)", color: "var(--bg-card)" }
                    : { background: "var(--bg-card)", color: "var(--fg-neutral-muted)", border: "1px solid var(--border-neutral-muted)" }}
                >
                  <span className="size-2 rounded-full" style={{ background: dotColor[st] }} />
                  {a.name.split(" ")[0]} <span style={{ opacity: 0.7 }}>· {a.locationName}</span>
                </button>
              )
            })}
          </div>
          {/* Fast Follow: change this agent's headset to show each approved-headset state */}
          <span className="text-[11px] font-semibold uppercase" style={{ color: "var(--fg-neutral-subtle)", letterSpacing: "0.06em" }}>Headset</span>
          <HeadsetPicker agentId={agentId} defaultModel={agent.headset} />
          <span className="text-[11px] font-semibold uppercase" style={{ color: "var(--fg-neutral-subtle)", letterSpacing: "0.06em" }}>Simulate issue</span>
          {triggerGroups.map((g) => (
            <div key={g.label} className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase" style={{ color: "var(--fg-neutral-subtle)", letterSpacing: "0.07em" }}>{g.label}</span>
              <div className="flex flex-wrap gap-1.5">
                {g.items.map((t) => {
                  const active = t.id === scenarioId
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { setExited(false); setScenarioId(t.id) }}
                      className="rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors"
                      style={active
                        ? { background: "var(--fg-neutral-emphasis)", color: "var(--bg-card)" }
                        : { background: "var(--bg-card)", color: "var(--fg-neutral-muted)", border: "1px solid var(--border-neutral-muted)" }}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        {/* Body — WHEN / WHAT explainer for the active scenario */}
        <div className="flex flex-col gap-3 p-3">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase" style={{ color: "var(--fg-neutral-subtle)", letterSpacing: "0.07em" }}>
              <span className="size-1.5 rounded-full" style={{ background: "var(--fg-neutral-subtle)" }} />When
            </span>
            <span className="text-[13px] leading-snug" style={{ color: "var(--fg-neutral-muted)" }}>{allTriggers.find((t) => t.id === scenarioId)?.when}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase" style={{ color: "var(--fg-neutral-subtle)", letterSpacing: "0.07em" }}>
              <span className="size-1.5 rounded-full" style={{ background: trayColor[displayStatus] }} />What's happening
            </span>
            <span className="text-[13px] leading-snug" style={{ color: "var(--fg-neutral-muted)" }}>{allTriggers.find((t) => t.id === scenarioId)?.what}</span>
          </div>
          <div className="flex flex-col gap-1 pt-2" style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}>
            <span className="text-[12px] leading-snug" style={{ color: "var(--fg-neutral-muted)" }}>
              {agent.name} · {agent.machine} · {agent.locationName}. Clarion shows this machine as{" "}
              <strong style={{ color: "var(--fg-neutral-emphasis)", fontWeight: 600 }}>{feedState[agentId] ? endpointView(feedState[agentId]).status : "healthy"}</strong>.
            </span>
            <div className="flex items-center justify-between">
              <a className="text-[12px] font-medium hover:underline" style={{ color: "var(--fg-link-default, var(--fg-primary-emphasis))" }}
                href={`${CLARION_URL}/endpoints?device=${agent.endpointId}`} target="clarion-dashboard" rel="noreferrer">Open in Clarion ↗</a>
              <button type="button" className="text-[12px] hover:underline" style={{ color: "var(--fg-neutral-muted)" }} onClick={() => feed.reset()}>Reset all agents</button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo size control — toggled from the taskbar Monitor icon; hidden otherwise */}
      {displayOpen && (
      <div onMouseDown={(e) => e.stopPropagation()} className="absolute" style={{ left: 24, bottom: 64 }}>
      <div className="flex w-[300px] flex-col gap-2.5 rounded-xl p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)", boxShadow: "var(--shadow-md)" }}>
        <button type="button" onClick={() => setDisplayOpen(false)} className="-m-1 flex items-center justify-between rounded-md p-1 transition-colors">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase" style={{ color: "var(--fg-neutral-subtle)", letterSpacing: "0.06em" }}>
            <Monitor className="size-3.5" style={{ color: "var(--fg-neutral-muted)" }} /> Simulate display
          </span>
          <ChevronDown className="size-4" style={{ color: "var(--fg-neutral-muted)" }} />
        </button>

        <div className="flex flex-col gap-1">
          <span className="text-[11px]" style={{ color: "var(--fg-neutral-muted)" }}>Screen resolution</span>
          <div className="flex flex-wrap gap-1.5">
            {([[1366, 768], [1920, 1080], [2560, 1440], [3840, 2160]] as [number, number][]).map(([w, h]) => {
              const active = screenW === w && screenH === h
              return (
                <button key={`${w}x${h}`} type="button" onClick={() => { setScreenW(w); setScreenH(h) }} className="rounded-md px-2 py-1 text-[11px] font-medium transition-colors" style={active ? { background: "var(--fg-neutral-emphasis)", color: "var(--bg-card)" } : { background: "var(--bg-card)", color: "var(--fg-neutral-muted)", border: "1px solid var(--border-neutral-muted)" }}>{w}×{h}</button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px]" style={{ color: "var(--fg-neutral-muted)" }}>Scaling</span>
          <div className="flex flex-wrap gap-1.5">
            {[1, 1.25, 1.5, 1.75, 2].map((s) => {
              const active = dpiScale === s
              return (
                <button key={s} type="button" onClick={() => setDpiScale(s)} className="rounded-md px-2 py-1 text-[11px] font-medium transition-colors" style={active ? { background: "var(--fg-neutral-emphasis)", color: "var(--bg-card)" } : { background: "var(--bg-card)", color: "var(--fg-neutral-muted)", border: "1px solid var(--border-neutral-muted)" }}>{Math.round(s * 100)}%</button>
              )
            })}
          </div>
        </div>

        <span className="text-[11px]" style={{ color: "var(--fg-neutral-muted)" }}>Widget · {widgetWidth} × {widgetHeight} (default)</span>
        {(() => {
          const wPct = Math.round((widgetWidth * dpiScale / screenW) * 100)
          const hPct = Math.round((renderedHeight * dpiScale / screenH) * 100)
          return (
            <div className="flex flex-col gap-0.5 rounded-lg p-2 text-[11px]" style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}>
              <div className="flex justify-between">
                <span>Covers</span>
                <span className="font-semibold tabular-nums" style={{ color: hPct >= 62 ? "var(--fg-warning-emphasis)" : "var(--fg-neutral-emphasis)" }}>{wPct}% × {hPct}% of screen</span>
              </div>
              <div className="flex justify-between tabular-nums">
                <span>Rendered height</span>
                <span style={heightClamped ? { color: "var(--fg-warning-emphasis)" } : undefined}>{renderedHeight}px{heightClamped ? " (clamped)" : ""}</span>
              </div>
              <div className="flex justify-between tabular-nums">
                <span>Effective desktop</span>
                <span>{Math.round(screenW / dpiScale)} × {Math.round(screenH / dpiScale)} logical</span>
              </div>
              {heightClamped && <span style={{ color: "var(--fg-neutral-subtle)" }}>Capped at 60% of the work area — content scrolls.</span>}
            </div>
          )
        })()}
      </div>
      </div>
      )}

      {/* Hint to open the tray app — only when fully at rest in the tray */}
      {!open && !minimized && !exited && (
        <div
          className="absolute flex items-center gap-2 rounded-full px-3.5 py-2"
          style={{ right: 16, bottom: 64, background: "var(--bg-neutral-emphasis)", color: "var(--fg-on-neutral-emphasis)", boxShadow: "var(--shadow-md)" }}
        >
          <span className="text-xs font-medium">Open Clarion from the tray</span>
          <ArrowDownRight className="size-4" />
        </div>
      )}

      {/* Version A — the full sidebar app, docked as a tray window */}
      {open && version === "A" && (
        <div
          ref={widgetRef}
          className="absolute overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
          style={{
            right: 16,
            bottom: 60,
            width: "min(520px, calc(100% - 32px))",
            height: "min(560px, calc(100% - 88px))",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border-neutral-muted)",
            boxShadow: "var(--shadow-xl)",
          }}
        >
          <AppShell showDevNav={false} scenarioId={scenarioId} onClose={() => setOpen(false)} initialPage={openSection} />
        </div>
      )}

      {/* Version B — one scrolling panel, no rail; opens straight to the full list */}
      {open && version === "B" && (
        <div ref={widgetRef} className="absolute animate-in fade-in slide-in-from-bottom-4 duration-200" style={{ right: 16, bottom: 60 }}>
          <AppShell showDevNav={false} scenarioId={scenarioId} onClose={() => setOpen(false)} singlePage initialPage={openSection} />
        </div>
      )}

      {/* Version C — same anchored one-page content + neutral rail as D (distinct tray icon) */}
      {open && version === "C" && (
        <div ref={widgetRef} className="absolute animate-in fade-in slide-in-from-bottom-4 duration-200" style={{ right: 16, bottom: 60 }}>
          <AppShell showDevNav={false} scenarioId={scenarioId} onClose={() => { setOpen(false); setMinimized(false) }} onMinimize={() => { setOpen(false); setMinimized(true) }} anchored initialPage={openSection} />
        </div>
      )}

      {/* Version E — the shipping widget (MVP): flat header, single full-panel view,
          rail nav between sections, hybrid tray + taskbar window model. */}
      {open && version === "E" && (
        <div ref={widgetRef} className="absolute animate-in fade-in slide-in-from-bottom-4 duration-200" style={{ right: 16, bottom: 60 }}>
          {/* Simulated DPI scaling — the whole widget renders larger, like Windows scaling. */}
          <div style={{ transform: `scale(${dpiScale})`, transformOrigin: "bottom right" }}>
            <AppShell
              showDevNav={false}
              scenarioId={scenarioId}
              onClose={toTray}
              onMinimize={toTaskbar}
              onSendToIt={() => setEmailOpen(true)}
              anchored
              flatHeader
              initialPage={openSection}
              widgetHeight={renderedHeight}
              widgetContentWidth={widgetWidth - 64}
            />
          </div>
        </div>
      )}

      {/* Version D — sidebar anchors + one scrolling page (scrollspy).
          Uses a mount-aware wrapper so it slides up from the tray on open and
          slides back down on close (the exit animation needs the node to stay
          mounted for the duration). */}
      <TrayPopover open={open && version === "D"} innerRef={widgetRef} style={{ right: 16, bottom: 60 }}>
        <AppShell showDevNav={false} scenarioId={scenarioId} onClose={() => { setOpen(false); setMinimized(false) }} onMinimize={() => { setOpen(false); setMinimized(true) }} anchored initialPage={openSection} />
      </TrayPopover>

      {/* Send-to-IT email compose window (prototype of the email application) */}
      {emailOpen && (
        <EmailWindow
          from={`${EMAIL_SENDER.name} <${EMAIL_SENDER.email}>`}
          to={IT_SUPPORT_EMAIL}
          subject={emailSubject}
          body={emailBody}
          attachment={emailAttachment}
          log={emailLog}
          onClose={() => setEmailOpen(false)}
        />
      )}

      {/* Taskbar */}
      <div
        className="absolute inset-x-0 bottom-0 flex h-12 items-center gap-1 px-3"
        style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border-neutral-muted)" }}
      >
        <TaskbarButton label="Start"><LayoutGrid className="size-4" /></TaskbarButton>
        <div className="mx-1 flex items-center gap-1">
          <TaskbarButton label="Search"><Search className="size-4" /></TaskbarButton>
          <TaskbarButton label="Genesys Cloud" active><Phone className="size-4" /></TaskbarButton>
          <TaskbarButton label="Outlook"><Mail className="size-4" /></TaskbarButton>
          <TaskbarButton label="Teams"><Users className="size-4" /></TaskbarButton>
          <TaskbarButton label="Browser"><Globe className="size-4" /></TaskbarButton>
          {/* Hybrid: taskbar button present while the widget is open or minimised. Toggles minimise / restore. */}
          {hasTaskbarIcon && !exited && (
            <span ref={taskbarRef} className="flex">
              <TaskbarButton
                label="Clarion"
                active={open}
                onClick={() => { if (open) toTaskbar(); else openWidget() }}
              >
                <span className="flex size-6 items-center justify-center rounded-md" style={{ background: CLARION_GRADIENT }}>
                  <ClarionMark className="size-4" style={{ color: "var(--palette-white)" }} />
                </span>
              </TaskbarButton>
            </span>
          )}
        </div>

        {/* System tray */}
        <div className="ml-auto flex items-center gap-1.5 pl-2">
          {/* Demo control — expands the "Simulate display" panel */}
          <button
            type="button"
            aria-label="Simulate display"
            title="Simulate display"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setDisplayOpen((v) => !v)}
            className="flex size-8 items-center justify-center rounded-md transition-colors"
            style={{ background: displayOpen ? "var(--bg-neutral-subtle-pressed)" : "transparent", color: "var(--fg-neutral-muted)" }}
            onMouseEnter={(e) => { if (!displayOpen) e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)" }}
            onMouseLeave={(e) => { if (!displayOpen) e.currentTarget.style.background = "transparent" }}
          >
            <Monitor className="size-4" />
          </button>
          <TrayIcon label="Network"><Wifi className="size-4" /></TrayIcon>
          <TrayIcon label="Volume"><Volume2 className="size-4" /></TrayIcon>

          {/* Clarion tray shield — disappears once Clarion is quit; a relaunch chip replaces it */}
          {exited ? (
            <button
              type="button"
              onClick={() => setExited(false)}
              title="Relaunch Clarion"
              className="flex items-center rounded-md px-2 py-1 text-[11px] transition-colors"
              style={{ color: "var(--fg-neutral-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Relaunch Clarion
            </button>
          ) : (
          <button
            ref={trayRef}
            type="button"
            title={`Clarion — ${tipMsg}`}
            aria-label={`Clarion — ${tipMsg}`}
            onClick={() => { if (trayOnly) return; if (open) toTray(); else openWidget() }}
            className="relative flex size-8 items-center justify-center rounded-md transition-colors"
            style={{ background: open ? "var(--bg-neutral-subtle-pressed)" : "transparent" }}
            onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)" }}
            onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent" }}
          >
            {version === "C" || version === "E" ? (
              <span className="flex size-6 items-center justify-center rounded-md" style={{ background: CLARION_GRADIENT, filter: notLicensed ? "grayscale(1)" : undefined, opacity: notLicensed ? 0.5 : 1 }}>
                <ClarionMark className="size-4" style={{ color: "var(--palette-white)" }} />
              </span>
            ) : (
              <ClarionMark className="size-5" style={{ color: "var(--fg-neutral-emphasis)", opacity: notLicensed ? 0.4 : 1 }} dot={trayColor[overall]} />
            )}
            {notLicensed ? null : version === "E" ? (
              // Readiness badge on the logo — green ✓✓ (ready) / amber ! / red △! —
              // shape *and* colour so it survives red/green colour-blindness.
              <span className="absolute" style={{ top: -4, right: -4 }}>
                <StatusBadge status={displayStatus} size={16} />
              </span>
            ) : (
              alertCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex size-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[10px] font-bold"
                  style={{
                    background: "var(--fg-warning-emphasis)",
                    color: "var(--fg-on-neutral-emphasis)",
                    border: "2px solid var(--bg-card)",
                  }}
                >
                  !
                </span>
              )
            )}
          </button>
          )}

          <div className="px-2 text-right leading-tight">
            <div className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>2:47 PM</div>
            <div className="text-[10px]" style={{ color: "var(--fg-neutral-subtle)" }}>Mon, May 4</div>
          </div>
        </div>
      </div>
      </div>
    </div>
    </WidgetAgent.Provider>
  )
}

/**
 * Tray popover with enter/exit motion. Keeps its child mounted for the exit
 * duration so the widget can slide back down into the tray on close (a plain
 * conditional render would just pop out of existence).
 */
function TrayPopover({
  open,
  innerRef,
  style,
  children,
}: {
  open: boolean
  innerRef?: React.Ref<HTMLDivElement>
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const r = requestAnimationFrame(() => setShown(true))
      return () => cancelAnimationFrame(r)
    }
    setShown(false)
    const t = setTimeout(() => setMounted(false), 240)
    return () => clearTimeout(t)
  }, [open])

  if (!mounted) return null
  return (
    <div
      ref={innerRef}
      className="absolute"
      style={{
        ...style,
        transformOrigin: "bottom right",
        transition: shown
          ? "transform 300ms cubic-bezier(0.16,1,0.3,1), opacity 220ms ease-out"
          : "transform 220ms cubic-bezier(0.4,0,1,1), opacity 180ms ease-in",
        transform: shown ? "translateY(0) scale(1)" : "translateY(28px) scale(0.96)",
        opacity: shown ? 1 : 0,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  )
}

function TaskbarButton({ children, label, active, onClick }: { children: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative flex size-9 items-center justify-center rounded-md transition-colors"
      style={{ color: "var(--fg-neutral-muted)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
      {active && (
        <span className="absolute bottom-0.5 left-1/2 h-0.5 w-3.5 -translate-x-1/2 rounded-full" style={{ background: "var(--bg-primary-emphasis)" }} />
      )}
    </button>
  )
}

/** Mock email compose window — prototype of the email app opened by "Send to IT". */
function EmailWindow({ from, to, subject, body, attachment, log, onClose }: {
  from: string; to: string; subject: string; body: string; attachment: string; log: string; onClose: () => void
}) {
  const [showLog, setShowLog] = useState(false)
  const [sent, setSent] = useState(false)
  return (
    <div
      className="absolute flex flex-col overflow-hidden rounded-xl animate-in fade-in zoom-in-95 duration-150"
      style={{ left: 380, top: 110, width: 560, maxHeight: 640, background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)", boxShadow: "var(--shadow-xl)" }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex h-10 shrink-0 items-center justify-between px-3" style={{ background: "var(--bg-neutral-subtle)", borderBottom: "1px solid var(--border-neutral-muted)" }}>
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
          <Mail className="size-4" style={{ color: "var(--fg-neutral-muted)" }} /> New message
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex size-6 items-center justify-center rounded-md transition-colors"
          style={{ color: "var(--fg-neutral-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <X className="size-4" />
        </button>
      </div>

      {sent ? (
        <div className="flex flex-col items-center justify-center gap-2 px-10 py-14 text-center">
          <span className="flex size-10 items-center justify-center rounded-full" style={{ background: "var(--status-healthy)" }}><Check className="size-5" style={{ color: "#fff" }} /></span>
          <div className="text-sm font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>Sent to IT</div>
          <div className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>Your report was sent to {to}.</div>
        </div>
      ) : (
        <>
          <EmailField label="From" value={from} />
          <EmailField label="To" value={to} />
          <EmailField label="Subject" value={subject} />

          <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
            <button
              type="button"
              onClick={() => setShowLog((v) => !v)}
              className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors"
              style={{ background: "var(--bg-neutral-subtle)", border: "1px solid var(--border-neutral-muted)", color: "var(--fg-neutral-emphasis)" }}
            >
              <Paperclip className="size-3.5" style={{ color: "var(--fg-neutral-muted)" }} />
              {attachment}
              <span style={{ color: "var(--fg-neutral-subtle)" }}>· 12 KB</span>
            </button>
            {showLog && (
              <pre className="mt-2 max-h-48 overflow-auto rounded-md p-2.5 text-[11px] leading-relaxed" style={{ background: "var(--bg-neutral-subtle)", border: "1px solid var(--border-neutral-subtle)", color: "var(--fg-neutral-muted)", fontFamily: "ui-monospace, monospace" }}>{log}</pre>
            )}
          </div>

          <div className="min-h-px flex-1 overflow-auto px-4 py-3 text-[13px] leading-relaxed" style={{ color: "var(--fg-neutral-emphasis)", whiteSpace: "pre-wrap" }}>{body}</div>

          <div className="flex shrink-0 items-center gap-2 px-3 py-2.5" style={{ borderTop: "1px solid var(--border-neutral-muted)" }}>
            <Button size="sm" onClick={() => { setSent(true); setTimeout(onClose, 1800) }}><Send /> Send</Button>
            <Button variant="ghost" size="sm" onClick={onClose}>Discard</Button>
          </div>
        </>
      )}
    </div>
  )
}

function EmailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-2" style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
      <span className="w-16 shrink-0 pt-0.5 text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{label}</span>
      <span className="min-w-px flex-1 text-[13px]" style={{ color: "var(--fg-neutral-emphasis)" }}>{value}</span>
    </div>
  )
}

function TrayIcon({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-md transition-colors"
      style={{ color: "var(--fg-neutral-muted)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </button>
  )
}


/** Fast Follow demo control: which headset the current agent is using, and how IT's approved list sees it. */
const HEADSET_CHOICES = ["jabra-evolve2-75", "poly-voyager-4320", "yealink-uh37", "usb-generic", "airpods-pro"]
const verdict = { approved: "approved", "not-approved": "not approved", "not-checked": "can't be checked", none: "none", "no-list": "no list set" } as const
function HeadsetPicker({ agentId, defaultModel }: { agentId: string; defaultModel: string }) {
  const map = useAgentHeadsets()
  const approved = useApprovedHeadsets()
  const current = map[agentId] ?? HEADSET_CATALOGUE.find((h) => h.model === defaultModel)?.id ?? HEADSET_CHOICES[0]
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Agent's headset">
      {HEADSET_CHOICES.map((id) => {
        const h = headsetById(id)!
        const active = id === current
        return (
          <button key={id} type="button" role="radio" aria-checked={active}
            onClick={() => agentHeadsets.set({ ...map, [agentId]: id })}
            title={`${h.model} · ${h.connection} · ${verdict[complianceOf(h, approved)]}`}
            className="rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors"
            style={active
              ? { background: "var(--fg-neutral-emphasis)", color: "var(--bg-card)" }
              : { background: "var(--bg-card)", color: "var(--fg-neutral-muted)", border: "1px solid var(--border-neutral-muted)" }}>
            {h.model.replace(" (unbranded)", "")} <span style={{ opacity: 0.7 }}>· {verdict[complianceOf(h, approved)]}</span>
          </button>
        )
      })}
    </div>
  )
}
