// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cn } from "../../lib/utils";
import {
  ChartFrame, ChartGridLines, ChartTable, ChartYAxis, SPAN, niceScale,
  type ChartSize,
} from "../chart/chart";

/**
 * DistributionChart — the shape of a spread, not its average. Latency, jitter
 * and call duration are the cases: a mean of 80ms hides whether that is every
 * call at 80 or half at 20 and half at 140, and the second one is the outage.
 *
 * Figma: none. Code first.
 *
 * ⚠️ The bars touch. A histogram's bins are a continuous axis cut into pieces,
 * so the 2px gap a BarChart puts between categories would be a lie here —
 * there is nothing between 20–40ms and 40–60ms. Only the group edges breathe.
 *
 * ⚠️ One hue, not six. Every bar is the same series, and the x position
 * already carries the order. Colouring bins by their value would spend the
 * identity channel re-encoding what the axis and the bar height both show.
 *
 * ⚠️ A marker here is VERTICAL. On a bar chart a threshold is a count — "no
 * more than 20 failures" — and runs across. On a histogram the number anyone
 * cares about is on the measured axis — a p95, an SLA limit — so it runs down.
 */

export interface DistributionMarker {
  /** A value on the measured axis — a percentile, a limit. */
  value: number;
  label: string;
}

export interface DistributionChartProps
  extends Omit<React.ComponentProps<"figure">, "title"> {
  /** The raw samples. Binning is the component's job, not the caller's. */
  values: readonly number[];
  /** How many buckets. The range is widened to round numbers, so the edges read. */
  bins?: number;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  size?: ChartSize;
  /** Pin the measured axis. Useful when two distributions are compared. */
  min?: number;
  max?: number;
  /** Formats a value on the measured axis — "80ms", not "80". */
  format?: (v: number) => string;
  /** Names the measured axis for the table. */
  xLabel?: string;
  yLabel?: string;
  /** Vertical lines: a p95, an SLA limit. */
  markers?: readonly DistributionMarker[];
  /** Sentence for the table caption. */
  label: string;
}

export function DistributionChart({
  className, values, bins = 12, title, subtitle, action, size = "md",
  min, max, format = String, xLabel = "Range", yLabel, markers, label, ...props
}: DistributionChartProps) {
  const nums = React.useMemo(
    () => values.filter((v) => typeof v === "number" && Number.isFinite(v)),
    [values],
  );

  /* Edges come off the same nice-number scale the axes use, so a bucket runs
     20–40 rather than 17.3–39.1. */
  const span = niceScale(nums, { min, max, count: bins });
  const width = (span.hi - span.lo) / bins;

  const counts = React.useMemo(() => {
    const out = new Array(bins).fill(0);
    for (const v of nums) {
      if (v < span.lo || v > span.hi) continue;
      // The top edge belongs to the last bucket rather than falling off it.
      const i = v === span.hi ? bins - 1 : Math.floor((v - span.lo) / width);
      out[i] += 1;
    }
    return out;
  }, [nums, bins, span.lo, span.hi, width]);

  const yScale = niceScale(counts, { min: 0, zero: true });
  const edge = (i: number) => span.lo + i * width;
  const bucketLabel = (i: number) => `${format(edge(i))}–${format(edge(i + 1))}`;

  /** A value's position along the measured axis, 0–100 from the start. */
  const at = (v: number) =>
    `${((v - span.lo) / (span.hi - span.lo || 1)) * 100}%`;

  /* A marker off the scale is not drawn, the same way a Sparkline's threshold
     is not. Clamping it to the edge is worse than omitting it: an SLA of 150
     pinned to a 100ms axis draws a line that says the limit is 100, which is a
     wrong answer rather than a missing one. Widen the axis with `max` to show
     it. */
  const onScale = (markers ?? []).filter(
    (m) => m.value >= span.lo && m.value <= span.hi,
  );

  if (process.env.NODE_ENV !== "production" && markers) {
    for (const m of markers)
      if (!onScale.includes(m))
        console.warn(
          `DistributionChart: marker "${m.label}" is ${m.value}, outside the ` +
            `axis (${span.lo}–${span.hi}), so it is not drawn. Pin \`max\` to ` +
            `bring it into range.`,
        );
  }

  return (
    <ChartFrame
      className={className}
      title={title}
      subtitle={subtitle}
      action={action}
      size={size}
      {...props}
    >
      <ChartYAxis scale={yScale} format={String} label={yLabel} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div data-slot="chart-plot" aria-hidden className="relative min-h-0 flex-1">
          <svg
            viewBox={`0 0 ${SPAN} ${SPAN}`}
            preserveAspectRatio="none"
            fill="none"
            className="absolute inset-0 size-full"
          >
            <ChartGridLines scale={yScale} />
          </svg>

          {/* Touching bars — see the note at the top of this file. */}
          <div
            data-slot="chart-bars"
            className="absolute inset-0 flex items-end"
          >
            {counts.map((c, i) => (
              <div
                key={i}
                data-slot="chart-bin"
                data-count={c}
                title={`${bucketLabel(i)} · ${c}`}
                className="flex h-full min-w-0 flex-1 items-end"
              >
                <div
                  className={cn(
                    "h-(--bar) w-full rounded-t-xs bg-chart-1",
                    // A bucket with nothing in it is still a bucket: it keeps
                    // its slot and draws nothing, rather than closing the gap
                    // and making the distribution look narrower than it is.
                    c === 0 && "bg-transparent",
                  )}
                  style={
                    {
                      "--bar": `${(c / (yScale.hi || 1)) * 100}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>

          {onScale.map((m) => {
            // Past four fifths the label would run off the plot, so it swaps
            // to the inside of its own line — the same tuck ChartXAxis gives
            // its end labels.
            const pos = (m.value - span.lo) / (span.hi - span.lo || 1);
            const nearEnd = pos > 0.8;
            return (
              <React.Fragment key={m.label}>
                <span
                  aria-hidden
                  data-slot="chart-marker"
                  data-value={m.value}
                  className="absolute top-0 bottom-0 w-px bg-line-neutral-emphasis start-(--at)"
                  style={{ "--at": at(m.value) } as React.CSSProperties}
                />
                <span
                  aria-hidden
                  data-slot="chart-marker-label"
                  data-near-end={nearEnd || undefined}
                  className={cn(
                    "absolute top-0 text-body-xs whitespace-nowrap",
                    "text-content-neutral-subtle start-(--at)",
                    nearEnd ? "-translate-x-full pe-1" : "ps-1",
                  )}
                  style={{ "--at": at(m.value) } as React.CSSProperties}
                >
                  {m.label}
                </span>
              </React.Fragment>
            );
          })}
        </div>

        {/* Edges, not one label per bar: a 12-bucket histogram with 12 labels
            is unreadable at any width a phone has. */}
        <div
          data-slot="chart-x-axis"
          aria-hidden
          className="relative h-5 w-full shrink-0 pt-1"
        >
          <span className="absolute start-0 text-body-xs tabular-nums text-content-neutral-subtle">
            {format(span.lo)}
          </span>
          <span className="absolute start-1/2 -translate-x-1/2 text-body-xs tabular-nums text-content-neutral-subtle">
            {format(span.lo + (span.hi - span.lo) / 2)}
          </span>
          <span className="absolute end-0 text-body-xs tabular-nums text-content-neutral-subtle">
            {format(span.hi)}
          </span>
        </div>
      </div>

      <ChartTable
        caption={label}
        xLabel={xLabel}
        xValues={counts.map((_, i) => bucketLabel(i))}
        series={[{ id: "count", label: yLabel ?? "Count", points: counts }]}
        format={String}
      />
    </ChartFrame>
  );
}
