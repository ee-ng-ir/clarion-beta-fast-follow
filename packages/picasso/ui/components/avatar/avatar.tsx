// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { BadgeCheck, Plus, User } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Avatar — Figma 375:427.
 *
 * STRUCTURE from Figma: Size (xs 24 · sm 32 · md 40), Style (Default ·
 * Inverse), Border, and two placeholder axes — icon or initials. Full radius
 * throughout.
 *
 * Measured per size, rather than inferred from the names:
 *
 *   size   box   inner (Border)   text          status dot   icon
 *   xs     24    22               label/xs      10           16
 *   sm     32    30               heading/xs    12           16
 *   md     40    38               heading/sm    14           24
 *
 * Border=True draws a wrapper the same size as the box with the avatar 2px
 * smaller inside it — a **1px inset ring**, not an outer one, so a bordered
 * avatar occupies exactly the same space as an unbordered one. In Figma the
 * wrapper is raw white; here it is `ring-surface-card`, because the ring
 * separates an avatar from the surface behind it and that surface is not
 * white in dark mode.
 *
 * ⚠️ Note the ring is NOT what Figma uses for groups — every avatar in
 * `Avatar group` is Border=False, so overlapping avatars have no separating
 * edge at all. Followed as drawn; raised as an observation, because same-fill
 * circles overlapping by 4–12px have nothing marking where one ends.
 *
 * The root does NOT clip, because the status dot sits on the edge. The image
 * carries its own radius instead.
 *
 * ⚠️ Figma's online dot has two gradient "Reflection" layers over the solid
 * fill — a radial highlight and a linear sheen. Reproduced here as the flat
 * fill only: the gradients need per-stop colour values, which is exactly what
 * no-arbitrary-values refuses, and a gloss on an 10px dot is below the
 * threshold where anyone can see it. Raised rather than quietly matched.
 */
const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center rounded-full align-middle select-none",
  {
    variants: {
      size: {
        xs: "size-6 text-label-xs",
        sm: "size-8 text-heading-xs",
        md: "size-10 text-heading-sm",
      },
      variant: {
        default: "bg-surface-neutral-muted text-content-neutral-muted",
        inverse: "bg-surface-neutral-emphasis text-content-on-neutral-emphasis",
      },
      ring: { true: "ring-1 ring-inset ring-surface-card", false: "" },
    },
    defaultVariants: { size: "md", variant: "default", ring: false },
  },
);

type Size = "xs" | "sm" | "md";
type Style = "default" | "inverse";

const SizeContext = React.createContext<Size>("md");
export const useAvatarSize = () => React.useContext(SizeContext);

/**
 * Set by AvatarGroup. Figma's group carries its own Size and Style axes and
 * every child follows them, so in code the group supplies the default and an
 * individual Avatar can still override it.
 */
const GroupContext = React.createContext<{
  size: Size;
  variant: Style;
  ring: boolean;
} | null>(null);
export const useAvatarGroup = () => React.useContext(GroupContext);

export interface AvatarProps
  extends
    React.ComponentProps<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

export function Avatar({
  className,
  size,
  variant,
  ring,
  ...props
}: AvatarProps) {
  const group = React.useContext(GroupContext);
  const s = size ?? group?.size ?? "md";
  const v = variant ?? group?.variant ?? "default";
  const r = ring ?? group?.ring ?? false;
  return (
    <SizeContext.Provider value={s}>
      <AvatarPrimitive.Root
        data-slot="avatar"
        className={cn(
          avatarVariants({ size: s, variant: v, ring: r }),
          className,
        )}
        {...props}
      />
    </SizeContext.Provider>
  );
}

export function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      // The root cannot clip (the status dot sits on its edge), so the image
      // carries the radius itself.
      className={cn("size-full rounded-full object-cover", className)}
      {...props}
    />
  );
}

const ICON = { xs: "size-4", sm: "size-4", md: "size-6" } as const;

export interface AvatarFallbackProps extends React.ComponentProps<
  typeof AvatarPrimitive.Fallback
> {
  /** Show the generic person icon instead of initials. Figma's `Placeholder icon`. */
  icon?: boolean;
}

/**
 * Initials, or the generic person. Radix waits for the image to fail before
 * showing this, so there is no flash of initials behind a picture that loads.
 */
export function AvatarFallback({
  className,
  icon,
  children,
  ...props
}: AvatarFallbackProps) {
  const size = useAvatarSize();
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full",
        className,
      )}
      {...props}
    >
      {icon ? <User aria-hidden className={ICON[size]} /> : children}
    </AvatarPrimitive.Fallback>
  );
}

const DOT = { xs: "size-2.5", sm: "size-3", md: "size-3.5" } as const;
const TONE = {
  online: "bg-surface-success-emphasis",
  // Figma's Status icon draws offline on fg/neutral/subtle. It was resting on
  // a -pressed token, which is a state word and went near-invisible in light.
  offline: "bg-content-neutral-subtle",
} as const;

export interface AvatarStatusProps extends React.ComponentProps<"span"> {
  type: "online" | "offline" | "verified" | "count";
  /** For type="count". */
  count?: number;
  /** What the dot means, for anyone not looking at it. */
  label?: string;
}

/**
 * The dot on the corner. It carries meaning, so it gets a name — an avatar
 * that silently turns green tells a screen reader nothing.
 */
export function AvatarStatus({
  className,
  type,
  count,
  label,
  ...props
}: AvatarStatusProps) {
  const size = useAvatarSize();
  const name = label ?? (type === "count" ? `${count} unread` : type);
  return (
    <span
      data-slot="avatar-status"
      data-type={type}
      role="img"
      aria-label={name}
      className={cn(
        "absolute end-0 bottom-0 inline-flex items-center justify-center rounded-full",
        DOT[size],
        type === "online" || type === "offline" ? TONE[type] : null,
        type === "count" &&
          "bg-surface-danger-emphasis text-content-on-danger-emphasis text-label-xs",
        type === "verified" && "text-content-info-emphasis",
        className,
      )}
      {...props}
    >
      {type === "count" ? count : null}
      {type === "verified" ? (
        <BadgeCheck aria-hidden className="size-full" />
      ) : null}
    </span>
  );
}

export { avatarVariants };

/* ------------------------------------------------------------------ group */

/**
 * AvatarGroup — Figma 375:380.
 *
 * Overlap is a flat 4px step, measured off the slot's negative item spacing
 * rather than guessed from a ratio: **xs −4 · sm −8 · md −12**. The group
 * itself is a plain 8px gap between the stack and its trailing action, which
 * is how Figma composes it (slot + 8 + add button = the group's width).
 *
 * Children inherit Size and Style from the group, matching the file's axes.
 *
 * Two things settled on 29 Sept, both now matching the file:
 *
 * 1. **Grouped avatars are ringed.** They were Border=False, which with
 *    identical fills and a 4–12px overlap left no edge at all and the stack
 *    read as one shape. Fixed in Figma across all six group variants and
 *    defaulted to true here; an individual avatar can still opt out.
 *
 *    ⚠️ The ring restores the EDGE. It does not uncover the trailing
 *    initial — "OR" still renders as "OF" on the pale variants, because each
 *    avatar is painted over by the next one. Figma has the same behaviour,
 *    and it is inherent to centring initials under a 30% overlap. The usual
 *    remedy is painting first-on-top instead of last-on-top, which is a pure
 *    z-order change with identical geometry; it needs either reversed DOM
 *    order (which reverses what a screen reader announces) or a z-index per
 *    child. Raised, not taken.
 * 2. **Overflow is just an avatar.** The file's groups end with a "+5" — not
 *    a separate component, only the last avatar with its initials overridden,
 *    which is why a structural dump does not show it. `max` does the counting
 *    here and renders the same thing.
 */
const avatarStackVariants = cva("flex items-center", {
  variants: {
    size: { xs: "-space-x-1", sm: "-space-x-2", md: "-space-x-3" },
  },
  defaultVariants: { size: "md" },
});

export interface AvatarGroupProps extends React.ComponentProps<"div"> {
  size?: Size;
  variant?: Style;
  /** Trailing control, sat 8px clear of the stack. Usually AvatarAddButton. */
  action?: React.ReactNode;
  /**
   * Ring every avatar in the group. Defaults to true, matching the file:
   * without it, overlapping avatars have no edge and swallow each other's
   * initials.
   */
  ring?: boolean;
  /**
   * Show at most this many, then a "+N" avatar for the rest — which is
   * exactly what the file draws at the end of a group.
   */
  max?: number;
}

export function AvatarGroup({
  className,
  size = "md",
  variant = "default",
  ring = true,
  max,
  action,
  children,
  ...props
}: AvatarGroupProps) {
  const items = React.Children.toArray(children);
  const over =
    max != null && max >= 0 && items.length > max ? items.length - max : 0;
  const shown = over > 0 ? items.slice(0, max) : items;
  return (
    <GroupContext.Provider value={{ size, variant, ring }}>
      <div
        data-slot="avatar-group"
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        <div data-slot="avatar-stack" className={avatarStackVariants({ size })}>
          {shown}
          {over > 0 ? (
            // Marked with an attribute rather than a different data-slot: it
            // is still an avatar, and anything selecting [data-slot=avatar]
            // should find it.
            <Avatar data-overflow="true">
              <AvatarFallback>{`+${over}`}</AvatarFallback>
            </Avatar>
          ) : null}
        </div>
        {action}
      </div>
    </GroupContext.Provider>
  );
}

/**
 * AvatarAddButton — Figma 375:1432.
 *
 * A real button, so it is reachable and announced. Disabled collapses both
 * styles onto the same treatment in the file, which is why there is no
 * per-style disabled branch here.
 */
const avatarAddVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full border transition-colors outline-none " +
    "focus-visible:ring-2 focus-visible:ring-line-focused " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app " +
    "disabled:cursor-not-allowed disabled:border-line-disabled " +
    "disabled:bg-surface-disabled disabled:text-content-disabled",
  {
    variants: {
      size: { xs: "size-6", sm: "size-8", md: "size-10" },
      variant: {
        default:
          "bg-surface-card border-line-neutral-muted text-content-neutral-subtle " +
          "enabled:hover:bg-surface-neutral-subtle-hovered enabled:hover:text-content-neutral-muted",
        inverse:
          "bg-surface-neutral-emphasis border-line-inverse text-content-on-neutral-emphasis " +
          "enabled:hover:bg-surface-neutral-emphasis-hovered",
      },
    },
    defaultVariants: { size: "md", variant: "default" },
  },
);

export interface AvatarAddButtonProps extends Omit<
  React.ComponentProps<"button">,
  "children"
> {
  size?: Size;
  variant?: Style;
  /** What adding does. "Add" alone rarely says enough. */
  label?: string;
}

export function AvatarAddButton({
  className,
  size,
  variant,
  label = "Add person",
  ...props
}: AvatarAddButtonProps) {
  const group = React.useContext(GroupContext);
  const s = size ?? group?.size ?? "md";
  const v = variant ?? group?.variant ?? "default";
  return (
    <button
      type="button"
      data-slot="avatar-add"
      aria-label={label}
      className={cn(avatarAddVariants({ size: s, variant: v }), className)}
      {...props}
    >
      <Plus aria-hidden className="size-4" />
    </button>
  );
}

export { avatarAddVariants, avatarStackVariants };
