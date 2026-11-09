import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * BottomSheet — a local mirror of Picasso's `BottomSheet` (@ir/ui), same API
 * and anatomy, on this prototype's tokens. Swap the import for "@ir/ui" when
 * the fleet app moves onto Picasso.
 *
 * Phones (< md) only: the panel rises from the bottom edge over the scrim —
 * handle (decorative), title + close, a scrolling body of 48-tall rows, and a
 * footer whose buttons share the width. Capped at 5/6 of the viewport.
 * Radix Dialog: Esc / scrim close it, focus is trapped and returns to the trigger.
 */
export const BottomSheet = DialogPrimitive.Root
export const BottomSheetTrigger = DialogPrimitive.Trigger
export const BottomSheetClose = DialogPrimitive.Close

export function BottomSheetContent({
  className,
  children,
  handle = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { handle?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-x-0 bottom-0 top-8 z-[80] data-[state=open]:animate-in data-[state=open]:fade-in-0"
        style={{ background: "var(--bg-scrim)" }}
      />
      <DialogPrimitive.Content
        aria-describedby={undefined}
        className={cn(
          "fixed inset-x-0 bottom-0 z-[90] flex max-h-[83vh] flex-col rounded-t-2xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom",
          className,
        )}
        style={{ background: "var(--bg-overlay)", borderTop: "1px solid var(--border-neutral-muted)", boxShadow: "var(--shadow-lg)" }}
        {...props}
      >
        {handle && <div aria-hidden className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full" style={{ background: "var(--bg-layer-emphasis)" }} />}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function BottomSheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex shrink-0 items-center gap-3 pb-1 pl-4 pr-2 pt-2", className)} {...props} />
}

export function BottomSheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("min-w-px flex-1 text-lg font-semibold", className)}
      style={{ color: "var(--fg-neutral-emphasis)" }}
      {...props}
    />
  )
}

export function BottomSheetCloseButton({ label = "Close" }: { label?: string }) {
  return (
    <DialogPrimitive.Close
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
      style={{ color: "var(--fg-neutral-muted)" }}
    >
      <X className="size-4" aria-hidden />
    </DialogPrimitive.Close>
  )
}

export function BottomSheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-2", className)} {...props} />
}

/** One 48-tall choice; a <label>, so the whole row is the target. */
export function BottomSheetItem({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("flex min-h-12 cursor-pointer items-center gap-3 text-sm last:border-b-0", className)}
      style={{ borderBottom: "1px solid var(--border-neutral-muted)", color: "var(--fg-neutral-emphasis)" }}
      {...props}
    />
  )
}

export function BottomSheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex shrink-0 gap-2 px-4 pb-6 pt-3 *:flex-1", className)} {...props} />
}

/** The two footer buttons, sized for a thumb (40). */
export function SheetButton({
  primary,
  className,
  ...props
}: React.ComponentProps<"button"> & { primary?: boolean }) {
  return (
    <button
      type="button"
      className={cn("h-10 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-50", className)}
      style={
        primary
          ? { background: "var(--bg-primary-emphasis)", color: "var(--fg-on-primary-emphasis)" }
          : { background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)", color: "var(--fg-neutral-emphasis)" }
      }
      {...props}
    />
  )
}

/** A Picasso-style checkbox square (checked / indeterminate / unchecked). */
export function SheetCheck({ state }: { state: "checked" | "indeterminate" | "unchecked" }) {
  const filled = state !== "unchecked"
  return (
    <span
      aria-hidden
      className="flex size-5 shrink-0 items-center justify-center rounded"
      style={{ background: filled ? "var(--bg-primary-emphasis)" : "var(--bg-input-default)", border: `1px solid ${filled ? "var(--bg-primary-emphasis)" : "var(--border-input-default)"}` }}
    >
      {state === "checked" && <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="var(--fg-on-primary-emphasis)" strokeWidth="2.2"><path d="M3.5 8.5l3 3 6-7" /></svg>}
      {state === "indeterminate" && <span className="h-0.5 w-2.5 rounded" style={{ background: "var(--fg-on-primary-emphasis)" }} />}
    </span>
  )
}
