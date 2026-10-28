// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, Info, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip/tooltip";

/**
 * InputGroup
 *
 * An input with things beside it — Figma's Input `Leading` / `Trailing` slots,
 * filled from InputGroup / Addon Inline (958:666): Icon · Text · Kbd ·
 * Spinner · Check Circle · Button · Tooltip · Dropdown.
 *
 * The GROUP draws the box (border, fill, radius, focus ring, invalid and
 * disabled), and the input inside it is bare. That is the only arrangement
 * where the focus ring surrounds the addons too — draw the box on the input
 * and the ring stops at the icon.
 *
 * States still come from the input, not from props: `has-[…]` reads the
 * inner control's aria-invalid and :disabled, and `focus-within` its focus.
 * Measurements match Input exactly (h-9 / px-3 at md, h-8 / px-2.5 at sm, a
 * gap of 8), so a plain Input and a grouped one line up in a form.
 *
 * Clicking an addon that is not itself a control focuses the input, because a
 * search icon inside a field is part of the field.
 */
const inputGroupVariants = cva(
  "group/input-group flex w-full min-w-0 items-center rounded-md border " +
    "bg-surface-input-default border-line-input-default text-content-neutral-emphasis " +
    "transition-colors " +
    "hover:border-line-input-hovered " +
    "focus-within:border-line-input-focused focus-within:ring-2 focus-within:ring-line-focused " +
    "focus-within:ring-offset-2 focus-within:ring-offset-surface-app " +
    "has-[[aria-invalid=true]]:border-line-input-invalid " +
    "has-[[aria-invalid=true]]:focus-within:ring-line-danger-emphasis " +
    "has-[[data-slot=input-group-control]:disabled]:cursor-not-allowed " +
    "has-[[data-slot=input-group-control]:disabled]:bg-surface-input-disabled " +
    "has-[[data-slot=input-group-control]:disabled]:border-line-input-disabled " +
    "has-[[data-slot=input-group-control]:disabled]:text-content-disabled " +
    "has-[[data-slot=input-group-control]:disabled]:hover:border-line-input-disabled",
  {
    variants: {
      size: {
        sm: "h-8 gap-2 px-2.5 text-body-sm",
        md: "h-9 gap-2 px-3 text-body-md",
      },
    },
    defaultVariants: { size: "md" },
  },
);

type Size = "sm" | "md";
const SizeContext = React.createContext<Size>("md");
export const useInputGroupSize = () => React.useContext(SizeContext);

export interface InputGroupProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof inputGroupVariants> {}

export function InputGroup({
  className,
  size = "md",
  onMouseDown,
  ...props
}: InputGroupProps) {
  return (
    <SizeContext.Provider value={size ?? "md"}>
      <div
        role="group"
        data-slot="input-group"
        className={cn(inputGroupVariants({ size }), className)}
        onMouseDown={(e) => {
          onMouseDown?.(e);
          // A click on the box (padding, icon, text) goes to the input.
          const target = e.target as HTMLElement;
          if (
            e.defaultPrevented ||
            target.closest("button, a, input, textarea, select, [role=button]")
          )
            return;
          const control = e.currentTarget.querySelector<HTMLElement>(
            "[data-slot=input-group-control]",
          );
          if (control && !(control as HTMLInputElement).disabled) {
            e.preventDefault();
            control.focus();
          }
        }}
        {...props}
      />
    </SizeContext.Provider>
  );
}

export type InputGroupInputProps = Omit<React.ComponentProps<"input">, "size">;

/** The bare input inside a group. Carries the id, aria and value — the group only draws. */
export const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  InputGroupInputProps
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    data-slot="input-group-control"
    className={cn(
      "h-full w-full min-w-0 flex-1 bg-transparent outline-none " +
        "placeholder:text-content-neutral-subtle " +
        "disabled:cursor-not-allowed disabled:placeholder:text-content-disabled",
      className,
    )}
    {...props}
  />
));
InputGroupInput.displayName = "InputGroupInput";

export interface InputGroupAddonProps extends React.ComponentProps<"div"> {
  /** Which side of the input. Purely order — put the addon before or after the input. */
  align?: "start" | "end";
}

/**
 * A slot beside the input. Icons get 16px and fg/neutral/subtle; anything
 * else (Kbd, a button, a spinner) renders as it is.
 */
export function InputGroupAddon({
  className,
  align = "start",
  ...props
}: InputGroupAddonProps) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        "flex shrink-0 items-center gap-2 text-content-neutral-subtle " +
          "[&>svg]:size-4 [&>svg]:shrink-0 " +
          "group-has-[[data-slot=input-group-control]:disabled]/input-group:text-content-disabled",
        className,
      )}
      {...props}
    />
  );
}

/** Figma `Variant=Text`: a fixed prefix or suffix — `https://`, `ms`, `%`. Mono, so it reads as syntax. */
export function InputGroupText({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="input-group-text"
      className={cn(
        // A prefix or suffix is technical text — "https://", "ms", ".ir.com".
        "ltr-island text-code-md whitespace-nowrap text-content-neutral-subtle",
        className,
      )}
      {...props}
    />
  );
}

/** Figma `Variant=Spinner`: the field is working — validating, searching. Announced politely. */
export function InputGroupSpinner({
  className,
  label = "Loading",
  ...props
}: React.ComponentProps<"span"> & { label?: string }) {
  return (
    <span
      role="status"
      data-slot="input-group-spinner"
      className={cn("inline-flex", className)}
      {...props}
    >
      <Loader2 aria-hidden className="size-4 animate-spin" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Figma `Variant=Check Circle`: the value has been checked and is valid. */
export function InputGroupCheck({
  className,
  label = "Valid",
  ...props
}: React.ComponentProps<"span"> & { label?: string }) {
  return (
    <span
      data-slot="input-group-check"
      className={cn(
        "inline-flex size-4 items-center justify-center rounded-full bg-content-neutral-emphasis text-content-inverse",
        className,
      )}
      {...props}
    >
      <Check aria-hidden className="size-3" strokeWidth={3} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * Figma `Variant=Tooltip`: an Info icon that explains the field. It is a
 * button, so keyboard users can reach the explanation too.
 */
export function InputGroupTooltip({
  children,
  label = "More information",
  className,
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          data-slot="input-group-tooltip"
          className={cn(
            "inline-flex size-4 items-center justify-center rounded-full text-content-neutral-subtle " +
              // the target reaches past the icon; the box stays 16
              "relative after:absolute after:-inset-2 pointer-coarse:after:-inset-3.5 " +
              "outline-none hover:text-content-neutral-emphasis focus-visible:ring-2 focus-visible:ring-line-focused",
            className,
          )}
        >
          <Info aria-hidden className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}

export { inputGroupVariants };
