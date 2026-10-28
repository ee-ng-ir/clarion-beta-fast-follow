// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * Card
 *
 * A surface that holds one thing. The border and the lift say "this is a
 * unit" — so a card with nothing to unify is just a box, and a page of
 * nested cards has said it three times.
 *
 * FROM FIGMA (`2579:33491`), as drawn:
 *
 *   box        bg/card, 1px border/neutral/muted, radius/xl, shadow/xs
 *   header     padding 24 sides + top, no bottom; title row gap 16
 *   title      heading/sm, fg/neutral/emphasis   · gap 4 above the description
 *   body       body/md, fg/neutral/subtle
 *   content    padding 24, gap 24 between its own children
 *   footer     padding 24 sides + bottom, no top; gap 8
 *   sm         the same, with every 24 replaced by 16
 *
 * The header carries no bottom padding and the footer no top: the spacing
 * between sections comes from whichever section is next, which is what keeps
 * a header-only or footer-only card correctly padded.
 */
type Size = "default" | "sm";

const CardContext = React.createContext<Size>("default");
const useCardSize = () => React.useContext(CardContext);

/* Size is not a variant of the box — every measurement it changes lives in
 * the header, content and footer. So it travels by context and the root keeps
 * one class list, rather than a cva axis whose every branch is empty. */
const cardVariants = cva(
  "flex flex-col rounded-xl border border-line-neutral-muted bg-surface-card shadow-xs",
);

export interface CardProps extends React.ComponentProps<"div"> {
  /** Figma's `Size`: `default` pads at 24, `sm` at 16. */
  size?: Size;
}

export function Card({ className, size = "default", ...props }: CardProps) {
  return (
    <CardContext.Provider value={size}>
      <div
        data-slot="card"
        data-size={size}
        className={cn(cardVariants(), className)}
        {...props}
      />
    </CardContext.Provider>
  );
}

/**
 * Title, description, and anything trailing — a menu button, a badge, a pair
 * of actions. The trailing slot is `CardAction`.
 */
export function CardHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const size = useCardSize();
  return (
    <div
      data-slot="card-header"
      className={cn(
        // No bottom padding: the next section brings its own. Unless there
        // is no next section — a header-only card would otherwise sit its
        // title flush against the bottom edge.
        "flex items-start gap-4",
        size === "sm" ? "px-4 pt-4 last:pb-4" : "px-6 pt-6 last:pb-6",
        className,
      )}
      {...props}
    />
  );
}

/** heading/sm. One line that says what the card is. */
export function CardTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-heading-sm text-content-neutral-emphasis", className)}
      {...props}
    />
  );
}

/** body/md, subtle. Sits 4 under the title. */
export function CardDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-body-md text-content-neutral-subtle", className)}
      {...props}
    />
  );
}

/** The title and description as one block, so the trailing action can sit beside them. */
export function CardHeaderText({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header-text"
      className={cn("flex min-w-0 flex-1 flex-col gap-1", className)}
      {...props}
    />
  );
}

/** Trailing controls in the header row — a menu, a badge, a button or two. */
export function CardAction({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const size = useCardSize();
  return (
    <div
      data-slot="card-content"
      className={cn(
        "flex flex-col",
        size === "sm" ? "gap-4 p-4" : "gap-6 p-6",
        className,
      )}
      {...props}
    />
  );
}

export function CardFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const size = useCardSize();
  return (
    <div
      data-slot="card-footer"
      // No top padding, for the same reason the header has no bottom — and
      // the same exception when the footer is all there is.
      className={cn(
        "flex items-center gap-2",
        size === "sm" ? "px-4 pb-4 first:pt-4" : "px-6 pb-6 first:pt-6",
        className,
      )}
      {...props}
    />
  );
}

export { cardVariants };
