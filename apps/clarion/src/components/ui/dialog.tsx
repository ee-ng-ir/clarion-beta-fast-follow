import { useEffect, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

/**
 * Modal dialog — matches the Design System "Dialog" component:
 * header (title + description) · content slot · footer (top border, right-aligned
 * actions) · top-right close. Portal + scrim + Escape + click-outside.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  showClose = true,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  showClose?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  if (!open) return null

  return createPortal(
    <div
      data-ff-offset="" className="fixed inset-x-0 bottom-0 z-[90] flex items-start justify-center p-4 pt-[12vh] animate-in fade-in"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={() => onOpenChange(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-[425px] flex-col overflow-hidden rounded-xl shadow-lg animate-in fade-in zoom-in-95"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)" }}
      >
        {/* header */}
        <div className="flex flex-col gap-2 p-4">
          <h2 className="text-base font-medium leading-none" style={{ color: "var(--fg-neutral-emphasis)" }}>{title}</h2>
          {description && <p className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{description}</p>}
        </div>

        {/* content */}
        {children != null && <div className="px-4 pb-4">{children}</div>}

        {/* footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 p-4" style={{ borderTop: "1px solid var(--border-neutral-muted)" }}>
            {footer}
          </div>
        )}

        {/* close */}
        {showClose && (
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-3.5 flex size-6 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
            style={{ color: "var(--fg-neutral-muted)" }}
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}
