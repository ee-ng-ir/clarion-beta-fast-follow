// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown, ChevronUp, Maximize2, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../button/button";
import { overlayScrimVariants } from "../overlay/overlay";

/**
 * Drawer — Figma `Drawer` 975:94, header `Drawer / Header` 40000394:24888.
 *
 * The file's own framing: *"side panel over a Scrim for secondary tasks,
 * filters and drilldowns"* — the place for work too long or too wide for a
 * Dialog, without sending anyone to another page.
 *
 * Two axes, five variants, not six. Side is End | Start | Expanded (the axis
 * was `Type` = Right | Left | Expanded until 2 Oct 2026, renamed in Figma the
 * same day the prop was); Size is
 * Default (480) | Wide (640). **Expanded has no Wide** — the file says
 * Expanded is already the wide one, so `size` is ignored there rather than
 * silently doing nothing surprising.
 *
 * The panel is a full-height edge of the app, not a floating card: bg/card,
 * shadow/lg, no radius, and a single border on the **inner** edge only —
 * the inline-start edge for an end drawer, the inline-end edge for a start
 * one (left and right respectively, in English). Expanded is
 * the exception: inset 80 horizontally and 40 vertically, a border on all
 * four sides, and radius/2xl. Measured at the 1280×800 canvas the file is
 * drawn at: 1120×720.
 *
 * ⚠️ The two rules are different tokens, as drawn. The header's bottom rule
 * is border/neutral/**subtle**; the footer's top rule is
 * border/neutral/**muted**. Followed rather than evened out, and raised — if
 * the two rules are meant to match, the file is the place to settle it.
 *
 * ⚠️ Heights run 4px taller than the Figma frames, and this is the Button
 * offset, not a new departure. Figma draws the header's icon buttons at
 * Ghost/icon-sm = 28 and the footer's at md = 32; code's Button is
 * deliberately one step taller at every size (see button.tsx), so icon-sm is
 * 32 and md is 36. Mapping by NAME rather than by pixel keeps a design
 * reading straight into props, so the record header measures 49 rather than
 * 45 and the footer 69 rather than 64. Both are padding-driven here — no
 * fixed height to fight the button.
 *
 * Motion (2 Oct): a side drawer slides in from its edge over
 * motion/duration/slow and back out over base; the expanded drawer, which
 * has no edge to come from, scales in like a Dialog. The scrim fades with
 * it. Under reduced motion each of these becomes a short fade — the named
 * animations carry that themselves. Figma draws none of this — a
 * static frame cannot — so the tokens in core.json are the spec.
 */
const drawerPanelVariants = cva(
  "fixed z-modal flex flex-col bg-surface-card shadow-lg outline-none",
  {
    variants: {
      /* `side` is logical: `end` is where a line of text finishes, so the
         detail drawer opens on the right in English and on the left in
         Arabic — the opposite side from the sidebar in both. It was
         `right` / `left` until 2 Oct 2026; a `side="right"` drawer that
         stayed on the right in an RTL locale would have opened over the
         sidebar it is meant to face. The travel is signed in theme.css,
         because there is no logical `translate`. */
      side: {
        end:
          "inset-y-0 end-0 border-s border-line-neutral-muted " +
          "data-[state=open]:animate-drawer-in-end data-[state=closed]:animate-drawer-out-end",
        start:
          "inset-y-0 start-0 border-e border-line-neutral-muted " +
          "data-[state=open]:animate-drawer-in-start data-[state=closed]:animate-drawer-out-start",
        // Inset on all four sides; size does not apply.
        expanded:
          "inset-x-20 inset-y-10 rounded-2xl border border-line-neutral-muted " +
          "data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out",
      },
      size: { default: "", wide: "" },
    },
    compoundVariants: [
      { side: "end", size: "default", class: "w-120 max-w-full" },
      { side: "end", size: "wide", class: "w-160 max-w-full" },
      { side: "start", size: "default", class: "w-120 max-w-full" },
      { side: "start", size: "wide", class: "w-160 max-w-full" },
    ],
    defaultVariants: { side: "end", size: "default" },
  },
);

export function Drawer(
  props: React.ComponentProps<typeof DialogPrimitive.Root>,
) {
  return <DialogPrimitive.Root data-slot="drawer" {...props} />;
}

export function DrawerTrigger(
  props: React.ComponentProps<typeof DialogPrimitive.Trigger>,
) {
  return <DialogPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

/** The unstyled primitive — wrap your own control. `DrawerCloseButton` is the drawn one. */
export function DrawerClose(
  props: React.ComponentProps<typeof DialogPrimitive.Close>,
) {
  return <DialogPrimitive.Close data-slot="drawer-close" {...props} />;
}

export interface DrawerContentProps
  extends
    React.ComponentProps<typeof DialogPrimitive.Content>,
    VariantProps<typeof drawerPanelVariants> {
  /**
   * The drawer's accessible name, for a drawer with **no** visible
   * `DrawerTitle` — a record header carries a counter, not a title, so it
   * needs one here. Rendered as a screen-reader-only title.
   *
   * ⚠️ Mutually exclusive with `DrawerTitle`. Both render a Radix Title, both
   * Titles get the same id, and the hidden one wins the accessible name — so
   * a drawer with a perfectly good visible title would announce itself as
   * something else entirely. Warns in development.
   */
  label?: string;
}

export function DrawerContent({
  className,
  side,
  size,
  label,
  children,
  ref,
  ...props
}: DrawerContentProps) {
  return (
    <DialogPrimitive.Portal>
      {/* The same scrim as Dialog — see overlay.tsx on its alpha. */}
      <DialogPrimitive.Overlay
        data-slot="drawer-overlay"
        className={overlayScrimVariants()}
      />
      <DialogPrimitive.Content
        data-slot="drawer-content"
        data-side={side ?? "end"}
        ref={(node: HTMLDivElement | null) => {
          // Ref callbacks run bottom-up, so the children are already in the
          // DOM here — which an effect on this component cannot rely on: the
          // Portal renders nothing while the drawer is closed.
          if (
            process.env.NODE_ENV !== "production" &&
            node &&
            label &&
            node.querySelector("[data-slot='drawer-title']")
          ) {
            console.warn(
              "Drawer: `label` and `DrawerTitle` are both set. Both render a title " +
                "with the same id, and the hidden one wins the accessible name. Drop `label`.",
            );
          }
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn(drawerPanelVariants({ side, size }), className)}
        {...props}
      >
        {label ? (
          <DialogPrimitive.Title className="sr-only">
            {label}
          </DialogPrimitive.Title>
        ) : null}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

const drawerHeaderVariants = cva(
  "shrink-0 border-b border-line-neutral-muted bg-surface-card",
  {
    variants: {
      type: {
        // Record: one row, navigation left, actions right.
        record: "flex items-center justify-between px-3 py-2",
        // Title: a heading row, and optionally a tabs row beneath it.
        title: "flex flex-col",
      },
    },
    defaultVariants: { type: "record" },
  },
);

export interface DrawerHeaderProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof drawerHeaderVariants> {}

export function DrawerHeader({ className, type, ...props }: DrawerHeaderProps) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(drawerHeaderVariants({ type }), className)}
      {...props}
    />
  );
}

/** The record header's left-hand group: back, previous/next, counter. */
export function DrawerNav({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-nav"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    />
  );
}

/** The right-hand group — expand and close. Used by both header types. */
export function DrawerActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-actions"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    />
  );
}

/** A labelled way back out of a drilldown, with the rule that separates it from the stepper. */
export function DrawerBack({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <div data-slot="drawer-back" className="flex items-center gap-2">
      <Button variant="ghost" size="sm" className={cn(className)} {...props}>
        {children}
      </Button>
      <div aria-hidden className="h-4.5 w-px shrink-0 bg-line-neutral-muted" />
    </div>
  );
}

/**
 * Previous and Next step through a list, so the file draws them as up and
 * down rather than left and right — the direction of the list behind the
 * drawer, not of the drawer itself.
 */
export function DrawerPrevious({
  label = "Previous",
  ...props
}: React.ComponentProps<typeof Button> & { label?: string }) {
  return (
    <Button
      data-slot="drawer-previous"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      {...props}
    >
      <ChevronUp aria-hidden />
    </Button>
  );
}

export function DrawerNext({
  label = "Next",
  ...props
}: React.ComponentProps<typeof Button> & { label?: string }) {
  return (
    <Button
      data-slot="drawer-next"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      {...props}
    >
      <ChevronDown aria-hidden />
    </Button>
  );
}

/**
 * Where in the list you are — "3 of 227".
 *
 * ⚠️ The file sets no gap between the optional icon and the text. Followed,
 * and raised: with the icon on, the two sit flush. Lucide's own padding
 * makes that read as a couple of pixels rather than a collision, which is
 * probably why it was never noticed.
 */
export function DrawerCounter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-counter"
      className={cn(
        "flex items-center gap-0 ps-1.5 text-label-sm text-content-neutral-muted [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}

export function DrawerExpand({
  label = "Expand",
  ...props
}: React.ComponentProps<typeof Button> & { label?: string }) {
  return (
    <Button
      data-slot="drawer-expand"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      {...props}
    >
      <Maximize2 aria-hidden />
    </Button>
  );
}

export function DrawerCloseButton({
  label = "Close",
  ...props
}: React.ComponentProps<typeof Button> & { label?: string }) {
  return (
    <DialogPrimitive.Close asChild>
      <Button
        data-slot="drawer-close-button"
        variant="ghost"
        size="icon-sm"
        aria-label={label}
        {...props}
      >
        <X aria-hidden />
      </Button>
    </DialogPrimitive.Close>
  );
}

/**
 * The title header's first row. Padding is asymmetric as drawn — 20 on the
 * left against the text, 12 on the right because the icon buttons carry
 * their own.
 */
export function DrawerHeading({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-heading"
      className={cn("flex items-start gap-3 py-4 pe-3 ps-5", className)}
      {...props}
    />
  );
}

/** The 32px chip that holds a 16px icon. */
export function DrawerIcon({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-icon"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-primary-subtle [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}

/** Title and supporting text share a column at gap 2. */
export function DrawerTitleGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-title-group"
      className={cn("flex min-w-0 flex-1 flex-col gap-0.5", className)}
      {...props}
    />
  );
}

export function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-heading-xs text-content-neutral-emphasis", className)}
      {...props}
    />
  );
}

/** body/sm here — narrower than Dialog's body/md, because the panel is narrower. */
export function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-body-sm text-content-neutral-muted", className)}
      {...props}
    />
  );
}

/** The optional second row of a title header. Off in the file by default. */
export function DrawerTabs({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div data-slot="drawer-tabs" className={cn("px-5", className)} {...props} />
  );
}

/** The scrolling middle. `min-h-0` is what lets it actually scroll inside the flex column. */
export function DrawerBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-body"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-5",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Actions, right-aligned, on a rule. Same order as Dialog: primary **last**,
 * at the right-hand edge, paired with a secondary or an outline rather than
 * a ghost.
 */
export function DrawerFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn(
        "flex shrink-0 items-center justify-end gap-3 border-t border-line-neutral-muted bg-surface-card px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}

export { drawerPanelVariants, drawerHeaderVariants };
