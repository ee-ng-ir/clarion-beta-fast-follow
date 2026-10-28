// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";
import {
  Illustration,
  type IllustrationName,
} from "../illustration/illustration";

/**
 * ListCard — a row in a list of things a person can open: an alert rule, a
 * fleet, a saved search, a dashboard. A badge, a title and a meta line on the
 * start side; an Illustration cropped into the trailing corner on a brand
 * circle on the end side.
 *
 * Figma: `List card`, `State=Default | Hover`.
 *
 * ⚠️ **The card is the control, and that is what licenses the motion.** It is
 * the one place a picture moves inside the console (see "List cards" in
 * `docs/foundations/motion.md`). The picture listens to nothing: the card owns
 * the hover and passes `active`, so a drawing can never answer a pointer the
 * card is not answering.
 *
 * - **It waits for the pointer to settle** — `active` turns on after 120ms on
 *   the card, so a pointer crossing a list on its way somewhere else moves
 *   nothing. Leaving turns it off at once, because a card you have left should
 *   not still be playing.
 * - **Keyboard focus turns it on straight away.** There is nothing to settle;
 *   `:focus-visible` is already a deliberate arrival.
 * - **The card itself only changes colour.** The border takes
 *   `border/primary/muted`. It does not lift: at a 2-gap between rows a
 *   shadow lands on the neighbour, so elevation would be a visual artefact
 *   signalling something the border already says.
 * - **The picture rises 4 inward and 8 up inside its crop**, never out of it.
 *   In RTL the crop is in the start corner, so the inward rise takes an `rtl:`
 *   twin with the sign turned.
 *
 * **The crop narrows before the text does.** Below a 448 card the art column
 * drops 160 → 112 and the drawing slides further into the corner, because a
 * row on a phone that gives half its width to a picture is a row you cannot
 * read. It answers the card's own width, not the viewport, so a card in a
 * drawer narrows at the same point as one on a page.
 *
 * The brand circle and the 160 drawing are picture, not layout: the circle is
 * sized and offset to crop well rather than to land on the spacing scale, the
 * same licence `Illustration` takes for its own geometry. Everything that IS
 * layout — the row height, the padding, the gaps — is on the scale.
 *
 * Accessibility: one target, one accessible name. The art is `aria-hidden` and
 * the drawing is drawn with `label={null}`, because the title beside it says
 * the same thing and a second name on one row is a second thing to read. The
 * card renders an anchor by default; pass `asChild` to hand it a router link.
 * Nothing is said only by the picture.
 */

export interface ListCardProps extends Omit<
  React.ComponentProps<"a">,
  "title"
> {
  /** One line. Sentence case, no full stop. Truncates rather than wraps. */
  title: React.ReactNode;
  /** The qualifying line — what it is, how many, when. Truncates. */
  meta?: React.ReactNode;
  /** A short kind or status. Omit it rather than inventing one. */
  badge?: React.ReactNode;
  /** Which drawing. Pick it for what it shows, not for how it moves. */
  illustration: IllustrationName;
  /**
   * Hand the row to a router link. Pass the link as the only child and leave
   * it empty — the card's own content is slotted inside it:
   * `<ListCard asChild …><Link href="/fleets/sydney" /></ListCard>`.
   */
  asChild?: boolean;
}

/** The pointer has to rest this long before the picture answers. */
const SETTLE_MS = 120;

export const ListCard = React.forwardRef<HTMLAnchorElement, ListCardProps>(
  (
    {
      className,
      title,
      meta,
      badge,
      illustration,
      asChild = false,
      children,
      onPointerEnter,
      onPointerLeave,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "a";

    const [settled, setSettled] = React.useState(false);
    const [focused, setFocused] = React.useState(false);
    const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const clear = React.useCallback(() => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    }, []);

    // A timer outlives the component if the row unmounts mid-dwell — a list
    // that re-filters under the pointer does exactly that.
    React.useEffect(() => clear, [clear]);

    const active = settled || focused;

    return (
      <Comp
        ref={ref}
        data-slot="list-card"
        data-active={active ? "" : undefined}
        className={cn(
          "@container/list-card group/list-card relative flex h-29 items-center overflow-hidden",
          "rounded-xl border border-line-neutral-muted bg-surface-card ps-5",
          "text-content-neutral-emphasis no-underline",
          // Colour is the whole of the card's own response.
          "transition-colors hover:border-line-primary-muted",
          "motion-reduce:transition-none",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-line-focused",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app",
          className,
        )}
        onPointerEnter={(e) => {
          clear();
          timer.current = setTimeout(() => setSettled(true), SETTLE_MS);
          onPointerEnter?.(e);
        }}
        onPointerLeave={(e) => {
          clear();
          setSettled(false);
          onPointerLeave?.(e);
        }}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      >
        {asChild ? <Slottable>{children}</Slottable> : null}
        <span
          data-slot="list-card-text"
          className="flex min-w-0 flex-1 flex-col items-start gap-1.5 pe-2"
        >
          {badge ? (
            <span
              data-slot="list-card-badge"
              className="rounded-full bg-surface-neutral-muted px-2 py-px text-label-sm text-content-neutral-muted"
            >
              {badge}
            </span>
          ) : null}
          <span className="flex w-full min-w-0 flex-col gap-0.5">
            <span
              data-slot="list-card-title"
              className="truncate text-heading-xs"
            >
              {title}
            </span>
            {meta ? (
              <span
                data-slot="list-card-meta"
                className="truncate text-body-sm text-content-neutral-subtle"
              >
                {meta}
              </span>
            ) : null}
          </span>
        </span>

        <span
          aria-hidden
          data-slot="list-card-art"
          className="pointer-events-none relative w-28 self-stretch @md/list-card:w-40"
        >
          <span
            data-slot="list-card-circle"
            className="absolute -end-25 -bottom-29 size-52 rounded-full bg-surface-primary-subtle @md/list-card:-end-19"
          />
          <span
            data-slot="list-card-illustration"
            className={cn(
              "absolute -end-8 top-3.5 block size-40 transition-illustration @md/list-card:-end-2",
              "motion-reduce:transition-none motion-reduce:translate-none",
              active && "-translate-x-1 -translate-y-2 rtl:translate-x-1",
            )}
          >
            {/* Illustration's contract takes no classes; the box is the
                wrapper's, and `active` is the card's. */}
            <Illustration name={illustration} label={null} active={active} />
          </span>
        </span>
      </Comp>
    );
  },
);
ListCard.displayName = "ListCard";
