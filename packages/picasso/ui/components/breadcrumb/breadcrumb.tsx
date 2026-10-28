// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown, ChevronRight, Ellipsis } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Breadcrumb — Figma `Breadcrumb` 2499:242 and `Breadcrumb / BreadcrumbItem`
 * 2499:269.
 *
 * Where the current page sits in the hierarchy. Everything but the last item
 * is a link; the last is the current page and is not one.
 *
 * ⚠️ The separator belongs to the item, not between items — and that is
 * load-bearing, not incidental. The file gives the list a gap of 10 (md) and
 * each item an internal gap of 6, so the space before a chevron is wider than
 * the space after it. A separator placed between items as a sibling can only
 * ever produce 10/10. Each item therefore carries its own **leading**
 * chevron, hidden on the first item — which is exactly what the file does
 * with its `Separator` boolean, off on the first item only.
 *
 * ⚠️ Size changes the gap and nothing else. md and sm are both body/md at
 * 14px and both 21 tall; only the list gap moves, 10 → 6. Built as drawn, and
 * raised — a size axis that does not change type is unusual enough to be
 * worth confirming.
 *
 * ⚠️ Focus is drawn but not designed. All twelve BreadcrumbItem variants
 * have a Focus state, and every one of them is pixel-identical to its
 * Default — no ring, no underline, nothing. Only `Link` Hover differs from
 * its Default at all. A link that cannot be seen when focused is a keyboard
 * trap, so the code carries the system's standard focus ring regardless;
 * Figma needs the same fix that the seven Tab focus variants got.
 */
const breadcrumbListVariants = cva("flex flex-wrap items-center", {
  variants: { size: { md: "gap-2.5", sm: "gap-1.5" } },
  defaultVariants: { size: "md" },
});

const SizeContext = React.createContext<"md" | "sm">("md");

export interface BreadcrumbProps
  extends
    React.ComponentProps<"nav">,
    VariantProps<typeof breadcrumbListVariants> {}

export function Breadcrumb({ size, children, ...props }: BreadcrumbProps) {
  return (
    <SizeContext.Provider value={size ?? "md"}>
      <nav data-slot="breadcrumb" aria-label="Breadcrumb" {...props}>
        {children}
      </nav>
    </SizeContext.Provider>
  );
}

export function BreadcrumbList({
  className,
  ...props
}: React.ComponentProps<"ol">) {
  const size = React.useContext(SizeContext);
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(breadcrumbListVariants({ size }), className)}
      {...props}
    />
  );
}

export interface BreadcrumbItemProps extends React.ComponentProps<"li"> {
  /** The leading chevron. On by default and hidden on the first item — Figma's `Separator`. */
  separator?: boolean;
}

export function BreadcrumbItem({
  className,
  separator = true,
  children,
  ...props
}: BreadcrumbItemProps) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("group/item flex items-center gap-1.5", className)}
      {...props}
    >
      {separator ? (
        <ChevronRight
          aria-hidden
          data-slot="breadcrumb-separator"
          className="rtl-mirror size-3.5 shrink-0 text-content-neutral-subtle group-first/item:hidden"
        />
      ) : null}
      {children}
    </li>
  );
}

const focusRing =
  "rounded-xs outline-none focus-visible:ring-2 focus-visible:ring-line-focused " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app";

export interface BreadcrumbLinkProps extends React.ComponentProps<"a"> {
  asChild?: boolean;
}

export function BreadcrumbLink({
  className,
  asChild,
  ...props
}: BreadcrumbLinkProps) {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn(
        // inline-flex with a 24 floor: the text is 21 tall, and in the
        // collapsed breadcrumb the links sit close enough together that the
        // 2.5.8 spacing exception does not cover them. The row is already
        // taller than this, so nothing moves.
        "inline-flex min-h-6 items-center text-body-md text-content-neutral-subtle transition-colors hover:text-content-neutral-emphasis",
        focusRing,
        className,
      )}
      {...props}
    />
  );
}

/** The last crumb. Not a link — it is where you already are. */
export function BreadcrumbPage({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn("text-body-md text-content-neutral-emphasis", className)}
      {...props}
    />
  );
}

/** Figma's `Variant=Ellipsis` — collapse the middle when there are more than four levels. */
export function BreadcrumbEllipsis({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      className={cn("flex items-center", className)}
      {...props}
    >
      <Ellipsis aria-hidden className="size-4 text-content-neutral-subtle" />
      <span className="sr-only">{children ?? "Show hidden levels"}</span>
    </span>
  );
}

/**
 * Figma's `Variant=Dropdown` — a crumb that opens a menu of siblings. Pass
 * `asChild` to hand it to a DropdownMenuTrigger.
 *
 * The chevron is fg/neutral/emphasis while the label is fg/neutral/subtle, as
 * drawn — the affordance is louder than the word.
 */
export interface BreadcrumbTriggerProps extends React.ComponentProps<"button"> {
  asChild?: boolean;
}

export function BreadcrumbTrigger({
  className,
  asChild,
  children,
  ...props
}: BreadcrumbTriggerProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="breadcrumb-trigger"
      className={cn(
        "flex cursor-pointer items-center gap-1.5 text-body-md text-content-neutral-subtle " +
          "transition-colors hover:text-content-neutral-emphasis",
        focusRing,
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        aria-hidden
        className="size-3.5 shrink-0 text-content-neutral-emphasis"
      />
    </Comp>
  );
}

export { breadcrumbListVariants };
