// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cn } from "../../lib/utils";
import {
  CHART_SLOTS, ChartFrame, ChartGridLines, ChartLegend, ChartTable,
  ChartThreshold, ChartYAxis, SPAN, niceScale,
  seriesText, type ChartSize, type LegendItem,
} from "../chart/chart";

/**
 * BarChart — a measure compared across categories: calls per site, failures
 * per cause, minutes per region. Grouped by default; `stacked` when the parts
 * add up to a whole anyone would want to read.
 *
 * Figma: none. Code first.
 *
 * ⚠️ The bars are HTML, not SVG, and that is the point. The plot elsewhere is
 * a 0–100 box stretched to its width, which is ideal for a line and wrong for
 * a bar: stretching turns a 24px cap into whatever the container feels like
 * and bends a 4px corner into an ellipse. As elements, a bar is capped at 24
 * exactly, its data-end is rounded 4 and its baseline end is square, and the
 * 2px gap between touching marks is 2px. Only the gridlines stay SVG, and
 * horizontal rules do not distort.
 *
 * ⚠️ Bars start at zero, always. A bar says "this much", and a bar chart with
 * a cut-off baseline says it at four times the size. `yMin` is not offered.
 *
 * ⚠️ Stacked bars are for parts of a whole. Only the bottom segment and the
 * total can be read along a common baseline; everything between floats. If
 * the comparison people actually make is between the middle segments, group
 * them instead.
 */

export interface BarSeries {
  id: string;
  label: string;
  /** One value per category. `null` is missing and leaves the slot empty. */
  points: readonly (number | null)[];
}

export interface BarChartProps
  extends Omit<React.ComponentProps<"figure">, "title"> {
  x: readonly string[];
  series: readonly BarSeries[];
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  size?: ChartSize;
  /** Parts of a whole, stacked on one baseline. Grouped when false. */
  stacked?: boolean;
  /** Pin the top. The bottom is always zero. */
  yMax?: number;
  format?: (v: number) => string;
  yLabel?: string;
  xLabel?: string;
  threshold?: { value: number; label?: string };
  /** Sentence for the table caption. */
  label: string;
}

const BAR_BG = [
  "bg-chart-1", "bg-chart-2", "bg-chart-3",
  "bg-chart-4", "bg-chart-5", "bg-chart-6",
];

export function BarChart({
  className, x, series, title, subtitle, action, size = "md",
  stacked = false, yMax, format = String, yLabel, xLabel = "Category",
  threshold, label, ...props
}: BarChartProps) {
  const [hidden, setHidden] = React.useState<readonly string[]>([]);

  if (process.env.NODE_ENV !== "production" && series.length > CHART_SLOTS) {
    console.warn(
      `BarChart: ${series.length} series, but the palette has ${CHART_SLOTS} slots. ` +
        `Fold the rest into an "Other" series or use small multiples.`,
    );
  }

  const slots = React.useMemo(
    () => Object.fromEntries(series.map((s, i) => [s.id, i])),
    [series],
  );
  const shown = series.filter((s) => !hidden.includes(s.id));

  /* Stacked compares column totals; grouped compares individual bars. */
  const reach = stacked
    ? x.map((_, i) => shown.reduce((n, s) => n + (s.points[i] ?? 0), 0))
    : shown.flatMap((s) => s.points);

  // Not memoised: `reach` is rebuilt every render anyway, so a memo on it
  // would only add a dependency that is never equal.
  const scale = niceScale(reach, { min: 0, max: yMax, zero: true });

  const legend: LegendItem[] = series.map((s) => ({
    id: s.id, label: s.label, slot: slots[s.id], hidden: hidden.includes(s.id),
  }));

  /** A value as a share of the plot's height. */
  const pct = (v: number) => `${Math.max(0, (v / (scale.hi || 1)) * 100)}%`;

  return (
    <ChartFrame
      className={className}
      title={title}
      subtitle={subtitle}
      action={action}
      size={size}
      legend={
        <ChartLegend
          items={legend}
          onToggle={(id) =>
            setHidden((h) => {
              const next = h.includes(id) ? h.filter((i) => i !== id) : [...h, id];
              return next.length === series.length ? h : next;
            })
          }
        />
      }
      {...props}
    >
      <ChartYAxis scale={scale} format={format} label={yLabel} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div data-slot="chart-plot" aria-hidden className="relative min-h-0 flex-1">
          <svg
            viewBox={`0 0 ${SPAN} ${SPAN}`}
            preserveAspectRatio="none"
            fill="none"
            className="absolute inset-0 size-full"
          >
            <ChartGridLines scale={scale} />
            {threshold ? (
              <ChartThreshold scale={scale} value={threshold.value} label={threshold.label} />
            ) : null}
          </svg>

          {/* The bars. gap-0.5 is the 2px surface gap between touching marks. */}
          <div
            data-slot="chart-bars"
            className="absolute inset-0 flex items-end justify-between gap-2"
          >
            {x.map((cat, i) => (
              <div
                key={cat + i}
                data-slot="chart-bar-group"
                className={cn(
                  "flex h-full min-w-0 flex-1 items-end justify-center",
                  stacked ? "flex-col justify-end" : "gap-0.5",
                )}
              >
                {shown.map((s) => {
                  const v = s.points[i];
                  if (typeof v !== "number") return null;
                  return (
                    <div
                      key={s.id}
                      data-slot="chart-bar"
                      data-series={s.id}
                      title={`${s.label} · ${cat} · ${format(v)}`}
                      className={cn(
                        // Capped at 24 and never filling its slot: the air
                        // between groups is what makes the groups readable.
                        "h-(--bar) w-full max-w-6 min-w-0",
                        BAR_BG[slots[s.id] % CHART_SLOTS],
                        // Rounded at the data end, square on the baseline.
                        // radius/xs (3.2) rather than the dataviz rule's 4:
                        // the rule is written to be filled in by the design
                        // system, and this system's scale has no 4.
                        stacked
                          ? "first:rounded-t-xs last:rounded-b-none"
                          : "rounded-t-xs",
                      )}
                      style={{ "--bar": pct(v) } as React.CSSProperties}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {threshold?.label ? (
            <span
              aria-hidden
              data-slot="chart-threshold-label"
              className="absolute end-0 top-(--ty) -translate-y-full pe-0.5 text-body-xs text-content-neutral-subtle"
              style={{ "--ty": `${scale.y(threshold.value)}%` } as React.CSSProperties}
            >
              {threshold.label}
            </span>
          ) : null}
        </div>

        {/* Category labels sit under their own group, so they line up with the
            bars rather than with a position along a continuous axis. */}
        <div
          data-slot="chart-x-axis"
          aria-hidden
          className="flex shrink-0 justify-between gap-2 pt-1"
        >
          {x.map((cat, i) => (
            <span
              key={cat + i}
              className="min-w-0 flex-1 truncate text-center text-body-xs text-content-neutral-subtle"
              title={cat}
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      <ChartTable
        caption={label}
        xLabel={xLabel}
        xValues={x}
        series={series}
        format={format}
      />
    </ChartFrame>
  );
}
