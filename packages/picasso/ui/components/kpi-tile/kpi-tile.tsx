// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cn } from "../../lib/utils";
import { Badge } from "../badge/badge";
import { Meter, type MeterStatus } from "../meter/meter";

/**
 * KpiTile
 *
 * One headline number, with just enough around it to say what the number is
 * and whether it is a problem. If a tile needs two numbers it is a Card.
 *
 * FROM FIGMA (`KPI Tile` 40000388:23522), as drawn:
 *
 *   box       bg/card, 1px border/neutral/subtle, radius/xl, NO shadow
 *   header    h 40, padding 16/16/0/16, gap 16 — label, then the badge
 *   label     heading/sm, fg/neutral/muted
 *   value     metric/xl, fg/neutral/emphasis
 *   unit      body/md, fg/neutral/muted, after the value
 *   content   padding 16, gap 8 (plain) / 12 (with a meter)
 *   meter     10 segments, only on the status variants
 *
 * ⚠️ It is NOT a Card, though it looks like one: Card has
 * border/neutral/muted and shadow/xs, this has border/neutral/subtle and no
 * shadow. A tile sits in a grid of its peers, so it is quieter than a card
 * that stands alone. Faithful to the file — don't "fix" it to match Card.
 *
 * ⚠️ Status does three things at once, which is Figma's design: it names the
 * badge, colours the badge dot, and colours the meter. The badge is the part
 * that matters — the file's description says it exists "so status never
 * relies on colour alone", which is why the word is not optional when a
 * status is set.
 */
export type KpiStatus = "none" | MeterStatus;

const BADGE: Record<
  MeterStatus,
  { color: "success" | "warning" | "danger" | "neutral"; label: string }
> = {
  healthy: { color: "success", label: "Healthy" },
  warning: { color: "warning", label: "Warning" },
  critical: { color: "danger", label: "Critical" },
  // A value nobody is grading still gets a word, so the grey meter is not
  // the only thing saying so.
  neutral: { color: "neutral", label: "No threshold" },
  unknown: { color: "neutral", label: "Unknown" },
};

export interface KpiTileProps extends Omit<
  React.ComponentProps<"div">,
  "title"
> {
  /** What the number is. heading/sm, muted — the number is the loud part. */
  label: React.ReactNode;
  /** The headline number. metric/xl. */
  value: React.ReactNode;
  /** Sits after the value in body/md — "/ 5", "ms", "%". */
  unit?: React.ReactNode;
  /** `none` is the plain KPI. The rest add a badge and a meter. */
  status?: KpiStatus;
  /** Override the badge wording — the tone's own word is the default. */
  statusLabel?: string;
  /** Hide the badge. Figma's `Show status badge`; think before using it. */
  showStatusBadge?: boolean;
  /** Lights the meter. Omit it and no meter is drawn. */
  meter?: { value: number; max?: number };
  /** Top-right control — a menu, usually. */
  action?: React.ReactNode;
  /** Sits under the number: a comparison badge, a delta, a sparkline. */
  comparison?: React.ReactNode;
  /** Anything below — a progress bar, a footer link. */
  footer?: React.ReactNode;
}

export function KpiTile({
  className,
  label,
  value,
  unit,
  status = "none",
  statusLabel,
  showStatusBadge = true,
  meter,
  action,
  comparison,
  footer,
  ...props
}: KpiTileProps) {
  const tone = status === "none" ? null : status;
  const badge = tone ? BADGE[tone] : null;
  return (
    <div
      data-slot="kpi-tile"
      data-status={status}
      className={cn(
        "flex flex-col rounded-xl border border-line-neutral-muted bg-surface-card",
        className,
      )}
      {...props}
    >
      <div
        data-slot="kpi-tile-header"
        className="flex items-center gap-4 px-4 pt-4"
      >
        <div
          data-slot="kpi-tile-label"
          className="min-w-0 flex-1 text-heading-sm text-content-neutral-muted"
        >
          {label}
        </div>
        {badge && showStatusBadge ? (
          <Badge color={badge.color} dot>
            {statusLabel ?? badge.label}
          </Badge>
        ) : null}
        {action ? (
          <div data-slot="kpi-tile-action" className="shrink-0">
            {action}
          </div>
        ) : null}
      </div>

      <div
        data-slot="kpi-tile-content"
        className={cn("flex flex-col p-4", meter ? "gap-3" : "gap-2")}
      >
        <div className="flex items-baseline gap-1">
          {/* A measurement is one figure: the value, then its unit, left to
              right in every locale — "-0.4 %", never "% -0.4". Only the
              figure is the island; the row still follows the page, so the
              comparison stays at the inline end. A unit that is a word in
              the page's language belongs in the label instead. */}
          <span
            data-slot="kpi-tile-figure"
            className="ltr-island inline-flex items-baseline gap-1"
          >
            <span
              data-slot="kpi-tile-value"
              className="text-metric-xl text-content-neutral-emphasis"
            >
              {value}
            </span>
            {unit ? (
              <span
                data-slot="kpi-tile-unit"
                className="text-body-md text-content-neutral-muted"
              >
                {unit}
              </span>
            ) : null}
          </span>
          {comparison ? (
            <div
              data-slot="kpi-tile-comparison"
              className="ms-auto flex items-center"
            >
              {comparison}
            </div>
          ) : null}
        </div>

        {meter ? (
          <Meter
            value={meter.value}
            max={meter.max}
            // `none` is Figma's Status=Neutral — a value with no thresholds,
            // whose meter still lights, in grey. It is not "no reading".
            status={tone ?? "neutral"}
          />
        ) : null}

        {footer ? <div data-slot="kpi-tile-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
