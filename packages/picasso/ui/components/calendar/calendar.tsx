// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { useDirection } from "../direction/direction";

/**
 * Calendar — Figma `Calendar / Basic` 2506:3284, `Calendar / Day Button`
 * 2506:2950 (40 variants) and `Calendar / Arrow Button` 2506:3090.
 *
 * Built on react-day-picker, which owns the month maths, the keyboard grid,
 * range selection, locale week-start and the disabled-day logic. Everything
 * here is Picasso's paint over its class hooks — the parts a design system
 * should own — rather than a second implementation of the parts that are
 * genuinely hard to get right.
 *
 * Measured: card 248 wide at radius/xl on bg/card with a
 * border/neutral/muted edge; day cell 32 at radius/md in label/lg; weekday
 * header fg/neutral/muted; arrows 32 at radius/md on bg/card, hovering to
 * bg/neutral/subtle-hovered. Selected is bg/primary/emphasis with
 * fg/on/primary-emphasis, today is bg/primary/subtle, a day outside the
 * month drops to fg/neutral/subtle, and a range's middle is
 * bg/primary/subtle with square corners so the run reads as one block.
 *
 * ⚠️ The file puts the caption and the arrows in two different orders.
 * `Calendar / Custom Cell Size` runs caption-then-arrows; `Calendar / Week
 * Numbers` runs arrows-then-caption. Built caption-left with the arrows
 * together on the right — the more common of the two and the one that keeps
 * the arrows as a pair — and raised.
 *
 * ⚠️ `Calendar / Custom Day Button` fills its Range Left and Right variants
 * with `fg/on/primary-emphasis` — a foreground token used as a background.
 * Not reproduced here: the same variants on the main Day Button use
 * bg/primary/subtle, which is what a range's edge should be.
 */
const calendarVariants = cva(
  // `relative` is load-bearing: react-day-picker renders Nav as a sibling of
  // the months, and the arrows are positioned onto the caption's row. Without
  // a positioned ancestor they anchor to the page and leave the card — which
  // measuring alone did not catch, because they were still 32×32 and visible,
  // just 984px away.
  "relative rounded-xl border border-line-neutral-muted bg-surface-card p-3",
  {
    variants: { size: { default: "", lg: "" } },
    defaultVariants: { size: "default" },
  },
);

const dayCell = {
  default: "size-8 text-label-lg",
  lg: "size-12 text-label-lg",
} as const;

/**
 * An intersection, not an Omit: `DayPickerProps` is a union discriminated on
 * `mode`, and Omit collapses it into one object type — which turns `mode`
 * into a plain union of strings and stops the whole thing being assignable.
 */
export type CalendarProps = DayPickerProps &
  VariantProps<typeof calendarVariants>;

export function Calendar({
  className,
  classNames,
  components,
  size = "default",
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const cell = dayCell[size ?? "default"];
  // react-day-picker lays the grid out, swaps its own chevrons and turns the
  // arrow keys round from this one prop. It does not read the DOM, so the
  // direction comes from the provider. The week's first day is the locale's:
  // pass a date-fns `locale` and Saturday or Sunday follows from it.
  const direction = useDirection();

  // Assembled and cast once, for the same reason as the type above.
  const dayPickerProps = {
    dir: direction,
    ...props,
    showOutsideDays,
    className: cn(calendarVariants({ size }), className),
    classNames: {
      months: "flex flex-col gap-4 sm:flex-row",
      month: "flex flex-col gap-4",

      // Caption left, arrows together on the right.
      month_caption: "flex h-8 items-center",
      caption_label: "text-label-lg text-content-neutral-emphasis",
      nav: "absolute top-3 end-3 flex h-8 items-center gap-1",
      button_previous:
        "inline-flex size-8 cursor-pointer items-center justify-center rounded-md " +
        "bg-surface-card text-content-neutral-emphasis outline-none transition-colors " +
        "hover:bg-surface-neutral-subtle-hovered " +
        "focus-visible:ring-2 focus-visible:ring-line-focused " +
        "disabled:pointer-events-none disabled:text-content-disabled",
      button_next:
        "inline-flex size-8 cursor-pointer items-center justify-center rounded-md " +
        "bg-surface-card text-content-neutral-emphasis outline-none transition-colors " +
        "hover:bg-surface-neutral-subtle-hovered " +
        "focus-visible:ring-2 focus-visible:ring-line-focused " +
        "disabled:pointer-events-none disabled:text-content-disabled",

      month_grid: "w-full border-collapse",
      weekdays: "flex",
      // `cell` carries the type size, so it goes last and nothing earlier
      // silently loses to it. The header is the same 14px as the days, which
      // is what the file's 20-tall Day Header comes out at.
      weekday: cn("h-5 flex-1 font-normal text-content-neutral-muted", cell),
      weeks: "flex flex-col",
      week: "flex w-full",

      // The cell carries the range fill so the run is continuous; the
      // button inside it carries the day's own treatment. Range state
      // arrives as classNames on the cell, not as data attributes.
      day: cn("relative flex-1 p-0 text-center", cell),
      day_button: cn(
        "flex size-full cursor-pointer items-center justify-center rounded-md " +
          "text-content-neutral-muted outline-none transition-colors " +
          "hover:bg-surface-neutral-subtle-hovered " +
          "focus-visible:ring-2 focus-visible:ring-line-focused",
      ),

      today:
        "[&_button]:bg-surface-primary-subtle [&_button]:text-content-neutral-muted",
      outside: "[&_button]:text-content-neutral-subtle",
      disabled:
        "[&_button]:pointer-events-none [&_button]:bg-surface-disabled [&_button]:text-content-disabled",
      // ⚠️ react-day-picker marks every day in a range as `selected`,
      // including the middle. Unscoped, this rule and `range_middle` both
      // set the button's text and fill at the same specificity, and
      // stylesheet order decided the winner: the middle kept its pale fill
      // but took the white text — white on bg/primary/subtle. `range-middle`
      // is a marker class (no styles of its own) so the solid treatment
      // skips the middle outright instead of racing it.
      selected:
        "[&:not(.range-middle)_button]:bg-surface-primary-emphasis " +
        "[&:not(.range-middle)_button]:text-content-on-primary-emphasis " +
        "[&:not(.range-middle)_button]:hover:bg-surface-primary-emphasis-hovered",
      // The run between the ends is one continuous block: the cell is
      // filled and its button is square and transparent so no gaps show.
      range_start: "rounded-s-md bg-surface-primary-subtle",
      range_end: "rounded-e-md bg-surface-primary-subtle",
      range_middle:
        "range-middle bg-surface-primary-subtle [&_button]:rounded-none [&_button]:bg-transparent " +
        "[&_button]:text-content-neutral-muted [&_button]:hover:bg-surface-primary-subtle-hovered",
      hidden: "invisible",
      ...classNames,
    },
    components: {
      Chevron: ({
        orientation,
        ...rest
      }: {
        orientation?: "left" | "right" | "up" | "down";
      }) =>
        orientation === "left" ? (
          <ChevronLeft aria-hidden className="size-4" {...rest} />
        ) : (
          <ChevronRight aria-hidden className="size-4" {...rest} />
        ),
      ...components,
    },
  } as DayPickerProps;

  return <DayPicker data-slot="calendar" {...dayPickerProps} />;
}

export { calendarVariants };
