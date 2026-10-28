// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * InputButton — Figma's `Input button` set (40000625:566): a button dressed as
 * a field, for things that open a picker rather than take typing (a date, a
 * filter, a select). Figma's `Icon` swap is `icon` here and its
 * `Show Badge number` toggle is `adornment`; until 2 Oct 2026 Figma drew
 * those as a `Type` axis (Button | Select trigger).
 *
 * It is a <button>, not a read-only input. It does one thing — open something
 * — and a screen reader should say "button", with aria-expanded telling it
 * whether the thing is open. The chevron turns when it is.
 *
 * Same box, measurements and states as Input, so a form that mixes the two
 * lines up. `placeholder` renders when there is no value, in the placeholder
 * colour, exactly as an empty Input would.
 */
const inputButtonVariants = cva(
  "group/input-button flex w-full min-w-0 items-center gap-2 rounded-md border text-start " +
    "bg-surface-input-default border-line-input-default text-content-neutral-emphasis " +
    "transition-colors outline-none cursor-pointer " +
    "hover:border-line-input-hovered " +
    "focus-visible:border-line-input-focused focus-visible:ring-2 focus-visible:ring-line-focused " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app " +
    "aria-expanded:border-line-input-focused " +
    "aria-invalid:border-line-input-invalid aria-invalid:focus-visible:ring-line-danger-emphasis " +
    "disabled:cursor-not-allowed disabled:bg-surface-input-disabled disabled:border-line-input-disabled " +
    "disabled:text-content-disabled " +
    "[&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      size: { sm: "h-8 px-2.5 text-body-sm", md: "h-9 px-3 text-body-md" },
    },
    defaultVariants: { size: "md" },
  },
);

export interface InputButtonProps
  extends
    Omit<React.ComponentProps<"button">, "value">,
    VariantProps<typeof inputButtonVariants> {
  /** Leading icon — Calendar, Filter, … */
  icon?: React.ReactNode;
  /** What is chosen. Leave empty to show the placeholder. */
  value?: React.ReactNode;
  placeholder?: React.ReactNode;
  /** Something between the value and the chevron — Select puts its count here. */
  adornment?: React.ReactNode;
  /** Hide the trailing chevron. */
  hideChevron?: boolean;
}

export const InputButton = React.forwardRef<
  HTMLButtonElement,
  InputButtonProps
>(
  (
    {
      className,
      size,
      icon,
      value,
      placeholder,
      adornment,
      hideChevron,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const empty = value === undefined || value === null || value === "";
    return (
      <button
        ref={ref}
        type={type}
        data-slot="input-button"
        className={cn(inputButtonVariants({ size }), className)}
        {...props}
      >
        {icon ? (
          <span
            aria-hidden
            className="flex text-content-neutral-subtle group-disabled/input-button:text-content-disabled"
          >
            {icon}
          </span>
        ) : null}
        <span
          data-slot="input-button-value"
          className={cn(
            "min-w-0 flex-1 truncate",
            empty &&
              "text-content-neutral-subtle group-disabled/input-button:text-content-disabled",
          )}
        >
          {empty ? placeholder : value}
        </span>
        {adornment}
        {hideChevron ? null : (
          <ChevronDown
            aria-hidden
            className="text-content-neutral-subtle transition-transform ease-out group-aria-expanded/input-button:rotate-180 motion-reduce:transition-none"
          />
        )}
      </button>
    );
  },
);
InputButton.displayName = "InputButton";

export { inputButtonVariants };
