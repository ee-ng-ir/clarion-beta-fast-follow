// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";

import { cn } from "../../lib/utils";

/**
 * PageHeader — the top of the content area: the page's name, optionally one
 * line on what the page is for, and the rule that separates the two from the
 * page itself.
 *
 * Figma: none yet. Code first, out of the App shell Rules, which have said
 * since 1 Oct that "page title and page actions live in the page header
 * inside the content area, not in the top bar" — without there being a page
 * header to put them in. Every page in the App shell story hand-rolled
 * `<h1 className="text-heading-xl text-content-neutral-emphasis">`: three
 * decisions (step, weight tier, colour) re-made per page and free to drift.
 *
 * Where it sits: inside `AppShellContent`, as the first thing on the page.
 * The breadcrumb is not part of it. That stays in the 48 top bar, which does
 * not scroll — a breadcrumb that leaves the screen with the page stops being
 * the thing that tells you where you are, which is the whole reason the bar
 * carries it and nothing else.
 *
 * `heading/xl` (30) is the page-title step, named as such in
 * docs/foundations/typography.md. The ramp was never the problem — nothing
 * said which step was a page title, so `xs` and `sm` did page-title work.
 * This component is where that answer stops being a sentence in a doc.
 *
 * The description caps at the reading width (768, `size/content/reading`)
 * whatever the page's own width mode is. A fluid dashboard hands the column
 * 2256 at a 2560 monitor, and a sentence that long is a sentence nobody
 * finishes — the same reason `width="reading"` exists for forms and prose.
 *
 * The rule under it is on by default, because what it marks is structural:
 * above is what this page is, below is the page. `divider={false}` is for
 * the case where the first thing under the header already has an edge — a
 * full-bleed table, a single card — and two lines 24 apart read as a mistake.
 *
 * No actions, meta or tabs slot yet, on purpose. Each is a layout decision
 * with its own wrapping behaviour on a narrow column; adding one later is
 * additive, and guessing at all three now is not.
 */
export interface PageHeaderProps extends Omit<
  React.ComponentProps<"header">,
  "title" | "children"
> {
  /** The page's name. Sentence case, no full stop. Renders the page's `h1`. */
  title: React.ReactNode;
  /**
   * What the page is for, in a line or two. Capped at the reading width.
   * Leave it out rather than restating the title.
   */
  description?: React.ReactNode;
  /** The rule under the header. On by default. */
  divider?: boolean;
}

export function PageHeader({
  className,
  title,
  description,
  divider = true,
  ...props
}: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      data-divider={divider ? "" : undefined}
      // gap-2 rather than gap-1: heading/xl is 120% leading, so there is
      // little optical space under the title to borrow from.
      className={cn(
        "flex flex-col gap-2",
        divider && "border-b border-line-neutral-muted pb-4",
        className,
      )}
      {...props}
    >
      <h1
        data-slot="page-header-title"
        className="text-heading-xl text-content-neutral-emphasis"
      >
        {title}
      </h1>
      {description ? (
        <p
          data-slot="page-header-description"
          className="max-w-content-reading text-body-md text-content-neutral-muted"
        >
          {description}
        </p>
      ) : null}
    </header>
  );
}
