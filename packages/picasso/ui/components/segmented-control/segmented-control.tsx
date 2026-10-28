// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * SegmentedControl
 *
 * A choice that stays selected, drawn as one control: a muted track with the
 * current option on a raised thumb. It is for two to five short options that
 * are the same kind of thing — Ascending / Descending, Day / Week / Month.
 *
 * It exists because ButtonGroup is not this. A ButtonGroup is a set of
 * actions and nothing in it stays pressed; the mobile Sort sheet had borrowed
 * one, with a Secondary button standing in for "selected", and it read as two
 * unrelated buttons. The thumb-on-a-track shape is deliberately not a row of
 * buttons, so the two cannot be mistaken for each other (Ee's call, 2 Oct).
 *
 * It is a radio group, not a toggle group and not tabs. One option is always
 * selected, arrow keys move the selection, and a screen reader announces
 * "radio, 1 of 2". Use Tabs when each option shows a different panel; use
 * this when the option is a value.
 *
 * Measurements:
 *
 *   track    bg/neutral/muted, radius/md, 2px padding, 2px gap
 *   thumb    bg/card, radius/sm (the track's 8 less its 2 of padding),
 *            shadow/xs — the selected option only
 *   height   36 (md) · 32 (sm), the heights of Button and Input, so it
 *            sits in a row with either
 *   label    label/md (md) · label/sm (sm); fg/neutral/muted at rest,
 *            fg/neutral/emphasis when selected or hovered
 *   icon     16, before the label
 *
 * In dark the thumb is the card colour on a lighter track, so it reads as a
 * cut-out rather than a raised pill. That is the tokens doing what they say;
 * the selected label's contrast carries it in both themes.
 *
 * No motion on the thumb. Sliding it between options needs a measured
 * position, which is a different mechanism from the motion tokens' fixed
 * fades; the selection changes instantly, with `transition-colors` on the
 * label.
 */
const segmentedControlVariants = cva(
  "items-stretch gap-0.5 rounded-md bg-surface-neutral-muted p-0.5",
  {
    variants: {
      size: { sm: "h-8", md: "h-9" },
      fullWidth: { true: "flex w-full", false: "inline-flex w-fit" },
    },
    defaultVariants: { size: "md", fullWidth: false },
  },
);

const segmentedControlItemVariants = cva(
  "inline-flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-sm px-3 " +
    "whitespace-nowrap text-content-neutral-muted outline-none transition-colors " +
    "hover:text-content-neutral-emphasis " +
    // selected — the thumb
    "data-[state=checked]:bg-surface-card data-[state=checked]:text-content-neutral-emphasis " +
    "data-[state=checked]:shadow-xs " +
    "focus-visible:ring-2 focus-visible:ring-line-focused " +
    "disabled:cursor-not-allowed disabled:text-content-disabled " +
    "disabled:hover:text-content-disabled " +
    // a disabled option that is selected keeps its thumb, with disabled text
    "disabled:data-[state=checked]:text-content-disabled " +
    "[&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      size: { sm: "text-label-sm", md: "text-label-md" },
      fullWidth: { true: "flex-1", false: "" },
    },
    defaultVariants: { size: "md", fullWidth: false },
  },
);

type Shape = VariantProps<typeof segmentedControlVariants>;
const SegmentedControlContext = React.createContext<Shape>({});

export interface SegmentedControlProps
  extends
    Omit<React.ComponentProps<typeof RadioGroupPrimitive.Root>, "orientation">,
    Shape {}

export function SegmentedControl({
  className,
  size,
  fullWidth,
  ...props
}: SegmentedControlProps) {
  const shape = React.useMemo(() => ({ size, fullWidth }), [size, fullWidth]);
  return (
    <SegmentedControlContext.Provider value={shape}>
      <RadioGroupPrimitive.Root
        data-slot="segmented-control"
        // Always a row, and declared: Radix decides which arrow keys move the
        // selection from this, so it has to match what someone sees.
        orientation="horizontal"
        className={cn(segmentedControlVariants({ size, fullWidth }), className)}
        {...props}
      />
    </SegmentedControlContext.Provider>
  );
}

export type SegmentedControlItemProps = React.ComponentProps<
  typeof RadioGroupPrimitive.Item
>;

export function SegmentedControlItem({
  className,
  ...props
}: SegmentedControlItemProps) {
  const { size, fullWidth } = React.useContext(SegmentedControlContext);
  return (
    <RadioGroupPrimitive.Item
      data-slot="segmented-control-item"
      className={cn(
        segmentedControlItemVariants({ size, fullWidth }),
        className,
      )}
      {...props}
    />
  );
}

export { segmentedControlVariants, segmentedControlItemVariants };
