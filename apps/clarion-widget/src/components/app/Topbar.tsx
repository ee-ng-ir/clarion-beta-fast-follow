import type { ReactNode } from "react"
import { X } from "lucide-react"
import { pageLabel, type PageId } from "@/nav"

function IconButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode
  label: string
  onClick?: () => void
}) {
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
  onClose,
}: {
  page: PageId
  /** Close the widget back to the tray (the app keeps running). */
  onClose?: () => void
}) {
  return (
    <header
      className="flex h-16 items-center justify-between px-5"
      style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}
    >
      <h1 className="text-base font-semibold leading-none" style={{ color: "var(--fg-neutral-emphasis)" }}>
        {pageLabel(page)}
      </h1>

      <div className="flex items-center gap-2">
        {onClose && (
          <IconButton label="Close to tray (Esc)" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        )}
      </div>
    </header>
  )
}
