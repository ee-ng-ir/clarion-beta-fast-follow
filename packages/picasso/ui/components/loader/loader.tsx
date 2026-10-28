// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Loader — indeterminate wait indicators. Figma: `Loader` (Variant = Spinner ·
 * Fuse · Pulse), built on `_Loader / Spinner`, `_Loader / Fuse`,
 * `_Loader / Pulse`.
 *
 * Pick by context, not by taste:
 * - **spinner** — in-console waits with no layout to skeleton: a panel, a
 *   button, a small region. If you know the layout, use Skeleton instead.
 * - **fuse** — brand moments only: app boot, the widget's first run, empty
 *   states. Never inside the console, never below 56px, one on screen.
 * - **pulse** — Iris is thinking, inside the assistant thread.
 *
 * Motion lives in `@ir/tokens/theme.css` (`animate-loader-*`), because @ir/ui
 * ships no CSS. Colours are chart tokens — blue leads (chart-1), purple follows
 * (chart-4), red last and smallest (chart-2) — so light/dark is automatic.
 *
 * Accessibility: the wrapper is a polite status region with a visually hidden
 * label naming the work ("Bringing your fleet online", "Iris is thinking"),
 * not the state ("Loading"). Pass `label={null}` when visible text beside it
 * already says the same thing, so it is not announced twice. Motion is the
 * only signal, never colour alone. `prefers-reduced-motion` stops all travel
 * and rotation; Fuse and Pulse fall back to a slow cross-fade.
 */

type SpinnerSize = "3" | "4" | "5" | "6" | "8" | "xl";
type FuseSize = 56 | 96 | 160;

interface LoaderBaseProps extends Omit<
  React.ComponentProps<"span">,
  "children"
> {
  /**
   * What is being waited for, read by screen readers. `null` hides the loader
   * from assistive tech — use it when visible text already says the same.
   */
  label?: string | null;
  /**
   * Milliseconds before the loader appears. A wait that ends before this
   * never shows anything, which is calmer than a flash. Pulse defaults to 400.
   */
  delay?: number;
}

export type LoaderProps = LoaderBaseProps &
  (
    | { variant?: "spinner"; size?: SpinnerSize; onTint?: never }
    | { variant: "fuse"; size?: FuseSize; onTint?: never }
    | {
        variant: "pulse";
        size?: never;
        /**
         * The loader sits on a tinted fill (the assistant bubble). The lead
         * blue drops to 2.8:1 on #EEF2F6, so it steps down to fg/info/muted.
         */
        onTint?: boolean;
      }
  );

const spinnerSizes: Record<SpinnerSize, string> = {
  "3": "size-3",
  "4": "size-4",
  "5": "size-5",
  "6": "size-6",
  "8": "size-8",
  xl: "size-16",
};

const defaultLabels = {
  spinner: "Loading",
  fuse: "Loading",
  pulse: "Iris is thinking",
} as const;

function useShowAfter(delay: number) {
  const [show, setShow] = React.useState(delay <= 0);
  React.useEffect(() => {
    if (delay <= 0) return;
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return show;
}

type CSSVars = React.CSSProperties & Record<`--${string}`, string>;

/* ── Fuse ────────────────────────────────────────────────────────────────
 * Three droplets on a turning triad. A blur + alpha threshold (the "goo"
 * filter) merges them into one body where they overlap. The filter is
 * defined inline with a unique id, so nothing needs mounting at the app root.
 * It repaints every frame — one instance at a time.
 *
 * The drops stop short of the centre, at different distances each
 * (--loader-merge). Converged to the middle they form a symmetric blob, and a
 * symmetric blob spinning looks still. Don't tighten the merge past ~0.6×.  */
const drops = [
  {
    size: "size-9/25",
    turn: "rotate-0",
    tone: "bg-chart-1",
    reach: "-85%",
    merge: "-24%",
    delay: "0s",
  },
  {
    size: "size-31/100",
    turn: "rotate-120",
    tone: "bg-chart-4",
    reach: "-100%",
    merge: "-23%",
    delay: "-0.075s",
  },
  {
    size: "size-13/50",
    turn: "rotate-240",
    tone: "bg-chart-2",
    reach: "-120%",
    merge: "-36%",
    delay: "-0.15s",
  },
] as const;

const fuseSizes: Record<FuseSize, string> = {
  56: "size-14",
  96: "size-24",
  160: "size-40",
};

function Fuse({ size }: { size: FuseSize }) {
  const id = `ir-loader-goo-${React.useId().replace(/:/g, "")}`;
  return (
    <span
      data-slot="loader-fuse"
      className={cn("relative inline-block shrink-0", fuseSizes[size])}
      style={{ "--loader-goo": `url(#${id})` } as CSSVars}
    >
      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          <filter
            id={id}
            primitiveUnits="objectBoundingBox"
            x="-25%"
            y="-25%"
            width="150%"
            height="150%"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="0.045"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -12"
            />
          </filter>
        </defs>
      </svg>
      <span
        aria-hidden
        // overflow-hidden because the three drop wrappers are rotated copies
        // of the full box, and a rotated square's corners reach past it. They
        // paint nothing out there — the drops are well inside — but the boxes
        // still count as scrollable overflow, which is a horizontal scrollbar
        // on a phone caused by something invisible. Measured: 99px past a 360
        // container before this.
        className="absolute inset-0 overflow-hidden filter-(--loader-goo) animate-loader-turn motion-reduce:animate-none"
      >
        {drops.map((drop) => (
          <span key={drop.turn} className={cn("absolute inset-0", drop.turn)}>
            {/* Centring lives on this wrapper so the drop's own transform is
                free for the animation. */}
            <span
              className={cn(
                "absolute top-1/2 start-1/2 -translate-1/2 rtl:translate-x-1/2",
                drop.size,
              )}
            >
              <span
                className={cn(
                  "block size-full rounded-full",
                  // Reduced motion: hold at the merge point. Scoped to
                  // motion-reduce because Tailwind's translate-* sets the
                  // `translate` property, which would stack on the keyframes'
                  // transform while animating.
                  "motion-reduce:translate-y-(--loader-merge)",
                  "animate-loader-reach motion-reduce:animate-loader-fade",
                  drop.tone,
                )}
                style={
                  {
                    "--loader-reach": drop.reach,
                    "--loader-merge": drop.merge,
                    "--loader-delay": drop.delay,
                  } as CSSVars
                }
              />
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}

/* ── Pulse ───────────────────────────────────────────────────────────────
 * Three 8px dots travel apart and back, and the scale runs INVERSE between
 * the middle and the outer pair: outer 0.78 → 1.08, middle 1.22 → 0.82.
 * That inversion is the component. Three dots scaling together is a bounce;
 * out of phase, the group's mass stays constant and it reads as one body
 * breathing. If a refactor makes all three scale the same way, it's broken.
 * Pure transform — composites, costs nothing. The box is 48 × 12, on the
 * grid; the handoff's 44.8 × 12.8 was the tight bound of the motion.        */
function Pulse({ onTint }: { onTint?: boolean }) {
  const dot = "absolute top-1/2 start-1/2 -mt-1 -ms-1 size-2 rounded-full";
  return (
    <span
      data-slot="loader-pulse"
      aria-hidden
      className="relative inline-block h-3 w-12 shrink-0 align-middle"
      style={{ "--loader-spread": "16px" } as CSSVars}
    >
      <i
        className={cn(
          dot,
          onTint ? "bg-content-info-muted" : "bg-chart-1",
          // Reduced motion: hold at the open position.
          "motion-reduce:-translate-x-4 animate-loader-pulse-l motion-reduce:animate-loader-pulse-fade",
        )}
      />
      <i
        className={cn(
          dot,
          "bg-chart-4 animate-loader-pulse-m motion-reduce:animate-loader-pulse-fade",
        )}
      />
      <i
        className={cn(
          dot,
          "bg-chart-2 motion-reduce:translate-x-4 animate-loader-pulse-r motion-reduce:animate-loader-pulse-fade",
        )}
      />
    </span>
  );
}

export function Loader(props: LoaderProps) {
  const {
    variant = "spinner",
    size,
    onTint,
    label,
    delay = variant === "pulse" ? 400 : 0,
    className,
    ...rest
  } = props as LoaderBaseProps & {
    variant?: "spinner" | "fuse" | "pulse";
    size?: SpinnerSize | FuseSize;
    onTint?: boolean;
  };
  const show = useShowAfter(delay);
  if (!show) return null;

  const text = label === undefined ? defaultLabels[variant] : label;
  const a11y =
    text === null
      ? { "aria-hidden": true as const }
      : { role: "status", "aria-live": "polite" as const };

  return (
    <span
      data-slot="loader"
      data-variant={variant}
      className={cn(
        "inline-flex items-center justify-center",
        variant === "spinner" && "text-content-neutral-emphasis",
        className,
      )}
      {...a11y}
      {...rest}
    >
      {variant === "spinner" && (
        <Loader2
          aria-hidden
          className={cn(
            "animate-spin",
            spinnerSizes[(size as SpinnerSize) ?? "8"],
          )}
        />
      )}
      {variant === "fuse" && <Fuse size={(size as FuseSize) ?? 96} />}
      {variant === "pulse" && <Pulse onTint={onTint} />}
      {text && <span className="sr-only">{text}</span>}
    </span>
  );
}
