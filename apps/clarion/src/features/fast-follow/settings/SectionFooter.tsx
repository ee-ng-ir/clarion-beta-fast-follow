import { useEffect, useRef } from "react"
import { Button, PageFooter } from "@ir/ui"
import { toast } from "@/components/ui/toast"

/** Picasso form footer, kept in view: who last saved it, then Discard (outline) and the primary, last. */
/** What a save toasts: a short title, and a line on what changed. */
export type Confirmation = { title: string; description?: string }

export function SectionFooter({ saved, dirty, onDiscard, onSave, saveLabel, extra, confirmation }: {
  saved: string; dirty: boolean; onDiscard: () => void; onSave: () => void; saveLabel: string; extra?: React.ReactNode
  /** set after a save; shown once as a success toast, the product's pattern for a save landing.
      Keep the description to what changed ("Network set to Calm"), not what it means. */
  confirmation?: Confirmation | null
}) {
  // Toast once per save. The ref stops a repeat when the effect re-runs (StrictMode, re-renders);
  // sections clear confirmation on the next edit, which re-arms it.
  const shown = useRef<Confirmation | null>(null)
  useEffect(() => {
    if (!confirmation) { shown.current = null; return }
    if (shown.current === confirmation) return
    shown.current = confirmation
    toast({ variant: "success", ...confirmation })
  }, [confirmation])

  return (
    <>
    {/* Sticky so Save is always in view on a long tab. Picasso's PageFooter doesn't stick
        (its docs say a sticky bar isn't built yet): logged as a Picasso gap. */}
    <PageFooter className="sticky -bottom-4 z-10 -mb-4 bg-surface-app pb-4">
      <span className="me-auto flex items-center gap-2 text-body-sm text-content-neutral-muted">
        {dirty && <span className="size-2 shrink-0 rounded-full bg-status-warning" aria-hidden />}
        {dirty ? <span className="text-label-md text-content-neutral-emphasis">Unsaved changes</span> : saved}
      </span>
      {extra}
      {/* only when there's something to save: disabled buttons at rest are just clutter */}
      {dirty && (
        <>
          <Button variant="outline" onClick={onDiscard}>Discard</Button>
          <Button onClick={onSave}>{saveLabel}</Button>
        </>
      )}
    </PageFooter>
    </>
  )
}
