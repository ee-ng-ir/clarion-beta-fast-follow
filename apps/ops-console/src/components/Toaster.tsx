import { useEffect, useState } from "react"
import {
  Toast, ToastBody, ToastClose, ToastContent, ToastDescription, ToastIcon, ToastProvider, ToastTitle, ToastViewport,
} from "@ir/ui"

import { TOAST_EVENT as EVENT, type ToastItem as Item } from "@/lib/toast"

/** Picasso toasts. Pages call `toast({...})` from @/lib/toast; this renders them. */
const tone = { success: "success", info: "info", danger: "destructive", warning: "warning" } as const

export function Toaster() {
  const [items, setItems] = useState<Item[]>([])
  useEffect(() => {
    const on = (e: Event) => setItems((xs) => [...xs, (e as CustomEvent).detail as Item])
    window.addEventListener(EVENT, on)
    return () => window.removeEventListener(EVENT, on)
  }, [])
  const remove = (id: number) => setItems((xs) => xs.filter((x) => x.id !== id))
  return (
    <ToastProvider duration={4000}>
      {items.map((t) => (
        <Toast
          key={t.id}
          variant={tone[t.variant ?? "success"]}
          appearance="subtle"
          defaultOpen
          onOpenChange={(open) => { if (!open) window.setTimeout(() => remove(t.id), 200) }}
        >
          <ToastBody>
            <ToastIcon />
            <ToastContent>
              <ToastTitle>{t.title}</ToastTitle>
              {t.description && <ToastDescription>{t.description}</ToastDescription>}
            </ToastContent>
            <ToastClose />
          </ToastBody>
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
