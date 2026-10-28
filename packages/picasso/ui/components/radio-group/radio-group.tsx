// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * RadioGroup / Radio
 *
 * One of many. A radio cannot be unticked by the person who ticked it — that
 * is the difference from Checkbox, and the reason a group needs a sensible
 * default or an explicit "None" option.
 *
 * The group is mandatory: a lone radio is not a control. Arrow keys move
 * between the options of a group, and without one there is nothing to move
 * through — Radix throws if you try.
 *
 * FROM FIGMA (`798:32`, 20 variants), as drawn:
 *
 *   box        20 (md) · 16 (sm), full radius, 1.5px border
 *   dot        8 (md) · 6 (sm), bg/primary/emphasis
 *   off        bg/input/default, border/neutral/emphasis
 *   hover off  bg/input/hovered              hover on  dot -emphasis-hovered
 *   focus      ring/focus
 *   on         border/primary/emphasis, the box colour unchanged
 *   disabled   bg/input/disabled, border/input/disabled
 *   disabled on  bg/input/disabled, border/input/disabled, dot fg/disabled — the
 *              pairing a disabled checked Checkbox takes (decided 2 Oct; the
 *              ring and dot were full primary, which read as live)
 *   invalid    ring/focus-danger over the resting colours
 *
 * ⚠️ Figma's 1.5px border **cannot render in a browser.** Chrome floors a
 * fractional border width to 1px, in plain CSS, at every pixel ratio
 * (measured: `border:1.5px` and `border:1px` give identical layout and
 * identical computed values at DPR 1 and 2). 1px is not a change from the
 * spec — it is the only form the spec can take on the web.
 */
const radioVariants = cva(
  "group aspect-square shrink-0 rounded-full border transition-colors outline-none " +
    // A bare control is its own target. 16px square is under the 24 floor
    // (WCAG 2.2 AA, 2.5.8), and a Checkbox in a table cell or a states
    // matrix has no label row to inherit — FieldOption covers the ones
    // that do. The hit area grows, the box does not. 24 and not 44:
    // a table row cannot spare 44, and where there is room there is a
    // FieldOption giving 44 already.
    "relative after:absolute after:-inset-1.5 " +
    "bg-surface-input-default border-line-neutral-emphasis " +
    "hover:bg-surface-input-hovered " +
    "focus-visible:ring-2 focus-visible:ring-line-focused " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app " +
    // selected colours the ring, not the box
    "data-[state=checked]:border-line-primary-emphasis " +
    // invalid is a danger ring over whatever the radio is doing
    "aria-invalid:shadow-ring-focus-danger " +
    "disabled:cursor-not-allowed " +
    "disabled:bg-surface-input-disabled disabled:hover:bg-surface-input-disabled " +
    "disabled:border-line-input-disabled " +
    // disabled AND selected — grey, not primary, so it does not read as live.
    // The pairing a disabled checked Checkbox takes; the dot is the mark.
    "disabled:data-[state=checked]:bg-surface-input-disabled " +
    "disabled:data-[state=checked]:hover:bg-surface-input-disabled " +
    "disabled:data-[state=checked]:border-line-input-disabled",
  {
    variants: {
      size: {
        sm: "size-4 [&_[data-slot=radio-dot]]:size-1.5",
        md: "size-5 [&_[data-slot=radio-dot]]:size-2",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export function RadioGroup({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      // Declared, not inferred. Radix decides which arrow keys move focus from
      // this, so leaving it unset means Down does nothing on a group that is
      // visibly a vertical stack — the arrow that matches what someone sees.
      orientation={orientation}
      className={cn(
        "grid gap-2.5",
        orientation === "horizontal" && "grid-flow-col auto-cols-max gap-5",
        className,
      )}
      {...props}
    />
  );
}

export interface RadioProps
  extends
    Omit<React.ComponentProps<typeof RadioGroupPrimitive.Item>, "size">,
    VariantProps<typeof radioVariants> {}

export function Radio({ className, size, ...props }: RadioProps) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio"
      className={cn(radioVariants({ size }), className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex h-full w-full items-center justify-center">
        <span
          data-slot="radio-dot"
          className={cn(
            "rounded-full bg-surface-primary-emphasis transition-colors",
            "group-hover:bg-surface-primary-emphasis-hovered",
            "group-disabled:bg-content-disabled group-disabled:group-hover:bg-content-disabled",
          )}
        />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { radioVariants };
