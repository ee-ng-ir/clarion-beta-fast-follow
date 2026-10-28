import { useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * An (i) icon that reveals an explanatory tooltip on hover. The bubble is
 * portalled to <body> and positioned in viewport coordinates with collision
 * clamping, so it never gets clipped by a scroll/overflow container (drawers,
 * tables, cards). `side`/`align` are accepted for call-site intent but the
 * final placement auto-adjusts to stay on screen.
 */
export function InfoTip(props: {
  text: string
  className?: string
  side?: "top" | "bottom"
  align?: "center" | "start" | "end"
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const show = () => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const width = 240, estHeight = 84, margin = 8, gap = 6
    // horizontally centred on the icon, clamped to the viewport
    let left = r.left + r.width / 2 - width / 2
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin))
    // prefer below the icon; flip above if it would run off the bottom
    let top = r.bottom + gap
    if (top + estHeight > window.innerHeight - margin) top = r.top - estHeight - gap
    top = Math.max(margin, top)
    setPos({ top, left })
  }
  const hide = () => setPos(null)

  return (
    <span
      ref={ref}
      onMouseEnter={show}
      onMouseLeave={hide}
      className={cn("inline-flex shrink-0 cursor-help items-center align-middle", props.className)}
    >
      <Info className="size-3.5" style={{ color: "var(--fg-neutral-subtle)" }} />
      {pos && createPortal(
        <div
          role="tooltip"
          className="pointer-events-none fixed z-[100] w-60 rounded-lg px-3 py-2.5 text-xs font-normal normal-case leading-relaxed tracking-normal"
          style={{ top: pos.top, left: pos.left, background: "var(--bg-neutral-emphasis)", color: "var(--fg-on-neutral-emphasis)", boxShadow: "var(--shadow-md)" }}
        >
          {props.text}
        </div>,
        document.body,
      )}
    </span>
  )
}
