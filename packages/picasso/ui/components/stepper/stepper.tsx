// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Stepper — Figma's Stepper page: five public layouts over two private
 * primitives, `_Step icon base` 1065:387 and `_Step base` 1065:412.
 *
 * The five sets are **not** one component wearing five hats — unlike Chip's,
 * they have three distinct child shapes and geometry from 1280×32 to
 * 400×252. But they all consume a `Steps` slot and all build from the same
 * two primitives, so they are five *arrangements*, not five components.
 * Built composable, with the named layouts as stories — the same way
 * `Drawer/Body` and `Drawer/Filters` are payloads rather than Drawer
 * variants.
 *
 * ⚠️ Figma's indicator axis is `Type` (Check | Number); here it is
 * `indicator`, because the root is an `<ol>` and `type` is a real attribute
 * on one — it sets list numbering. Fourth prop collision of the week.
 *
 * ⚠️ At Complete both indicator types render the same check and differ only
 * in fill: Check completes on bg/primary/emphasis, Number on
 * bg/success/emphasis. One status, two colours, chosen by an axis that is
 * about the indicator rather than the state. Built as drawn; raised.
 *
 * Measured: indicator 24 (sm) / 32 (md), fully round; dot 8 / 10; check
 * 12 / 16; number label/sm (12px) / label/md (13px); connector 2px on
 * border/primary/emphasis once the step before it is complete and
 * border/neutral/muted until then. Title is heading/sm and supporting text
 * body/lg — both on fg/disabled while a step is incomplete, which is the
 * only thing distinguishing an untouched step from a done one in the text.
 */
type StepperSize = "sm" | "md";
type StepperIndicator = "check" | "number";
type StepperOrientation = "horizontal" | "vertical";
/**
 * How each step arranges its own parts. Figma draws five named layouts, and
 * this is what actually differs between them — so it is a prop rather than
 * something every consumer re-expresses in className, which `no-restyle`
 * refuses anyway.
 *
 * `inline` puts the indicator and the connector in a row (Icons connected,
 * Icons minimal). `stacked` puts the text under them (Icons centered). A
 * vertical stepper always runs the indicator column beside the text.
 */
type StepperLayout = "inline" | "stacked";
type StepStatus = "incomplete" | "current" | "complete";

const stepperIndicatorVariants = cva(
  "flex shrink-0 items-center justify-center rounded-full border border-transparent",
  {
    variants: {
      size: { sm: "size-6 text-label-sm", md: "size-8 text-label-md" },
      indicator: { check: "", number: "" },
      status: { incomplete: "", current: "", complete: "" },
    },
    compoundVariants: [
      {
        indicator: "check",
        status: "incomplete",
        class: "border-line-neutral-muted bg-surface-card",
      },
      {
        indicator: "check",
        status: "current",
        class: "bg-surface-primary-emphasis",
      },
      {
        indicator: "check",
        status: "complete",
        class: "bg-surface-primary-emphasis",
      },
      // Incomplete stays on subtle while current takes muted. Its number is
      // fg/neutral/subtle, which on the muted fill drops to 2.2:1 in dark —
      // so the quiet step keeps the quiet fill and reads by its ring.
      {
        indicator: "number",
        status: "incomplete",
        class:
          "border-line-neutral-muted bg-surface-neutral-subtle text-content-neutral-subtle",
      },
      {
        indicator: "number",
        status: "current",
        class:
          "border-line-neutral-emphasis bg-surface-neutral-muted text-content-neutral-emphasis",
      },
      // Same status, different fill, decided by the indicator axis. As drawn.
      {
        indicator: "number",
        status: "complete",
        class: "bg-surface-success-emphasis",
      },
    ],
    defaultVariants: { size: "md", indicator: "number", status: "incomplete" },
  },
);

interface StepperContextValue {
  size: StepperSize;
  indicator: StepperIndicator;
  orientation: StepperOrientation;
  layout: StepperLayout;
  value: number;
}
const StepperContext = React.createContext<StepperContextValue>({
  size: "md",
  indicator: "number",
  orientation: "horizontal",
  layout: "inline",
  value: 0,
});

const StepContext = React.createContext<{ status: StepStatus; index: number }>({
  status: "incomplete",
  index: 0,
});

export interface StepperProps extends Omit<React.ComponentProps<"ol">, "type"> {
  /** Index of the step in progress. Everything before it is complete. */
  value?: number;
  size?: StepperSize;
  /** Figma's `Type` axis, renamed — `type` on an `<ol>` sets list numbering. */
  indicator?: StepperIndicator;
  orientation?: StepperOrientation;
  /** Where each step's text sits relative to its indicator. */
  layout?: StepperLayout;
}

export function Stepper({
  className,
  value = 0,
  size = "md",
  indicator = "number",
  orientation = "horizontal",
  layout = "inline",
  ...props
}: StepperProps) {
  const ctx = React.useMemo(
    () => ({ size, indicator, orientation, layout, value }),
    [size, indicator, orientation, layout, value],
  );
  return (
    <StepperContext.Provider value={ctx}>
      <ol
        data-slot="stepper"
        data-orientation={orientation}
        className={cn(
          "flex",
          orientation === "vertical" ? "flex-col" : "items-start",
          className,
        )}
        {...props}
      />
    </StepperContext.Provider>
  );
}

export interface StepperItemProps extends React.ComponentProps<"li"> {
  index: number;
  /** Override the derived status for a step that failed or was skipped. */
  status?: StepStatus;
}

export function StepperItem({
  className,
  index,
  status,
  children,
  ...props
}: StepperItemProps) {
  const { value, orientation, layout } = React.useContext(StepperContext);
  const derived: StepStatus =
    index < value ? "complete" : index === value ? "current" : "incomplete";
  const resolved = status ?? derived;
  const ctx = React.useMemo(
    () => ({ status: resolved, index }),
    [resolved, index],
  );

  return (
    <StepContext.Provider value={ctx}>
      <li
        data-slot="stepper-item"
        data-status={resolved}
        aria-current={resolved === "current" ? "step" : undefined}
        className={cn(
          "group/step flex last:flex-none",
          orientation === "vertical"
            ? "gap-3"
            : layout === "stacked"
              ? "flex-1 flex-col gap-2"
              : "flex-1 items-center gap-1.5",
          className,
        )}
        {...props}
      >
        {children}
      </li>
    </StepContext.Provider>
  );
}

/**
 * The indicator and its connector as one row (or column, when vertical).
 * Exists so a stacked or vertical step does not have to re-express the
 * arrangement in className.
 */
export function StepperTrack({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const { orientation } = React.useContext(StepperContext);
  return (
    <span
      data-slot="stepper-track"
      className={cn(
        "flex",
        orientation === "vertical"
          ? "flex-col items-center gap-1.5 self-stretch"
          : "w-full items-center gap-1.5",
        className,
      )}
      {...props}
    />
  );
}

export function StepperIndicator({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  const { size, indicator } = React.useContext(StepperContext);
  const { status, index } = React.useContext(StepContext);
  const dot = size === "sm" ? "size-2" : "size-2.5";
  const check = size === "sm" ? "size-3" : "size-4";

  return (
    <span
      data-slot="stepper-indicator"
      className={cn(
        stepperIndicatorVariants({ size, indicator, status }),
        className,
      )}
      {...props}
    >
      {children ??
        (status === "complete" ? (
          <Check
            aria-hidden
            className={cn(check, "text-content-on-primary-emphasis")}
          />
        ) : indicator === "number" ? (
          index + 1
        ) : (
          <span
            aria-hidden
            className={cn(
              dot,
              "rounded-full",
              status === "current"
                ? "bg-content-on-primary-emphasis"
                : "bg-content-neutral-subtle",
            )}
          />
        ))}
    </span>
  );
}

/**
 * The connector. Owned by the step before it and hidden on the last one, so
 * the line's colour follows that step's status — which is how the file draws
 * it: primary once the step is complete, neutral until then.
 */
export function StepperSeparator({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const { orientation } = React.useContext(StepperContext);
  const { status } = React.useContext(StepContext);
  return (
    <span
      data-slot="stepper-separator"
      aria-hidden
      className={cn(
        "shrink-0 rounded-full group-last/step:hidden",
        orientation === "horizontal" ? "h-0.5 flex-1" : "min-h-6 w-0.5 flex-1",
        status === "complete"
          ? "bg-line-primary-emphasis"
          : "bg-line-neutral-muted",
        className,
      )}
      {...props}
    />
  );
}

/** Title and supporting text, for the layouts that carry them. */
export function StepperContent({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="stepper-content"
      className={cn("flex flex-col", className)}
      {...props}
    />
  );
}

export function StepperTitle({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const { status } = React.useContext(StepContext);
  return (
    <span
      data-slot="stepper-title"
      className={cn(
        "text-heading-sm",
        status === "incomplete"
          ? "text-content-disabled"
          : "text-content-neutral-muted",
        className,
      )}
      {...props}
    />
  );
}

export function StepperDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const { status } = React.useContext(StepContext);
  return (
    <span
      data-slot="stepper-description"
      className={cn(
        "text-body-lg",
        status === "incomplete"
          ? "text-content-disabled"
          : "text-content-neutral-subtle",
        className,
      )}
      {...props}
    />
  );
}

export { stepperIndicatorVariants };
