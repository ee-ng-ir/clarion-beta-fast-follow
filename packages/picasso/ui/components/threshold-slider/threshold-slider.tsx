// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";

import { cn } from "../../lib/utils";
import { useDirection } from "../direction/direction";

/**
 * ThresholdSlider — Figma's `Slider` Type=Threshold (1106:40) for the states,
 * and `Slider / Threshold` (1751:104) for the six metric presets.
 *
 * Not a variant of `Slider`. Figma models it as Slider's third `Type`, and in
 * Figma that is right — it is the same idea drawn three ways. In code the
 * three types share a track and nothing else: this one has three coloured
 * bands, two differently-coloured thumbs, a labelled value over each and
 * min/max markers under the ends, and it sets two numbers rather than
 * reporting one. A `type="threshold"` branch on Slider would be two
 * components in a trenchcoat, and Radix's range slider cannot paint bands or
 * colour thumbs separately anyway.
 *
 * ⭐ Direction is derived, never declared. Higher is better for MOS, Wi-Fi
 * signal and disk free space; lower is better for CPU and memory. All six
 * presets say which they are simply by the order of the two thresholds —
 * `critical < warning` means low is bad, `warning < critical` means high is
 * bad — so there is no `direction` prop to get wrong, and no way to set one
 * that contradicts the numbers. The bands fall out of it.
 *
 * Verified against all six presets at 696 wide: Network MOS 1–5 c3/w4 gives
 * 348/174/174; Wi-Fi −90 to −30 c−80/w−70 gives 116/116/464; CPU 0–100
 * w70/c85 gives 487/105/104; Memory w75/c90 gives 522/104/70; Disk c5/w15
 * gives 35/69/592. Platform MOS is Network MOS again, number for number.
 *
 * ⭐ The labels move, the thumbs do not. Two 60px labels over thumbs 20px
 * apart are unreadable, so once they would overlap they separate symmetrically
 * about their midpoint — the lower one toward the start, the higher one toward the end — and the
 * pair slides back inside the track if that pushed an end off it.
 *
 * ⭐ When the thumbs meet exactly, the label that survives is the CRITICAL
 * one. There is no warning band at the boundary — the only states either side
 * of it are healthy and critical — so crossing that number skips warning
 * entirely and the number is the critical limit. Labelling it "Warning" would
 * name a state the control cannot be in. The critical thumb is raised over its
 * twin for the same reason: the ring you see should be the colour of the
 * boundary you are reading.
 *
 * ⚠️ The two Figma sets disagree on the thumb colour. The preset gallery
 * binds `status/warning` and `status/critical`; the state set binds
 * `bg/warning/emphasis` and `bg/danger/emphasis`, which are warning-500 and
 * (in dark) danger-500 — different values. `status/*` wins here: it is the
 * family that has a `healthy` member, it is what both sets use for the
 * bands, and it makes each thumb the colour of the boundary it sits on,
 * which is the whole point of the control.
 *
 * Measured: track 8 tall at radius/sm, thumb a 16 circle with a 3 inside
 * stroke over bg/card, labels label/sm over code/xs, min and max in code/xs
 * at fg/neutral/subtle. Disabled is 50% on the whole control, which is what
 * the file draws rather than the bg/disabled pairing the form controls use.
 *
 * The six metric presets are product policy — CPU warns at 70% because
 * Clarion says so — so they live in the stories and in Metrics, not in this
 * package. A design system should not ship a company's alert thresholds.
 */

/**
 * Label geometry in px, because the overlap is a px problem: `w-15` is 60, and
 * 4 of air keeps the two numbers from touching at the seam.
 */
const LABEL_W = 60;
const MIN_SEP = LABEL_W + 4;

/** Positions and a label, as a percentage along the track. */
function pct(value: number, min: number, max: number) {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

/** Snap to the step grid, anchored at min, and shed floating-point dust. */
function snap(v: number, min: number, step: number) {
  if (!step) return v;
  const snapped = min + Math.round((v - min) / step) * step;
  const dp = (String(step).split(".")[1] ?? "").length;
  return Number(snapped.toFixed(dp));
}

export interface ThresholdSliderProps extends Omit<
  React.ComponentProps<"div">,
  "onChange"
> {
  min: number;
  max: number;
  /** The value at which the metric stops being healthy. */
  warning: number;
  /** The value at which it stops being merely worrying. */
  critical: number;
  step?: number;
  disabled?: boolean;
  /** How a value is written — units, decimals. Defaults to `String`. */
  format?: (value: number) => string;
  warningLabel?: string;
  criticalLabel?: string;
  onChange?: (next: { warning: number; critical: number }) => void;
}

export function ThresholdSlider({
  className,
  min,
  max,
  warning,
  critical,
  step = 1,
  disabled = false,
  format = String,
  warningLabel = "Warning",
  criticalLabel = "Critical",
  onChange,
  ...props
}: ThresholdSliderProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  // The scale mirrors: low is at the inline start, so in Arabic it is on the
  // right, as Radix's Slider is. Everything that measures — the pointer, the
  // arrow keys — reads this; everything that draws uses `start-`.
  const rtl = useDirection() === "rtl";

  // The one derivation everything else hangs off. Ties count as higher-is-
  // better, which puts an empty warning band in the middle rather than
  // flipping the whole control on a keystroke as a thumb passes its twin.
  const higherIsBetter = critical <= warning;

  const cPct = pct(critical, min, max);
  const wPct = pct(warning, min, max);

  // The thumbs have met, so the warning band has no width and both labels
  // would read the same number. Only the critical one is drawn: the boundary
  // separates healthy from critical, with no warning state in between.
  const coincident = warning === critical;

  // The track is measured because the labels are a fixed pixel width and the
  // track is fluid: whether 3 and 4 on a 1–5 scale collide depends entirely on
  // how wide the control happens to be.
  const [trackW, setTrackW] = React.useState(0);
  React.useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    setTrackW(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      setTrackW(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Null means each label sits on its own thumb, which is the common case.
  const labelX = React.useMemo(() => {
    if (!trackW || coincident) return null;
    const half = LABEL_W / 2;
    const loX = (Math.min(cPct, wPct) / 100) * trackW;
    const hiX = (Math.max(cPct, wPct) / 100) * trackW;
    if (hiX - loX >= MIN_SEP) return null;
    let lo = (loX + hiX) / 2 - MIN_SEP / 2;
    if (lo < half) lo = half;
    if (lo + MIN_SEP + half > trackW) lo = trackW - half - MIN_SEP;
    const hi = lo + MIN_SEP;
    return cPct < wPct
      ? { critical: lo, warning: hi }
      : { critical: hi, warning: lo };
  }, [trackW, coincident, cPct, wPct]);

  const bands = higherIsBetter
    ? [
        { tone: "critical" as const, from: 0, to: cPct },
        { tone: "warning" as const, from: cPct, to: wPct },
        { tone: "healthy" as const, from: wPct, to: 100 },
      ]
    : [
        { tone: "healthy" as const, from: 0, to: wPct },
        { tone: "warning" as const, from: wPct, to: cPct },
        { tone: "critical" as const, from: cPct, to: 100 },
      ];

  function commit(which: "warning" | "critical", raw: number) {
    if (disabled || !onChange) return;
    // Each thumb is bounded by the track and by its twin: they may meet and
    // may not cross, so the band order can never contradict the direction.
    const lo =
      which === (higherIsBetter ? "critical" : "warning")
        ? min
        : Math.min(warning, critical);
    const hi =
      which === (higherIsBetter ? "critical" : "warning")
        ? Math.max(warning, critical)
        : max;
    const next = clamp(
      snap(raw, min, step),
      Math.max(min, lo),
      Math.min(max, hi),
    );
    if (which === "warning" && next !== warning)
      onChange({ warning: next, critical });
    if (which === "critical" && next !== critical)
      onChange({ warning, critical: next });
  }

  function fromClientX(clientX: number) {
    const el = trackRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (!r.width) return null;
    const fromStart = rtl ? r.right - clientX : clientX - r.left;
    return min + (fromStart / r.width) * (max - min);
  }

  function handlePointerDown(which: "warning" | "critical") {
    return (e: React.PointerEvent<HTMLSpanElement>) => {
      if (disabled) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.focus();
    };
  }

  function handlePointerMove(which: "warning" | "critical") {
    return (e: React.PointerEvent<HTMLSpanElement>) => {
      if (disabled || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
      const v = fromClientX(e.clientX);
      if (v !== null) commit(which, v);
    };
  }

  function handleKeyDown(which: "warning" | "critical") {
    return (e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (disabled) return;
      const current = which === "warning" ? warning : critical;
      const big = step * 10;
      let next: number | null = null;
      // The arrow that points along the scale increases; in RTL that is
      // ArrowLeft. Up and down mean more and less in both.
      const forward = rtl ? "ArrowLeft" : "ArrowRight";
      const back = rtl ? "ArrowRight" : "ArrowLeft";
      if (e.key === forward || e.key === "ArrowUp") next = current + step;
      else if (e.key === back || e.key === "ArrowDown") next = current - step;
      else if (e.key === "PageUp") next = current + big;
      else if (e.key === "PageDown") next = current - big;
      else if (e.key === "Home") next = min;
      else if (e.key === "End") next = max;
      if (next === null) return;
      e.preventDefault();
      commit(which, next);
    };
  }

  const thumbs = [
    {
      which: "critical" as const,
      value: critical,
      label: criticalLabel,
      at: cPct,
    },
    {
      which: "warning" as const,
      value: warning,
      label: warningLabel,
      at: wPct,
    },
  ];

  return (
    <div
      data-slot="threshold-slider"
      data-disabled={disabled || undefined}
      role="group"
      className={cn(
        "flex w-full flex-col gap-1",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      {...props}
    >
      {/* Labels sit over the thumb they belong to. The row is given the
          height of a label over a value rather than measured from an
          absolutely-positioned child, which would collapse it to nothing. */}
      <div className="relative h-8.5">
        {thumbs
          .filter(({ which }) => !(coincident && which === "warning"))
          .map(({ which, value, label, at }) => (
            <span
              key={which}
              data-slot={`threshold-slider-label-${which}`}
              // A custom property plus Tailwind's `start-(--var)` shorthand is
              // the house pattern for a dynamic value — an inline `left` is
              // refused by no-inline-styles and a calc() by no-arbitrary-values.
              style={
                {
                  "--at": labelX ? `${labelX[which]}px` : `${at}%`,
                } as React.CSSProperties
              }
              // `--at` is a distance from the inline start, so the class is
              // `start-`. Centring on that point is half the label's width
              // back toward the start: left in LTR, right in RTL.
              className="absolute top-0 flex w-15 -translate-x-1/2 flex-col items-center start-(--at) rtl:translate-x-1/2"
            >
              <span className="text-label-sm text-content-neutral-muted">
                {label}
              </span>
              <span
                className={cn(
                  // A reading is a figure: "-70 dBm" must not reorder.
                  "ltr-island text-code-xs",
                  which === "critical"
                    ? "text-content-danger-emphasis"
                    : "text-content-warning-emphasis",
                )}
              >
                {format(value)}
              </span>
            </span>
          ))}
      </div>

      <div ref={trackRef} className="relative h-2">
        <div
          data-slot="threshold-slider-bands"
          className="flex h-full w-full overflow-hidden rounded-sm"
        >
          {bands.map(({ tone, from, to }) => (
            <span
              key={tone}
              data-slot={`threshold-slider-band-${tone}`}
              style={
                {
                  "--span": `${Math.max(0, to - from)}%`,
                } as React.CSSProperties
              }
              className={cn(
                "h-full w-(--span)",
                tone === "healthy" && "bg-status-healthy",
                tone === "warning" && "bg-status-warning",
                tone === "critical" && "bg-status-critical",
              )}
            />
          ))}
        </div>

        {thumbs.map(({ which, value, label, at }) => {
          const twin = which === "warning" ? critical : warning;
          const lowThumb = higherIsBetter ? "critical" : "warning";
          return (
            <span
              key={which}
              data-slot={`threshold-slider-thumb-${which}`}
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-label={`${label} threshold`}
              aria-orientation="horizontal"
              aria-valuemin={
                which === lowThumb ? min : Math.min(warning, critical)
              }
              aria-valuemax={
                which === lowThumb ? Math.max(warning, critical) : max
              }
              aria-valuenow={value}
              aria-valuetext={format(value)}
              aria-disabled={disabled || undefined}
              onPointerDown={handlePointerDown(which)}
              onPointerMove={handlePointerMove(which)}
              onKeyDown={handleKeyDown(which)}
              style={{ "--at": `${at}%` } as React.CSSProperties}
              className={cn(
                // no `relative` here — the thumb is already absolute, and
                // tailwind-merge would drop the one that positions it. An
                // absolutely-positioned box is its own containing block, so
                // the ::after has what it needs.
                "absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2 " +
                  // the grab area clears 44 tall and 24 wide; the thumb stays
                  // 16, and two thumbs that converge barely overlap. The
                  // insets look large because border-3 leaves a 10px padding
                  // box for them to grow from.
                  "after:absolute after:-inset-y-5 after:-inset-x-2 " +
                  "cursor-grab touch-none rounded-full border-3 bg-surface-card " +
                  "shadow-sm outline-none focus-visible:ring-2 " +
                  "focus-visible:ring-line-focused active:cursor-grabbing " +
                  "start-(--at)",
                which === "critical"
                  ? "border-status-critical"
                  : "border-status-warning",
                // Stacked thumbs: the critical one takes the top, so the ring
                // matches the label on the boundary. Dragging it still
                // separates the pair — lowering critical opens a warning band
                // behind it — and the warning thumb stays keyboard-reachable.
                coincident && which === "critical" && "z-raised",
                // Not aria-hidden and not unreachable: a disabled control is
                // still something you may need to read.
                disabled && "cursor-default",
              )}
            />
          );
        })}
      </div>

      <div className="flex justify-between text-code-xs text-content-neutral-subtle">
        <span data-slot="threshold-slider-min" className="ltr-island">
          {format(min)}
        </span>
        <span data-slot="threshold-slider-max" className="ltr-island">
          {format(max)}
        </span>
      </div>
    </div>
  );
}
