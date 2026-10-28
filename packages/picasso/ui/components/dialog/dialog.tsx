// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { overlayScrimVariants } from "../overlay/overlay";

/**
 * Dialog — Figma 40000392:23689.
 *
 * The file states the sizing rule and the boundary: *"modal for focused tasks
 * that interrupt the flow; always over a Scrim. Size: sm 400px
 * (confirmations, single-field prompts), md 560px (short forms), lg 720px
 * (multi-section forms, previews). Anything bigger or longer belongs in a
 * Drawer (Type=Expanded)."*
 *
 * ⚠️ Dialog is NOT built on Overlay / Surface, unlike Popover and
 * DropdownMenu. It shares the card treatment — bg/card, radius/xl, a 1px
 * border/neutral/muted — but carries no shadow and no padding of its own;
 * its three sections own their spacing instead. Written as its own card here
 * rather than fighting the surface variant with overrides, and raised: if the
 * intent is that a modal shares the floating card, the file should say so.
 * The scrim IS shared — it is the same OverlayScrim.
 *
 * Measured: header VERTICAL gap 8 at 16 padding; content gap 8 at 0/16/16/16,
 * with no top padding because the header's bottom padding already provides
 * it; footer HORIZONTAL gap 8 at 16, right-aligned. Title is heading/xs in
 * fg/neutral/emphasis; description is body/md in **fg/neutral/muted** — note
 * that is muted, where Popover's description is subtle.
 *
 * The close sits inside the title row in the file, not floated over the
 * corner, so DialogTitle renders it. Every dialog gets one without ceremony,
 * and the file's own note is that it *"always has an accessible label
 * 'Close'"*. Pass `close={false}` for the rare dialog that must be answered.
 */
const dialogContentVariants = cva(
  "fixed top-1/2 left-1/2 z-modal flex w-full max-w-full -translate-x-1/2 -translate-y-1/2 " +
    "flex-col rounded-xl border border-line-neutral-muted bg-surface-card outline-none " +
    // Arrives over motion/duration/base, leaves over fast — see theme.css.
    "data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out",
  {
    variants: {
      size: { sm: "sm:w-100", md: "sm:w-140", lg: "sm:w-180" },
    },
    defaultVariants: { size: "sm" },
  },
);

export function Dialog(
  props: React.ComponentProps<typeof DialogPrimitive.Root>,
) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

export function DialogTrigger(
  props: React.ComponentProps<typeof DialogPrimitive.Trigger>,
) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

export function DialogClose(
  props: React.ComponentProps<typeof DialogPrimitive.Close>,
) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

export interface DialogContentProps
  extends
    React.ComponentProps<typeof DialogPrimitive.Content>,
    VariantProps<typeof dialogContentVariants> {}

export function DialogContent({
  className,
  size,
  children,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      {/* The same scrim the rest of the system uses. */}
      <DialogPrimitive.Overlay
        data-slot="dialog-overlay"
        className={overlayScrimVariants()}
      />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(dialogContentVariants({ size }), className)}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

export interface DialogTitleProps extends React.ComponentProps<
  typeof DialogPrimitive.Title
> {
  /** The close button in the title row. Off only for a dialog that must be answered. */
  close?: boolean;
  closeLabel?: string;
}

export function DialogTitle({
  className,
  children,
  close = true,
  closeLabel = "Close",
  ...props
}: DialogTitleProps) {
  return (
    <div data-slot="dialog-title-row" className="flex items-center gap-2.5">
      <DialogPrimitive.Title
        data-slot="dialog-title"
        className={cn(
          "flex-1 text-heading-xs text-content-neutral-emphasis",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Title>
      {close ? (
        <DialogPrimitive.Close
          data-slot="dialog-close"
          aria-label={closeLabel}
          className={
            "inline-flex size-4 shrink-0 items-center justify-center rounded-xs " +
            // the target reaches past the icon; the box stays 16
            "relative after:absolute after:-inset-2 pointer-coarse:after:-inset-3.5 " +
            "text-content-neutral-subtle outline-none transition-colors " +
            "hover:text-content-neutral-emphasis " +
            "focus-visible:ring-2 focus-visible:ring-line-focused focus-visible:ring-offset-2 " +
            "focus-visible:ring-offset-surface-card"
          }
        >
          <X aria-hidden className="size-4" />
        </DialogPrimitive.Close>
      ) : null}
    </div>
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-body-md text-content-neutral-muted", className)}
      {...props}
    />
  );
}

/** No top padding — the header's bottom padding is the gap. */
export function DialogBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("flex flex-col gap-2 px-4 pb-4", className)}
      {...props}
    />
  );
}

/**
 * Actions, right-aligned — which fixes the order, not just the alignment.
 * The primary goes **last**, at the right-hand edge where the eye finishes,
 * paired with a secondary or an outline. Not a ghost: beside a primary, a
 * ghost reads as a third-tier action rather than the way out.
 */
export function DialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex items-center justify-end gap-2 p-4", className)}
      {...props}
    />
  );
}

export { dialogContentVariants };
