// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cva } from "class-variance-authority";
import { Minus, Plus } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * NumberInput — Figma's `Number input` set (40000625:565): − | value | +, the
 * steppers divided from the value by border/input/default.
 *
 * Not `<input type="number">`. The native one swallows the scroll wheel,
 * accepts "e", shows its own spinner and gives screen readers nothing better.
 * This is a text field with role="spinbutton" and the ARIA values, which is
 * what the native one would have announced anyway:
 *
 * - ArrowUp / ArrowDown step, PageUp / PageDown step ×10, Home / End jump to
 *   min / max.
 * - The steppers are mouse conveniences (tabIndex -1): keyboard users already
 *   have the arrows, and two extra tab stops per field is a tax on every form.
 * - Typing is free; the value is parsed and clamped on blur, so "1" on the way
 *   to "15" is not snapped to the minimum mid-keystroke.
 */
const shell = cva(
  "flex w-full min-w-0 items-stretch overflow-hidden rounded-md border bg-surface-input-default " +
    "border-line-input-default text-content-neutral-emphasis transition-colors " +
    "hover:border-line-input-hovered " +
    "focus-within:border-line-input-focused focus-within:ring-2 focus-within:ring-line-focused " +
    "focus-within:ring-offset-2 focus-within:ring-offset-surface-app " +
    "has-[[aria-invalid=true]]:border-line-input-invalid " +
    "has-[[aria-invalid=true]]:focus-within:ring-line-danger-emphasis " +
    "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:bg-surface-input-disabled " +
    "has-[input:disabled]:border-line-input-disabled has-[input:disabled]:text-content-disabled",
  {
    variants: { size: { sm: "h-8 text-body-sm", md: "h-9 text-body-md" } },
    defaultVariants: { size: "md" },
  },
);
const stepper = cva(
  "inline-flex shrink-0 items-center justify-center border-line-input-default text-content-neutral-muted " +
    "hover:bg-surface-input-hovered active:bg-surface-input-pressed " +
    "disabled:pointer-events-none disabled:text-content-disabled [&>svg]:size-4",
  {
    variants: { size: { sm: "w-8", md: "w-9" } },
    defaultVariants: { size: "md" },
  },
);

export interface NumberInputProps extends Omit<
  React.ComponentProps<"input">,
  | "size"
  | "value"
  | "defaultValue"
  | "onChange"
  | "type"
  | "min"
  | "max"
  | "step"
> {
  size?: "sm" | "md";
  value?: number | null;
  defaultValue?: number | null;
  /** Called with the parsed, clamped number — or null when the field is empty. */
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  decrementLabel?: string;
  incrementLabel?: string;
  groupClassName?: string;
}

const decimals = (n: number) => (String(n).split(".")[1] ?? "").length;

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      size = "md",
      value,
      defaultValue = null,
      onValueChange,
      min = -Infinity,
      max = Infinity,
      step = 1,
      decrementLabel = "Decrease",
      incrementLabel = "Increase",
      groupClassName,
      className,
      disabled,
      readOnly,
      onBlur,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const controlled = value !== undefined;
    const [inner, setInner] = React.useState<number | null>(defaultValue);
    const current = controlled ? value : inner;
    const [text, setText] = React.useState(
      current == null ? "" : String(current),
    );
    React.useEffect(
      () => setText(current == null ? "" : String(current)),
      [current],
    );

    const places = Math.max(
      decimals(step),
      decimals(Number.isFinite(min) ? min : 0),
    );
    const clamp = (n: number) =>
      Math.min(max, Math.max(min, +n.toFixed(places)));
    const commit = (n: number | null) => {
      const next = n == null ? null : clamp(n);
      if (!controlled) setInner(next);
      setText(next == null ? "" : String(next));
      if (next !== current) onValueChange?.(next);
    };
    const stepBy = (k: number) =>
      commit(
        (current ?? (Number.isFinite(min) ? min : 0) - (k > 0 ? step : -step)) +
          k * step,
      );
    const locked = disabled || readOnly;

    return (
      <div
        className={cn(shell({ size }), groupClassName)}
        data-slot="number-input"
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label={decrementLabel}
          disabled={locked || (current != null && current <= min)}
          onClick={() => stepBy(-1)}
          className={cn(stepper({ size }), "border-e")}
        >
          <Minus aria-hidden />
        </button>
        <input
          ref={ref}
          type="text"
          inputMode={step % 1 === 0 && min >= 0 ? "numeric" : "decimal"}
          role="spinbutton"
          aria-valuenow={current ?? undefined}
          aria-valuemin={Number.isFinite(min) ? min : undefined}
          aria-valuemax={Number.isFinite(max) ? max : undefined}
          autoComplete="off"
          disabled={disabled}
          readOnly={readOnly}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => {
            const t = text.trim();
            const n = t === "" ? null : Number(t.replace(",", "."));
            commit(n == null || Number.isNaN(n) ? current : n);
            onBlur?.(e);
          }}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (e.defaultPrevented || locked) return;
            const map: Record<string, () => void> = {
              ArrowUp: () => stepBy(1),
              ArrowDown: () => stepBy(-1),
              PageUp: () => stepBy(10),
              PageDown: () => stepBy(-10),
              Home: () => Number.isFinite(min) && commit(min),
              End: () => Number.isFinite(max) && commit(max),
            };
            if (map[e.key]) {
              e.preventDefault();
              map[e.key]();
            }
            if (e.key === "Enter")
              commit(text.trim() === "" ? null : Number(text));
          }}
          data-slot="number-input-control"
          className={cn(
            // ltr-island: "-5" must not become "5-" while it is being typed.
            "ltr-island w-full min-w-0 flex-1 bg-transparent text-center tabular-nums outline-none " +
              "placeholder:text-content-neutral-subtle disabled:cursor-not-allowed",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={incrementLabel}
          disabled={locked || (current != null && current >= max)}
          onClick={() => stepBy(1)}
          className={cn(stepper({ size }), "border-s")}
        >
          <Plus aria-hidden />
        </button>
      </div>
    );
  },
);
NumberInput.displayName = "NumberInput";
