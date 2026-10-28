// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * ButtonGroup
 *
 * Several buttons that belong to one decision, joined into a single control:
 * outer corners rounded, every join square, one shared edge between
 * neighbours. It is for actions that sit at the same level — a split of one
 * job, or a set of views. It is **not** a radio group: nothing here stays
 * pressed, and if one option should remain selected afterwards, the control
 * is Radio or a segmented control, not this.
 *
 * FROM FIGMA (`667:1703`), as drawn:
 *
 *   join       outer corners at radius/md (the Button's own radius), every
 *              inner corner square
 *   outline    neighbours overlap by 1px so two borders read as one line
 *   secondary  the same
 *   default    solid buttons, divided by a 1px border/primary/muted line
 *   vertical   the same logic rotated — top and bottom corners round
 *
 * ⚠️ **Figma carries a `Variant` axis; this does not, on purpose.** In Figma
 * the group has to restate Outline / Default / Secondary because a component
 * cannot read what its children are. Here the children *are* Buttons and each
 * one already carries its own variant, so a group-level variant could only
 * duplicate or contradict them. The group owns the geometry; the buttons own
 * their colour. Same divergence the theme-architecture note records for
 * Input's `Type` axis — the code shape is the contract.
 *
 * Figma (since 2 Oct) keeps the first and last buttons permanent and toggles
 * the four between them, because a variant cannot move a rounded corner to
 * whichever button happens to be last. The frame has no border and does not
 * clip, as here, so a focus ring shows in full. Here the corners come from
 * `:first-child` / `:last-child`, so any number of children is correct.
 *
 * One thing Figma cannot draw: this lifts a hovered or focused member above
 * its neighbours (`z-raised`). In Figma the next button sits on top, so a
 * focus ring is covered along its trailing edge. The code is the reference.
 */
const buttonGroupVariants = cva(
  "flex w-fit items-stretch " +
    // Every join is square; the ends are rounded by position, not by index.
    "[&>*]:rounded-none " +
    // A focused or hovered button lifts above its neighbours, so its ring is
    // drawn in full instead of being painted over by the next button.
    "[&>*:hover]:z-raised [&>*:focus-visible]:z-raised [&>*:focus-within]:z-raised",
  {
    variants: {
      orientation: {
        horizontal:
          "flex-row -space-x-px " +
          "[&>*:first-child]:rounded-s-md [&>*:last-child]:rounded-e-md " +
          // Solid buttons have no visible border of their own, so the shared
          // edge has to be drawn. This is Figma's 1px separator rectangle,
          // expressed as the neighbour's leading border.
          "[&>[data-variant=default]:not(:first-child)]:border-s-line-primary-muted " +
          "[&>[data-variant=neutral]:not(:first-child)]:border-s-line-neutral-muted",
        vertical:
          "flex-col -space-y-px " +
          // Every child shares the group's width. `items-stretch` alone does
          // not do it: an icon button sets an explicit square width, which
          // wins over stretch, and the group ends in a half-width stub.
          "[&>*]:w-full " +
          "[&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-b-md " +
          "[&>[data-variant=default]:not(:first-child)]:border-t-line-primary-muted " +
          "[&>[data-variant=neutral]:not(:first-child)]:border-t-line-neutral-muted",
      },
    },
    defaultVariants: { orientation: "horizontal" },
  },
);

export interface ButtonGroupProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof buttonGroupVariants> {}

export function ButtonGroup({
  className,
  orientation,
  ...props
}: ButtonGroupProps) {
  return (
    <div
      // A group of related controls, so it is announced as one thing. Give it
      // an aria-label: "Zoom", "View as", "Export" — otherwise a screen reader
      // reads six buttons with nothing to say what they have in common.
      role="group"
      data-slot="button-group"
      data-orientation={orientation ?? "horizontal"}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

export { buttonGroupVariants };
