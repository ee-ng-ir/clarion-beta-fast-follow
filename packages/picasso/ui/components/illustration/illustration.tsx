// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import {
  Activity,
  Check,
  CircleCheck,
  Cloud,
  Database,
  Eye,
  Headset,
  History,
  KeyRound,
  Monitor,
  Network,
  Pencil,
  Phone,
  Plug,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Wifi,
} from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Illustration — product spot illustrations that answer the pointer.
 *
 * Figma: the Illustration page, drawn from this file (Name × State). Code
 * first, and code is the source of truth. The first three drawings follow the
 * Spotkit spots in `IR Brand/illustrations/product-illustrations` (Issue
 * alerts, Fleet health, Call readiness): a 160 × 160 box, one 0.5 stroke, a
 * panel with a ghost behind it, bars for text, one accent. The rest are
 * drawn to the same rules for the empty states and list cards a SaaS
 * console keeps needing.
 *
 * ⚠️ Two deliberate differences from the Spotkit files. The colours are
 * Picasso semantics, not the `--il-*` preset, so the hairline is
 * `border/neutral/emphasis` and the bars are `bg/layer/emphasis` — one step
 * off the preset's in-between greys. And the glyphs are Lucide, not
 * Phosphor, because Lucide is the only icon library here.
 *
 * Because every colour is a semantic, a drawing follows the brand it sits
 * in: under `data-brand="vantage"` the accent is Vantage's, with no copy of
 * the drawing and no prop.
 *
 * Each drawing carries one mechanic. Pick the drawing for what it shows, not
 * for how it moves:
 * - **Lift** — a discrete change. The item under the pointer opens.
 *   issue-alerts (the gap moves and the alerts below make room),
 *   search-results (the result slides in), dashboards (the widget rises).
 * - **Magnify** — a continuous one. Each shape's radius is a function of its
 *   distance from the pointer, run through its own spring; the nearest takes
 *   the accent. fleet-health, topology, team-access.
 * - **Sequence** — a stepped loop while the pointer is over it. Four steps,
 *   one lit at a time, and the connectors run. call-readiness,
 *   activity-log, integrations, assistant.
 *
 * `active` hands the response to a parent. A list card owns the hover for
 * the whole card, so it passes `active` and the picture stops listening:
 * lift opens the next item, magnify swells around the flagged shape and
 * sequence runs. It is the one way a picture moves inside the product; see
 * "List cards" in docs/foundations/motion.md.
 *
 * Geometry is drawn in SVG attributes on purpose: a corner here is part of a
 * picture, not a control, so it does not follow `--radius`, and distances
 * are box units, not the spacing scale. Colour is always a utility.
 *
 * Motion lives in `@ir/tokens/theme.css` (`transition-illustration`,
 * `animate-illustration-*`, `illustration-float`). Under
 * `prefers-reduced-motion` nothing travels: lift changes state without the
 * slide, magnify moves the accent and leaves the radii alone, and sequence
 * does not run. The drawing still says what it means standing still.
 *
 * Accessibility: `role="img"` with a label naming the feature; `label={null}`
 * hides it when the heading beside it already says the same. The response is
 * decoration — nothing is focusable and nothing is said only by it.
 */

export type IllustrationName =
  | "issue-alerts"
  | "fleet-health"
  | "call-readiness"
  | "search-results"
  | "dashboards"
  | "topology"
  | "team-access"
  | "activity-log"
  | "integrations"
  | "assistant";

export interface IllustrationProps extends Omit<
  React.ComponentProps<"svg">,
  "children" | "viewBox" | "name" | "style"
> {
  /** Which drawing. Each has one mechanic; see the component notes. */
  name: IllustrationName;
  /**
   * What the picture shows, read by screen readers. `null` hides it from
   * assistive tech — use it when a heading beside it says the same thing.
   */
  label?: string | null;
  /**
   * Answer the pointer. Turn off where the picture sits inside the product
   * (an empty state) and should stay still.
   */
  interactive?: boolean;
  /**
   * Let a parent drive the response instead of the pointer — a list card
   * that owns the hover for the whole card. When set, the picture stops
   * listening: `true` plays the response (lift opens the next item, magnify
   * swells around the flagged shape, sequence runs), `false` holds it at
   * rest. Leave it unset for a picture that answers the pointer itself.
   */
  active?: boolean;
}

type CSSVars = React.CSSProperties & Record<`--${string}`, string>;
type Point = { x: number; y: number };
/** How a drawing responds: to the pointer, to its parent, or not at all. */
type Mode = "pointer" | "driven" | "still";
interface DrawingProps {
  mode: Mode;
  active: boolean;
}

const BOX = 160;
const HAIRLINE = 0.5;

const line = "stroke-line-neutral-emphasis";
const bar = "fill-surface-layer-emphasis";
const barMuted = "fill-surface-layer-muted";
const glyph = "text-content-neutral-subtle";
const accentGlyph = "text-content-primary-muted";
const accentTint = "fill-surface-primary-muted";
const accentFill = "fill-surface-primary-emphasis";
/** One curve for anything that slides or recolours with a lift. */
const move = "transition-illustration motion-reduce:transition-none";

const defaultLabels: Record<IllustrationName, string> = {
  "issue-alerts": "Issue alerts",
  "fleet-health": "Fleet health",
  "call-readiness": "Call readiness",
  "search-results": "Search results",
  dashboards: "Dashboards",
  topology: "Topology",
  "team-access": "Team access",
  "activity-log": "Activity log",
  integrations: "Integrations",
  assistant: "Assistant",
};

/** The pointer in box units, whatever size the picture is drawn at. */
function toBox(event: React.PointerEvent<SVGElement>): Point | null {
  const svg = event.currentTarget.ownerSVGElement;
  const rect = svg?.getBoundingClientRect();
  if (!rect || !rect.width || !rect.height) return null;
  return {
    x: ((event.clientX - rect.left) / rect.width) * BOX,
    y: ((event.clientY - rect.top) / rect.height) * BOX,
  };
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** The panel every spot sits on, and its ghost one step behind. */
function Backdrop() {
  return (
    <>
      <rect
        x={30}
        y={30}
        width={116}
        height={118}
        rx={10}
        strokeWidth={HAIRLINE}
        className={cn("fill-surface-canvas", line)}
      />
      <rect
        x={22}
        y={22}
        width={116}
        height={118}
        rx={10}
        strokeWidth={HAIRLINE}
        className={cn("fill-surface-app", line)}
      />
    </>
  );
}

/**
 * The layer that listens. It never moves, so a shape sliding out from under
 * the pointer cannot end the hover that moved it.
 */
function HitArea(
  props: Pick<React.ComponentProps<"rect">, "onPointerMove" | "onPointerLeave">,
) {
  return (
    <rect
      data-slot="illustration-hit"
      width={BOX}
      height={BOX}
      className="fill-transparent"
      {...props}
    />
  );
}

/** A two-line label: the bars that stand in for text. */
function Bars({
  x,
  y,
  widths,
  muted = false,
}: {
  x: number;
  y: number;
  widths: [number, number];
  muted?: boolean;
}) {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={widths[0]}
        height={3.4}
        rx={1.7}
        className={bar}
      />
      <rect
        x={x}
        y={y + 5.8}
        width={widths[1]}
        height={3.4}
        rx={1.7}
        className={muted ? barMuted : bar}
      />
    </>
  );
}

/** The raised summary card at the foot of a field: accent chip, two bars. */
function SummaryCard({
  icon: Icon,
  x = 56,
  y = 106,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  x?: number;
  y?: number;
}) {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={92}
        height={30}
        rx={9}
        strokeWidth={HAIRLINE}
        className={cn("illustration-float fill-surface-card", line)}
      />
      <circle cx={x + 17} cy={y + 15} r={8} className={accentTint} />
      <Icon
        aria-hidden
        x={x + 12.5}
        y={y + 10.5}
        width={9}
        height={9}
        strokeWidth={1.75}
        className={accentGlyph}
      />
      <rect
        x={x + 32}
        y={y + 8}
        width={26}
        height={3.6}
        rx={1.8}
        className={bar}
      />
      <rect
        x={x + 32}
        y={y + 15.4}
        width={44}
        height={4}
        rx={2}
        className={bar}
      />
    </>
  );
}

/** A square tile carrying a glyph — a check, a stage, a source. */
function Tile({
  icon: Icon,
  x,
  y,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  x: number;
  y: number;
}) {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={16}
        height={16}
        rx={5}
        strokeWidth={HAIRLINE}
        className={cn("fill-surface-app", line)}
      />
      <Icon
        aria-hidden
        x={x + 3}
        y={y + 3}
        width={10}
        height={10}
        strokeWidth={1.5}
        className={glyph}
      />
    </>
  );
}

/* ── Lift ─────────────────────────────────────────────────────────────────
 * One item is open. The pointer picks it; a parent can instead, with
 * `active`, which opens the next one along.                                */

/** Milliseconds between one shape starting to move and the next. */
const STAGGER = 50;

function useLift(
  mode: Mode,
  active: boolean,
  itemAt: (point: Point, open: number) => number,
) {
  const [pointed, setPointed] = React.useState(0);
  const open = mode === "driven" ? (active ? 1 : 0) : pointed;
  const listen =
    mode === "pointer" ? (
      <HitArea
        onPointerMove={(event) => {
          const point = toBox(event);
          if (point) setPointed((current) => itemAt(point, current));
        }}
        onPointerLeave={() => setPointed(0)}
      />
    ) : null;
  return { open, listen };
}

/* Issue alerts — three alerts in a list. One is open: it floats, takes the
 * accent, and the alerts below it sit 16 lower, which uncovers its detail.
 *
 * The detail for every alert is always drawn, underneath. A closed alert's
 * detail is hidden by a card: the next one if it is above the gap, its own
 * (pushed down over it) if it is below. That is why the gap (16) and the
 * detail's position are tied: change one and bars start showing through.   */
const ALERT = { x: 34, y: 34, width: 92, height: 22, step: 28, gap: 16 };
const ALERTS = [0, 1, 2] as const;

/**
 * Which alert the pointer is on, given which one is open. Each alert owns
 * its card and the space under it, so pointing at an alert and having it
 * open never changes the answer — no flicker at the edges.
 */
export function alertAt(y: number, open: number) {
  let hit = 0;
  for (const i of ALERTS) {
    const top = ALERT.y + i * ALERT.step + (i > open ? ALERT.gap : 0);
    if (y >= top) hit = i;
  }
  return hit;
}

function IssueAlerts({ mode, active }: DrawingProps) {
  const { open, listen } = useLift(mode, active, (point, current) =>
    alertAt(point.y, current),
  );

  return (
    <>
      <Backdrop />
      {ALERTS.map((i) => {
        const y = ALERT.y + i * ALERT.step + ALERT.height;
        return (
          <g key={i} data-slot="illustration-detail">
            <circle cx={47} cy={y + 11.4} r={1.6} className={bar} />
            <rect
              x={60}
              y={y + 7}
              width={30}
              height={3.2}
              rx={1.6}
              className={bar}
            />
            <rect
              x={60}
              y={y + 12.6}
              width={46}
              height={3.2}
              rx={1.6}
              className={barMuted}
            />
          </g>
        );
      })}
      {ALERTS.map((i) => {
        const isOpen = i === open;
        const pushed = i > open;
        const y = ALERT.y + i * ALERT.step;
        return (
          <g
            key={i}
            data-slot="illustration-card"
            data-open={isOpen ? "" : undefined}
            data-pushed={pushed ? "" : undefined}
            className={cn(move, pushed && "translate-y-(--illustration-gap)")}
            style={
              {
                // Cards making room start one after another, nearest the gap
                // first. Cards closing up go together.
                "--illustration-delay": `${pushed ? (i - open - 1) * STAGGER : 0}ms`,
              } as CSSVars
            }
          >
            <rect
              x={ALERT.x}
              y={y}
              width={ALERT.width}
              height={ALERT.height}
              rx={7}
              strokeWidth={HAIRLINE}
              className={cn(
                "fill-surface-card",
                line,
                move,
                isOpen && "illustration-float",
              )}
            />
            <circle
              cx={47}
              cy={y + 11}
              r={7}
              className={cn(move, isOpen ? accentTint : barMuted)}
            />
            <TriangleAlert
              aria-hidden
              x={42.5}
              y={y + 6.5}
              width={9}
              height={9}
              strokeWidth={1.5}
              className={cn(move, isOpen ? accentGlyph : glyph)}
            />
            <rect
              x={60}
              y={y + 6.4}
              width={28}
              height={3.4}
              rx={1.7}
              className={bar}
            />
            <rect
              x={60}
              y={y + 12.2}
              width={52}
              height={3.6}
              rx={1.8}
              className={bar}
            />
          </g>
        );
      })}
      {listen}
    </>
  );
}

/* Search results — a query, and three results under it. The open result
 * slides in by 4 and floats. Rows never overlap and slide sideways only, so
 * each owns a fixed band and nothing can slip out from under the pointer.   */
const RESULT = { x: 34, y: 64, width: 92, height: 18, step: 24, slide: 4 };
const RESULTS = [0, 1, 2] as const;

/** Which result the pointer is on. Above the results, the open one stays. */
export function resultAt(y: number, open: number) {
  if (y < RESULT.y - RESULT.step / 4) return open;
  const i = Math.floor((y - RESULT.y + 3) / RESULT.step);
  return Math.max(0, Math.min(RESULTS.length - 1, i));
}

function SearchResults({ mode, active }: DrawingProps) {
  const { open, listen } = useLift(mode, active, (point, current) =>
    resultAt(point.y, current),
  );

  return (
    <>
      <Backdrop />
      <rect
        x={34}
        y={34}
        width={92}
        height={20}
        rx={10}
        strokeWidth={HAIRLINE}
        className={cn("illustration-float fill-surface-card", line)}
      />
      <Search
        aria-hidden
        x={40}
        y={39}
        width={10}
        height={10}
        strokeWidth={1.75}
        className={accentGlyph}
      />
      <rect x={56} y={42.3} width={40} height={3.4} rx={1.7} className={bar} />
      {RESULTS.map((i) => {
        const isOpen = i === open;
        const y = RESULT.y + i * RESULT.step;
        return (
          <g
            key={i}
            data-slot="illustration-result"
            data-open={isOpen ? "" : undefined}
            className={cn(move, isOpen && "translate-x-(--illustration-slide)")}
          >
            <rect
              x={RESULT.x}
              y={y}
              width={RESULT.width}
              height={RESULT.height}
              rx={6}
              strokeWidth={HAIRLINE}
              className={cn(
                "fill-surface-card",
                line,
                move,
                isOpen && "illustration-float",
              )}
            />
            <circle
              cx={45}
              cy={y + 9}
              r={5}
              className={cn(move, isOpen ? accentTint : barMuted)}
            />
            <rect
              x={56}
              y={y + 4.6}
              width={30}
              height={3}
              rx={1.5}
              className={bar}
            />
            <rect
              x={56}
              y={y + 10.2}
              width={50}
              height={3}
              rx={1.5}
              className={barMuted}
            />
          </g>
        );
      })}
      {listen}
    </>
  );
}

/* Dashboards — four widgets. The open one rises 3 and floats, and its
 * corner dot takes the accent. A widget rises inside its own quadrant, so
 * quadrants are the bands and the answer never flickers.                   */
const WIDGETS: Point[] = [
  { x: 32, y: 34 },
  { x: 84, y: 34 },
  { x: 32, y: 86 },
  { x: 84, y: 86 },
];
const WIDGET = 44;

/** Which widget the pointer is on: the quadrant it is in. */
export function widgetAt(point: Point) {
  return (point.x >= 80 ? 1 : 0) + (point.y >= 82 ? 2 : 0);
}

/** What each widget shows, abstracted: columns, a line, a ring, a list. */
function WidgetSketch({ i, x, y }: { i: number } & Point) {
  if (i === 0)
    return (
      <>
        {[10, 16, 12, 20].map((h, j) => (
          <rect
            key={j}
            x={x + 8 + j * 8}
            y={y + 38 - h}
            width={5}
            height={h}
            rx={1.2}
            className={bar}
          />
        ))}
      </>
    );
  if (i === 1)
    return (
      <path
        d={`M${x + 7} ${y + 36}l8-8 7 4 8-11 7 5`}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={line}
      />
    );
  if (i === 2)
    return (
      <>
        <circle
          cx={x + 22}
          cy={y + 28}
          r={8}
          strokeWidth={2.4}
          className="stroke-surface-layer-muted"
        />
        <path
          d={`M${x + 22} ${y + 20}a8 8 0 0 1 7.6 10.5`}
          strokeWidth={2.4}
          strokeLinecap="round"
          className="stroke-surface-layer-emphasis"
        />
      </>
    );
  return (
    <>
      <rect
        x={x + 7}
        y={y + 20}
        width={30}
        height={3}
        rx={1.5}
        className={bar}
      />
      <rect
        x={x + 7}
        y={y + 26}
        width={24}
        height={3}
        rx={1.5}
        className={barMuted}
      />
      <rect
        x={x + 7}
        y={y + 32}
        width={28}
        height={3}
        rx={1.5}
        className={barMuted}
      />
    </>
  );
}

function Dashboards({ mode, active }: DrawingProps) {
  const { open, listen } = useLift(mode, active, (point) => widgetAt(point));

  return (
    <>
      <Backdrop />
      {WIDGETS.map(({ x, y }, i) => {
        const isOpen = i === open;
        return (
          <g
            key={i}
            data-slot="illustration-widget"
            data-open={isOpen ? "" : undefined}
            className={cn(move, isOpen && "-translate-y-(--illustration-rise)")}
          >
            <rect
              x={x}
              y={y}
              width={WIDGET}
              height={WIDGET}
              rx={7}
              strokeWidth={HAIRLINE}
              className={cn(
                "fill-surface-card",
                line,
                move,
                isOpen && "illustration-float",
              )}
            />
            <rect
              x={x + 7}
              y={y + 7}
              width={18}
              height={3.4}
              rx={1.7}
              className={bar}
            />
            <circle
              cx={x + 36}
              cy={y + 8.7}
              r={2.4}
              className={cn(move, isOpen ? accentFill : barMuted)}
            />
            <WidgetSketch i={i} x={x} y={y} />
          </g>
        );
      })}
      {listen}
    </>
  );
}

/* ── Magnify ──────────────────────────────────────────────────────────────
 * A field of shapes. Each one's radius falls off with its distance from the
 * pointer and is chased by its own spring, so the swell trails the pointer
 * slightly and settles without a bounce you would notice.
 *
 * The radius is written straight to the attribute each frame; React never
 * re-renders for it. Only the accent — which shape is nearest — is state.
 *
 * The falloff is capped so two neighbours can never touch: the tightest
 * field is 14 apart and the largest pair sums to under 10. The test holds
 * it there.                                                                */
const RADIUS = { rest: 2.2, flagged: 3.4, near: 3.8, peak: 6 };
const REACH = { near: 10, far: 34 };
/** Mass 1. Damping ratio 0.84: one small overshoot, then still. */
const SPRING = { stiffness: 170, damping: 22 };

/** A shape's radius for its distance from the pointer, in box units. */
export function magnify(distance: number, rest = RADIUS.rest) {
  if (distance <= REACH.near)
    return RADIUS.peak - (distance / REACH.near) * (RADIUS.peak - RADIUS.near);
  if (distance <= REACH.far)
    return (
      RADIUS.near -
      ((distance - REACH.near) / (REACH.far - REACH.near)) *
        (RADIUS.near - rest)
    );
  return rest;
}

interface Field {
  points: Point[];
  /** The shape that carries the accent when nothing is pointing. */
  flagged: number;
  rest?: number;
}

function useMagnify({ points, flagged, rest = RADIUS.rest }: Field) {
  const restRadius = React.useCallback(
    (i: number) => (i === flagged ? RADIUS.flagged : rest),
    [flagged, rest],
  );
  const shapes = React.useRef<(SVGCircleElement | null)[]>([]);
  const sim = React.useRef({
    radius: points.map((_, i) => restRadius(i)),
    velocity: points.map(() => 0),
    target: points.map((_, i) => restRadius(i)),
    frame: 0,
    last: 0,
  });
  const [focus, setFocus] = React.useState(flagged);

  React.useEffect(() => {
    const state = sim.current;
    return () => cancelAnimationFrame(state.frame);
  }, []);

  const run = React.useCallback(() => {
    const state = sim.current;
    if (state.frame) return;
    state.last = performance.now();
    const tick = (now: number) => {
      // Clamp the step: a tab coming back from the background would
      // otherwise hand the spring one enormous frame and fling the shapes.
      const dt = Math.min((now - state.last) / 1000, 1 / 30);
      state.last = now;
      let moving = false;
      for (let i = 0; i < points.length; i++) {
        const pull = -SPRING.stiffness * (state.radius[i] - state.target[i]);
        state.velocity[i] += (pull - SPRING.damping * state.velocity[i]) * dt;
        state.radius[i] += state.velocity[i] * dt;
        const settled =
          Math.abs(state.velocity[i]) < 0.01 &&
          Math.abs(state.radius[i] - state.target[i]) < 0.01;
        if (settled) {
          state.radius[i] = state.target[i];
          state.velocity[i] = 0;
        } else {
          moving = true;
        }
        shapes.current[i]?.setAttribute("r", state.radius[i].toFixed(2));
      }
      state.frame = moving ? requestAnimationFrame(tick) : 0;
    };
    state.frame = requestAnimationFrame(tick);
  }, [points.length]);

  const aim = React.useCallback(
    (point: Point | null) => {
      const distances = points.map((p) =>
        point ? Math.hypot(point.x - p.x, point.y - p.y) : Infinity,
      );
      const nearest = distances.indexOf(Math.min(...distances));
      // Pointing anywhere off the field — a summary card, the margin — is rest.
      const onField = distances[nearest] <= REACH.far;
      setFocus(onField ? nearest : flagged);
      // Reduced motion: the accent moves, the radii do not.
      if (prefersReducedMotion()) return;
      sim.current.target = distances.map((distance, i) =>
        onField ? magnify(distance, rest) : restRadius(i),
      );
      run();
    },
    [points, flagged, rest, restRadius, run],
  );

  const ref = (i: number) => (element: SVGCircleElement | null) => {
    shapes.current[i] = element;
  };

  return { focus, aim, ref, restRadius };
}

/** Drive a field from its parent, or listen to the pointer. */
function useFieldResponse(
  mode: Mode,
  active: boolean,
  field: Field,
  aim: (point: Point | null) => void,
) {
  const target = field.points[field.flagged];
  React.useEffect(() => {
    if (mode !== "driven") return;
    aim(active ? target : null);
  }, [mode, active, target, aim]);
  return mode === "pointer" ? (
    <HitArea
      onPointerMove={(event) => aim(toBox(event))}
      onPointerLeave={() => aim(null)}
    />
  ) : null;
}

/* Fleet health — a grid of endpoints and a summary card.                  */
const FLEET = { cols: 7, rows: 4, x: 38, y: 52, step: 14 };
const FLEET_FIELD: Field = {
  points: Array.from({ length: FLEET.cols * FLEET.rows }, (_, i) => ({
    x: FLEET.x + (i % FLEET.cols) * FLEET.step,
    y: FLEET.y + Math.floor(i / FLEET.cols) * FLEET.step,
  })),
  flagged: 11,
};

function FleetHealth({ mode, active }: DrawingProps) {
  const { focus, aim, ref, restRadius } = useMagnify(FLEET_FIELD);
  const listen = useFieldResponse(mode, active, FLEET_FIELD, aim);

  return (
    <>
      <Backdrop />
      <circle cx={32} cy={31} r={1.7} className={bar} />
      <circle cx={37.5} cy={31} r={1.7} className={bar} />
      <circle cx={43} cy={31} r={1.7} className={bar} />
      <path d="M22 39H138" strokeWidth={HAIRLINE} className={line} />
      {FLEET_FIELD.points.map((dot, i) => (
        <circle
          key={i}
          ref={ref(i)}
          data-slot="illustration-dot"
          data-focus={i === focus ? "" : undefined}
          cx={dot.x}
          cy={dot.y}
          r={restRadius(i)}
          className={cn("transition-colors", i === focus ? accentFill : bar)}
        />
      ))}
      <SummaryCard icon={Check} />
      {listen}
    </>
  );
}

/* Topology — systems joined up: a service map, a site network, the
 * dependencies behind an incident. Each node is a ring with a core; the
 * core is what swells. Nodes sit at least 20 apart, wider than the fleet.  */
const TOPOLOGY_FIELD: Field = {
  points: [
    { x: 40, y: 48 },
    { x: 74, y: 42 },
    { x: 110, y: 50 },
    { x: 126, y: 76 },
    { x: 58, y: 74 },
    { x: 92, y: 76 },
    { x: 38, y: 98 },
    { x: 114, y: 98 },
  ],
  flagged: 5,
};
const LINKS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [0, 4],
  [1, 5],
  [4, 5],
  [5, 3],
  [4, 6],
  [5, 7],
  [3, 7],
];

function Topology({ mode, active }: DrawingProps) {
  const { focus, aim, ref, restRadius } = useMagnify(TOPOLOGY_FIELD);
  const listen = useFieldResponse(mode, active, TOPOLOGY_FIELD, aim);
  const { points } = TOPOLOGY_FIELD;

  return (
    <>
      <Backdrop />
      {LINKS.map(([a, b]) => (
        <path
          key={`${a}-${b}`}
          d={`M${points[a].x} ${points[a].y}L${points[b].x} ${points[b].y}`}
          strokeWidth={HAIRLINE}
          className={line}
        />
      ))}
      {points.map((node, i) => (
        <circle
          key={`ring-${i}`}
          cx={node.x}
          cy={node.y}
          r={7.5}
          strokeWidth={HAIRLINE}
          className={cn("fill-surface-app", line)}
        />
      ))}
      {points.map((node, i) => (
        <circle
          key={i}
          ref={ref(i)}
          data-slot="illustration-node"
          data-focus={i === focus ? "" : undefined}
          cx={node.x}
          cy={node.y}
          r={restRadius(i)}
          className={cn("transition-colors", i === focus ? accentFill : bar)}
        />
      ))}
      <SummaryCard icon={Network} />
      {listen}
    </>
  );
}

/* Team access — who can do what. People down the side, permissions across
 * the top (view, edit, admin), a cell where they meet. Filled cells are
 * granted, hollow ones are not; the cell under the pointer swells and takes
 * the accent.                                                              */
const ACCESS = { cols: [78, 102, 126], rows: [64, 82, 100, 118] };
const GRANTED = [1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0];
const ACCESS_FIELD: Field = {
  points: ACCESS.rows.flatMap((y) => ACCESS.cols.map((x) => ({ x, y }))),
  flagged: 4,
  rest: 3,
};
const PERMISSIONS = [Eye, Pencil, Shield] as const;

function TeamAccess({ mode, active }: DrawingProps) {
  const { focus, aim, ref, restRadius } = useMagnify(ACCESS_FIELD);
  const listen = useFieldResponse(mode, active, ACCESS_FIELD, aim);

  return (
    <>
      <Backdrop />
      {PERMISSIONS.map((Icon, c) => (
        <Tile key={c} icon={Icon} x={ACCESS.cols[c] - 8} y={32} />
      ))}
      {ACCESS.rows.map((y) => (
        <g key={y}>
          <circle cx={37} cy={y} r={5} className={barMuted} />
          <rect
            x={46}
            y={y - 1.7}
            width={14}
            height={3.4}
            rx={1.7}
            className={bar}
          />
        </g>
      ))}
      {ACCESS_FIELD.points.map((cell, i) => {
        const granted = GRANTED[i] === 1;
        const isFocus = i === focus;
        return (
          <circle
            key={i}
            ref={ref(i)}
            data-slot="illustration-cell"
            data-focus={isFocus ? "" : undefined}
            data-granted={granted ? "" : undefined}
            cx={cell.x}
            cy={cell.y}
            r={restRadius(i)}
            strokeWidth={granted || isFocus ? 0 : HAIRLINE}
            className={cn(
              "transition-colors",
              isFocus
                ? accentFill
                : granted
                  ? bar
                  : cn("fill-surface-app", line),
            )}
          />
        );
      })}
      {listen}
    </>
  );
}

/* ── Sequence ─────────────────────────────────────────────────────────────
 * Four steps feed one answer. While the pointer is over the picture — or
 * while a parent holds it `active` — the steps light in turn, each for a
 * quarter of the loop, in steps, and the dashes run.
 *
 * One step is lit at a time, never all four: with the answer that keeps the
 * accent on two shapes, which is the Spotkit limit. If a change makes them
 * accumulate, it has broken the brand rule, not improved the animation.
 *
 * No script. The loop is `group-hover` (or `group-data-[active]`) on the
 * root, so it costs nothing at rest and stops the moment the pointer leaves.
 *
 * ⚠️ `motion-safe:` on the trigger class, not `motion-reduce:animate-none`
 * beside it. A hover variant is emitted after `motion-reduce:`, so the
 * override loses and the loop runs anyway — which is what it did at first.  */

/** A quarter of the 2.4s loop in theme.css. Change them together. */
const CHECK_STEP = 600;

/** The class that runs one of the sequence animations, for this mode. */
function runs(mode: Mode, animation: "check" | "flow") {
  if (mode === "pointer")
    return animation === "check"
      ? "motion-safe:group-hover/illustration:animate-illustration-check"
      : "motion-safe:group-hover/illustration:animate-illustration-flow";
  if (mode === "driven")
    return animation === "check"
      ? "motion-safe:group-data-[active]/illustration:animate-illustration-check"
      : "motion-safe:group-data-[active]/illustration:animate-illustration-flow";
  return undefined;
}

/** A dashed connector that runs while the sequence does. */
function Wire({ d, mode }: { d: string; mode: Mode }) {
  return (
    <path
      d={d}
      strokeWidth={HAIRLINE}
      strokeDasharray="2.4 3"
      strokeLinecap="round"
      className={cn(line, runs(mode, "flow"))}
    />
  );
}

/** The ring that lights for step k. Drawn only when something can run it. */
function StepRing({
  mode,
  k,
  ...shape
}: { mode: Mode; k: number } & (
  | { x: number; y: number; size: number; rx: number }
  | { cx: number; cy: number; r: number }
)) {
  if (mode === "still") return null;
  const style = { "--illustration-delay": `${k * CHECK_STEP}ms` } as CSSVars;
  const cls = cn("stroke-line-primary-emphasis opacity-0", runs(mode, "check"));
  if ("r" in shape)
    return (
      <circle
        data-slot="illustration-step"
        cx={shape.cx}
        cy={shape.cy}
        r={shape.r}
        strokeWidth={1}
        style={style}
        className={cls}
      />
    );
  return (
    <rect
      data-slot="illustration-step"
      x={shape.x}
      y={shape.y}
      width={shape.size}
      height={shape.size}
      rx={shape.rx}
      strokeWidth={1}
      style={style}
      className={cls}
    />
  );
}

/* Call readiness — headset, machine, platform and network checks roll up
 * into one shield.                                                          */
const CHECKS = [
  { Icon: Headset, x: 28, y: 40, wire: "M44 48C53.5 48 53.5 69 63 69" },
  { Icon: Monitor, x: 116, y: 40, wire: "M116 48C106.5 48 106.5 69 97 69" },
  { Icon: Cloud, x: 116, y: 88, wire: "M116 96C106.5 96 106.5 69 97 69" },
  { Icon: Wifi, x: 28, y: 88, wire: "M44 96C53.5 96 53.5 69 63 69" },
] as const;

function CallReadiness({ mode }: DrawingProps) {
  return (
    <>
      <Backdrop />
      {CHECKS.map(({ Icon, x, y, wire }, i) => (
        <g
          key={wire}
          data-slot="illustration-check"
          style={{ "--illustration-delay": `${i * CHECK_STEP}ms` } as CSSVars}
        >
          <Wire d={wire} mode={mode} />
          <Tile icon={Icon} x={x} y={y} />
          {mode !== "still" && (
            <rect
              data-slot="illustration-check-ring"
              x={x}
              y={y}
              width={16}
              height={16}
              rx={5}
              strokeWidth={1}
              className={cn(
                "stroke-line-primary-emphasis opacity-0",
                runs(mode, "check"),
              )}
            />
          )}
        </g>
      ))}
      <rect
        x={63}
        y={52}
        width={34}
        height={34}
        rx={11}
        strokeWidth={HAIRLINE}
        className={cn("illustration-float fill-surface-card", line)}
      />
      <ShieldCheck
        aria-hidden
        x={71}
        y={60}
        width={18}
        height={18}
        strokeWidth={1.5}
        className={accentGlyph}
      />
      <rect x={52} y={110} width={56} height={5} rx={2.5} className={bar} />
      <rect x={62} y={120} width={36} height={4.4} rx={2.2} className={bar} />
    </>
  );
}

/* Activity log — events in order, newest first: an audit trail, a history,
 * a run log. The four nodes on the rail light top to bottom.               */
const EVENTS = [48, 72, 96, 120];

function ActivityLog({ mode }: DrawingProps) {
  return (
    <>
      <Backdrop />
      <rect x={30} y={31} width={34} height={4} rx={2} className={bar} />
      <rect x={30} y={38} width={20} height={3} rx={1.5} className={barMuted} />
      <circle cx={122} cy={36} r={8} className={accentTint} />
      <History
        aria-hidden
        x={117.5}
        y={31.5}
        width={9}
        height={9}
        strokeWidth={1.75}
        className={accentGlyph}
      />
      <path
        d={`M42 ${EVENTS[0]}V${EVENTS[EVENTS.length - 1]}`}
        strokeWidth={HAIRLINE}
        className={line}
      />
      {EVENTS.map((y, k) => (
        <g key={y} data-slot="illustration-event">
          <circle
            cx={42}
            cy={y}
            r={4}
            strokeWidth={HAIRLINE}
            className={cn("fill-surface-app", line)}
          />
          <StepRing mode={mode} k={k} cx={42} cy={y} r={4} />
          <Bars
            x={54}
            y={y - 5}
            widths={[k === 0 ? 42 : 34, 56 - k * 6]}
            muted
          />
          <rect
            x={114}
            y={y - 3.3}
            width={14}
            height={3}
            rx={1.5}
            className={barMuted}
          />
        </g>
      ))}
    </>
  );
}

/* Integrations — connecting a source: connect, authorise, sync, live, and
 * the connection card they lead to. The stages light left to right.        */
const STAGES = [
  { Icon: Plug, x: 30 },
  { Icon: KeyRound, x: 58 },
  { Icon: RefreshCw, x: 86 },
  { Icon: Activity, x: 114 },
] as const;

function Integrations({ mode }: DrawingProps) {
  return (
    <>
      <Backdrop />
      {STAGES.slice(0, -1).map(({ x }) => (
        <Wire key={x} d={`M${x + 16} 52H${x + 28}`} mode={mode} />
      ))}
      <Wire d="M80 60V86" mode={mode} />
      {STAGES.map(({ Icon, x }, k) => (
        <g key={x} data-slot="illustration-stage">
          <Tile icon={Icon} x={x} y={44} />
          <StepRing mode={mode} k={k} x={x} y={44} size={16} rx={5} />
        </g>
      ))}
      <SummaryCard icon={CircleCheck} x={34} y={86} />
      <rect
        x={30}
        y={128}
        width={40}
        height={3.4}
        rx={1.7}
        className={barMuted}
      />
    </>
  );
}

/* Assistant — a question, and an answer drawn from four sources: calls,
 * servers, the network, stored records. The sources light in turn and feed
 * the answer.                                                              */
const SOURCES = [
  { Icon: Phone, x: 30 },
  { Icon: Server, x: 54 },
  { Icon: Network, x: 78 },
  { Icon: Database, x: 102 },
] as const;

function Assistant({ mode }: DrawingProps) {
  return (
    <>
      <Backdrop />
      <rect
        x={66}
        y={32}
        width={64}
        height={20}
        rx={9}
        strokeWidth={HAIRLINE}
        className={cn("fill-surface-canvas", line)}
      />
      <Bars x={74} y={36.6} widths={[40, 26]} muted />
      <rect
        x={30}
        y={60}
        width={86}
        height={34}
        rx={9}
        strokeWidth={HAIRLINE}
        className={cn("illustration-float fill-surface-card", line)}
      />
      <Sparkles
        aria-hidden
        x={37}
        y={66}
        width={10}
        height={10}
        strokeWidth={1.75}
        className={accentGlyph}
      />
      <rect x={51} y={69.3} width={50} height={3.4} rx={1.7} className={bar} />
      <rect
        x={37}
        y={80}
        width={66}
        height={3.4}
        rx={1.7}
        className={barMuted}
      />
      <rect
        x={37}
        y={85.8}
        width={44}
        height={3.4}
        rx={1.7}
        className={barMuted}
      />
      {SOURCES.map(({ Icon, x }, k) => (
        <g key={x} data-slot="illustration-source">
          <Wire d={`M${x + 8} 108V96`} mode={mode} />
          <Tile icon={Icon} x={x} y={108} />
          <StepRing mode={mode} k={k} x={x} y={108} size={16} rx={5} />
        </g>
      ))}
    </>
  );
}

const DRAWINGS: Record<IllustrationName, React.ComponentType<DrawingProps>> = {
  "issue-alerts": IssueAlerts,
  "fleet-health": FleetHealth,
  "call-readiness": CallReadiness,
  "search-results": SearchResults,
  dashboards: Dashboards,
  topology: Topology,
  "team-access": TeamAccess,
  "activity-log": ActivityLog,
  integrations: Integrations,
  assistant: Assistant,
};

/** Which mechanic each drawing carries — for docs, stories and tests. */
export const illustrationMechanic: Record<
  IllustrationName,
  "lift" | "magnify" | "sequence"
> = {
  "issue-alerts": "lift",
  "search-results": "lift",
  dashboards: "lift",
  "fleet-health": "magnify",
  topology: "magnify",
  "team-access": "magnify",
  "call-readiness": "sequence",
  "activity-log": "sequence",
  integrations: "sequence",
  assistant: "sequence",
};

export function Illustration({
  name,
  label,
  interactive = true,
  active,
  className,
  ...rest
}: IllustrationProps) {
  const text = label === undefined ? defaultLabels[name] : label;
  const a11y =
    text === null
      ? { "aria-hidden": true as const }
      : { role: "img", "aria-label": text };
  const mode: Mode =
    active !== undefined ? "driven" : interactive ? "pointer" : "still";
  const Drawing = DRAWINGS[name];

  return (
    <svg
      data-slot="illustration"
      data-name={name}
      data-interactive={mode === "pointer" ? "" : undefined}
      data-active={active ? "" : undefined}
      viewBox="0 0 160 160"
      fill="none"
      className={cn("group/illustration block h-auto w-full", className)}
      style={
        {
          "--illustration-gap": `${ALERT.gap}px`,
          "--illustration-slide": `${RESULT.slide}px`,
          "--illustration-rise": "3px",
        } as CSSVars
      }
      {...a11y}
      {...rest}
    >
      <Drawing mode={mode} active={active ?? false} />
    </svg>
  );
}
