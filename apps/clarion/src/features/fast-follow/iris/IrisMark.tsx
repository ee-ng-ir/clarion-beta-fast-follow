import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import "./iris-mark.css"

/**
 * What Iris is doing, for the one mark that animates (the panel header).
 * - `rest` — still. Chips, buttons and prompts always use this.
 * - `idle` — glances across the page and blinks now and then.
 * - `listening` — the prompt has focus: the eyes turn to you and widen.
 * - `thinking` — the eyes look up and drift. Inside the thread, the Pulse
 *   loader still shows the wait; this is the face, not the progress.
 * - `answered` — a hop and a wink, once, when an answer lands.
 */
export type IrisMood = "rest" | "idle" | "listening" | "thinking" | "answered"

export type IrisMarkProps = Omit<ComponentProps<"svg">, "children"> & {
  mood?: IrisMood
  /**
   * `colour` keeps the IR eyes, blue then red (the logo's two dots, blue
   * higher and larger). `mono` draws everything in currentColor — use it on
   * filled buttons and coloured tiles, where the eyes would clash.
   */
  tone?: "colour" | "mono"
}

/**
 * Iris's mark: the IR logo's two dots as a pair of eyes in a soft tile.
 * Replaces the generic Sparkles wherever Iris is meant. 24-unit grid, 2px
 * stroke to sit beside lucide icons; the tile is currentColor.
 *
 * Decorative by default (`aria-hidden`), since it always sits beside text
 * naming Iris. Motion is never the only signal, and reduced motion holds it
 * still. Explored on the "Iris mark explorations" canvas.
 */
export function IrisMark({ mood = "rest", tone = "colour", className, ...props }: IrisMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable="false"
      data-slot="iris-mark"
      data-mood={mood}
      data-tone={tone}
      className={cn("iris-mark size-4 shrink-0", className)}
      {...props}
    >
      <g className="iris-mark-face">
        <path
          d="M10.5 4.5h3a7 7 0 0 1 7 7v1a7 7 0 0 1-7 7h-3a7 7 0 0 1-7-7v-1a7 7 0 0 1 7-7Z"
          stroke="currentColor"
          strokeWidth={2}
        />
        <g className="iris-mark-eyes">
          <circle className="iris-mark-eye iris-mark-eye-l" cx="9.1" cy="12" r="2.5" />
          <circle className="iris-mark-eye iris-mark-eye-r" cx="15.2" cy="13" r="2.1" />
        </g>
      </g>
    </svg>
  )
}
