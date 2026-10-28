// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { overlaySurfaceVariants } from "../overlay/overlay";

/**
 * DropdownMenu — Figma: Menu 1146:3028, Item 1146:3071, Label 1146:3112,
 * Separator 1146:3114, SubTrigger 1146:3127.
 *
 * The panel is the **Compact overlay surface**, and the file says so: *"Built
 * on Overlay / Surface (Density=Compact) — the shared floating card… Leave
 * Density alone; Compact is correct for menu rows."* So the content takes
 * `overlaySurfaceVariants({ density: "compact" })` and adds only a minimum
 * width and its scroll behaviour.
 *
 * The Item set documents its own mapping, which is followed exactly:
 * *"Focused = focus:bg-accent (Radix moves DOM focus on both pointer and
 * keyboard, so one state covers both), Disabled = data-[disabled]:opacity-50.
 * There is deliberately no separate hover."* That is why there is no
 * `hover:` anywhere below — a menu row lights up because focus moved to it,
 * and Radix moves focus on pointer-over as well as arrow keys.
 *
 * Measured: rows 28 tall, 4/6 padding, gap 6, radius/md; body/md label in
 * fg/neutral/emphasis with a body/xs shortcut in fg/neutral/subtle that goes
 * to emphasis when the row has focus. Destructive draws fg/danger/emphasis
 * and focuses onto bg/danger/subtle. Label is label/sm in fg/neutral/subtle.
 * The separator is a 1px border/neutral/muted rule with 4 above and below.
 *
 * ⚠️ Two inconsistencies in the file, neither acted on:
 *
 * 1. `Variant=Default` pads 32 on the right where Shortcut and Destructive
 *    pad 6 — the same component set disagreeing with itself. Built at 6,
 *    since two of the three say so, the way Alert's spacing was settled.
 * 2. SubTrigger draws radius/lg (10) where Item draws radius/md (8), and the
 *    two sit in the same list. Built as drawn — they are separate components,
 *    so this is an observation rather than a defect — but it means a submenu
 *    row is visibly rounder than the rows around it.
 * 3. SubTrigger is drawn 29 tall against Item's 28. Both are h-7 here: rows
 *    in one list have to align, and a 1px difference between siblings is
 *    noise rather than intent.
 *
 * Heights are explicit for the same reason Tabs and Input set theirs —
 * padding plus body/md's line-height renders 29, one over the drawn 28.
 *
 * Not built: CheckboxItem and RadioItem. Radix provides them and a menu often
 * wants them, but Figma draws no check indicator for this menu and inventing
 * one is the mistake this project keeps paying for. Worth adding to the file.
 */
export function DropdownMenu(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Root>,
) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

export function DropdownMenuTrigger(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>,
) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

export function DropdownMenuGroup(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Group>,
) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  );
}

export function DropdownMenuContent({
  className,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          overlaySurfaceVariants({ density: "compact" }),
          "min-w-40 max-h-(--radix-dropdown-menu-content-available-height) overflow-y-auto",
          "origin-(--radix-dropdown-menu-content-transform-origin)",
          "data-[state=open]:animate-popover-in data-[state=closed]:animate-popover-out",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

const dropdownMenuItemVariants = cva(
  "group relative flex h-7 cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 " +
    "text-body-md outline-none select-none " +
    // No hover. Radix moves DOM focus on pointer-over as well as arrow keys,
    // so focus is the only state a row needs — the file says this outright.
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 " +
    "[&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "text-content-neutral-emphasis focus:bg-surface-neutral-subtle-hovered",
        destructive:
          "text-content-danger-emphasis focus:bg-surface-danger-subtle",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface DropdownMenuItemProps
  extends
    React.ComponentProps<typeof DropdownMenuPrimitive.Item>,
    VariantProps<typeof dropdownMenuItemVariants> {}

export function DropdownMenuItem({
  className,
  variant,
  ...props
}: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-variant={variant ?? "default"}
      className={cn(dropdownMenuItemVariants({ variant }), className)}
      {...props}
    />
  );
}

/** The key hint on the right. Brightens with the row, because it belongs to it. */
export function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ms-auto text-body-xs text-content-neutral-subtle group-focus:text-content-neutral-emphasis",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      className={cn(
        "px-1.5 py-1 text-label-sm text-content-neutral-subtle",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      // Drawn inset to the surface's own padding rather than bled to the
      // edges — the rule sits inside the Items slot in the file.
      className={cn("my-1 h-px bg-line-neutral-muted", className)}
      {...props}
    />
  );
}

export function DropdownMenuSub(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>,
) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

export function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger>) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      className={cn(
        "flex h-7 cursor-default items-center gap-2 rounded-lg px-1.5 py-1 text-body-md " +
          "text-content-neutral-emphasis outline-none select-none " +
          "focus:bg-surface-neutral-subtle-hovered data-[state=open]:bg-surface-neutral-subtle-hovered " +
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRight
        aria-hidden
        className="rtl-mirror ms-auto size-4 shrink-0"
      />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

export function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent
        data-slot="dropdown-menu-sub-content"
        className={cn(
          overlaySurfaceVariants({ density: "compact" }),
          "min-w-40",
          "origin-(--radix-dropdown-menu-content-transform-origin)",
          "data-[state=open]:animate-popover-in data-[state=closed]:animate-popover-out",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export { dropdownMenuItemVariants };
