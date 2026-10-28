// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, Minus } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Checkbox
 *
 * STRUCTURE from Figma — two sizes, three checked states (unchecked, checked,
 * indeterminate). Radix supplies the behaviour, including the tri-state.
 *
 * Figma's `State` axis (Default · Hover · Focus · Disabled · Invalid) is CSS
 * states, the disabled attribute and aria-invalid, as everywhere else.
 *
 * ⚠️ One departure from the Figma file:
 *
 * **Border is 1px, not 1.5.** Figma draws 1.5 and keeps it. Chrome floors a
 * fractional border width — measured, `border:1.5px` and `border:1px` give
 * identical computed values and identical layout at DPR 1 and DPR 2 — so 1px
 * is the only form 1.5 can take on the web. The file is right; the browser
 * cannot draw it.
 *
 * The disabled treatment is NOT a departure. A disabled checked box takes
 * bg/input/disabled with an fg/disabled mark (Ee's calls, 28 Sept and 2 Oct),
 * and Figma draws the same. The fill was bg/disabled until 2 Oct: the two are
 * the same colour in light, but in dark bg/disabled is the card itself, so on
 * a card the box vanished and only the tick was left. bg/input/disabled is the
 * fill the box already has when disabled and unchecked — a dark well on a
 * card, with its border showing on the page. Switch and Radio do the same.
 * The mark stays soft on purpose: it reads as inactive without the state
 * becoming unreadable.
 */
const checkboxVariants = cva(
  "group peer shrink-0 rounded-sm border transition-colors outline-none " +
    // A bare control is its own target. 16px square is under the 24 floor
    // (WCAG 2.2 AA, 2.5.8), and a Checkbox in a table cell or a states
    // matrix has no label row to inherit — FieldOption covers the ones
    // that do. The hit area grows, the box does not. 24 and not 44:
    // a table row cannot spare 44, and where there is room there is a
    // FieldOption giving 44 already.
    "relative after:absolute after:-inset-1.5 " +
    "bg-surface-input-default border-line-neutral-emphasis " +
    "hover:bg-surface-input-hovered " +
    "focus-visible:ring-2 focus-visible:ring-line-focused " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app " +
    // checked and indeterminate read the same — both mean "this has a value"
    "data-[state=checked]:bg-surface-primary-emphasis " +
    "data-[state=indeterminate]:bg-surface-primary-emphasis " +
    "data-[state=checked]:border-line-primary-emphasis " +
    "data-[state=indeterminate]:border-line-primary-emphasis " +
    "data-[state=checked]:text-content-on-primary-emphasis " +
    "data-[state=indeterminate]:text-content-on-primary-emphasis " +
    "data-[state=checked]:hover:bg-surface-primary-emphasis-hovered " +
    "data-[state=indeterminate]:hover:bg-surface-primary-emphasis-hovered " +
    // invalid: the box itself carries the failure, checked or not
    "aria-invalid:shadow-ring-focus-danger " +
    "aria-invalid:data-[state=checked]:bg-surface-danger-emphasis " +
    "aria-invalid:data-[state=indeterminate]:bg-surface-danger-emphasis " +
    // on a danger fill the mark is the danger pairing, as Figma draws it
    "aria-invalid:data-[state=checked]:text-content-on-danger-emphasis " +
    "aria-invalid:data-[state=indeterminate]:text-content-on-danger-emphasis " +
    "aria-invalid:focus-visible:ring-line-danger-emphasis " +
    // disabled, including checked — see the doc block
    "disabled:cursor-not-allowed disabled:hover:bg-surface-input-disabled " +
    "disabled:bg-surface-input-disabled disabled:border-line-input-disabled " +
    "disabled:data-[state=checked]:bg-surface-input-disabled " +
    "disabled:data-[state=indeterminate]:bg-surface-input-disabled " +
    "disabled:data-[state=checked]:border-line-input-disabled " +
    "disabled:data-[state=indeterminate]:border-line-input-disabled " +
    "disabled:data-[state=checked]:text-content-disabled " +
    "disabled:data-[state=indeterminate]:text-content-disabled",
  {
    variants: {
      size: {
        sm: "size-4 [&_svg]:size-3",
        md: "size-5 [&_svg]:size-3.5",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface CheckboxProps
  extends
    Omit<React.ComponentProps<typeof CheckboxPrimitive.Root>, "size">,
    VariantProps<typeof checkboxVariants> {}

export function Checkbox({ className, size, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(checkboxVariants({ size }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        {/* Chosen by data-state rather than by reading props.checked, which is
            undefined whenever the checkbox is uncontrolled. */}
        <Check
          strokeWidth={3}
          className="group-data-[state=indeterminate]:hidden"
        />
        <Minus
          strokeWidth={3}
          className="hidden group-data-[state=indeterminate]:block"
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { checkboxVariants };
