import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react"

type ToastVariant = "success" | "info" | "danger"
interface ToastItem { id: number; title: string; description?: string; variant?: ToastVariant }

let counter = 0
const EVENT = "clarion:toast"

/** Fire a transient toast from anywhere. */
export function toast(t: { title: string; description?: string; variant?: ToastVariant }) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { ...t, id: ++counter } }))
}

const toneColor: Record<ToastVariant, string> = {
  success: "var(--fg-success-emphasis)",
  info: "var(--fg-info-emphasis)",
  danger: "var(--fg-danger-emphasis)",
}
const toneIcon = { success: CheckCircle2, info: Info, danger: AlertTriangle }

/** Mount once near the app root. Listens for toast() events and renders a stack. */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    const onToast = (e: Event) => {
      const item = (e as CustomEvent).detail as ToastItem
      setItems((xs) => [...xs, item])
      window.setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== item.id)), 4000)
    }
    window.addEventListener(EVENT, onToast)
    return () => window.removeEventListener(EVENT, onToast)
  }, [])

  const dismiss = (id: number) => setItems((xs) => xs.filter((x) => x.id !== id))

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" role="region" aria-label="Notifications">
      {items.map((t) => {
        const variant = t.variant ?? "success"
        const Icon = toneIcon[variant]
        return (
          <div key={t.id} role="status" aria-live="polite"
            className="pointer-events-auto flex items-start gap-3 rounded-xl p-3 shadow-lg data-[state=open]:animate-in slide-in-from-bottom-2 fade-in"
            data-state="open"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-neutral-muted)" }}>
            <Icon className="mt-0.5 size-5 shrink-0" style={{ color: toneColor[variant] }} />
            <div className="flex min-w-px flex-1 flex-col">
              <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{t.title}</span>
              {t.description && <span className="mt-0.5 text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{t.description}</span>}
            </div>
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)}
              className="flex size-6 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]" style={{ color: "var(--fg-neutral-muted)" }}>
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>,
    document.body
  )
}
