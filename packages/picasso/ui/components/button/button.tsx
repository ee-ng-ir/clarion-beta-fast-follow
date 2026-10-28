// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Button
 *
 * STRUCTURE comes from Figma — which variants, sizes and states exist, and
 * which semantic token each one uses. Names mirror the Figma component
 * exactly, so a design reads straight into props.
 *
 * MEASUREMENTS come from shadcn — height, padding, gap, radius.
 *
 * Height is 28/32/36/40 on both sides. Figma drew 24/28/32/36 until 2 Oct
 * 2026 and was moved to match (Ee's call), so md is 36 beside a 36 Input.
 *
 * Padding (10/12/16/24), gap (6/6/8/8), label (label/sm at xs and sm) and
 * icon size (14 at xs) match Figma too, since the same day.
 *
 * One thing Figma cannot follow: `has-[>svg]` trims the padding a step when
 * a button carries an icon. Figma shows the icon with a toggle and cannot
 * change padding from one, so a button with an icon is 4–8px wider there.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md " +
    "border border-transparent font-medium cursor-pointer " +
    // The press. The button gives 3% under the pointer and takes its label
    // and icon with it; `transition-press` is the colours it always
    // animated, plus `scale`, on motion/duration/fast. Not inside a
    // ButtonGroup, where one member shrinking away from its neighbours
    // reads as the group coming apart — and not under reduced motion,
    // where the pressed colour answers alone.
    "transition-press motion-safe:not-in-data-[slot=button-group]:active:scale-97 " +
    "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-line-focused " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app " +
    "disabled:pointer-events-none " +
    "[&:disabled:not([data-loading])]:text-content-disabled " +
    "[&:disabled:not([data-loading])]:border-transparent " +
    "[&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-surface-primary-emphasis text-content-on-primary-emphasis " +
          "hover:bg-surface-primary-emphasis-hovered " +
          "active:bg-surface-primary-emphasis-pressed " +
          "[&:disabled:not([data-loading])]:bg-surface-disabled",
        neutral:
          "bg-surface-neutral-emphasis text-content-on-neutral-emphasis " +
          "hover:bg-surface-neutral-emphasis-hovered " +
          "active:bg-surface-neutral-emphasis-pressed " +
          "[&:disabled:not([data-loading])]:bg-surface-disabled",
        secondary:
          "border-line-neutral-emphasis bg-surface-neutral-muted text-content-neutral-emphasis " +
          "hover:bg-surface-neutral-muted-hovered " +
          "active:bg-surface-neutral-muted-pressed " +
          "[&:disabled:not([data-loading])]:bg-surface-disabled",
        destructive:
          "border-line-danger-muted bg-surface-danger-subtle text-content-on-danger-subtle " +
          "hover:bg-surface-danger-subtle-hovered " +
          "active:bg-surface-danger-subtle-pressed " +
          "focus-visible:ring-line-danger-emphasis " +
          "[&:disabled:not([data-loading])]:bg-surface-disabled",
        outline:
          "border-line-neutral-muted bg-surface-card text-content-neutral-emphasis " +
          "hover:bg-surface-neutral-subtle-hovered " +
          "active:bg-surface-neutral-subtle-pressed " +
          "[&:disabled:not([data-loading])]:bg-surface-disabled",
        // Transparent at rest — a ghost that carries a resting fill reads as
        // Outline, and the hierarchy between primary and tertiary collapses.
        ghost:
          "bg-transparent text-content-neutral-emphasis " +
          "hover:bg-surface-neutral-subtle-hovered " +
          "active:bg-surface-neutral-subtle-pressed " +
          "[&:disabled:not([data-loading])]:bg-transparent",
        // A text link, not a button in a box: no fill, no border, no radius.
        // Not underlined at rest — fg/link/* carries it at 7.66:1, and a
        // shared text style cannot be underlined for one consumer only.
        link:
          "bg-transparent border-0 rounded-none text-content-link-default " +
          "underline-offset-2 hover:text-content-link-hovered hover:underline " +
          "active:text-content-link-pressed " +
          // Text does not press: a link that shrinks reads as a glitch.
          "motion-safe:not-in-data-[slot=button-group]:active:scale-100 " +
          "[&:disabled:not([data-loading])]:bg-transparent",
      },
      size: {
        // Measurements are shadcn's, mapped onto Figma's size names.
        // shadcn has three text sizes (sm/default/lg); Figma has four, so xs
        // extrapolates one step below shadcn's sm on the same rhythm.
        // has-[>svg] trims horizontal padding when an icon is present —
        // shadcn's own trick, so icon+label does not read as over-padded.
        xs: "h-7 gap-1.5 px-2.5 text-label-sm has-[>svg]:px-2 [&_svg]:size-3.5",
        sm: "h-8 gap-1.5 px-3 text-label-sm has-[>svg]:px-2.5 [&_svg]:size-4",
        md: "h-9 gap-2 px-4 py-2 text-label-md has-[>svg]:px-3 [&_svg]:size-4",
        lg: "h-10 gap-2 px-6 text-label-md has-[>svg]:px-4 [&_svg]:size-4",
        "icon-xs": "size-7 [&_svg]:size-3.5",
        "icon-sm": "size-8 [&_svg]:size-4",
        "icon-md": "size-9 [&_svg]:size-4",
        "icon-lg": "size-10 [&_svg]:size-4",
      },
    },
    compoundVariants: [
      {
        // cva applies size after variant, so link's box-stripping has to be
        // re-asserted here — otherwise every link inherits the size block's
        // height and padding and is a button in an invisible box.
        variant: "link",
        class: "size-auto p-0 gap-1",
      },
    ],
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as the child element, keeping Button's styling. */
  asChild?: boolean;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        data-loading={loading || undefined}
        data-slot="button"
        // Metadata, not styling. ButtonGroup needs to know which of its
        // children carry a visible border and which are solid, so it can draw
        // the divider between two solid buttons that Figma draws as a
        // separate 1px rectangle.
        data-variant={variant ?? "default"}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : null}
        <Slottable>{children}</Slottable>
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
