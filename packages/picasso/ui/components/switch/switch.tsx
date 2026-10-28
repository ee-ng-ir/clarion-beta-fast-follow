// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * Switch
 *
 * An immediate change. Flipping a Switch does the thing — there is no Save
 * button waiting behind it. That is the difference from Checkbox, and it
 * decides which control a question deserves: "Send notifications" in a
 * settings panel is a Switch; "Send notifications" in a form you submit is a
 * Checkbox. Two switches are two settings, never a choice — that is Radio.
 *
 * FROM FIGMA (`1604:99`, 20 variants), as drawn:
 *
 *   track      44×24 (md) · 36×20 (sm), full radius, 2px padding, 1px border
 *   knob       20 (md) · 16 (sm), white, shadow/sm, travels the gap
 *   off        bg/input/default, border/input/default
 *   hover off  border/input/hovered          hover on   bg/primary/emphasis-hovered
 *   focus      ring/focus + border/input/focused
 *   on         bg/primary/emphasis, no border
 *   disabled   bg/input/disabled, border/input/disabled
 *   disabled on  bg/input/disabled, border/input/disabled, knob fg/disabled — the
 *              pairing a disabled checked Checkbox takes (decided 2 Oct; it
 *              was full primary, which read as live)
 *   invalid    ring/focus-danger over the resting colours
 *
 * ⚠️ Figma draws the track border at **1.5px, which no browser can render** —
 * Chrome floors a fractional border width to 1px, in plain CSS, at every pixel
 * ratio (measured: `border:1.5px` and `border:1px` produce identical layout and
 * identical computed values at DPR 1 and 2). So 1px is not a change from the
 * Figma spec, it is the only form the spec can take on the web.
 *
 * The knob is `bg-white` rather than a token because it stays white in both
 * modes and no semantic expresses that — Figma binds `palette/white` here for
 * the same reason.
 */
const switchVariants = cva(
  "group peer inline-flex shrink-0 items-center rounded-full border p-0.5 " +
    // A bare control is its own target. 16px square is under the 24 floor
    // (WCAG 2.2 AA, 2.5.8), and a Checkbox in a table cell or a states
    // matrix has no label row to inherit — FieldOption covers the ones
    // that do. The hit area grows, the box does not. 24 and not 44:
    // a table row cannot spare 44, and where there is room there is a
    // FieldOption giving 44 already.
    "relative after:absolute after:-inset-1.5 " +
    "transition-colors outline-none " +
    "bg-surface-input-default border-line-input-default " +
    "hover:border-line-input-hovered " +
    "focus-visible:border-line-input-focused " +
    "focus-visible:ring-2 focus-visible:ring-line-focused " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app " +
    // ON — the track carries the colour and the border steps out of the way
    "data-[state=checked]:bg-surface-primary-emphasis " +
    "data-[state=checked]:border-transparent " +
    "data-[state=checked]:hover:bg-surface-primary-emphasis-hovered " +
    // invalid is a danger ring sitting over whatever the switch is doing
    "aria-invalid:shadow-ring-focus-danger " +
    "disabled:cursor-not-allowed " +
    "disabled:bg-surface-input-disabled disabled:border-line-input-disabled " +
    "disabled:hover:border-line-input-disabled " +
    // disabled AND on — grey, not primary, so it does not read as live.
    // The same pairing as a disabled checked Checkbox: bg/input/disabled, and the
    // mark (here the knob) in fg/disabled.
    "disabled:data-[state=checked]:bg-surface-input-disabled " +
    "disabled:data-[state=checked]:border-line-input-disabled " +
    "disabled:data-[state=checked]:hover:bg-surface-input-disabled",
  {
    variants: {
      // On is the inline end: the knob travels right in English and left in
      // Arabic. There is no logical translate, so RTL gets the same distance
      // the other way; without it the knob slides out of its own track.
      size: {
        sm:
          "h-5 w-9 [&_[data-slot=switch-thumb]]:size-4 " +
          "[&_[data-slot=switch-thumb]]:data-[state=checked]:translate-x-4 " +
          "rtl:[&_[data-slot=switch-thumb]]:data-[state=checked]:-translate-x-4",
        md:
          "h-6 w-11 [&_[data-slot=switch-thumb]]:size-5 " +
          "[&_[data-slot=switch-thumb]]:data-[state=checked]:translate-x-5 " +
          "rtl:[&_[data-slot=switch-thumb]]:data-[state=checked]:-translate-x-5",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface SwitchProps
  extends
    React.ComponentProps<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {}

export function Switch({ className, size, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(switchVariants({ size }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full shadow-sm ring-0",
          // White in both modes, as Figma draws it — except disabled and
          // on, where the knob is the mark and takes fg/disabled.
          "bg-white",
          "group-disabled:group-data-[state=checked]:bg-content-disabled",
          // The knob slides on motion/duration/fast (the default) and
          // easing/out, so it has left before the click has finished.
          // Under reduced motion it changes sides without travelling.
          "translate-x-0 transition-transform ease-out motion-reduce:transition-none",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { switchVariants };
