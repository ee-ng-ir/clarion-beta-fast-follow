/** Fire a Picasso toast from anywhere. <Toaster/> renders them. */
export type ToastVariant = "success" | "info" | "danger" | "warning"
export interface ToastItem { id: number; title: string; description?: string; variant?: ToastVariant }

export const TOAST_EVENT = "ops:toast"
let seq = 0

export function toast(t: Omit<ToastItem, "id">) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { ...t, id: ++seq } }))
}

/** Copy to the clipboard and say so. */
export function copy(value: string, what: string) {
  void navigator.clipboard?.writeText(value).catch(() => {})
  toast({ title: `${what} copied`, description: value, variant: "info" })
}
