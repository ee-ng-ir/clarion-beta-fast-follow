// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../../lib/utils";

/**
 * Tooltip
 *
 * STRUCTURE from Figma (Tooltip 426:8325): bg/neutral/emphasis, radius/md,
 * 4 / 12 padding, body/xs in fg/on/neutral-emphasis, with an arrow.
 *
 * Radix underneath, so it opens on hover AND keyboard focus, closes on
 * Escape, and is announced as the trigger's description — a tooltip only a
 * mouse can reach is a tooltip half the audience never sees.
 *
 * A tooltip explains; it never holds the only copy of something someone needs
 * to finish a task. That belongs in the field's hint.
 */
export function TooltipProvider({
  delayDuration = 300,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}

export function Tooltip(
  props: React.ComponentProps<typeof TooltipPrimitive.Root>,
) {
  // Self-providing, so a single tooltip works without an app-level provider.
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

export function TooltipTrigger(
  props: React.ComponentProps<typeof TooltipPrimitive.Trigger>,
) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

export function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-floating max-w-xs rounded-md bg-surface-neutral-emphasis px-3 py-1 " +
            "text-body-xs text-content-on-neutral-emphasis text-balance",
          // Only the delayed open animates. Radix opens the next tooltip
          // instantly while the pointer is moving along a row of triggers,
          // and a fade on each one would make the row feel slower.
          "origin-(--radix-tooltip-content-transform-origin)",
          "data-[state=delayed-open]:animate-popover-in data-[state=closed]:animate-popover-out",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow
          className="fill-surface-neutral-emphasis"
          width={10}
          height={5}
        />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
