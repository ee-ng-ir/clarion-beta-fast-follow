// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * Textarea
 *
 * Input's sibling, for answers longer than a line. STRUCTURE from Figma,
 * MEASUREMENTS from shadcn — and as with Input the two agree: padding 8/12 at
 * md, radius 8. Figma's default heights (80 and 68) become minimums rather
 * than fixed heights, because a box that cannot grow is the reason people
 * write three words where they meant three sentences.
 *
 * `field-sizing-content` grows the field with its content, no JavaScript and
 * no ref. Chrome has it; elsewhere it degrades to the minimum height plus the
 * native resize handle, which is the behaviour people already expect.
 *
 * `resize-y` rather than the browser default: a textarea dragged wider breaks
 * the column it sits in, and horizontal resizing solves a problem nobody has.
 *
 * Like Input, State is CSS states plus aria-invalid plus the disabled
 * attribute, not a prop.
 */
const textareaVariants = cva(
  "flex w-full min-w-0 resize-y field-sizing-content rounded-md border " +
    "bg-surface-input-default text-content-neutral-emphasis " +
    "placeholder:text-content-neutral-subtle border-line-input-default " +
    "transition-colors outline-none " +
    "[&:not(:read-only)]:hover:border-line-input-hovered " +
    "[&:read-only:not(:disabled)]:bg-surface-neutral-muted " +
    "[&:read-only:not(:disabled)]:resize-none " +
    "focus-visible:border-line-input-focused focus-visible:ring-2 " +
    "focus-visible:ring-line-focused focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-surface-app " +
    "aria-invalid:border-line-input-invalid " +
    "aria-invalid:focus-visible:ring-line-danger-emphasis " +
    "disabled:cursor-not-allowed disabled:resize-none " +
    "disabled:bg-surface-input-disabled disabled:border-line-input-disabled " +
    "disabled:text-content-disabled disabled:placeholder:text-content-disabled",
  {
    variants: {
      size: {
        sm: "min-h-17 px-2.5 py-1.5 text-body-sm",
        md: "min-h-20 px-3 py-2 text-body-md",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface TextareaProps
  // `size` is not a native textarea attribute, but omitting it keeps the type
  // identical in shape to Input's, which matters when Field wraps either.
  extends
    Omit<React.ComponentProps<"textarea">, "size">,
    VariantProps<typeof textareaVariants> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size, ...props }, ref) => (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(textareaVariants({ size }), className)}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { textareaVariants };
