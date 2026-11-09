import { Sparkles } from "lucide-react"

/**
 * Persistent "Fast Follow preview" strip across the top of the whole window.
 * Sales will read anything on screen as a promise, so every screen in this repo
 * says plainly that it's a concept, not the shipped product.
 */
export function PreviewMarker() {
  return (
    <div
      role="note"
      aria-label="Fast Follow preview"
      className="flex h-8 shrink-0 items-center justify-center gap-2 bg-surface-neutral-emphasis px-4 text-label-sm text-content-on-neutral-emphasis"
    >
      <Sparkles className="size-3.5 shrink-0" aria-hidden />
      <span>Fast Follow preview</span>
      <span className="hidden text-body-xs sm:inline">· Concept for upcoming features. Illustrative data, not the shipped product.</span>
    </div>
  )
}
