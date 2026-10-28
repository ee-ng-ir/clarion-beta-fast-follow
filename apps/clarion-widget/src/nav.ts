import {
  LayoutDashboard,
  Headset,
  Wifi,
  Cpu,
  AppWindow,
  MonitorPlay,
  type LucideIcon,
} from "lucide-react"

/**
 * End-user app navigation.
 *
 * The rail exists to keep each view focused: rather than stacking every
 * telemetry read-out into one long, scrolling panel, telemetry is split by
 * category (Devices / Network / Platform) so any single pane stays glanceable.
 * Pattern reference: macOS System Settings + Windows 11 Settings.
 */
export type PageId =
  | "overview"
  | "devices"
  | "network"
  | "system"
  | "platform"
  | "demo"

export interface NavItem {
  id: PageId
  label: string
  icon: LucideIcon
  /** short hint used by the collapsed-rail tooltip */
  hint?: string
}

const overview: NavItem = { id: "overview", label: "Overview", icon: LayoutDashboard, hint: "Your readiness at a glance" }
const devices: NavItem = { id: "devices", label: "Devices", icon: Headset, hint: "Headset, mic & camera" }
const network: NavItem = { id: "network", label: "Network", icon: Wifi, hint: "Wi-Fi, latency & packet loss" }
const system: NavItem = { id: "system", label: "System", icon: Cpu, hint: "CPU, memory & disk" }
const platform: NavItem = { id: "platform", label: "Platform", icon: AppWindow, hint: "Genesys Cloud & app health" }

/** Primary telemetry sections (flat — used for label + route lookups). */
export const navItems: NavItem[] = [overview, devices, network, system, platform]

export interface NavSection {
  /** Group heading; omitted for the standalone Overview. */
  label?: string
  items: NavItem[]
}

/**
 * Sidebar grouping reflects Clarion's core question — "is it me/my machine,
 * or is it the platform?". Your-machine signals sit apart from the platform.
 */
export const navSections: NavSection[] = [
  { items: [overview] },
  { label: "Your machine", items: [devices, network, system] },
  { label: "Platform", items: [platform] },
]

/** Internal — not shipped in the built product. Mirrors the Fleet dashboard's dev group. */
export const devNavItems: NavItem[] = [
  { id: "demo", label: "Demo", icon: MonitorPlay, hint: "Desktop preview of the live app" },
]

const allNavItems = [...navItems, ...devNavItems]

export const pageLabel = (id: PageId) =>
  allNavItems.find((n) => n.id === id)?.label ?? "Overview"

/** Type guard used by hash routing to validate a URL segment. */
export const isPageId = (value: string): value is PageId =>
  allNavItems.some((n) => n.id === value)
