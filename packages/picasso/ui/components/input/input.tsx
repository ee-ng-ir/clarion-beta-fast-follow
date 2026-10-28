// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * Input
 *
 * STRUCTURE comes from Figma — sizes, states and which semantic token each one
 * uses. MEASUREMENTS come from shadcn. Here the two agree: h-9 / px-3 / radius
 * 8 at md, which is unusual and worth saying out loud.
 *
 * Two deliberate departures from the Figma component:
 *
 * 1. There is no `Type` prop, and since 1 Oct 2026 no `Type` axis in Figma
 *    either. Figma's Input was one set of seven Types; it is now six sets —
 *    Input, Password input, Number input, Input button, Tags input and File
 *    upload — one per code component, which is how the code always had them.
 *    The native `type` attribute still covers what the browser owns (email,
 *    search, url); it is not a way to reach the sibling components.
 *
 * 2. Figma's `State` axis (Hover · Focus · Filled · Invalid · Disabled) is not a
 *    prop either. Hover, focus and filled are CSS states; invalid is
 *    `aria-invalid`, which a screen reader can also act on; disabled is the
 *    attribute. A `state` prop would let a caller render a focus ring on an
 *    input that is not focused.
 *
 * Leading and trailing addons live in InputGroup, not here.
 *
 * ⚠️ One addition Figma does not have: a read-only treatment. Figma's State
 * axis is Default · Hover · Focus · Filled · Invalid · Disabled, so a
 * read-only field would render identically to an editable one — and this
 * component's own guidance tells people to reach for readOnly instead of
 * disabled. Advice that produces an ambiguous control is not advice, so
 * read-only gets a resting surface and no hover response. Figma needs the
 * matching state.
 */
const inputVariants = cva(
  "flex w-full min-w-0 rounded-md border bg-surface-input-default " +
    "text-content-neutral-emphasis placeholder:text-content-neutral-subtle " +
    "border-line-input-default transition-colors outline-none " +
    // Hover is a promise that the field responds. Only editable ones do.
    "[&:not(:read-only)]:hover:border-line-input-hovered " +
    // :read-only also matches a disabled input, so exclude it — otherwise the
    // two treatments fight over the same element.
    "[&:read-only:not(:disabled)]:bg-surface-neutral-muted " +
    "[&:read-only:not(:disabled)]:cursor-default " +
    "focus-visible:border-line-input-focused focus-visible:ring-2 " +
    "focus-visible:ring-line-focused focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-surface-app " +
    // aria-invalid rather than a prop, so assistive tech gets it too
    "aria-invalid:border-line-input-invalid " +
    "aria-invalid:focus-visible:ring-line-danger-emphasis " +
    "disabled:cursor-not-allowed disabled:bg-surface-input-disabled " +
    // Figma's Textarea uses border/input/disabled where its Input kept
    // border/input/default. The token exists and means what it says.
    "disabled:border-line-input-disabled " +
    "disabled:text-content-disabled disabled:placeholder:text-content-disabled " +
    // file inputs render their own button; strip its chrome so it inherits ours
    "file:inline-flex file:border-0 file:bg-transparent file:font-medium " +
    "file:text-content-neutral-emphasis",
  {
    variants: {
      size: {
        sm: "h-8 px-2.5 text-body-sm file:h-6",
        md: "h-9 px-3 text-body-md file:h-7",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface InputProps
  // `size` is a native input attribute (a character count) and also our variant
  // name. Ours wins; the native one is not something a design system should
  // expose, since it sets width in ex units.
  extends
    Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { inputVariants };
