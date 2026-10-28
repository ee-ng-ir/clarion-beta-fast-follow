// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Sparkline — a chart stripped to its shape. No axes, no gridlines, no ticks,
 * no labels: Tufte's "word-sized graphic". It answers which way this is going
 * and whether it is steady, and nothing else, so it always sits beside the
 * number it belongs to rather than standing alone.
 *
 * Figma: none. Code first.
 *
 * Two homes: a table cell, where it makes fifty trunks scannable in one pass,
 * and a KpiTile, where the headline number is now and the line is the last
 * day. Sized by the caller — `h-6 w-20` in a cell, `h-10 w-full` in a tile.
 *
 * ⚠️ No crosshair, no tooltip, no hover. That is deliberate rather than
 * missing: reading a value off a 24px-tall line is not possible, and a
 * crosshair without an axis to read against is furniture pretending to be
 * information. Values are the time-series chart's job; this is the shape.
 *
 * ⚠️ One series only. There is no series axis and no legend, because two
 * lines in 80 × 24 is two lines nobody can follow — and because the chart
 * palette cannot currently tell eight series apart anyway.
 *
 * Mark specs follow the dataviz rules: the line is 2px with round joins and
 * caps at every rendered size (`vector-effect="non-scaling-stroke"`, because a
 * sparkline is stretched to whatever box it is given and a scaled stroke would
 * come out a different weight in every column), and the end dot is 8px with a
 * 2px ring in the surface colour so it stays visible where the line doubles
 * back under it.
 *
 * The dot is an HTML element positioned in percentages, not an SVG circle: the
 * viewBox is stretched non-uniformly, so a circle drawn inside it would arrive
 * as an ellipse.
 */

/** Normalised drawing space. The viewBox is stretched to the box it is given. */
const W = 100;
const H = 100;

export type SparklineTone =
  | "primary"
  | "neutral"
  | "healthy"
  | "warning"
  | "critical";

const STROKE: Record<SparklineTone, string> = {
  primary: "stroke-chart-1",
  neutral: "stroke-content-neutral-subtle",
  healthy: "stroke-status-healthy",
  warning: "stroke-status-warning",
  critical: "stroke-status-critical",
};
const FILL: Record<SparklineTone, string> = {
  primary: "text-chart-1",
  neutral: "text-content-neutral-subtle",
  healthy: "text-status-healthy",
  warning: "text-status-warning",
  critical: "text-status-critical",
};

export interface SparklineProps
  extends Omit<React.ComponentProps<"span">, "children"> {
  /**
   * The series, oldest first. `null` is missing data and leaves a gap — it is
   * never plotted as zero, which would invent a reading.
   */
  values: readonly (number | null)[];
  /**
   * What the shape says, in words, for anyone who cannot see it — "MOS over 24
   * hours, 4.4 falling to 4.1". `null` where the row or tile around it already
   * says the same thing. Not optional: a label generated from the numbers
   * would describe the data and not the point.
   */
  label: string | null;
  /** Line, or line with the area under it filled. */
  variant?: "line" | "area";
  /**
   * `primary` unless the thing is graded. A status tone is only for use where
   * the status is also written down — a KpiTile badge, a table status cell —
   * never as the only thing saying so.
   */
  tone?: SparklineTone;
  /** Pin the low end of the scale. Defaults to the lowest value present. */
  min?: number;
  /** Pin the high end. Defaults to the highest value present. */
  max?: number;
  /** A dot on the newest point. On by default — it says which end is now. */
  end?: boolean;
  /** A dashed rule across the plot: a threshold, a target, an SLA floor. */
  threshold?: number;
}

type Pt = { x: number; y: number };

/** Runs of consecutive readings. A gap ends a run; it does not bridge one. */
function runs(values: readonly (number | null)[], lo: number, hi: number) {
  const span = hi - lo;
  const out: Pt[][] = [];
  let run: Pt[] = [];
  values.forEach((v, i) => {
    if (v === null || !Number.isFinite(v)) {
      if (run.length) out.push(run);
      run = [];
      return;
    }
    run.push({
      x: values.length > 1 ? (i / (values.length - 1)) * W : W / 2,
      // A flat series sits on the centre line rather than on the floor: zero
      // span would divide by zero, and a flat line at the bottom reads as a
      // collapse rather than as steady.
      y: span === 0 ? H / 2 : (1 - (v - lo) / span) * H,
    });
  });
  if (run.length) out.push(run);
  return out;
}

const d = (pts: Pt[]) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");

export function Sparkline({
  className,
  values,
  label,
  variant = "line",
  tone = "primary",
  min,
  max,
  end = true,
  threshold,
  ...props
}: SparklineProps) {
  const numbers = values.filter(
    (v): v is number => v !== null && Number.isFinite(v),
  );
  const lo = min ?? Math.min(...numbers);
  const hi = max ?? Math.max(...numbers);
  const span = hi - lo;

  const segments = numbers.length >= 2 ? runs(values, lo, hi) : [];
  const lastRun = segments.at(-1);
  const last = lastRun?.at(-1);

  const thresholdY =
    threshold === undefined || span === 0
      ? null
      : (1 - (threshold - lo) / span) * H;

  const a11y =
    label === null
      ? ({ "aria-hidden": true } as const)
      : ({ role: "img", "aria-label": label } as const);

  return (
    <span
      data-slot="sparkline"
      data-tone={tone}
      data-empty={segments.length ? undefined : ""}
      className={cn("relative block h-6 w-20", FILL[tone], className)}
      {...a11y}
      {...props}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        /* Stretched to the box, which is the whole idea of a sparkline: it
           fills whatever column or tile it is put in. */
        preserveAspectRatio="none"
        fill="none"
        className="block size-full overflow-visible"
        aria-hidden
      >
        {thresholdY !== null && thresholdY >= 0 && thresholdY <= H ? (
          <line
            data-slot="sparkline-threshold"
            x1={0}
            x2={W}
            y1={thresholdY}
            y2={thresholdY}
            vectorEffect="non-scaling-stroke"
            strokeWidth={1}
            strokeDasharray="3 3"
            className="stroke-line-neutral-emphasis"
          />
        ) : null}

        {variant === "area"
          ? segments.map((pts, i) => (
              <path
                key={`a${i}`}
                data-slot="sparkline-area"
                d={`${d(pts)} L${pts.at(-1)!.x.toFixed(2)} ${H} L${pts[0].x.toFixed(2)} ${H} Z`}
                /* The tone's own colour at low alpha, so the fill follows the
                   line without a second token per tone. */
                className="fill-current/15"
                stroke="none"
              />
            ))
          : null}

        {segments.map((pts, i) =>
          pts.length === 1 ? (
            /* A run of one has no line to draw. Without this a lone reading
               between two gaps would vanish. */
            <circle
              key={`p${i}`}
              data-slot="sparkline-point"
              cx={pts[0].x}
              cy={pts[0].y}
              r={1.5}
              fill="currentColor"
              stroke="none"
              /* Drawn in the stretched space, so kept small enough that the
                 distortion does not read. */
            />
          ) : (
            <path
              key={`p${i}`}
              data-slot="sparkline-line"
              d={d(pts)}
              vectorEffect="non-scaling-stroke"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={STROKE[tone]}
            />
          ),
        )}
      </svg>

      {end && last ? (
        <span
          data-slot="sparkline-end"
          aria-hidden
          /* HTML, not SVG: the viewBox is stretched, so a circle inside it
             would arrive as an ellipse. Percentages put it on the point and
             the ring keeps it off the line it sits on. */
          className={cn(
            "absolute size-2 rounded-full bg-current ring-2 ring-surface-card",
            "start-(--spark-x) top-(--spark-y) -translate-x-1/2 -translate-y-1/2",
          )}
          style={
            {
              /* Clamped so the dot and its ring stay inside the box. Centred
                 on the point, half the 8px dot plus the 2px ring hangs out at
                 x=100% — which is where a sparkline's last reading always is —
                 and that 6px scrolled the whole page sideways on a phone. The
                 cost is up to 6px of position at the extremes; the dot marks
                 the latest value rather than measuring it, so being fully
                 visible is worth more than being exactly on the endpoint. */
              "--spark-x": `clamp(0.375rem, ${last.x}%, calc(100% - 0.375rem))`,
              "--spark-y": `${last.y}%`,
            } as React.CSSProperties
          }
        />
      ) : null}
    </span>
  );
}
