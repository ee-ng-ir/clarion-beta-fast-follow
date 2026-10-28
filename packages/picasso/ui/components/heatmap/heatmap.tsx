// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cn } from "../../lib/utils";
import { ChartFrame, type ChartSize } from "../chart/chart";

/**
 * Heatmap — one measure across two dimensions, usually endpoint × time. The
 * fleet view: which hosts were bad, and when, in one picture.
 *
 * Figma: none. Code first.
 *
 * ⚠️ This is the one chart in Picasso that colours by VALUE, and it is the
 * only place the sequential scale belongs. A cell has no length and no height
 * to encode with — colour is the only channel it has, which is exactly the
 * case `chart/scale/1–5` exists for. Everywhere else, colour carries identity
 * and `chart/1–6` are the slots.
 *
 * ⚠️ Five bins, not a continuous gradient. Nobody reads a colour back to a
 * number off a smooth ramp; they read it to a band. Banding it makes the
 * legend honest and the scale discrete enough to match against.
 *
 * ⚠️ Light runs light→dark and dark runs dark→light. In dark mode nothing can
 * sit below the surface, so the quiet end has to be the dark end — a scale
 * flipped by `invert()` would put the loudest cells nearest the background.
 *
 * ⚠️ No data is not zero. A host that reported nothing is drawn as an empty
 * outlined cell, never as the lowest bin, because "fine" and "we don't know"
 * are different answers and only one of them is safe to ignore.
 */

export const SCALE_BINS = 5;

const BIN_BG = [
  "bg-chart-scale-1", "bg-chart-scale-2", "bg-chart-scale-3",
  "bg-chart-scale-4", "bg-chart-scale-5",
];

export interface HeatmapRow {
  id: string;
  label: string;
  /** One value per column. `null` is "did not report", not zero. */
  values: readonly (number | null)[];
}

export interface HeatmapProps
  extends Omit<React.ComponentProps<"figure">, "title"> {
  /** Column headings — time buckets, usually. */
  x: readonly string[];
  rows: readonly HeatmapRow[];
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  size?: ChartSize;
  /** Pin the scale so two heatmaps can be compared. Defaults to the data. */
  min?: number;
  max?: number;
  /**
   * Four boundaries cutting the range into five bins. Defaults to equal
   * widths. Pass explicit stops when the thresholds mean something — an SLA
   * band is not a fifth of the range.
   */
  stops?: readonly number[];
  format?: (v: number) => string;
  xLabel?: string;
  /** What the colour means, at each end of the legend. */
  lowLabel?: string;
  highLabel?: string;
  /** Sentence for the table caption. */
  label: string;
}

export function Heatmap({
  className, x, rows, title, subtitle, action, size = "md",
  min, max, stops, format = String, xLabel = "Time",
  lowLabel = "Low", highLabel = "High", label, ...props
}: HeatmapProps) {
  const nums = React.useMemo(
    () =>
      rows.flatMap((r) =>
        r.values.filter((v): v is number => typeof v === "number" && Number.isFinite(v)),
      ),
    [rows],
  );

  const lo = min ?? (nums.length ? Math.min(...nums) : 0);
  const hi = max ?? (nums.length ? Math.max(...nums) : 1);

  const edges = React.useMemo(() => {
    if (stops && stops.length === SCALE_BINS - 1) return [...stops];
    const w = (hi - lo) / SCALE_BINS;
    return Array.from({ length: SCALE_BINS - 1 }, (_, i) => lo + w * (i + 1));
  }, [stops, lo, hi]);

  /** A value to one of five bins. Null stays null — it is not a bin. */
  const binOf = (v: number | null) => {
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    let i = 0;
    while (i < edges.length && v >= edges[i]) i++;
    return i;
  };

  const bandLabel = (i: number) => {
    const from = i === 0 ? lo : edges[i - 1];
    const to = i === SCALE_BINS - 1 ? hi : edges[i];
    return `${format(from)}–${format(to)}`;
  };

  /* The column count is data, so it rides a custom property and the class
     reads it — the same shape as Sparkline's --spark-x. */
  const cols = {
    "--cols": `repeat(${x.length}, minmax(0, 1fr))`,
  } as React.CSSProperties;

  return (
    <ChartFrame
      className={className}
      title={title}
      subtitle={subtitle}
      action={action}
      size={size}
      legend={
        <div
          data-slot="heatmap-legend"
          className="flex items-center gap-2 text-body-xs text-content-neutral-muted"
        >
          <span>{lowLabel}</span>
          <ul className="flex items-center gap-0.5">
            {BIN_BG.map((bg, i) => (
              <li
                key={bg}
                className={cn("h-3 w-5 rounded-xs", bg)}
                title={bandLabel(i)}
              >
                <span className="sr-only">{bandLabel(i)}</span>
              </li>
            ))}
          </ul>
          <span>{highLabel}</span>
        </div>
      }
      {...props}
    >
      <div className="flex min-w-0 flex-1 gap-2 overflow-hidden">
        {/* Row labels. They truncate rather than setting the chart's width —
            a hostname is as long as it likes and the grid is not negotiable. */}
        <ul
          data-slot="heatmap-rows"
          aria-hidden
          className="flex w-24 shrink-0 flex-col gap-0.5"
        >
          {rows.map((r) => (
            <li
              key={r.id}
              title={r.label}
              className="flex min-h-0 flex-1 items-center truncate text-body-xs text-content-neutral-muted"
            >
              {r.label}
            </li>
          ))}
        </ul>

        <div className="flex min-w-0 flex-1 flex-col">
          <div
            data-slot="heatmap-grid"
            aria-hidden
            className="flex min-h-0 flex-1 flex-col gap-0.5"
          >
            {rows.map((r) => (
              <div
                key={r.id}
                data-slot="heatmap-row"
                className="grid min-h-0 flex-1 grid-cols-(--cols) gap-0.5"
                style={cols}
              >
                {x.map((col, i) => {
                  const v = r.values[i] ?? null;
                  const b = binOf(v);
                  return (
                    <div
                      key={col + i}
                      data-slot="heatmap-cell"
                      data-bin={b ?? "none"}
                      title={
                        b === null
                          ? `${r.label} · ${col} · no data`
                          : `${r.label} · ${col} · ${format(v as number)}`
                      }
                      className={cn(
                        "rounded-xs",
                        b === null
                          // Outlined and empty: "we don't know" has to look
                          // different from "lowest", not quieter than it.
                          ? "border border-dashed border-line-neutral-muted"
                          : BIN_BG[b],
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <div
            data-slot="chart-x-axis"
            aria-hidden
            className="grid shrink-0 grid-cols-(--cols) gap-0.5 pt-1"
            style={cols}
          >
            {x.map((col, i) => (
              <span
                key={col + i}
                className={cn(
                  "truncate text-body-xs tabular-nums text-content-neutral-subtle",
                  // Every label will not fit, so only the ends and the middle
                  // are drawn — the rest are present for screen readers in the
                  // table below.
                  i !== 0 && i !== x.length - 1 && i !== Math.floor(x.length / 2) &&
                    "invisible",
                  i === x.length - 1 && "text-end",
                )}
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* The numbers, for anyone who cannot read a colour. */}
      <div className="sr-only">
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">Row</th>
              {x.map((col, i) => (
                <th key={col + i} scope="col">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <th scope="row">{r.label}</th>
                {x.map((col, i) => {
                  const v = r.values[i] ?? null;
                  return (
                    <td key={col + i}>
                      {typeof v === "number" ? format(v) : "No data"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p>{xLabel}</p>
      </div>
    </ChartFrame>
  );
}
