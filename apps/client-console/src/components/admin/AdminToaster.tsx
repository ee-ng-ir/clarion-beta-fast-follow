import { useEffect, useState } from "react"
import {
  Toast, ToastBody, ToastClose, ToastContent, ToastDescription, ToastIcon, ToastProvider, ToastTitle, ToastViewport,
} from "@ir/ui"

/**
 * Picasso toasts for the Administration experience.
 *
 * Listens to the same event as the prototype's `toast()` helper
 * (`@/components/ui/toast`), so admin screens keep calling `toast({...})` and
 * get Picasso's Toast — Radix-backed, swipeable, announced to screen readers.
 */
type Variant = "success" | "info" | "danger"
interface Item { id: number; title: string; description?: string; variant?: Variant }

const EVENT = "clarion:toast"
const tone = { success: "success", info: "info", danger: "destructive" } as const

export function AdminToaster() {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    const onToast = (e: Event) => setItems((xs) => [...xs, (e as CustomEvent).detail as Item])
    window.addEventListener(EVENT, onToast)
    return () => window.removeEventListener(EVENT, onToast)
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
