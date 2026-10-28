// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import {
  Illustration,
  type IllustrationName,
} from "../illustration/illustration";

/**
 * EmptyState — what a data component shows when it is working and has nothing
 * to show.
 *
 * Figma: none. Code first. `Error page` in the file covers 404 and 500, which
 * is the opposite job: that is the app having failed, this is the app having
 * succeeded and found nothing.
 *
 * `description` is required, and that is the point of the component.
 * `docs/content/empty-and-loading-states.md` exists because "No data." is what
 * ships when a state is left to the framework, and a title on its own is "No
 * data." with better spacing. Say why it is empty and what would fill it.
 *
 * Four states in the guidance, three components — this is one of them:
 * - **Loading** → `Skeleton`. The guidance prefers a skeleton to a spinner.
 * - **Empty, and first use** → here. Both are a panel with nothing in it, so
 *   there is no `kind` axis: the block is identical and the words are not.
 *   Empty asks for a change to the question ("widen the time range"); first
 *   use asks for setup ("connect a source") and must not read as though the
 *   reader did something wrong.
 * - **Partial** → `Alert` above the data that did load, naming what did not.
 *   Deliberately not this component: partial means there IS something to show,
 *   so a centred block standing in for the data would hide the part that
 *   worked — which is the "never silently drop a source" rule, inverted.
 *
 * `size` is about the hole being filled, not about importance. `md` fills a
 * page, a table body or a panel and can carry the 160 drawing. `sm` sits
 * inside a chart frame, a card or a popover, where a 160 drawing would be
 * larger than the space it is explaining — so `illustration` is ignored there
 * and `icon` is the way in.
 */

const emptyStateVariants = cva(
  "flex flex-col items-center text-center [&_a]:underline",
  {
    variants: {
      size: {
        // The cap is on the text, not the box: a description that runs the
        // full width of a dashboard is a description nobody finishes.
        md: "gap-4 px-6 py-10 [&>[data-slot=empty-state-text]]:max-w-80",
        sm: "gap-2 px-4 py-6 [&>[data-slot=empty-state-text]]:max-w-64",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface EmptyStateProps
  extends Omit<React.ComponentProps<"div">, "title">,
    VariantProps<typeof emptyStateVariants> {
  /** One line, sentence case, no full stop. */
  title: React.ReactNode;
  /**
   * Why it is empty and what would fill it. Required on purpose — see the
   * component notes.
   */
  description: React.ReactNode;
  /** The 160 drawing. `md` only; ignored at `sm`. */
  illustration?: IllustrationName;
  /** A glyph instead of a drawing — the usual choice at `sm`. */
  icon?: React.ReactNode;
  /** What to do about it: one Button, or a ButtonGroup for two. */
  action?: React.ReactNode;
}

export function EmptyState({
  className,
  size = "md",
  title,
  description,
  illustration,
  icon,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      data-size={size}
      className={cn(emptyStateVariants({ size }), className)}
      {...props}
    >
      {illustration && size === "md" ? (
        /* The 160 box is the wrapper's, not the drawing's: Illustration's
           contract takes no classes. */
        <span data-slot="empty-state-art" className="block size-40">
          <Illustration
            name={illustration}
            /* Still, and silent. The picture sits inside the product rather
               than inviting a pointer, and the title beside it already says
               what it shows. */
            interactive={false}
            label={null}
          />
        </span>
      ) : icon ? (
        <span
          aria-hidden
          data-slot="empty-state-icon"
          className={cn(
            "flex items-center justify-center text-content-neutral-subtle",
            size === "md" ? "[&_svg]:size-8" : "[&_svg]:size-6",
          )}
        >
          {icon}
        </span>
      ) : null}

      <div
        data-slot="empty-state-text"
        className={cn("flex flex-col", size === "md" ? "gap-1.5" : "gap-1")}
      >
        <p
          data-slot="empty-state-title"
          className={cn(
            "text-content-neutral-emphasis",
            size === "md" ? "text-heading-sm" : "text-heading-xs",
          )}
        >
          {title}
        </p>
        <p
          data-slot="empty-state-description"
          className={cn(
            "text-content-neutral-subtle",
            size === "md" ? "text-body-md" : "text-body-sm",
          )}
        >
          {description}
        </p>
      </div>

      {action ? (
        <div data-slot="empty-state-action">{action}</div>
      ) : null}
    </div>
  );
}

export { emptyStateVariants };
