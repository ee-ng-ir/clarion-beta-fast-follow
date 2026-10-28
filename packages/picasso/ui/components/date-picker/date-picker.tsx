// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { format as formatDate } from "date-fns";
import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { Calendar } from "../calendar/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/popover";

/**
 * Date picker — Figma `Date Picker` 2506:230, 15 variants.
 *
 * A trigger that borrows the field family's treatment, and a Popover holding
 * a Calendar. The trigger is a button rather than an input: the value is a
 * date, not free text, and a button is what a listbox-style control should
 * be when there is nothing to type into.
 *
 * Figma's `Type` axis is Icon Left | Icon Right | With Input, which is
 * position and presence rather than paint — so it is `iconPosition` here,
 * and "With Input" is what you get by composing the trigger yourself.
 *
 * Measured: 32 tall at radius/md, padding 4/10, gap 8, on bg/input/default
 * with a border/input/default edge. Placeholder text is fg/neutral/subtle
 * and a filled value is fg/neutral/emphasis — which is the whole difference
 * between the two states, so the placeholder must not look like a value.
 * Hover moves the edge to border/input/hovered; disabled is
 * bg/input/disabled with fg/disabled.
 */
const datePickerTriggerVariants = cva(
  "flex h-8 w-full cursor-pointer items-center gap-2 rounded-md border " +
    "border-line-input-default bg-surface-input-default px-2.5 " +
    "text-body-md outline-none transition-colors " +
    "hover:border-line-input-hovered " +
    "focus-visible:border-line-input-focused focus-visible:ring-2 " +
    "focus-visible:ring-line-focused focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-surface-app " +
    "disabled:pointer-events-none disabled:border-line-input-default " +
    "disabled:bg-surface-input-disabled disabled:text-content-disabled " +
    "[&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      /** Whether a value has been chosen — the only thing separating the two. */
      filled: {
        true: "text-content-neutral-emphasis",
        false: "text-content-neutral-subtle",
      },
    },
    defaultVariants: { filled: false },
  },
);

type SingleProps = {
  mode?: "single";
  value?: Date;
  onValueChange?: (value: Date | undefined) => void;
};

type RangeProps = {
  mode: "range";
  value?: DateRange;
  onValueChange?: (value: DateRange | undefined) => void;
};

export type DatePickerProps = (SingleProps | RangeProps) & {
  placeholder?: string;
  disabled?: boolean;
  /** Figma's `Type` — where the calendar glyph sits. */
  iconPosition?: "left" | "right";
  /** date-fns format string for the trigger's label. */
  format?: string;
  className?: string;
  /** Anything the Calendar itself takes — disabled days, min, max, locale. */
  calendarProps?: Partial<React.ComponentProps<typeof Calendar>>;
} & Pick<VariantProps<typeof datePickerTriggerVariants>, never>;

function label(
  mode: "single" | "range",
  value: Date | DateRange | undefined,
  pattern: string,
): string | null {
  if (!value) return null;
  if (mode === "single") return formatDate(value as Date, pattern);
  const range = value as DateRange;
  if (!range.from) return null;
  if (!range.to) return formatDate(range.from, pattern);
  return `${formatDate(range.from, pattern)} – ${formatDate(range.to, pattern)}`;
}

export function DatePicker({
  placeholder = "Pick a date",
  disabled = false,
  iconPosition = "left",
  format: pattern = "d MMM yyyy",
  className,
  calendarProps,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const mode = props.mode ?? "single";
  const text = label(mode, props.value, pattern);
  const icon = <CalendarDays aria-hidden />;

  // react-day-picker is a union on `mode`, so the selection props are
  // assembled and cast once rather than spread through the JSX.
  const calendarPropsResolved = {
    autoFocus: true,
    ...calendarProps,
    mode,
    selected: props.value,
    onSelect: (next: unknown) => {
      (props.onValueChange as ((v: unknown) => void) | undefined)?.(next);
      // A single date is a complete answer; a range is not until both ends
      // are in, so only the former closes the popover.
      if (mode === "single" && next) setOpen(false);
    },
  } as unknown as React.ComponentProps<typeof Calendar>;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-slot="date-picker-trigger"
          data-filled={text ? true : undefined}
          disabled={disabled}
          className={cn(
            datePickerTriggerVariants({ filled: Boolean(text) }),
            className,
          )}
        >
          {iconPosition === "left" ? icon : null}
          <span className="flex-1 truncate text-start">
            {text ?? placeholder}
          </span>
          {iconPosition === "right" ? icon : null}
        </button>
      </PopoverTrigger>
      {/* The Calendar is its own card, so the popover does not draw a second. */}
      <PopoverContent
        data-slot="date-picker-content"
        surface={false}
        align="start"
      >
        <Calendar {...calendarPropsResolved} />
      </PopoverContent>
    </Popover>
  );
}

export { datePickerTriggerVariants };
