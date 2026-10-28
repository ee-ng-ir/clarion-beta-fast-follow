// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../../lib/utils";

/**
 * Slider — Figma `Slider` 1106:40, 12 variants (Type × State).
 *
 * Single and Range are the same component with one thumb or two, which is
 * how Radix models it too: pass one value or two. There is no `type` prop,
 * because the number of values already says which it is and a prop that can
 * disagree with the values is a prop that will.
 *
 * Figma's third Type, Threshold, is a different anatomy — colour bands
 * instead of a track, two differently-coloured thumbs, labels and min/max
 * markers — so it lives in `ThresholdSlider` rather than behind a `type`
 * prop here. Unlike Chip's five sets, this axis genuinely changes what is
 * drawn.
 *
 * Measured: track 6 tall at radius/sm on bg/layer/emphasis, range on
 * bg/primary/emphasis (bg/primary/emphasis-hovered on hover), thumb 16 round
 * on bg/card with a 2px border/primary/emphasis and shadow/xs.
 *
 * ⚠️ **The track is a correction.** It was drawn on bg/neutral/subtle-pressed,
 * which in dark is neutral-800 — the card itself — so the track vanished on
 * any card, and a resting track should not borrow a state word. It takes
 * bg/layer/emphasis, the system's token for a neutral fill that must be
 * seen on any surface; Progress and Meter use the same. Figma corrected.
 *
 * ⚠️ **Disabled is a correction.** All three Types draw `State=Disabled`
 * pixel-identical to `State=Default` — same fills, same strokes, same
 * effects. A disabled control that looks live is the same defect as the
 * seven Tab focus variants that showed no focus, so the code gives it the
 * system's usual treatment (bg/disabled range, a muted thumb edge) and
 * Figma is owed the fix.
 *
 * ⚠️ Hover and Focus carry raw drop and inner shadows rather than binding
 * `ring/focus`, so the ring here is the system's standard one rather than a
 * reproduction of three unbound effects. Raised.
 */
export interface SliderProps extends React.ComponentProps<
  typeof SliderPrimitive.Root
> {
  /** Names each thumb for screen readers — one per value. */
  thumbLabels?: string[];
}

export function Slider({ className, thumbLabels, ...props }: SliderProps) {
  // Radix is uncontrolled or controlled; either way the thumb count follows
  // the values, so read whichever one is present.
  const values = React.useMemo(
    () => props.value ?? props.defaultValue ?? [props.min ?? 0],
    [props.value, props.defaultValue, props.min],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "group/slider relative flex w-full touch-none items-center select-none",
        // The file's root is 24 tall around a 6 track, so the whole strip is
        // draggable rather than only the six pixels of the track itself.
        "data-[orientation=horizontal]:h-6",
        "data-[orientation=vertical]:h-44 data-[orientation=vertical]:w-auto",
        "data-[orientation=vertical]:flex-col",
        "data-[disabled]:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "relative grow overflow-hidden rounded-sm bg-surface-layer-emphasis",
          "h-1.5 w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute rounded-sm bg-surface-primary-emphasis transition-colors",
            "h-full data-[orientation=vertical]:w-full",
            // The file moves the range, not the thumb, on hover.
            "group-hover/slider:bg-surface-primary-emphasis-hovered",
            "group-data-[disabled]/slider:bg-surface-disabled",
          )}
        />
      </SliderPrimitive.Track>
      {values.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          data-slot="slider-thumb"
          aria-label={thumbLabels?.[i]}
          className={cn(
            "block size-4 shrink-0 rounded-full border-2 border-line-primary-emphasis " +
              // the grab area is 44 tall and 24 wide; the thumb stays 16
              // border-2 leaves a 12px padding box, so these reach 44 × 24
              "relative after:absolute after:-inset-y-4 after:-inset-x-1.5 " +
              "bg-surface-card shadow-xs transition-colors outline-none",
            "focus-visible:ring-2 focus-visible:ring-line-focused " +
              "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app",
            // Figma draws no disabled treatment at all — see the note above.
            "data-[disabled]:border-line-neutral-muted data-[disabled]:shadow-none",
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
}
