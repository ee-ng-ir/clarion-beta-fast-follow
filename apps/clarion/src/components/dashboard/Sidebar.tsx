import { useEffect, useState } from "react"
import { ChevronDown, PanelLeftClose, CircleHelp, Moon, ExternalLink } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { navItems, type NavItem, type PageId } from "@/nav"
import { cn } from "@/lib/utils"

export function Sidebar({
  active,
  onNavigate,
  lastRefreshAt,
  onClose,
  dark,
  onToggleTheme,
}: {
  active: PageId
  onNavigate: (id: PageId) => void
  /** Phones: the theme toggle moves here from the top bar. */
  dark?: boolean
  onToggleTheme?: () => void
  /** Phones: the nav is full screen and this draws the collapse button. */
  onClose?: () => void
  /** epoch ms of the last stream refresh; the "Ns ago" ticks locally here so the
   *  per-second update doesn't re-render the whole app. */
  lastRefreshAt: number
}) {
  const [secondsAgo, setSecondsAgo] = useState(0)
  useEffect(() => {
    const tick = () => setSecondsAgo(Math.max(0, Math.round((Date.now() - lastRefreshAt) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [lastRefreshAt])
  return (
    <aside
      className={cn("flex h-full shrink-0 flex-col", onClose ? "w-full" : "w-64")}
      style={{ background: "var(--bg-sidebar)" }}
    >
      {/* Header — product brand on the IR watercolour banner (client white-label is a Day 2 feature) */}
      <div
        className={cn("relative flex h-20 shrink-0 items-end overflow-hidden", !onClose && "rounded-tr-2xl")}
        style={{ backgroundImage: "url('/sidebar-header.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <span className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.28), rgba(0,0,0,0) 55%)" }} />
        <div className="relative flex flex-col justify-center px-4 pb-3 leading-tight" style={{ fontFamily: "'Poppins', ui-sans-serif, sans-serif" }}>
          <span className="text-xl" style={{ fontFamily: "'Oswald', ui-sans-serif, sans-serif", fontWeight: 600, letterSpacing: "0.02em", textTransform: "uppercase", color: "#fff" }}>Clarion</span>
          <span className="text-xs" style={{ fontWeight: 400, color: "rgba(255,255,255,0.85)" }}>powered by Iris</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Collapse navigation"
            className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-md transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ color: "#fff" }}
          >
            <PanelLeftClose className="size-5" aria-hidden />
          </button>
        )}
      </div>

      {/* Content — nav */}
      <div className="flex-1 overflow-y-auto p-2">
        <NavGroup label="Workspace" items={navItems} active={active} onNavigate={onNavigate} touch={!!onClose} />
      </div>

      {/* Phones: Help and Dark theme, moved from the top bar (option B) */}
      {onClose && (
        <div className="flex flex-col gap-1 px-2 py-2" style={{ borderTop: "1px solid var(--border-neutral-muted)" }}>
          <a
            href="/support.html"
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
            style={{ color: "var(--fg-neutral-emphasis)" }}
          >
            <CircleHelp className="size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} aria-hidden />
            <span className="flex-1">Help &amp; support</span>
            <ExternalLink className="size-3.5" style={{ color: "var(--fg-neutral-subtle)" }} aria-hidden />
          </a>
          {onToggleTheme && (
            <label className="flex h-11 cursor-pointer items-center gap-2 rounded-md px-2 text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>
              <Moon className="size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} aria-hidden />
              <span className="flex-1">Dark theme</span>
              <Switch checked={!!dark} onCheckedChange={() => onToggleTheme()} aria-label="Dark theme" />
            </label>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col gap-2 px-4 py-2">
        <div className="flex items-center gap-2 p-2">
          <span
            className="size-3 shrink-0 rounded-full"
            style={{ background: "var(--status-healthy)", border: "1px solid var(--bg-card)", boxShadow: "var(--shadow-xs)" }}
          />
          <span className="truncate text-xs font-medium" style={{ color: "var(--fg-neutral-muted)" }}>
            {secondsAgo === 0 ? "Streaming just now" : `Streaming ${secondsAgo}s ago`}
          </span>
        </div>
        {/* IR logo, bottom-left (min 'i' height ≈20px per brand book) */}
        <div className="flex items-start p-2">
          <img src="/ir-logo.png" alt="Integrated Research" className="h-9 w-auto dark:hidden" />
          <img src="/ir-logo-white.png" alt="Integrated Research" className="hidden h-9 w-auto dark:block" />
        </div>
      </div>
    </aside>
  )
}

function NavGroup({
  label, items, active, onNavigate, collapsible = false, defaultOpen = true, touch = false,
}: {
  label: string
  items: NavItem[]
  active: PageId
  onNavigate: (id: PageId) => void
  collapsible?: boolean
  defaultOpen?: boolean
  /** phone nav: 44-tall rows for a thumb */
  touch?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const showItems = !collapsible || open
  return (
    <>
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex h-8 w-full items-center rounded-md px-2 text-xs font-medium transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
          style={{ color: "var(--fg-neutral-emphasis)" }}
        >
          {label}
          <ChevronDown className={cn("ml-auto size-3.5 transition-transform", !open && "-rotate-90")} style={{ color: "var(--fg-neutral-muted)" }} />
        </button>
      ) : (
        <div className="flex h-8 items-center px-2 text-xs font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
          {label}
        </div>
      )}
      {showItems && (
      <nav className="flex flex-col gap-1">
        {items.map(({ id, label: itemLabel, icon: Icon }) => {
          const isActive = id === active
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={cn("relative flex w-full items-center gap-2 rounded-md p-2 text-left text-sm transition-colors", touch ? "h-11" : "h-8")}
              style={
                isActive
                  ? { background: "var(--bg-selected-subtle)", color: "var(--fg-neutral-emphasis)" }
                  : { color: "var(--fg-neutral-emphasis)" }
              }
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)" }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent" }}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full" style={{ background: "var(--border-focused)" }} />
              )}
              <Icon className="size-4 shrink-0" style={{ color: isActive ? "var(--fg-primary-emphasis)" : "var(--fg-neutral-muted)" }} />
              <span className="truncate">{itemLabel}</span>
            </button>
          )
        })}
      </nav>
      )}
    </>
  )
}
