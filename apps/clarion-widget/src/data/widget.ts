// Dummy data for the Clarion end-user widget.
//
// Ported from the original `clarion-widget.html` prototype's `scenarios` object
// so the React app reflects the same end-user criteria: per-component health,
// plain-language explanations, and desktop toasts (informational — no
// proactive remediation or auto-raised tickets).
//
// This is the single source the Overview, the section panes, and the Demo all
// read from — change a reading here and every surface updates.

export type Status = "healthy" | "warning" | "critical" | "syncing" | "unknown"

/** The demo states the prototype can switch between. */
export type ScenarioId = "healthy" | "device" | "network" | "platform" | "multi" | "busy" | "hovering" | "syncing" | "collectFail" | "reconnecting" | "reconnectCold" | "verifying" | "notVerified"

/** The things Clarion monitors. */
export type ComponentId = "wifi" | "headphones" | "microphone" | "camera" | "cpu" | "memory" | "disk" | "platform"

/** Which nav section owns each component. */
export type SectionId = "network" | "devices" | "system" | "platform"

export interface ComponentReading {
  id: ComponentId
  name: string
  section: SectionId
  status: Status
  /** One-line, human-readable telemetry summary. */
  detail: string
}

/**
 * A plain-language explanation surfaced inline when a component degrades.
 * Informational only — the widget reports, it does not offer the user
 * proactive remediation. Resolution happens in the application / by IT.
 */
export interface Fix {
  title: string
  description: string
  /** Fast Follow: the likely cause, named only (no steps), e.g. energy saver */
  cause?: string
}

/** A desktop notification fired when something needs attention. */
export interface Toast {
  title: string
  body: string
}

export interface Scenario {
  id: ScenarioId
  label: string
  /** Worst component status — drives the tray shield + banner colour. */
  overallStatus: Status
  banner: { main: string; sub: string }
  components: Record<ComponentId, ComponentReading>
  /** Fixes keyed by the component they remediate. */
  fixes: Partial<Record<ComponentId, Fix>>
  toast?: Toast
  footer: string
  /** Lost-connection meta state — overlays last-known data (Scenario 1). */
  connection?: "reconnecting"
  /** Timestamp shown in the staleness pill while reconnecting. */
  staleAsOf?: string
  /** Tray-only — clicking the tray does not open the panel (Scenario 2, verifying, not verified). */
  trayOnly?: boolean
}

/** Static component identity — name + the section that owns it. */
export const componentMeta: Record<ComponentId, { name: string; section: SectionId }> = {
  wifi:       { name: "Wi-Fi & Network",         section: "network" },
  headphones: { name: "Headphones",              section: "devices" },
  microphone: { name: "Microphone",              section: "devices" },
  camera:     { name: "Camera",                  section: "devices" },
  cpu:        { name: "CPU",                      section: "system" },
  memory:     { name: "Memory",                   section: "system" },
  disk:       { name: "Disk",                     section: "system" },
  platform:   { name: "Platform (Genesys Cloud)", section: "platform" },
}

const reading = (id: ComponentId, status: Status, detail: string): ComponentReading => ({
  id,
  name: componentMeta[id].name,
  section: componentMeta[id].section,
  status,
  detail,
})

// Healthy baselines reused across scenarios.
const HEALTHY = {
  wifi: reading("wifi", "healthy", "Strong signal · 87 Mbps · 18 ms latency"),
  headphones: reading("headphones", "healthy", "Jabra Evolve2 75 · Connected"),
  microphone: reading("microphone", "healthy", "Jabra mic · Input level normal"),
  camera: reading("camera", "healthy", "HP HD Camera · Active"),
  cpu: reading("cpu", "healthy", "28% · normal"),
  memory: reading("memory", "healthy", "42% used · 6.8 GB free"),
  disk: reading("disk", "healthy", "350 / 512 GB · 49% used · NVMe SSD"),
  platform: reading("platform", "healthy", "Genesys Cloud · Connected"),
} as const

// ---- Fast Follow · smarter alerts -------------------------------------------
// Energy saver is named as the likely cause; it is context, never an alert of its own.
const BUSY: Scenario = {
  id: "busy",
  label: "Computer busy",
  overallStatus: "warning",
  banner: { main: "Your computer is busy", sub: "Calls may stutter or lag" },
  components: {
    ...HEALTHY,
    cpu: reading("cpu", "warning", "91% · On battery · Energy saver on"),
  },
  fixes: {
    cpu: {
      title: "Your computer is busy",
      description: "Your CPU is at 91%, which can make calls stutter. Close apps you aren't using.",
      cause: "Energy saver is on, which can slow your computer.",
    },
  },
  toast: { title: "Your computer is busy", body: "Your CPU is at 91%. Energy saver is on, which can slow your computer." },
  footer: "Issue detected at 2:47 PM · 1 warning",
}
// Alert stability: a reading that hovers around its threshold never becomes an
// alert. The agent sees nothing change; that is the point.
const HOVERING: Scenario = {
  id: "hovering",
  label: "Wi-Fi hovering",
  overallStatus: "healthy",
  banner: { main: "You're ready for calls", sub: "All systems healthy" },
  components: {
    ...HEALTHY,
    wifi: reading("wifi", "healthy", "Signal 48–53% · 42 Mbps · 31 ms latency"),
  },
  fixes: {},
  footer: "Monitoring active · Telemetry streaming to Clarion",
}

export const scenarios: Record<ScenarioId, Scenario> = {
  busy: BUSY,
  hovering: HOVERING,
  healthy: {
    id: "healthy",
    label: "All healthy",
    overallStatus: "healthy",
    banner: { main: "You're ready for calls", sub: "All systems healthy" },
    components: { ...HEALTHY },
    fixes: {},
    footer: "Monitoring active · Telemetry streaming to Clarion",
  },

  // Startup / reconnecting — telemetry not in yet, so status is unknown.
  // Every reading reports "Checking…" and the tray/logo show the grey sync badge.
  syncing: {
    id: "syncing",
    label: "Starting up",
    overallStatus: "syncing",
    banner: { main: "Checking your setup", sub: "Gathering telemetry…" },
    components: {
      wifi: reading("wifi", "syncing", "Checking…"),
      headphones: reading("headphones", "syncing", "Checking…"),
      microphone: reading("microphone", "syncing", "Checking…"),
      camera: reading("camera", "syncing", "Checking…"),
      cpu: reading("cpu", "syncing", "Checking…"),
      memory: reading("memory", "syncing", "Checking…"),
      disk: reading("disk", "syncing", "Checking…"),
      platform: reading("platform", "syncing", "Checking…"),
    },
    fixes: {},
    footer: "Gathering telemetry…",
  },

  // One or more readings couldn't be collected — the affected tile goes
  // "unknown" and the banner explains. Distinct from syncing: we tried and
  // failed (info "i"), rather than still waiting (sync). Retries in background.
  collectFail: {
    id: "collectFail",
    label: "Collection failed",
    overallStatus: "unknown",
    banner: { main: "Some data couldn't be collected", sub: "Clarion will keep retrying" },
    components: {
      ...HEALTHY,
      camera: reading("camera", "unknown", "Couldn't be collected"),
    },
    fixes: {},
    footer: "Some readings unavailable · retrying",
  },

  // Lost connection — Scenario 1: the widget was running, so we keep the
  // last-known telemetry (which may be stale) under a "Reconnecting…" banner
  // plus a staleness pill showing when it was last up to date.
  reconnecting: {
    id: "reconnecting",
    label: "Reconnecting",
    overallStatus: "healthy",
    connection: "reconnecting",
    staleAsOf: "15 July 12:23 pm",
    banner: { main: "Reconnecting…", sub: "Showing your last known status" },
    components: { ...HEALTHY },
    fixes: {},
    footer: "Reconnecting to Clarion…",
  },

  // Lost connection — Scenario 2: the widget hadn't run yet, so there's no data
  // to show — the panel won't open; only the tray icon (unknown) + tooltip.
  reconnectCold: {
    id: "reconnectCold",
    label: "Reconnecting · cold",
    overallStatus: "healthy",
    connection: "reconnecting",
    trayOnly: true,
    banner: { main: "Reconnecting…", sub: "Your status may be out of date" },
    components: { ...HEALTHY },
    fixes: {},
    footer: "Reconnecting to Clarion…",
  },

  // Startup — verifying licence: tray-only, info "i" (unknown) badge; the window
  // won't open until verification passes and data starts flowing.
  verifying: {
    id: "verifying",
    label: "Verifying licence",
    overallStatus: "unknown",
    trayOnly: true,
    banner: { main: "Verifying license…", sub: "Checking your licence" },
    components: { ...HEALTHY },
    fixes: {},
    footer: "Verifying…",
  },

  // Not licensed: tray-only, greyed/disabled logo (no badge); the window won't open.
  notVerified: {
    id: "notVerified",
    label: "Not licensed",
    overallStatus: "unknown",
    trayOnly: true,
    banner: { main: "Not licensed", sub: "Contact your IT team" },
    components: { ...HEALTHY },
    fixes: {},
    footer: "Not licensed for use",
  },

  device: {
    id: "device",
    label: "Device issue",
    overallStatus: "critical",
    banner: { main: "Headphones disconnected", sub: "Action needed · audio fell back to laptop speakers" },
    components: {
      ...HEALTHY,
      headphones: reading("headphones", "critical", "Jabra Evolve2 75 · Disconnected"),
      microphone: reading("microphone", "warning", "Fallback to laptop mic · Quality reduced"),
    },
    fixes: {
      headphones: {
        title: "Headphones not working",
        description: "Your Jabra Evolve2 75 disconnected and the call fell back to your laptop speakers.",
      },
    },
    toast: {
      title: "Headphones not working",
      body: "Your Jabra Evolve2 75 disconnected; the call fell back to your laptop speakers.",
    },
    footer: "Issue detected at 2:47 PM · 1 alert",
  },

  network: {
    id: "network",
    label: "Weak Wi-Fi",
    overallStatus: "warning",
    banner: { main: "Wi-Fi signal is weak", sub: "Audio quality may be affected" },
    components: {
      ...HEALTHY,
      wifi: reading("wifi", "warning", "Weak signal · 32% · 184 ms latency · 6% packet loss"),
    },
    fixes: {
      wifi: {
        title: "Wi-Fi signal is weak",
        description: "Signal strength dropped to 32%, which may cause audio drops on your call.",
      },
    },
    toast: {
      title: "Wi-Fi signal is weak",
      body: "Wi-Fi signal dropped to 32%, which may affect your call audio.",
    },
    footer: "Network degradation detected · 1 warning",
  },

  platform: {
    id: "platform",
    label: "Platform issue",
    overallStatus: "critical",
    banner: { main: "Platform connectivity issue", sub: "Not your machine · platform issue detected" },
    components: {
      ...HEALTHY,
      platform: reading("platform", "critical", "Genesys Cloud unreachable · HTTP 503"),
    },
    fixes: {
      platform: {
        title: "Platform connectivity issue detected",
        description:
          "Genesys Cloud media servers are returning errors (HTTP 503). This is a platform issue, not your machine.",
      },
    },
    toast: {
      title: "Platform issue detected",
      body: "Genesys Cloud media servers are unreachable. This is a platform issue, not your machine.",
    },
    footer: "Platform issue detected",
  },

  // 2 critical (network, headphones) + 1 warning (disk) across three sections.
  // Network leads the headline via the call-blocking tie-break.
  multi: {
    id: "multi",
    label: "Multiple",
    overallStatus: "critical",
    banner: { main: "Network connection lost", sub: "Your machine is offline — calls can't connect until it's back" },
    components: {
      ...HEALTHY,
      headphones: reading("headphones", "critical", "Jabra Evolve2 75 · Disconnected"),
      wifi: reading("wifi", "critical", "Disconnected · no network detected"),
      disk: reading("disk", "warning", "Low space · 12 GB free · 98% used"),
    },
    fixes: {
      wifi: {
        title: "Network connection lost",
        description: "Your machine has lost its network connection, so calls can't connect until it's back.",
      },
      headphones: {
        title: "Headphones not working",
        description: "Your Jabra Evolve2 75 disconnected and the call fell back to your laptop speakers.",
      },
      disk: {
        title: "Disk almost full",
        description: "Your disk is 98% full — only 12 GB free. Free up space to keep things running smoothly.",
      },
    },
    toast: {
      title: "Network connection lost",
      body: "Your machine is offline — calls can't connect until your connection is back.",
    },
    footer: "Multiple issues detected",
  },
}

export const scenarioList: Scenario[] = [
  scenarios.healthy,
  scenarios.network,
  scenarios.device,
  scenarios.platform,
  scenarios.multi,
  scenarios.busy,
  scenarios.hovering,
  scenarios.syncing,
  scenarios.collectFail,
  scenarios.reconnecting,
  scenarios.reconnectCold,
  scenarios.verifying,
  scenarios.notVerified,
]

/** Canonical component display order. */
export const componentOrder: ComponentId[] = ["wifi", "headphones", "microphone", "camera", "cpu", "memory", "disk", "platform"]

/** Section identity for the shell's nav sections. */
export const sectionMeta: Record<SectionId, { label: string; blurb: string }> = {
  network: { label: "Network", blurb: "Wi-Fi strength, throughput, latency and packet loss for your current connection." },
  devices: { label: "Devices", blurb: "Headset, microphone and camera — connection state and input levels." },
  system: { label: "System", blurb: "CPU, memory and disk headroom on your machine." },
  platform: { label: "Platform", blurb: "Connectivity and health for your calling and meeting platforms." },
}

/** Worst-case roll-up across a set of statuses. */
export function worstStatus(list: Status[]): Status {
  if (list.includes("critical")) return "critical"
  if (list.includes("warning")) return "warning"
  if (list.includes("unknown")) return "unknown"
  if (list.includes("syncing")) return "syncing"
  return "healthy"
}

/** The component readings that belong to a given section, in display order. */
export function componentsInSection(section: SectionId, scenario: Scenario): ComponentReading[] {
  return componentOrder
    .filter((id) => componentMeta[id].section === section)
    .map((id) => scenario.components[id])
}

/**
 * UC/CC platforms shown under the Platform section. The agent may run several;
 * Genesys is the active contact-centre platform whose telemetry the scenarios
 * drive today (the others are placeholders until we define their metrics).
 */
export interface PlatformApp {
  id: string
  name: string
}
export const platforms: PlatformApp[] = [
  { id: "teams", name: "Teams" },
  { id: "zoom", name: "Zoom" },
  { id: "webex", name: "Webex" },
  { id: "genesys", name: "Genesys" },
  { id: "cxone", name: "NICE CXone" },
]

/**
 * Snooze durations — mirrors the Fleet dashboard's alert MUTE_DURATIONS.
 * Snoozing is a time-boxed, local quieting of the *tray notification* (the
 * Windows toast): it does NOT change the component's health or the overall/tray
 * status (those keep reporting the truth, and to the Fleet). The in-widget
 * detail and fix card stay available; only the interruptive toast is silenced.
 */
export const SNOOZE_DURATIONS = [
  { label: "1 hour", value: "1h" },
  { label: "8 hours", value: "8h" },
  { label: "24 hours", value: "24h" },
] as const
