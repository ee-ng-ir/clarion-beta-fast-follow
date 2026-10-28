// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * The two grids a product page is made of.
 *
 * The rules they carry were written down before they existed — in
 * docs/foundations/responsive.md and the Layout and breakpoints story — which
 * meant every product re-derived them from prose and could drift without
 * anyone noticing. A rule that only lives in a sentence is a rule nobody can
 * run. These are that sentence, executable.
 *
 * ⭐ Both answer to their CONTAINER, not the viewport. The content column is
 * the query container (`AppShellContent`), so the rungs are `@3xl` (768) and
 * `@7xl` (1280). The viewport knows nothing about the rail, the page padding,
 * a width cap or an open drawer: the same grid gets 976 at a 1280 viewport
 * with the rail open and 1184 with it collapsed. A grid that read `xl:` would
 * be wrong at the width it was actually given.
 *
 * Both gap with `gap-gutter`, which is the page padding — 16 below xl, 24
 * from xl. The Rules make the two equal, so they share one variable rather
 * than agreeing by coincidence.
 */

/* Auto-fill at a 224 minimum (space/56, the tile as Figma's App shell draws
   it), so a wider column takes more tiles rather than wider ones: four across
   a 976 column at 1280, nine across 2256 at 2560. */
const kpiRowVariants = cva("grid grid-cols-tiles gap-gutter");

export type KpiRowProps = React.ComponentProps<"div">;

/**
 * A row of KPI tiles that adds tiles as it widens.
 *
 * ⚠️ Tiles are not stretched to fill. `grid-cols-tiles` caps the minimum at
 * `min(100%, 224)`, so a column narrower than one tile still gets one tile
 * rather than an overflowing row.
 */
export function KpiRow({ className, ...props }: KpiRowProps) {
  return (
    <div
      data-slot="kpi-row"
      className={cn(kpiRowVariants(), className)}
      {...props}
    />
  );
}

/* 1 across below 768 of column, 2 from 768, 3 from 1280 — the ladder in
   docs/foundations/responsive.md. `max` stops lower for a page whose charts
   need the width: a page of dense time series reads better two across at
   any width than three. */
const chartGridVariants = cva("grid gap-gutter", {
  variants: {
    max: {
      2: "grid-cols-1 @3xl:grid-cols-2",
      3: "grid-cols-1 @3xl:grid-cols-2 @7xl:grid-cols-3",
    },
  },
  defaultVariants: { max: 3 },
});

export interface ChartGridProps
  extends React.ComponentProps<"div">, VariantProps<typeof chartGridVariants> {}

/**
 * A row of charts that adds columns as the content column widens.
 *
 * ⚠️ Chart height is the chart's own business and is a fixed range
 * (240–320), never an aspect ratio — a chart that grows tall on a wide screen
 * is a chart nobody asked for. The grid sets columns and gap, nothing else.
 *
 * ⚠️ A table or a time series takes the full row at every width, so it is a
 * sibling of this grid rather than a cell in it.
 */
export function ChartGrid({ className, max, ...props }: ChartGridProps) {
  return (
    <div
      data-slot="chart-grid"
      className={cn(chartGridVariants({ max }), className)}
      {...props}
    />
  );
}

export { chartGridVariants, kpiRowVariants };
