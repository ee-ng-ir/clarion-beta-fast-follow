import { useEffect, useRef, useState } from "react"
import { ChevronUp, Sparkles } from "lucide-react"
import { Button } from "@ir/ui"
import "./preview.css"
import "./card-table.css"

const KEY = "ff:preview-banner-hidden"
type Phase = "shown" | "hiding" | "hidden" | "showing-start" | "showing"

const readHidden = () => { try { return window.localStorage.getItem(KEY) === "1" } catch { return false } }
const writeHidden = (v: boolean) => { try { window.localStorage.setItem(KEY, v ? "1" : "0") } catch { /* storage off: still works this session */ } }
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

/**
 * The whole window, with the "Fast Follow preview" banner across the top.
 * Hide slides the page up by the banner's height (transform only, per IR motion
 * rules: base duration, in-out easing, instant under reduced motion), then takes
 * the banner out of the layout. A small "Preview" pill stays so the screen is
 * never mistaken for the shipped product; it brings the banner back.
 */
export function PreviewFrame({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>(() => (readHidden() ? "hidden" : "shown"))
  const frame = useRef<HTMLDivElement>(null)
  const bannerOut = phase === "hidden"

  // overlays and drawers start below the banner while it's there (preview.css)
  useEffect(() => {
    document.documentElement.style.setProperty("--ff-preview-height", bannerOut ? "0rem" : "2rem")
  }, [bannerOut])

  // showing: mount the banner off the top, then let the frame slide down on the next frame
  useEffect(() => {
    if (phase !== "showing-start") return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setPhase("showing")))
    return () => cancelAnimationFrame(id)
  }, [phase])

  const hide = () => { writeHidden(true); setPhase(reducedMotion() ? "hidden" : "hiding") }
  const show = () => { writeHidden(false); setPhase(reducedMotion() ? "shown" : "showing-start") }
  const onEnd = (e: React.TransitionEvent) => {
    if (e.target !== frame.current) return
    if (phase === "hiding") setPhase("hidden")
    if (phase === "showing") setPhase("shown")
  }

  return (
    <>
      <div
        ref={frame}
        data-phase={phase}
        onTransitionEnd={onEnd}
        className="ff-frame flex h-screen w-full flex-col overflow-hidden bg-surface-app"
      >
        {!bannerOut && <Banner onHide={hide} />}
        {children}
      </div>
      {bannerOut && (
        <button
          type="button"
          onClick={show}
          className="fixed start-1/2 top-0 z-50 inline-flex h-5 -translate-x-1/2 items-center gap-1 rounded-b-md bg-surface-neutral-emphasis px-2 text-label-xs text-content-on-neutral-emphasis animate-fade-in rtl:translate-x-1/2"
          aria-label="Show the Fast Follow preview banner"
        >
          <Sparkles className="size-3" aria-hidden /> Preview
        </button>
      )}
    </>
  )
}

function Banner({ onHide }: { onHide: () => void }) {
  return (
    <div
      role="note"
      aria-label="Fast Follow preview"
      className="relative flex h-8 shrink-0 items-center justify-center gap-2 bg-surface-neutral-emphasis px-12 text-label-sm text-content-on-neutral-emphasis"
    >
      <Sparkles className="size-3.5 shrink-0" aria-hidden />
      <span>Fast Follow preview</span>
      <span className="hidden text-body-xs sm:inline">· Concept for upcoming features. Illustrative data, not the shipped product.</span>
      <Button
        variant="ghost"
        size="xs"
        onClick={onHide}
        className="absolute end-2 text-content-on-neutral-emphasis hover:bg-surface-layer-on-emphasis-subtle"
      >
        <ChevronUp aria-hidden /> <span className="hidden sm:inline">Hide</span><span className="sr-only sm:hidden">Hide the preview banner</span>
      </Button>
    </div>
  )
}

/** Kept for anything still importing the old name. */
export const PreviewMarker = () => null
