// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cn } from "../../lib/utils";
import {
  CHART_SLOTS, ChartFrame, ChartGridLines, ChartLegend, ChartTable,
  ChartThreshold, ChartXAxis, ChartYAxis, SPAN, niceScale,
  seriesStroke, seriesText, type ChartSize, type LegendItem, type Scale,
} from "./chart";

/**
 * TimeSeriesChart — the workhorse. Something measured repeatedly, drawn
 * against time: MOS per trunk, latency per site, calls per minute.
 *
 * Figma: none. Code first.
 *
 * Line by default; `variant="area"` fills under a single series, where the
 * fill reads as volume rather than as a second quantity. Area is refused for
 * more than one series on purpose — overlapping translucent fills are the
 * chart that looks informative and answers nothing. Several series are lines.
 *
 * ⚠️ Colour follows the entity. `series` is the full list; hiding one through
 * the legend does not repaint the rest, because each series keeps the slot it
 * was given when the list was built.
 *
 * ⚠️ `null` is a gap and is drawn as one. An endpoint going quiet and an
 * endpoint reading zero are different incidents, and a line to the floor
 * reports the second when the first happened.
 *
 * Accessibility: the picture is `aria-hidden` and the numbers are carried by a
 * visually-hidden table, so a screen reader gets the data rather than a shape.
 * The crosshair is pointer-only — see the Do and Don't on reading values.
 */

export interface TimeSeries {
  /** Stable across filters: the colour is derived from the list position this had when built. */
  id: string;
  label: string;
  /** One reading per x. `null` is missing, never zero. */
  points: readonly (number | null)[];
}

export interface TimeSeriesChartProps
  extends Omit<React.ComponentProps<"figure">, "title"> {
  /** The axis, already formatted — "09:00", "Mon". The chart does not own time formatting. */
  x: readonly string[];
  series: readonly TimeSeries[];
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  size?: ChartSize;
  variant?: "line" | "area";
  /** Pin the value axis. Left open, it ends on round numbers around the data. */
  yMin?: number;
  yMax?: number;
  /** Include zero in the range. On for counts; off for a metric like MOS that never nears it. */
  yZero?: boolean;
  /** How a value reads — "4.1", "92%", "1.2k". Used by the axis, the tooltip and the table. */
  format?: (v: number) => string;
  /** What the axis is. Shown on the axis as a title and in the table header. */
  yLabel?: string;
  xLabel?: string;
  threshold?: { value: number; label?: string };
  /** Sentence for the table caption — what the chart shows. */
  label: string;
}

const AREA_FILL = [
  "fill-chart-1/15", "fill-chart-2/15", "fill-chart-3/15",
  "fill-chart-4/15", "fill-chart-5/15", "fill-chart-6/15",
];

type Pt = { x: number; y: number };

/** Runs of consecutive readings; a gap ends a run rather than bridging it. */
function runs(points: readonly (number | null)[], scale: Scale): Pt[][] {
  const out: Pt[][] = [];
  let run: Pt[] = [];
  points.forEach((v, i) => {
    if (v === null || !Number.isFinite(v)) {
      if (run.length) out.push(run);
      run = [];
      return;
    }
    run.push({ x: scale.x(i, points.length), y: scale.y(v) });
  });
  if (run.length) out.push(run);
  return out;
}
const path = (pts: Pt[]) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");

export function TimeSeriesChart({
  className, x, series, title, subtitle, action, size = "md",
  variant = "line", yMin, yMax, yZero, format = String,
  yLabel, xLabel = "Time", threshold, label, ...props
}: TimeSeriesChartProps) {
  const [hidden, setHidden] = React.useState<readonly string[]>([]);
  const [at, setAt] = React.useState<number | null>(null);
  const plot = React.useRef<HTMLDivElement | null>(null);

  if (process.env.NODE_ENV !== "production" && series.length > CHART_SLOTS) {
    // Never a generated hue. Past the palette, fold the tail into one "Other"
    // series or facet into small multiples — both of which are decisions about
    // the data, so the chart will not make them silently.
    console.warn(
      `TimeSeriesChart: ${series.length} series, but the palette has ${CHART_SLOTS} slots. ` +
        `Fold the rest into an "Other" series or use small multiples.`,
    );
  }

  /* The slot is the position in the list as given, so hiding one series never
     moves another's colour. */
  const slots = React.useMemo(
    () => Object.fromEntries(series.map((s, i) => [s.id, i])),
    [series],
  );
  const shown = series.filter((s) => !hidden.includes(s.id));

  const scale = React.useMemo(
    () => niceScale(shown.flatMap((s) => s.points), { min: yMin, max: yMax, zero: yZero }),
    [shown, yMin, yMax, yZero],
  );

  const multi = series.length > 1;
  const area = variant === "area" && series.length === 1;

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = plot.current?.getBoundingClientRect();
    if (!r || !r.width || x.length < 2) return;
    const t = (e.clientX - r.left) / r.width;
    setAt(Math.max(0, Math.min(x.length - 1, Math.round(t * (x.length - 1)))));
  };

  const legend: LegendItem[] = series.map((s) => ({
    id: s.id, label: s.label, slot: slots[s.id], hidden: hidden.includes(s.id),
  }));

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
              // Never hide the last one: an empty plot is not a filter result,
              // it is a chart that looks broken.
              return next.length === series.length ? h : next;
            })
          }
        />
      }
      {...props}
    >
      <ChartYAxis scale={scale} format={format} label={yLabel} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div
          ref={plot}
          data-slot="chart-plot"
          aria-hidden
          className="relative min-h-0 flex-1"
          onPointerMove={move}
          onPointerLeave={() => setAt(null)}
        >
          <svg
            viewBox={`0 0 ${SPAN} ${SPAN}`}
            preserveAspectRatio="none"
            fill="none"
            className="block size-full overflow-visible"
          >
            <ChartGridLines scale={scale} />
            {threshold ? (
              <ChartThreshold scale={scale} value={threshold.value} label={threshold.label} />
            ) : null}

            {shown.map((s) => {
              const slot = slots[s.id];
              const segments = runs(s.points, scale);
              return (
                <g key={s.id} data-slot="chart-series" data-series={s.id}>
                  {area
                    ? segments.map((pts, i) => (
                        <path
                          key={`a${i}`}
                          data-slot="chart-area"
                          d={`${path(pts)} L${pts.at(-1)!.x.toFixed(2)} ${SPAN} L${pts[0].x.toFixed(2)} ${SPAN} Z`}
                          className={AREA_FILL[slot % CHART_SLOTS]}
                        />
                      ))
                    : null}
                  {segments.map((pts, i) =>
                    pts.length === 1 ? (
                      <circle
                        key={`p${i}`}
                        data-slot="chart-point"
                        cx={pts[0].x}
                        cy={pts[0].y}
                        r={0.9}
                        className={cn("fill-current", seriesText(slot))}
                      />
                    ) : (
                      <path
                        key={`p${i}`}
                        data-slot="chart-line"
                        d={path(pts)}
                        vectorEffect="non-scaling-stroke"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={seriesStroke(slot)}
                      />
                    ),
                  )}
                </g>
              );
            })}

            {at !== null && x.length > 1 ? (
              <line
                data-slot="chart-crosshair"
                x1={scale.x(at, x.length)}
                x2={scale.x(at, x.length)}
                y1={0}
                y2={SPAN}
                vectorEffect="non-scaling-stroke"
                strokeWidth={1}
                className="stroke-line-neutral-emphasis"
              />
            ) : null}
          </svg>

          {/* The dots on the crosshair are HTML: the box is stretched, so a
              circle drawn in it would arrive as an ellipse. */}
          {at !== null
            ? shown.map((s) => {
                const v = s.points[at];
                if (typeof v !== "number") return null;
                return (
                  <span
                    key={s.id}
                    data-slot="chart-marker"
                    className={cn(
                      "pointer-events-none absolute size-2 rounded-full bg-current ring-2 ring-surface-card",
                      "start-(--mx) top-(--my) -translate-x-1/2 -translate-y-1/2",
                      seriesText(slots[s.id]),
                    )}
                    style={{
                      "--mx": `${scale.x(at, x.length)}%`,
                      "--my": `${scale.y(v)}%`,
                    } as React.CSSProperties}
                  />
                );
              })
            : null}

          {at !== null ? (
            <div
              data-slot="chart-tooltip"
              className={cn(
                "pointer-events-none absolute top-2 z-floating w-max max-w-56 rounded-md border border-line-neutral-muted",
                "bg-surface-overlay p-2 shadow-md",
                // Flip at the halfway mark so the tooltip never leaves the plot.
                at > x.length / 2 ? "end-(--flip)" : "start-(--at)",
              )}
              style={{
                "--at": `calc(${scale.x(at, x.length)}% + 8px)`,
                "--flip": `calc(${SPAN - scale.x(at, x.length)}% + 8px)`,
              } as React.CSSProperties}
            >
              <div className="mb-1 text-label-xs text-content-neutral-subtle">
                {x[at]}
              </div>
              <ul className="flex flex-col gap-0.5">
                {shown.map((s) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={cn(
                        "h-0.5 w-3 shrink-0 rounded-full bg-current",
                        seriesText(slots[s.id]),
                      )}
                    />
                    {multi ? (
                      <span className="min-w-0 flex-1 truncate text-body-xs text-content-neutral-muted">
                        {s.label}
                      </span>
                    ) : null}
                    <span className="text-body-xs tabular-nums text-content-neutral-emphasis">
                      {typeof s.points[at] === "number"
                        ? format(s.points[at] as number)
                        : "No data"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

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

        <ChartXAxis labels={x} />
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
