import { useEffect, useState } from "react"
import {
  Button, Toast, ToastAction, ToastBody, ToastClose, ToastContent, ToastDescription, ToastIcon, ToastProvider, ToastTitle, ToastViewport,
} from "@ir/ui"

type ToastVariant = "success" | "info" | "danger"
/** One button on the toast, e.g. Undo for a change that applied straight away. */
interface ToastActionItem { label: string; onClick: () => void }
interface ToastItem { id: number; title: string; description?: string; variant?: ToastVariant; action?: ToastActionItem }

let counter = 0
const EVENT = "clarion:toast"

/** Fire a transient toast from anywhere. */
export function toast(t: { title: string; description?: string; variant?: ToastVariant; action?: ToastActionItem }) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { ...t, id: ++counter } }))
}

const tone = { success: "success", info: "info", danger: "destructive" } as const

/** Mount once near the app root. Renders toast() events with Picasso's Toast, as ops-console and client-console do. */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])
  useEffect(() => {
    const onToast = (e: Event) => setItems((xs) => [...xs, (e as CustomEvent).detail as ToastItem])
    window.addEventListener(EVENT, onToast)
    return () => window.removeEventListener(EVENT, onToast)
  }, [])
  const remove = (id: number) => setItems((xs) => xs.filter((x) => x.id !== id))

  return (
    <ToastProvider duration={4000}>
      {items.map((t) => (
        <Toast key={t.id} variant={tone[t.variant ?? "success"]} appearance="subtle" defaultOpen
          onOpenChange={(open) => { if (!open) window.setTimeout(() => remove(t.id), 200) }}>
          <ToastBody>
            <ToastIcon />
            <ToastContent>
              <ToastTitle>{t.title}</ToastTitle>
              {t.description && <ToastDescription>{t.description}</ToastDescription>}
            </ToastContent>
            {t.action && (
              <ToastAction asChild altText={t.action.label}>
                <Button variant="outline" size="xs" onClick={t.action.onClick}>{t.action.label}</Button>
              </ToastAction>
            )}
            <ToastClose />
          </ToastBody>
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
