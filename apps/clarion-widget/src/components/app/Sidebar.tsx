import { useRef } from "react"
import { PanelLeftClose, PanelLeftOpen, Pin } from "lucide-react"
import { ClarionMark } from "@/components/widget/ClarionMark"
import { StatusBadge } from "@/components/widget/StatusBadge"
import { IRLogo } from "@/components/widget/IRLogo"
import { animatedNavIcon, type AnimatedIconHandle } from "@/components/icons"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { navSections, navItems, devNavItems, type NavItem, type PageId } from "@/nav"
import { type Status } from "@/data/widget"

type SectionStatus = { status: Status; detail: string }

const statusColor: Record<Status, string> = {
  healthy: "var(--status-healthy)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
  syncing: "var(--status-unknown)",
  unknown: "var(--status-unknown)",
}

/** Version C — IR 2026 brand gradient for the logomark tile. */
const BRAND_GRADIENT =
  "linear-gradient(135deg, var(--palette-brand-950) 0%, var(--palette-brand-700) 52%, var(--palette-vis-teal-500) 116%)"

/** Clarion brand mark gradient — new Brand logo (Figma 1386:73651): cyan → purple, no red stop. */
const CLARION_GRADIENT = "linear-gradient(135deg, #3CC9F3 0%, #852CAA 100%)"

export function Sidebar({
  active,
  onNavigate,
  collapsed,
  onToggleCollapsed,
  showDevNav = true,
  hideCollapseToggle = false,
  hideOverview = false,
  sectionStatus,
  brand = false,
  neutral = false,
  logoStatus,
  showPin = false,
  pinned = false,
  onTogglePin,
}: {
  active: PageId | null
  onNavigate: (id: PageId) => void
  collapsed: boolean
  onToggleCollapsed: () => void
  showDevNav?: boolean
  hideCollapseToggle?: boolean
  hideOverview?: boolean
  sectionStatus?: Partial<Record<PageId, SectionStatus>>
  brand?: boolean
  /** Neutral rail — dark neutral logomark, grey icons, subtle neutral active state (Version D). */
  neutral?: boolean
  /** Overall readiness — renders the badge on the logomark (green ✓ / amber ! / red △). */
  logoStatus?: Status
  /** Show the pin toggle in the footer (below categories, above the IR logo). */
  showPin?: boolean
  /** Whether the widget is pinned on top — drives the pin toggle's active state. */
  pinned?: boolean
  onTogglePin?: () => void
}) {
  const sections = hideOverview
    ? navSections
        .map((s) => ({ ...s, items: s.items.filter((it) => it.id !== "overview") }))
        .filter((s) => s.items.length > 0)
    : navSections
  return (
    <TooltipProvider delayDuration={120}>
      <aside
        className="flex h-full shrink-0 flex-col transition-[width] duration-200 ease-out"
        style={{ width: collapsed ? 64 : 208, background: "var(--bg-sidebar)" }}
      >
        {/* Header — product identity */}
        <div className="flex h-16 items-center px-2.5">
          <div
            className="flex w-full items-center gap-2.5 rounded-md p-1.5"
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <span
              className="relative flex size-9 shrink-0 items-center justify-center rounded-lg"
              style={neutral
                ? { background: CLARION_GRADIENT, color: "var(--palette-white)" }
                : brand
                  ? { background: BRAND_GRADIENT, color: "var(--palette-white)" }
                  : { background: "var(--bg-primary-emphasis)", color: "var(--fg-on-primary-emphasis)" }}
            >
              <ClarionMark className="size-5" />
              {logoStatus && (
                <span className="absolute -right-1.5 -top-1.5 leading-none">
                  <StatusBadge status={logoStatus} size={15} />
                </span>
              )}
            </span>
            {!collapsed && (
              <span className="flex min-w-px flex-1 flex-col items-start gap-0.5 text-left">
                <span className="w-full truncate text-sm font-semibold leading-none" style={{ color: "var(--fg-neutral-emphasis)" }}>
                  Clarion
                </span>
                <span className="w-full truncate text-xs leading-none" style={{ color: "var(--fg-neutral-muted)" }}>
                  Your device health
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Primary nav — grouped by "your machine" vs "platform" */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2">
          {sections.map((section, i) => (
            <div key={section.label ?? "primary"} className={i > 0 ? "mt-3" : undefined}>
              {section.label && <GroupLabel collapsed={collapsed}>{section.label}</GroupLabel>}
              <nav className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const keyIndex = navItems.findIndex((n) => n.id === item.id)
                  return (
                    <NavButton
                      key={item.id}
                      item={item}
                      active={item.id === active}
                      collapsed={collapsed}
                      onNavigate={onNavigate}
                      shortcut={keyIndex >= 0 ? String(keyIndex + 1) : undefined}
                      status={sectionStatus?.[item.id]}
                      brand={brand}
                      neutral={neutral}
                    />
                  )
                })}
              </nav>
            </div>
          ))}

          {showDevNav && (
            <div className="mt-4">
              <GroupLabel collapsed={collapsed}>Product development</GroupLabel>
              <nav className="flex flex-col gap-1">
                {devNavItems.map((item) => (
                  <NavButton
                    key={item.id}
                    item={item}
                    active={item.id === active}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Footer — pin toggle (below categories, above the IR logo), collapse toggle, version, IR mark */}
        <div className="flex flex-col gap-1 px-2.5 py-2.5">
          {showPin && (
            <>
              <div className={collapsed ? "mx-2 mb-1 h-px" : "mx-2.5 mb-1 h-px"} style={{ background: "var(--border-neutral-subtle)" }} />
              <PinToggle collapsed={collapsed} pinned={pinned} onToggle={onTogglePin} />
            </>
          )}
          {!hideCollapseToggle && <CollapseToggle collapsed={collapsed} onToggle={onToggleCollapsed} />}
          {!collapsed && (
            <div className="px-2.5 pt-1 text-[11px]" style={{ color: "var(--fg-neutral-subtle)" }}>
              Version 1
            </div>
          )}
          <div className={collapsed ? "flex justify-center pt-1.5" : "flex justify-start px-2.5 pt-1.5"} aria-label="Integrated Research">
            <IRLogo className="h-5 w-auto" />
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}

function NavButton({
  item,
  active,
  collapsed,
  onNavigate,
  shortcut,
  status,
  brand = false,
  neutral = false,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
  onNavigate: (id: PageId) => void
  shortcut?: string
  status?: SectionStatus
  brand?: boolean
  neutral?: boolean
}) {
  const { id, label, hint } = item
  const degraded = !!status && status.status !== "healthy"
  // Version C colours icons with the brand (status when degraded); neutral mode
  // (Version D) keeps them grey and lets the status dot carry state.
  const iconColor = brand
    ? degraded ? statusColor[status!.status] : "var(--fg-primary-muted)"
    : neutral
      ? active ? "var(--fg-neutral-emphasis)" : "var(--fg-neutral-muted)"
      : active ? "var(--fg-primary-emphasis)" : "var(--fg-neutral-muted)"
  const Animated = animatedNavIcon[id]
  const iconRef = useRef<AnimatedIconHandle>(null)
  const button = (
    <button
      type="button"
      onClick={() => onNavigate(id)}
      aria-label={label}
      className="relative flex h-9 w-full items-center gap-2.5 rounded-md text-left text-sm transition-colors"
      style={{
        paddingInline: collapsed ? 0 : 10,
        justifyContent: collapsed ? "center" : "flex-start",
        background: active ? (neutral ? "var(--bg-neutral-subtle)" : "var(--bg-selected-subtle)") : "transparent",
        border: `1px solid ${active && neutral ? "var(--border-neutral-muted)" : "transparent"}`,
        color: "var(--fg-neutral-emphasis)",
      }}
      onMouseEnter={(e) => { iconRef.current?.startAnimation(); if (!active) e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)" }}
      onMouseLeave={(e) => { iconRef.current?.stopAnimation(); if (!active) e.currentTarget.style.background = "transparent" }}
    >
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full" style={{ background: "var(--border-focused)" }} />
      )}
      <span className="relative flex shrink-0">
        <Animated ref={iconRef} size={16} className="flex" style={{ color: iconColor }} />
        {degraded && (
          <span
            className="absolute -right-1.5 -top-1.5 size-2 rounded-full"
            style={{ background: statusColor[status!.status], boxShadow: "0 0 0 2px var(--bg-sidebar)" }}
          />
        )}
      </span>
      {!collapsed && <span className="min-w-px flex-1 truncate">{label}</span>}
      {!collapsed && shortcut && (
        <kbd
          className="flex h-5 shrink-0 items-center justify-center rounded-sm px-1.5 text-[10px] font-medium"
          style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-subtle)", border: "1px solid var(--border-neutral-muted)" }}
        >
          Alt + {shortcut}
        </kbd>
      )}
    </button>
  )

  if (!collapsed) return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        <div className="font-medium">{label}</div>
        <div className="opacity-80">{status ? status.detail : hint}</div>
      </TooltipContent>
    </Tooltip>
  )
}

function GroupLabel({ collapsed, children }: { collapsed: boolean; children: string }) {
  if (collapsed) {
    return <div className="mx-2 my-2 h-px" style={{ background: "var(--border-neutral-subtle)" }} />
  }
  return (
    <div className="flex h-7 items-center px-2.5 text-xs font-medium" style={{ color: "var(--fg-neutral-subtle)" }}>
      {children}
    </div>
  )
}

function CollapseToggle({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const btn = (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="flex h-9 w-full items-center gap-2.5 rounded-md text-left text-sm transition-colors"
      style={{
        paddingInline: collapsed ? 0 : 10,
        justifyContent: collapsed ? "center" : "flex-start",
        color: "var(--fg-neutral-muted)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {collapsed ? <PanelLeftOpen className="size-4 shrink-0" /> : <PanelLeftClose className="size-4 shrink-0" />}
      {!collapsed && <span className="min-w-px flex-1 truncate">Collapse</span>}
      {!collapsed && (
        <kbd
          className="flex h-5 shrink-0 items-center justify-center rounded-sm px-1.5 text-[10px] font-medium"
          style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-subtle)", border: "1px solid var(--border-neutral-muted)" }}
        >
          Alt + S
        </kbd>
      )}
    </button>
  )
  if (!collapsed) return btn
  return (
    <Tooltip>
      <TooltipTrigger asChild>{btn}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>Expand <span className="opacity-70">· Alt + S</span></TooltipContent>
    </Tooltip>
  )
}

/**
 * Pin toggle — keeps Clarion on top / persistent. Outline Lucide pin; active
 * (pinned) state is carried by the filled brand button background, since Lucide
 * has no filled variant.
 */
function PinToggle({ collapsed, pinned, onToggle }: { collapsed: boolean; pinned: boolean; onToggle?: () => void }) {
  const label = pinned ? "Unpin widget" : "Pin widget on top"
  const btn = (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={pinned}
      className="flex h-9 w-full items-center gap-2.5 rounded-md text-left text-sm transition-colors"
      style={{
        paddingInline: collapsed ? 0 : 10,
        justifyContent: collapsed ? "center" : "flex-start",
        // Active (pinned) uses the rail's neutral "selected" treatment — matching
        // the active nav icon in the DS (Figma 1246:345), not a bold brand fill.
        background: pinned ? "var(--bg-neutral-subtle)" : "transparent",
        border: `1px solid ${pinned ? "var(--border-neutral-muted)" : "transparent"}`,
        color: pinned ? "var(--fg-neutral-emphasis)" : "var(--fg-neutral-muted)",
      }}
      onMouseEnter={(e) => { if (!pinned) e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)" }}
      onMouseLeave={(e) => { if (!pinned) e.currentTarget.style.background = "transparent" }}
    >
      <Pin className="size-4 shrink-0" />
      {!collapsed && <span className="min-w-px flex-1 truncate">{pinned ? "Pinned on top" : "Pin on top"}</span>}
    </button>
  )
  if (!collapsed) return btn
  return (
    <Tooltip>
      <TooltipTrigger asChild>{btn}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        <div className="font-medium">{pinned ? "Pinned on top" : "Pin on top"}</div>
        <div className="opacity-80">{pinned ? "Click to unpin" : "Keep Clarion visible"}</div>
      </TooltipContent>
    </Tooltip>
  )
}
