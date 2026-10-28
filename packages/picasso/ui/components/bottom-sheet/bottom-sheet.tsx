// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../button/button";
import { overlayScrimVariants } from "../overlay/overlay";

/**
 * BottomSheet — Figma `Bottom sheet` 40000659:233 (Overlays → Bottom sheet),
 * rows `Bottom sheet / Item` 40000658:32195. The phone-sized answer to a
 * Select or a filter Popover: a panel that rises from the bottom edge over the
 * scrim, so its choices sit where a thumb already is.
 *
 * Drawn from the Clarion Endpoints mobile work (Status, Location and Sort),
 * where anchored popovers below md clipped against the viewport and put
 * 32-tall rows under a thumb.
 *
 * Anatomy, top to bottom: a decorative handle (36 × 4, bg/layer/emphasis),
 * a header row (title heading/md + a ghost close), a scrolling body, and an
 * optional footer whose buttons share the width (Clear + Apply).
 *
 * The panel: bg/overlay, radius/2xl on the top corners only, shadow/lg, a
 * border/neutral/muted top edge. Never full height — the cap leaves the page
 * peeking above it, which is what makes it read as temporary rather than as a
 * new screen. Padding is 16 on the sides (space/4) and 24 under the footer
 * (space/6) so the last button clears a phone's home indicator.
 *
 * Built on Radix Dialog, like Drawer: Esc and a tap on the scrim close it,
 * focus is trapped while it is open and returns to the trigger after.
 *
 * Motion: the sheet rises from the bottom edge over motion/duration/slow and
 * drops back over base, on the sheet curve (motion/easing/drawer), the same
 * as Drawer; the scrim fades. Under reduced motion the sheet fades instead
 * of travelling. Figma draws none of this.
 *
 * Drag: the handle and the header follow the finger downward. Released past a
 * quarter of the panel, or thrown, the sheet goes; short of that it settles
 * back on motion/easing/settle, which overshoots a couple of percent so the
 * return reads as weight. Dragging up is resisted rather than refused — the
 * panel gives about 24px and stops. Under reduced motion the panel still
 * follows the finger, because direct manipulation is not animation; the
 * settle is instant and a dismissal fades.
 *
 * ⚠️ The drag is an addition, never the exit. A sheet whose only way out is a
 * gesture is a sheet a keyboard or switch user cannot leave, so the close
 * button is always drawn and the handle stays aria-hidden: it is an affordance
 * for the gesture, not a control.
 *
 * ⚠️ Not for navigation. A phone's main nav is full screen
 * (SidebarMobile); a sheet is for one decision about the page beneath it.
 */

export function BottomSheet(
  props: React.ComponentProps<typeof DialogPrimitive.Root>,
) {
  return <DialogPrimitive.Root data-slot="bottom-sheet" {...props} />;
}

export function BottomSheetTrigger(
  props: React.ComponentProps<typeof DialogPrimitive.Trigger>,
) {
  return (
    <DialogPrimitive.Trigger data-slot="bottom-sheet-trigger" {...props} />
  );
}

/** The unstyled primitive — wrap your own control. `BottomSheetCloseButton` is the drawn one. */
export function BottomSheetClose(
  props: React.ComponentProps<typeof DialogPrimitive.Close>,
) {
  return <DialogPrimitive.Close data-slot="bottom-sheet-close" {...props} />;
}

export interface BottomSheetContentProps extends React.ComponentProps<
  typeof DialogPrimitive.Content
> {
  /** Accessible name for a sheet with no visible `BottomSheetTitle`. Mutually exclusive with it. */
  label?: string;
  /** The handle. On by default; it is the affordance for the drag, not a control. */
  handle?: boolean;
  /** Drag the handle or header down to dismiss. On by default. */
  drag?: boolean;
}

export function BottomSheetContent({
  className,
  label,
  handle = true,
  drag = true,
  children,
  ...props
}: BottomSheetContentProps) {
  const dismiss = React.useRef<HTMLButtonElement | null>(null);
  const from = React.useRef<{ id: number; y: number; t: number } | null>(null);
  const [offset, setOffset] = React.useState(0);
  const [settling, setSettling] = React.useState(false);

  /* Where a press must not become a drag: the body scrolls, the footer holds
     the actions, and anything focusable is a control the press belongs to. */
  const inert = (t: HTMLElement) =>
    !!t.closest(
      "[data-slot='bottom-sheet-body'],[data-slot='bottom-sheet-footer']," +
        "button,a,input,select,textarea,[role='button'],[role='slider']",
    );

  const start = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag || !e.isPrimary || inert(e.target as HTMLElement)) return;
    from.current = { id: e.pointerId, y: e.clientY, t: e.timeStamp };
    setSettling(false);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = from.current;
    if (!d || e.pointerId !== d.id) return;
    const dy = e.clientY - d.y;
    /* Down follows the finger exactly. Up is resisted, not refused: the panel
       gives a little so the gesture is acknowledged, then stops. */
    setOffset(dy >= 0 ? dy : Math.max(dy / 4, -24));
  };

  const settle = () => {
    from.current = null;
    setSettling(true);
    setOffset(0);
  };

  const end = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = from.current;
    if (!d || e.pointerId !== d.id) return;
    const dy = e.clientY - d.y;
    /* px/ms, positive downward. A flick should not have to cover the
       distance, and a slow drag past a quarter of the panel is a decision
       rather than a wobble. */
    const speed = dy / Math.max(e.timeStamp - d.t, 1);
    if (
      dy > Math.max(e.currentTarget.offsetHeight * 0.25, 64) ||
      /* A throw still has to travel, or a twitch over a few milliseconds
         reads as one. It travels less than a considered drag, which is the
         point of measuring speed at all: on a 600-tall sheet that is 48
         against 150. */
      (speed > 0.5 && dy > 48)
    ) {
      from.current = null;
      /* Radix owns closing — focus has to return to the trigger and the exit
         animation has to run — so this goes through a real Close rather than
         reaching for onOpenChange. The offset is left where it is: it lives in
         `translate`, which composes with the `transform` that sheet-out
         animates, so the panel leaves from where the finger left it instead of
         jumping back to the edge first. */
      dismiss.current?.click();
      return;
    }
    settle();
  };

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="bottom-sheet-overlay"
        className={overlayScrimVariants()}
      />
      <DialogPrimitive.Content
        data-slot="bottom-sheet-content"
        aria-describedby={undefined}
        data-dragging={offset !== 0 ? "" : undefined}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={settle}
        onTransitionEnd={(e) => {
          if (e.propertyName === "translate") setSettling(false);
        }}
        style={{ "--sheet-offset": `${offset}px` } as React.CSSProperties}
        className={cn(
          "fixed inset-x-0 bottom-0 z-modal flex max-h-5/6 flex-col " +
            "rounded-t-2xl border-t border-line-neutral-muted bg-surface-overlay " +
            "shadow-lg outline-none",
          "data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out",
          /* Only while it matters: a standing transform makes the sheet a
             containing block for anything fixed inside it. `translate-y` sets
             the `translate` property, which is also what lets the offset
             survive the exit animation — see transition-settle. */
          (offset !== 0 || settling) && "translate-y-(--sheet-offset)",
          settling && "motion-safe:transition-settle",
          className,
        )}
        {...props}
      >
        {/* The drag's way of closing. Hidden from everyone — the drawn close
            button is the control — and clicked programmatically so Radix runs
            its own close. */}
        <DialogPrimitive.Close
          ref={dismiss}
          data-slot="bottom-sheet-dismiss"
          hidden
          aria-hidden
          tabIndex={-1}
        />
        {label ? (
          <DialogPrimitive.Title className="sr-only">
            {label}
          </DialogPrimitive.Title>
        ) : null}
        {handle ? (
          <div
            aria-hidden
            data-slot="bottom-sheet-handle"
            className={cn(
              "mx-auto mt-2 h-1 w-9 shrink-0 touch-none rounded-full bg-surface-layer-emphasis select-none",
              drag && "cursor-grab active:cursor-grabbing",
            )}
          />
        ) : null}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** Title on the start, close on the end. */
export function BottomSheetHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bottom-sheet-header"
      className={cn(
        // touch-none and select-none because the header is the drag's real
        // target — 36 × 4 of handle is none. The body keeps its own
        // touch-action, so it still scrolls.
        "flex shrink-0 touch-none items-center gap-3 ps-4 pe-2 pt-2 pb-1 select-none",
        className,
      )}
      {...props}
    />
  );
}

/** heading/md — the sheet is the whole of the user's attention while it is up. */
export function BottomSheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="bottom-sheet-title"
      className={cn(
        "min-w-0 flex-1 text-heading-md text-content-neutral-emphasis",
        className,
      )}
      {...props}
    />
  );
}

export function BottomSheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="bottom-sheet-description"
      className={cn("px-4 text-body-sm text-content-neutral-muted", className)}
      {...props}
    />
  );
}

export function BottomSheetCloseButton({
  label = "Close",
  ...props
}: React.ComponentProps<typeof Button> & { label?: string }) {
  return (
    <DialogPrimitive.Close asChild>
      <Button
        data-slot="bottom-sheet-close-button"
        variant="ghost"
        size="icon-md"
        aria-label={label}
        {...props}
      >
        <X aria-hidden />
      </Button>
    </DialogPrimitive.Close>
  );
}

/** The scrolling middle. `min-h-0` is what lets it scroll inside the capped column. */
export function BottomSheetBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bottom-sheet-body"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-2",
        className,
      )}
      {...props}
    />
  );
}

/**
 * One choice: 48 tall (a thumb's target), divided by border/neutral/muted.
 * Render it as a `<label>` around a Checkbox or Radio so the whole row is the hit area.
 */
export function BottomSheetItem({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="bottom-sheet-item"
      className={cn(
        "flex min-h-12 cursor-pointer items-center gap-3 border-b border-line-neutral-muted " +
          "text-body-md text-content-neutral-emphasis last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The actions. Buttons share the width — on a phone the outcome deserves the
 * whole row — primary last, paired with an outline (Clear + Apply).
 */
export function BottomSheetFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bottom-sheet-footer"
      className={cn("flex shrink-0 gap-2 px-4 pt-3 pb-6 *:flex-1", className)}
      {...props}
    />
  );
}
