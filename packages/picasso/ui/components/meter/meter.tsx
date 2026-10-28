// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Meter
 *
 * A ten-segment bar for a value against a known ceiling — MOS out of 5, a
 * score out of 100. Not a progress bar: nothing here is completing.
 *
 * FROM FIGMA (`Drilldown / Meter`, 1462:1192), and from its own description:
 *
 *   10 segments, 8 tall, gap 4, radius/xs
 *   lit segments take status/<tone>; the rest take bg/layer/emphasis
 *   (a correction — it was border/neutral/muted, a border token used as a
 *   fill; the layer ramp is the neutral for fills that must be seen)
 *   Fill moves in 20% STEPS, always rounding UP — 0.6/5 lights 20%,
 *   3.2/5 lights 80% — so any non-zero value lights at least one step
 *   `unknown` lights nothing: no reading is not the same as zero
 *
 * ⚠️ Figma: "Decorative on its own — always pair with a visible value." So
 * this is `aria-hidden` and carries no ARIA value of its own. The number
 * beside it is what a screen reader reads, and duplicating it here would
 * announce the same figure twice. If you ever use a Meter *without* a
 * visible value, give it `role="meter"` and the aria-* attributes yourself —
 * but the design says don't.
 */
const SEGMENTS = 10;
const STEP = 20; // percent per step; two segments

export type MeterStatus =
  "healthy" | "warning" | "critical" | "neutral" | "unknown";

const LIT: Record<MeterStatus, string> = {
  healthy: "bg-status-healthy",
  warning: "bg-status-warning",
  critical: "bg-status-critical",
  // Figma's `Status=Neutral`: a metric with a value and no thresholds. It
  // lights in fg/neutral/muted — the reading is real, it just is not being
  // judged. This was missing, so a status-less tile showed an empty bar.
  neutral: "bg-content-neutral-muted",
  // ⚠️ Not in Figma. `unknown` is no reading at all, which is a different
  // thing from a reading nobody grades, and the file has no variant for it.
  // The bar stays empty, because a grey "amount" would be a number we do
  // not have. Added deliberately; raised rather than assumed.
  unknown: "bg-surface-layer-emphasis",
};

/** Segments lit for a value, in 20% steps, rounded up. Exported for tests. */
export function litSegments(value: number, max: number) {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(max) ||
    max <= 0 ||
    value <= 0
  )
    return 0;
  const pct = Math.min(100, (value / max) * 100);
  return Math.min(SEGMENTS, Math.ceil(pct / STEP) * (SEGMENTS / (100 / STEP)));
}

export interface MeterProps extends React.ComponentProps<"div"> {
  value: number;
  /** The ceiling the value is measured against. MOS is out of 5. */
  max?: number;
  status?: MeterStatus;
}

export function Meter({
  className,
  value,
  max = 100,
  status = "healthy",
  ...props
}: MeterProps) {
  const lit = status === "unknown" ? 0 : litSegments(value, max);
  return (
    <div
      data-slot="meter"
      data-status={status}
      aria-hidden
      className={cn("flex w-full items-center gap-1", className)}
      {...props}
    >
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <span
          key={i}
          data-lit={i < lit || undefined}
          className={cn(
            "h-2 flex-1 rounded-xs",
            i < lit ? LIT[status] : "bg-surface-layer-emphasis",
          )}
        />
      ))}
    </div>
  );
}
