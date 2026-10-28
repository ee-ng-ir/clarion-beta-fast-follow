// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * Progress
 *
 * Work in flight, with an end. An upload, an import, a scan. It only makes
 * sense where something is finishing — a reading that can go back down is a
 * Meter, and a wait with no known duration is a spinner.
 *
 * FROM FIGMA (`Progress` 2298:15158), as drawn:
 *
 *   track      8 tall, full radius, bg/layer/emphasis
 *   indicator  full radius, bg/primary/emphasis (brand) or
 *              bg/neutral/emphasis (neutral)
 *   label      optional row above, space-between, both sides metric/md
 *              in fg/neutral/emphasis
 *   gap        8 between the label row and the track
 *
 * ⚠️ The track was drawn on bg/neutral/subtle. That is neutral-50 in light —
 * the app background itself, and one step off a white card — so the track
 * vanished and the bar had no visible end: 40% read as a short bar, not as
 * 40% of something. Corrected to bg/layer/emphasis: a translucent tint that
 * reads the same on the page, on a card and in both modes, which is what a
 * thin track needs — bg/neutral/muted (one step past subtle since 2 Oct) is
 * still only 1.05 on the page in light. A resting track also should not
 * borrow a state word like "pressed". Slider, Meter and File upload take the
 * same token. Figma corrected to match.
 *
 * Figma pins Percent to 0/25/50/75/100 because a variant set needs discrete
 * options. Here it is a number: the bar is drawn by width, so the steps were
 * only ever a way to draw five pictures of one continuous thing.
 */
const indicatorVariants = cva(
  // Linear: the bar is reporting progress, and progress does not ease.
  "h-full w-full flex-1 rounded-full transition-transform ease-linear motion-reduce:transition-none",
  {
    variants: {
      variant: {
        brand: "bg-surface-primary-emphasis",
        neutral: "bg-surface-neutral-emphasis",
      },
    },
    defaultVariants: { variant: "brand" },
  },
);

export interface ProgressProps
  extends
    React.ComponentProps<typeof ProgressPrimitive.Root>,
    VariantProps<typeof indicatorVariants> {
  /** 0–100. Leave undefined for work of unknown length — see the note below. */
  value?: number | null;
  /** The left-hand label. Its presence is what draws the label row. */
  label?: React.ReactNode;
  /** The right-hand label. Defaults to the percentage when a label is set. */
  valueLabel?: React.ReactNode;
}

export function Progress({
  className,
  value,
  variant,
  label,
  valueLabel,
  ...props
}: ProgressProps) {
  const pct = value == null ? null : Math.min(100, Math.max(0, value));
  return (
    <div
      data-slot="progress-root"
      className={cn("flex flex-col gap-2", className)}
    >
      {label ? (
        <div
          data-slot="progress-label"
          className="flex items-center justify-between text-metric-md text-content-neutral-emphasis"
        >
          <span>{label}</span>
          {/* A figure reads left to right in every locale. */}
          <span data-slot="progress-value" className="ltr-island">
            {valueLabel ?? (pct == null ? "" : `${Math.round(pct)}%`)}
          </span>
        </div>
      ) : null}
      <ProgressPrimitive.Root
        data-slot="progress"
        // Radix puts role="progressbar" and the aria-value* attributes here,
        // and omits aria-valuenow when value is null — which is exactly how
        // an indeterminate bar should announce itself.
        value={pct}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-surface-layer-emphasis",
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            indicatorVariants({ variant }),
            // The bar fills from the inline start, so in RTL the offset is
            // the same distance the other way. There is no logical translate.
            "translate-x-(--progress-offset) rtl:-translate-x-(--progress-offset)",
          )}
          // translateX rather than width: a transform animates on the
          // compositor, so a bar that updates often never relayouts.
          //
          // The offset travels as a CSS custom property, consumed by
          // Tailwind v4's `translate-x-(--var)` shorthand. That is the house
          // pattern for a dynamic value: an inline `transform` is refused by
          // no-inline-styles, and `translate-x-[calc(...)]` by
          // no-arbitrary-values — both correctly. A variable reference is
          // neither an inline style nor a magic number, so the arithmetic
          // stays in JS where the value comes from.
          style={
            {
              "--progress-offset": `-${100 - (pct ?? 0)}%`,
            } as React.CSSProperties
          }
        />
      </ProgressPrimitive.Root>
    </div>
  );
}

export { indicatorVariants as progressIndicatorVariants };
