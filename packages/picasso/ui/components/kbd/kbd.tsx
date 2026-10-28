// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * Kbd
 *
 * STRUCTURE comes from Figma — the `Background` axis and the semantic token
 * each option uses. Names mirror the Figma component (Kbd 45:2487).
 *
 * MEASUREMENTS come from shadcn — h-5, min-w-5, px-1, gap-1, 12px icons.
 * These already agree with Figma (space/5, space/1).
 *
 * Radius is `rounded-sm` (radius/sm, 6px at the default theme). It was
 * radius/lg (10px) in Figma and read as a pill at 20px tall — corrected in
 * both places on 28 Sept.
 *
 * The key cap is a 1px bottom border plus shadow/xs, not a full outline.
 */
const kbdVariants = cva(
  "inline-flex h-5 min-w-5 w-fit select-none items-center justify-center gap-1 " +
    "rounded-sm border-b px-1 font-sans text-label-sm shadow-xs " +
    "pointer-events-none [&_svg:not([class*='size-'])]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      background: {
        // Default and Neutral are identical in Figma today. Both are kept so a
        // design reads straight into props; collapse them together if Figma does.
        default:
          "bg-surface-neutral-muted border-line-inverse text-content-neutral-muted",
        neutral:
          "bg-surface-neutral-muted border-line-inverse text-content-neutral-muted",
        brand:
          "bg-surface-primary-subtle border-line-focused text-content-primary-emphasis",
        opaque:
          "bg-surface-primary-subtle border-line-neutral-muted text-content-primary-emphasis",
        // For use on a filled surface (e.g. inside a primary Button).
        "on-emphasis":
          "bg-surface-layer-on-emphasis-emphasis/18 border-surface-layer-on-emphasis-subtle/10 " +
          "text-content-on-primary-emphasis",
      },
    },
    defaultVariants: { background: "default" },
  },
);

export interface KbdProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof kbdVariants> {}

export const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, background, ...props }, ref) => (
    <kbd
      ref={ref}
      data-slot="kbd"
      className={cn(kbdVariants({ background }), className)}
      {...props}
    />
  ),
);
Kbd.displayName = "Kbd";

export type KbdGroupProps = React.HTMLAttributes<HTMLElement>;

/** A key combination — Figma KbdGroup (2501:6884), gap space/1. */
export const KbdGroup = React.forwardRef<HTMLElement, KbdGroupProps>(
  ({ className, ...props }, ref) => (
    <kbd
      ref={ref}
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  ),
);
KbdGroup.displayName = "KbdGroup";

export { kbdVariants };
