// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Chart furniture — the parts every chart type is built from: the frame and
 * its fixed height, the scales, the grid, the two axes, the legend, threshold
 * rules, the hover layer, and the data table that makes any of it readable
 * without eyes.
 *
 * Figma: none. Code first.
 *
 * Three rules the whole file is shaped by:
 *
 * 1. **Height is fixed, width is fluid.** 240 / 280 / 320, never an aspect
 *    ratio — the rule `ChartGrid` already states. A chart that grows taller on
 *    a wide screen is a chart nobody asked for.
 * 2. **Labels are HTML, marks are SVG.** Text in SVG cannot wrap, ignores the
 *    type steps and needs hand-measured metrics; every label here is a real
 *    element wearing a real text token, positioned over the plot in
 *    percentages. Only the marks are drawn.
 * 3. **The plot is a 0–100 box stretched to whatever width it is given**
 *    (`preserveAspectRatio="none"`), so nothing has to be measured to draw.
 *    Every stroke carries `vector-effect="non-scaling-stroke"`, or it would
 *    come out a different weight at every width.
 *
 * ⚠️ Series colour follows the ENTITY, never its position in the filtered
 * list. Pass a stable `id` per series and the colour is derived from it, so
 * hiding one series in the legend does not repaint the others.
 *
 * ⚠️ There is no second y-axis, and there never will be. Two measures of
 * different scale are two charts, or one chart indexed to a common base.
 */

/* ── the palette ──────────────────────────────────────────────────────
   Written out rather than templated because Tailwind reads class names as
   literals. The order is fixed: slot 1 is always the first series, and a
   filter that removes series 2 must not promote series 3 into its colour. */
/* Six, not eight. Eight were declared and three of them could not be told
   apart from the others — corporate blue sits 7° from brand blue on the hue
   wheel, ir-lime 20° from lime and far too light, and teal cannot clear blue
   in both modes at once. The colours all still exist; they are not series. */
export const CHART_SLOTS = 6;
const STROKE = [
  "stroke-chart-1", "stroke-chart-2", "stroke-chart-3",
  "stroke-chart-4", "stroke-chart-5", "stroke-chart-6",
];
const TEXT = [
  "text-chart-1", "text-chart-2", "text-chart-3",
  "text-chart-4", "text-chart-5", "text-chart-6",
];
export const seriesStroke = (slot: number) => STROKE[slot % CHART_SLOTS];
export const seriesText = (slot: number) => TEXT[slot % CHART_SLOTS];

/* ── scales ───────────────────────────────────────────────────────────
   Everything is drawn in a 0–100 box, so a scale is just a normaliser. */
export const SPAN = 100;

export interface Scale {
  lo: number;
  hi: number;
  /** Data value → 0–100, top-down (SVG y grows downward). */
  y: (v: number) => number;
  /** Index → 0–100 across the width. */
  x: (i: number, n: number) => number;
  ticks: number[];
}

/**
 * A scale that ends on round numbers. An axis labelled 0, 1.25, 2.5 is an axis
 * nobody reads, so the range is widened to the next step rather than the ticks
 * being bent to fit the data.
 */
export function niceScale(
  values: readonly (number | null | undefined)[],
  opts: { min?: number; max?: number; count?: number; zero?: boolean } = {},
): Scale {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  let lo = opts.min ?? (nums.length ? Math.min(...nums) : 0);
  let hi = opts.max ?? (nums.length ? Math.max(...nums) : 1);
  if (opts.zero && opts.min === undefined) lo = Math.min(0, lo);
  if (lo === hi) { lo -= 1; hi += 1; }

  const count = opts.count ?? 4;
  const raw = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const nice = [1, 2, 2.5, 5, 10].flatMap((m) => [m * mag, m * mag * 10, m * mag / 10]).sort((a, b) => a - b);
  let step: number;
  if (opts.min !== undefined && opts.max !== undefined) {
    // A pinned range must land a tick on its own top, or the plot runs past
    // its highest label and the axis looks truncated. So the step has to
    // divide the range exactly; among those, take the one closest to the
    // wanted number of intervals.
    const divides = nice.filter((s) => Math.abs((hi - lo) / s - Math.round((hi - lo) / s)) < 1e-9);
    step = divides.sort(
      (a, b) => Math.abs((hi - lo) / a - count) - Math.abs((hi - lo) / b - count),
    )[0] ?? (nice.find((s) => s >= raw) ?? 10 * mag);
  } else {
    step = nice.find((s) => s >= raw) ?? 10 * mag;
    if (opts.min === undefined) lo = Math.floor(lo / step) * step;
    if (opts.max === undefined) hi = Math.ceil(hi / step) * step;
  }

  const ticks: number[] = [];
  // Float arithmetic: 0.1 + 0.2 walks off the step, so each tick is computed
  // from the index rather than accumulated.
  for (let i = 0; lo + i * step <= hi + step / 1e6; i++) ticks.push(+(lo + i * step).toFixed(10));

  const span = hi - lo || 1;
  return {
    lo, hi, ticks,
    y: (v) => ((hi - v) / span) * SPAN,
    x: (i, n) => (n > 1 ? (i / (n - 1)) * SPAN : SPAN / 2),
  };
}

/* ── the frame ────────────────────────────────────────────────────────── */

export type ChartSize = "sm" | "md" | "lg";
/** 240 / 280 / 320. The rule is a fixed range, never an aspect ratio. */
const PLOT_H: Record<ChartSize, string> = {
  sm: "h-60",
  md: "h-70",
  lg: "h-80",
};

export interface ChartFrameProps extends Omit<React.ComponentProps<"figure">, "title"> {
  /** Names the chart. With one series this is what identifies it, so there is no legend. */
  title?: React.ReactNode;
  /** Sits under the title — the window, the unit, the caveat. */
  subtitle?: React.ReactNode;
  /** Top-end controls: a range picker, a menu. */
  action?: React.ReactNode;
  legend?: React.ReactNode;
  size?: ChartSize;
}

export function ChartFrame({
  className, title, subtitle, action, legend, size = "md", children, ...props
}: ChartFrameProps) {
  return (
    <figure
      data-slot="chart"
      data-size={size}
      className={cn("flex min-w-0 flex-col gap-3", className)}
      {...props}
    >
      {title || subtitle || action ? (
        <figcaption
          data-slot="chart-caption"
          className="flex min-w-0 items-start gap-3"
        >
          <div className="min-w-0 flex-1">
            {title ? (
              <div className="text-heading-xs text-content-neutral-emphasis">
                {title}
              </div>
            ) : null}
            {subtitle ? (
              <div className="text-body-sm text-content-neutral-subtle">
                {subtitle}
              </div>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </figcaption>
      ) : null}
      {legend}
      <div data-slot="chart-plot-row" className={cn("flex min-w-0 gap-2", PLOT_H[size])}>
        {children}
      </div>
    </figure>
  );
}

/* ── axes ─────────────────────────────────────────────────────────────── */

/**
 * The value axis. Labels are HTML pinned by percentage, so they wear
 * `text-body-xs` like any other small text and need no measuring.
 */
export function ChartYAxis({
  scale, format = String, label,
}: {
  scale: Scale;
  format?: (v: number) => string;
  label?: string;
}) {
  return (
    <div
      data-slot="chart-y-axis"
      aria-hidden
      className="relative w-10 shrink-0 text-end"
      title={label}
    >
      {scale.ticks.map((t, i) => (
        <span
          key={t}
          className={cn(
            "absolute end-0 text-body-xs tabular-nums text-content-neutral-subtle",
            "top-(--tick)",
            // The end labels are tucked inside the plot rather than centred on
            // their rule, where half of each would hang outside the figure and
            // collide with whatever the page puts above and below it.
            i === scale.ticks.length - 1
              ? "translate-y-0"
              : i === 0
                ? "-translate-y-full"
                : "-translate-y-1/2",
          )}
          style={{ "--tick": `${scale.y(t)}%` } as React.CSSProperties}
        >
          {format(t)}
        </span>
      ))}
    </div>
  );
}

/**
 * The time axis. Only the ends and a few inside are labelled: a tick under
 * every point is noise, and 24 of them overlap.
 */
export function ChartXAxis({
  labels, count = 4,
}: {
  labels: readonly string[];
  count?: number;
}) {
  const n = labels.length;
  const step = Math.max(1, Math.round((n - 1) / Math.max(1, count)));
  const shown = labels.map((l, i) => ({ l, i })).filter(({ i }) => i % step === 0 || i === n - 1);
  return (
    <div
      data-slot="chart-x-axis"
      aria-hidden
      className="relative h-5 w-full shrink-0"
    >
      {shown.map(({ l, i }) => (
        <span
          key={i}
          className={cn(
            "absolute top-0 whitespace-nowrap text-body-xs tabular-nums text-content-neutral-subtle",
            // The first and last labels sit inside the plot rather than
            // hanging off its ends, where they would be clipped.
            i === 0 ? "start-0" : i === n - 1 ? "end-0" : "start-(--at) -translate-x-1/2",
          )}
          style={i === 0 || i === n - 1 ? undefined : ({ "--at": `${(i / (n - 1)) * 100}%` } as React.CSSProperties)}
        >
          {l}
        </span>
      ))}
    </div>
  );
}

/* ── the plot ─────────────────────────────────────────────────────────── */

/** Horizontal rules only. A gridline under every reading is a cage. */
export function ChartGridLines({ scale }: { scale: Scale }) {
  return (
    <g data-slot="chart-grid" aria-hidden>
      {scale.ticks.map((t) => (
        <line
          key={t}
          x1={0}
          x2={SPAN}
          y1={scale.y(t)}
          y2={scale.y(t)}
          vectorEffect="non-scaling-stroke"
          strokeWidth={1}
          className="stroke-line-neutral-subtle"
        />
      ))}
    </g>
  );
}

/** A labelled rule: an SLA floor, a target, a capacity ceiling. */
export function ChartThreshold({
  scale, value, label,
}: {
  scale: Scale;
  value: number;
  label?: string;
}) {
  if (value < scale.lo || value > scale.hi) return null;
  return (
    <line
      data-slot="chart-threshold"
      data-label={label}
      x1={0}
      x2={SPAN}
      y1={scale.y(value)}
      y2={scale.y(value)}
      vectorEffect="non-scaling-stroke"
      strokeWidth={1}
      strokeDasharray="4 3"
      className="stroke-line-neutral-emphasis"
    />
  );
}

/* ── legend ───────────────────────────────────────────────────────────── */

export interface LegendItem {
  id: string;
  label: string;
  slot: number;
  hidden?: boolean;
}

/**
 * Always present from two series up; absent for one, where the title names it.
 * The swatch carries the identity and the text stays in ink — a light series
 * colour is illegible as text.
 */
export function ChartLegend({
  items, onToggle,
}: {
  items: readonly LegendItem[];
  onToggle?: (id: string) => void;
}) {
  if (items.length < 2) return null;
  return (
    <ul
      data-slot="chart-legend"
      className="flex flex-wrap items-center gap-x-4 gap-y-1"
    >
      {items.map((it) => {
        const swatch = (
          <>
            <span
              aria-hidden
              data-slot="chart-legend-swatch"
              className={cn(
                "h-0.5 w-4 shrink-0 rounded-full bg-current",
                seriesText(it.slot),
                it.hidden && "opacity-40",
              )}
            />
            <span
              className={cn(
                "text-body-xs text-content-neutral-muted",
                it.hidden && "line-through",
              )}
            >
              {it.label}
            </span>
          </>
        );
        return (
          <li key={it.id} data-slot="chart-legend-item">
            {onToggle ? (
              <button
                type="button"
                onClick={() => onToggle(it.id)}
                aria-pressed={!it.hidden}
                className="flex items-center gap-1.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-line-focused focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app"
              >
                {swatch}
              </button>
            ) : (
              <span className="flex items-center gap-1.5">{swatch}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ── the table behind the picture ─────────────────────────────────────── */

/**
 * Every chart carries its numbers. Visually hidden, in the accessibility tree,
 * and the chart itself is `aria-hidden` — so a screen reader gets the data
 * rather than a shape it cannot see, and nobody hears "image" and stops.
 */
export function ChartTable({
  caption, xLabel, xValues, series, format = String,
}: {
  caption: string;
  xLabel: string;
  xValues: readonly string[];
  series: readonly { id: string; label: string; points: readonly (number | null)[] }[];
  format?: (v: number) => string;
}) {
  return (
    // The wrapper carries `sr-only`, not the table: a table sizes to its
    // content and ignores the 1px width, so putting it on the table left a
    // 428px element pushing the page sideways on a phone.
    <div className="sr-only">
      <table data-slot="chart-table">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{xLabel}</th>
          {series.map((s) => (
            <th key={s.id} scope="col">{s.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {xValues.map((x, i) => (
          <tr key={x + i}>
            <th scope="row">{x}</th>
            {series.map((s) => (
              <td key={s.id}>
                {/* "No data" rather than a blank cell: an empty cell is
                    indistinguishable from a cell that failed to render. */}
                {typeof s.points[i] === "number" ? format(s.points[i] as number) : "No data"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  );
}
