import type { ReactNode } from "react"
import { PanelLeft, ChevronRight, Sun, Moon, HelpCircle } from "lucide-react"
import { fleet } from "@/data/dashboard"
import { pageLabel, type PageId, type Experience } from "@/nav"
import { Button } from "@/components/ui/button"
import { ExperienceMenu } from "./ExperienceMenu"

function IconButton({ children, label, onClick }: { children: ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-8 shrink-0 items-center justify-center rounded-full transition-colors"
      style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle)")}
    >
      {children}
    </button>
  )
}

export function Topbar({
  page,
  dark,
  onToggleTheme,
  onToggleSidebar,
  sidebarExpanded,
}: {
  page: PageId
  dark: boolean
  onToggleTheme: () => void
  onToggleSidebar: () => void
  /** drives aria-expanded on the menu button */
  sidebarExpanded?: boolean
  /** no longer used — the account menu doesn't offer the Admin Portal */
  onSwitchExperience?: (e: Experience) => void
}) {
  return (
    <header
      className="flex h-12 items-center justify-between gap-3 px-4 md:h-20"
      style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}
    >
      <div className="flex min-w-px items-center gap-2">
        <button
          type="button"
          aria-label="Toggle sidebar"
          aria-expanded={sidebarExpanded}
          onClick={onToggleSidebar}
          className="flex size-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
          style={{ color: "var(--fg-neutral-muted)" }}
        >
          <PanelLeft className="size-4" />
        </button>
        <span className="mx-1 h-4 w-px shrink-0" style={{ background: "var(--border-neutral-muted)" }} />
        {/* phones keep the workspace crumb, truncated rather than dropped (Picasso: show where the page sits) */}
        <nav aria-label="Breadcrumb" className="flex min-w-px items-center gap-1.5 text-sm md:gap-2.5">
          <span className="min-w-px truncate whitespace-nowrap md:shrink-0" style={{ color: "var(--fg-neutral-muted)" }} title={fleet.workspace}>{fleet.workspace}</span>
          <ChevronRight className="size-4 shrink-0" style={{ color: "var(--fg-neutral-subtle)" }} />
          <span className="shrink-0 whitespace-nowrap font-medium md:font-normal" style={{ color: "var(--fg-neutral-emphasis)" }} aria-current="page">{pageLabel(page)}</span>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="flex items-center gap-1 md:gap-2">
          {/* phones: Help and theme live in the navigation footer (top bar option B) */}
          <span className="hidden md:contents">
            <Button asChild variant="ghost" size="icon">
              <a href="/support.html" target="_blank" rel="noreferrer" aria-label="Help">
                <HelpCircle />
              </a>
            </Button>
            <IconButton label="Toggle theme" onClick={onToggleTheme}>
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </IconButton>
          </span>
          <ExperienceMenu experience="fleet" />
        </div>
      </div>
    </header>
  )
}
