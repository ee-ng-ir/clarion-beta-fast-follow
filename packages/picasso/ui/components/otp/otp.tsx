// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * Verification OTP — Figma `OTP Slot` 673:24 (12 variants), `OTP Input`
 * 673:25 and `OTP Slot/OTP Separator` 40000343:18.
 *
 * One hidden input behind a row of boxes. `input-otp` owns the hard parts —
 * the single text field, the caret position, paste across slots, mobile
 * autofill — and each slot reads its own character and active flag from that
 * field's context. So the boxes are presentation; there is nothing focusable
 * in them.
 *
 * Which is why `Active` is a data state here rather than `:focus-visible`.
 * The slot cannot receive focus, so it cannot match the pseudo-class every
 * other field in the system uses, and the ring is applied from context
 * instead.
 *
 * Measured: sm 40, md 48, lg 56, all at radius/md. The digit is metric/lg
 * (24px) at sm and metric/xl (30px) at md **and lg** — the box grows from md
 * to lg and the type does not. Built as drawn; raised, because a size step
 * that moves only the box is unusual.
 *
 * States come straight off the input family: bg/input/default on
 * border/input/default, border/input/focused plus ring/focus when active,
 * border/input/invalid when invalid, and bg/input/disabled with
 * border/input/disabled when disabled.
 *
 * ⚠️ No caret. Figma draws the active slot empty, with the ring and the
 * focused border as the only marker, so that is what this renders —
 * `input-otp` offers a fake caret and it is deliberately not used. The ring
 * is strong enough to place you, but a blinking caret is the more usual
 * signal and worth a decision.
 */
const otpSlotVariants = cva(
  "relative flex shrink-0 items-center justify-center rounded-md border " +
    "border-line-input-default bg-surface-input-default " +
    "text-content-neutral-emphasis transition-colors",
  {
    variants: {
      size: {
        sm: "size-10 text-metric-lg",
        md: "size-12 text-metric-xl",
        lg: "size-14 text-metric-xl",
      },
      active: {
        true:
          "z-raised border-line-input-focused ring-2 ring-line-focused " +
          "ring-offset-2 ring-offset-surface-app",
        false: "",
      },
      invalid: { true: "border-line-input-invalid", false: "" },
      disabled: {
        true: "bg-surface-input-disabled border-line-input-disabled text-content-disabled",
        false: "",
      },
    },
    defaultVariants: {
      size: "md",
      active: false,
      invalid: false,
      disabled: false,
    },
  },
);

type OtpSize = "sm" | "md" | "lg";

const OtpContext = React.createContext<{
  size: OtpSize;
  invalid: boolean;
  disabled: boolean;
}>({
  size: "md",
  invalid: false,
  disabled: false,
});

export interface OtpInputProps extends Omit<
  React.ComponentProps<typeof OTPInput>,
  "render" | "children" | "size"
> {
  /**
   * Shadows the DOM `size` attribute, which on an `<input>` is a character
   * count and means nothing here — the boxes are separate elements. Omitted
   * from the underlying props rather than renamed, so the Figma axis keeps
   * its name.
   */
  size?: OtpSize;
  /** Mirrors the field family: sets `aria-invalid` as well as the treatment. */
  invalid?: boolean;
  children?: React.ReactNode;
}

export function OtpInput({
  className,
  containerClassName,
  size = "md",
  invalid = false,
  disabled = false,
  children,
  ...props
}: OtpInputProps) {
  const ctx = React.useMemo(
    () => ({ size, invalid, disabled }),
    [size, invalid, disabled],
  );
  return (
    <OtpContext.Provider value={ctx}>
      <OTPInput
        data-slot="otp-input"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        // A code is typed and read left to right in every locale; without
        // this the boxes run right to left and the digits come out reversed.
        containerClassName={cn(
          "ltr-island flex items-center gap-2",
          containerClassName,
        )}
        className={cn("disabled:cursor-not-allowed", className)}
        {...props}
      >
        {children}
      </OTPInput>
    </OtpContext.Provider>
  );
}

export interface OtpSlotProps
  extends
    React.ComponentProps<"div">,
    Pick<VariantProps<typeof otpSlotVariants>, "size"> {
  index: number;
}

export function OtpSlot({ index, className, size, ...props }: OtpSlotProps) {
  const { size: ctxSize, invalid, disabled } = React.useContext(OtpContext);
  const input = React.useContext(OTPInputContext);
  const slot = input?.slots?.[index];

  return (
    <div
      data-slot="otp-slot"
      data-active={slot?.isActive || undefined}
      className={cn(
        otpSlotVariants({
          size: size ?? ctxSize,
          // A disabled field has no active slot to point at.
          active: Boolean(slot?.isActive) && !disabled,
          invalid,
          disabled,
        }),
        className,
      )}
      {...props}
    >
      {slot?.char}
    </div>
  );
}

/**
 * The pill between groups — 8×4 in a 16-wide box, as drawn. Decorative: the
 * grouping is visual, and the value is one string.
 */
export function OtpSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="otp-separator"
      aria-hidden
      className={cn("flex w-4 shrink-0 items-center justify-center", className)}
      {...props}
    >
      <div className="h-1 w-2 rounded-full bg-line-neutral-muted" />
    </div>
  );
}

export { otpSlotVariants };
