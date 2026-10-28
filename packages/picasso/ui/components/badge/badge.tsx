// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * Badge
 *
 * A short, static label on a thing — a status, a count, a category. It is
 * not a control: nothing happens when you click it. A badge people can act
 * on is a Button or a Chip.
 *
 * FROM FIGMA (`383:41`, 120 variants = Color × Style × Size × Leading):
 *
 *   box       radius/sm, gap 4
 *   md        padding 2/4, label/sm      lg   padding 4/8, label/lg
 *   subtle    bg/<c>/subtle + border/<c>/muted + fg/<c>/emphasis
 *   emphasis  bg/<c>/emphasis, no border, fg/on/<c>-emphasis
 *   outline   bg/card + border/neutral/muted + fg/neutral/emphasis
 *   dot       8px, from the STATUS palette — success→healthy, danger→critical
 *   icon      12px        avatar  16px
 *
 * ⚠️ **Outline ignores the colour.** All five colours render identically in
 * Figma — neutral fill, neutral border, neutral text — so 40 of the 120
 * variants collapse to 8. That is the file's spec and it is kept here, but
 * it means `<Badge variant="outline" color="danger">` is not a red badge and
 * never was. Raised, not changed.
 *
 * ⚠️ Neutral subtle takes `border/neutral/subtle` where every other colour
 * takes `border/<c>/muted` — a quieter edge for the quiet colour. Also the
 * file's spec.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-sm border " +
    "whitespace-nowrap [&>svg]:pointer-events-none",
  {
    variants: {
      color: {
        neutral: "",
        success: "",
        warning: "",
        danger: "",
        info: "",
      },
      variant: {
        subtle: "",
        emphasis: "border-transparent",
        // Colourless on purpose — see the note above.
        outline:
          "bg-surface-card border-line-neutral-muted text-content-neutral-emphasis",
      },
      size: {
        md: "px-1 py-0.5 text-label-sm [&>svg]:size-3",
        lg: "px-2 py-1 text-label-lg [&>svg]:size-3.5",
      },
    },
    compoundVariants: [
      // Subtle: the colour carries fill, edge and text.
      {
        variant: "subtle",
        color: "neutral",
        class:
          "bg-surface-neutral-muted border-line-neutral-muted text-content-neutral-emphasis",
      },
      {
        variant: "subtle",
        color: "success",
        class:
          "bg-surface-success-subtle border-line-success-muted text-content-success-emphasis",
      },
      {
        variant: "subtle",
        color: "warning",
        class:
          "bg-surface-warning-subtle border-line-warning-muted text-content-warning-emphasis",
      },
      {
        variant: "subtle",
        color: "danger",
        class:
          "bg-surface-danger-subtle border-line-danger-muted text-content-danger-emphasis",
      },
      {
        variant: "subtle",
        color: "info",
        class:
          "bg-surface-info-subtle border-line-info-muted text-content-info-emphasis",
      },
      // Emphasis: solid fill, and the ink that was measured to sit on it.
      {
        variant: "emphasis",
        color: "neutral",
        class: "bg-surface-neutral-emphasis text-content-on-neutral-emphasis",
      },
      {
        variant: "emphasis",
        color: "success",
        class: "bg-surface-success-emphasis text-content-on-success-emphasis",
      },
      {
        variant: "emphasis",
        color: "warning",
        class: "bg-surface-warning-emphasis text-content-on-warning-emphasis",
      },
      {
        variant: "emphasis",
        color: "danger",
        class: "bg-surface-danger-emphasis text-content-on-danger-emphasis",
      },
      {
        variant: "emphasis",
        color: "info",
        class: "bg-surface-info-emphasis text-content-on-info-emphasis",
      },
    ],
    defaultVariants: { color: "neutral", variant: "subtle", size: "md" },
  },
);

/* The dot is drawn from the STATUS palette, not the badge's own colour — so
 * a success badge gets status/healthy. Those are the five colours the product
 * already uses for probe state, and reusing them keeps one meaning per hue. */
const DOT = {
  neutral: "bg-status-unknown",
  success: "bg-status-healthy",
  warning: "bg-status-warning",
  danger: "bg-status-critical",
  info: "bg-status-info",
} as const;

export interface BadgeProps
  // `color` is a legacy presentational HTML attribute, so the native one is
  // dropped — the same collision Input has with `size` and TableCell with
  // `align`. Old HTML attribute names and good variant names overlap a lot.
  extends
    Omit<React.ComponentProps<"span">, "color">,
    VariantProps<typeof badgeVariants> {
  /** Render as the child element, keeping Badge's styling. */
  asChild?: boolean;
  /** An 8px status dot before the label, in the matching status colour. */
  dot?: boolean;
}

export function Badge({
  className,
  color,
  variant,
  size,
  asChild = false,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ color, variant, size }), className)}
      {...props}
    >
      {dot ? (
        <span
          data-slot="badge-dot"
          aria-hidden
          className={cn(
            "size-2 shrink-0 rounded-full",
            DOT[color ?? "neutral"],
          )}
        />
      ) : null}
      {/* Slottable, not a bare {children}: with asChild the dot and the label
          are two nodes, and Slot needs to know which one to merge into. Same
          reason Button wraps its label. */}
      <Slottable>{children}</Slottable>
    </Comp>
  );
}

export { badgeVariants };
